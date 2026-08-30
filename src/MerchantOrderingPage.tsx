import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dish, DishCategory, Table } from './types'
import './merchant-ordering-layout.css'

export interface PendingOrderItem {
  id: string
  dishId: string
  name: string
  imageUrl?: string
  specs?: string
  quantity: number
  originalUnitPrice: number
  discountedUnitPrice: number
}

interface MerchantOrderingPageProps {
  table: Table
  dishes: Dish[]
  categories: DishCategory[]
  onBack: () => void
  onSubmit: (items: PendingOrderItem[]) => void
  notify: (message: string, duration?: number) => void
}

const cartStorageKey = (tableId: string) => `fkm-pending-order:${tableId}`

function loadCart(tableId: string): PendingOrderItem[] {
  try {
    const saved = localStorage.getItem(cartStorageKey(tableId))
    return saved ? JSON.parse(saved) as PendingOrderItem[] : []
  } catch {
    return []
  }
}

const money = (value: number) => value.toFixed(2)
const discountedPrice = (price: number, discount?: number) => discount ? price * (1 - discount / 100) : price

export function MerchantOrderingPage({ table, dishes, categories, onBack, onSubmit, notify }: MerchantOrderingPageProps) {
  const [selectedCategory, setSelectedCategory] = useState(() => [...categories].sort((a, b) => a.priority - b.priority)[0]?.name ?? '')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<PendingOrderItem[]>(() => loadCart(table.id))
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [soldOutExpanded, setSoldOutExpanded] = useState<Record<string, boolean>>({})
  const groupRefs = useRef<Record<string, HTMLElement | null>>({})
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(searchInput.trim().toLocaleLowerCase()), 500)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    localStorage.setItem(cartStorageKey(table.id), JSON.stringify(cart))
  }, [cart, table.id])

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.priority - b.priority), [categories])
  const searchableDishes = useMemo(() => dishes
    .filter(dish => dish.status !== '已下架')
    .filter(dish => {
      if (!searchTerm) return true
      return [dish.name, dish.englishName, dish.description, dish.keywords].some(value => value?.toLocaleLowerCase().includes(searchTerm))
    })
    .sort((a, b) => Number(a.status === '售罄') - Number(b.status === '售罄') || Number(Boolean(b.discount)) - Number(Boolean(a.discount))),
  [dishes, searchTerm])
  const groupedCategories = useMemo(() => sortedCategories
    .map(category => ({ category, dishes: searchableDishes.filter(dish => dish.category === category.name) }))
    .filter(group => !searchTerm || group.dishes.length > 0),
  [searchTerm, searchableDishes, sortedCategories])

  useEffect(() => {
    if (!groupedCategories.length) return
    const syncCategory = () => {
      let active = groupedCategories[0].category.name
      for (const group of groupedCategories) {
        const element = groupRefs.current[group.category.id]
        if (element && element.getBoundingClientRect().top <= 118) active = group.category.name
        else break
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = groupedCategories[groupedCategories.length - 1].category.name
      setSelectedCategory(current => current === active ? current : active)
    }
    syncCategory()
    window.addEventListener('scroll', syncCategory, { passive: true })
    return () => window.removeEventListener('scroll', syncCategory)
  }, [groupedCategories])

  useEffect(() => {
    const category = sortedCategories.find(item => item.name === selectedCategory)
    if (category) categoryButtonRefs.current[category.id]?.scrollIntoView({ block: 'nearest' })
  }, [selectedCategory, sortedCategories])

  const scrollToCategory = (category: DishCategory) => {
    setSelectedCategory(category.name)
    groupRefs.current[category.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + item.discountedUnitPrice * item.quantity, 0)
  const dishQuantityInCart = (dishId: string) => cart.filter(item => item.dishId === dishId).reduce((total, item) => total + item.quantity, 0)
  const availableStock = (dish: Dish) => dish.stock === undefined ? Number.POSITIVE_INFINITY : dish.stock - dishQuantityInCart(dish.id)

  const addCartItem = (dish: Dish, selected: Record<string, string[]> = {}) => {
    if (dish.status !== '已上架' || availableStock(dish) <= 0) {
      notify(dish.stock ? `目前该菜品库存仅剩 ${dish.stock} 份` : '该菜品已售罄', 1200)
      return false
    }
    const chosenOptions = (dish.specs ?? []).flatMap(group => (selected[group.id] ?? []).map(optionId => {
      const option = group.options.find(item => item.id === optionId)
      return option ? { group, option } : null
    }).filter((item): item is NonNullable<typeof item> => Boolean(item)))
    const specification = chosenOptions.map(({ group, option }) => `${group.name}：${option.name}`).join(' | ')
    const optionKey = chosenOptions.map(({ group, option }) => `${group.id}:${option.id}`).sort().join(',') || 'default'
    const originalUnitPrice = dish.price + chosenOptions.reduce((total, { option }) => total + option.priceDelta, 0)
    const id = `${dish.id}|${optionKey}`
    setCart(current => {
      const existing = current.find(item => item.id === id)
      if (existing) return current.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...current, {
        id,
        dishId: dish.id,
        name: dish.name,
        imageUrl: dish.imageUrl,
        specs: specification || undefined,
        quantity: 1,
        originalUnitPrice,
        discountedUnitPrice: discountedPrice(originalUnitPrice, dish.discount),
      }]
    })
    return true
  }

  const openDish = (dish: Dish) => {
    if (dish.status !== '已上架' || availableStock(dish) <= 0) {
      notify('该菜品已售罄', 1200)
      return
    }
    if (!dish.specs?.length) {
      addCartItem(dish)
      return
    }
    setSelections(Object.fromEntries(dish.specs.map(group => [group.id, group.defaultOptionId ? [group.defaultOptionId] : []])))
    setSelectedDish(dish)
  }

  const toggleOption = (groupId: string, optionId: string, selection: '单选' | '多选') => {
    setSelections(current => {
      const selected = current[groupId] ?? []
      return {
        ...current,
        [groupId]: selection === '单选'
          ? [optionId]
          : selected.includes(optionId) ? selected.filter(id => id !== optionId) : [...selected, optionId],
      }
    })
  }

  const confirmSpecification = () => {
    if (!selectedDish) return
    const missing = selectedDish.specs?.find(group => !(selections[group.id]?.length))
    if (missing) {
      notify(`请选择${missing.name}`, 1200)
      return
    }
    if (addCartItem(selectedDish, selections)) setSelectedDish(null)
  }

  const updateQuantity = (id: string, delta: number) => {
    const target = cart.find(item => item.id === id)
    if (!target) return
    if (delta > 0) {
      const dish = dishes.find(item => item.id === target.dishId)
      if (!dish || availableStock(dish) <= 0) {
        notify(`目前该菜品库存仅剩 ${dish?.stock ?? 0} 份`, 1200)
        return
      }
    }
    setCart(current => current.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
  }

  const clearCart = () => {
    if (!cart.length || !window.confirm('是否确定清空当前待下单所有菜品？')) return
    setCart([])
    notify('待下单菜品已清空')
  }

  const submit = () => {
    if (!cart.length) return
    const unavailable = cart.find(item => {
      const dish = dishes.find(candidate => candidate.id === item.dishId)
      return !dish || dish.status !== '已上架' || (dish.stock !== undefined && dish.stock < dishQuantityInCart(dish.id))
    })
    if (unavailable) {
      notify(`「${unavailable.name}」库存不足，请调整数量`, 1600)
      return
    }
    const submitted = [...cart]
    localStorage.removeItem(cartStorageKey(table.id))
    setCart([])
    onSubmit(submitted)
  }

  const selectedOriginalPrice = selectedDish ? selectedDish.price + (selectedDish.specs ?? []).reduce((total, group) => total + (selections[group.id] ?? []).reduce((sum, optionId) => sum + (group.options.find(option => option.id === optionId)?.priceDelta ?? 0), 0), 0) : 0
  const renderDishCard = (dish: Dish) => {
    const soldOut = dish.status === '售罄' || dish.stock === 0
    const salePrice = discountedPrice(dish.price, dish.discount)
    return <article className={`ordering-dish-card ${soldOut ? 'sold-out' : ''}`} key={dish.id}>
      <button className="dish-card-main" onClick={() => openDish(dish)} disabled={soldOut}>
        <div className="ordering-dish-image">{dish.imageUrl ? <img src={dish.imageUrl} alt="" /> : <span>{dish.name.slice(0, 1)}</span>}{dish.discount && <i>{dish.discount}% OFF</i>}</div>
        <div className="ordering-dish-copy"><b>{dish.name}{dish.recommended && <span className="ordering-recommended-star" aria-label="推荐菜品">🌟</span>}</b><p>{dish.description || '暂无菜品简介'}</p></div>
      </button>
      <footer><div><strong>¥{money(salePrice)}</strong>{dish.discount && <del>¥{money(dish.price)}</del>}</div><button disabled={soldOut} aria-label={soldOut ? `${dish.name}缺货` : `加购${dish.name}`} onClick={() => openDish(dish)}>{soldOut ? '缺货' : '+'}</button></footer>
    </article>
  }

  return <main className="merchant-ordering-page">
    <header className="merchant-ordering-header">
      <button aria-label="返回桌台详情" onClick={onBack}>‹</button>
      <div><b>{table.name} 桌 · 点餐</b><span>{table.diners ?? 0} 人用餐</span></div>
      <span className="ordering-header-space" />
    </header>

    <section className="ordering-catalog">
      <header className="ordering-catalog-toolbar">
        <div className="ordering-category-heading">菜品分类</div>
        <section className="ordering-search">
          <span>⌕</span><input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="搜索菜品名称" />
          {searchInput && <button aria-label="清空搜索" onClick={() => setSearchInput('')}>×</button>}
        </section>
      </header>

      <aside className="ordering-category-rail" aria-label="菜品分类">
        {sortedCategories.map(category => <button ref={element => { categoryButtonRefs.current[category.id] = element }} key={category.id} className={selectedCategory === category.name ? 'active' : ''} onClick={() => scrollToCategory(category)}><span>{category.name}</span></button>)}
      </aside>

      <section className="ordering-menu-panel">
        {groupedCategories.length ? groupedCategories.map(group => {
          const available = group.dishes.filter(dish => dish.status !== '售罄' && dish.stock !== 0)
          const soldOut = group.dishes.filter(dish => dish.status === '售罄' || dish.stock === 0)
          const expanded = Boolean(soldOutExpanded[group.category.id])
          return <section className="ordering-category-group" data-category={group.category.name} key={group.category.id} ref={element => { groupRefs.current[group.category.id] = element }}>
            <header className="ordering-group-title"><b>{group.category.name}</b><span>{dishes.filter(dish => dish.status !== '已下架' && dish.category === group.category.name).length} 道菜品</span></header>
            <section className="ordering-dish-list">
              {available.map(renderDishCard)}
              {!group.dishes.length && <p className="ordering-category-empty">该分类下暂无菜品</p>}
              {soldOut.length > 0 && !expanded && <button className="sold-out-toggle" onClick={() => setSoldOutExpanded(current => ({ ...current, [group.category.id]: true }))}>{`点击查看售罄菜品（${soldOut.length}）`}<i>⌄</i></button>}
              {expanded && soldOut.map(renderDishCard)}
              {soldOut.length > 0 && expanded && <button className="sold-out-toggle" onClick={() => setSoldOutExpanded(current => ({ ...current, [group.category.id]: false }))}>点击收起售罄菜品<i>⌃</i></button>}
            </section>
          </section>
        }) : <section className="ordering-empty"><i>⌕</i><p>暂无匹配菜品</p><span>请尝试其他关键词</span></section>}
      </section>
    </section>

    <footer className="ordering-cart-bar">
      <button className="ordering-cart-summary" aria-label="查看待下单购物车" onClick={() => setCartOpen(true)}><i>🛒</i>{cartCount > 0 && <b>{cartCount}</b>}</button>
      <strong>¥{money(cartTotal)}</strong>
      <button className="primary" disabled={!cart.length} onClick={submit}>提交下单</button>
    </footer>

    {selectedDish && <div className="modal-backdrop ordering-modal-backdrop" onClick={() => setSelectedDish(null)}><section className="ordering-spec-modal" onClick={event => event.stopPropagation()}>
      <header><div><h2>{selectedDish.name}</h2><span>{selectedDish.englishName}</span></div><button aria-label="关闭规格选择" onClick={() => setSelectedDish(null)}>×</button></header>
      <div className="ordering-spec-content">{selectedDish.specs?.map(group => <section className="spec-choice-group" key={group.id}><div><b>{group.name}</b><span>{group.selection === '多选' ? '可多选' : '请选择 1 项'}</span></div><div>{group.options.map(option => {
        const active = selections[group.id]?.includes(option.id)
        return <button className={active ? 'active' : ''} key={option.id} onClick={() => toggleOption(group.id, option.id, group.selection)}><i>{group.selection === '多选' ? (active ? '✓' : '') : ''}</i><span>{option.name}</span>{option.priceDelta !== 0 && <small>{option.priceDelta > 0 ? '+' : '−'}¥{money(Math.abs(option.priceDelta))}</small>}</button>
      })}</div></section>)}</div>
      <footer><div><span>当前单价</span><strong>¥{money(discountedPrice(selectedOriginalPrice, selectedDish.discount))}</strong>{selectedDish.discount && <del>¥{money(selectedOriginalPrice)}</del>}</div><button className="primary" onClick={confirmSpecification}>加入待下单</button></footer>
    </section></div>}

    {cartOpen && <div className="modal-backdrop ordering-modal-backdrop" onClick={() => setCartOpen(false)}><section className="ordering-cart-sheet" onClick={event => event.stopPropagation()}>
      <header><div><h2>待下单</h2><span>{table.name} 桌 · 共 {cartCount} 件</span></div><button disabled={!cart.length} onClick={clearCart}>清空</button></header>
      <div className="ordering-cart-list">{cart.length ? cart.map(item => <article key={item.id}>
        <div className="cart-dish-thumb">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.name.slice(0, 1)}</div>
        <div className="cart-dish-copy"><b>{item.name}</b><span>{item.specs || '默认规格'}</span><strong>¥{money(item.discountedUnitPrice * item.quantity)}{item.originalUnitPrice > item.discountedUnitPrice && <del>¥{money(item.originalUnitPrice * item.quantity)}</del>}</strong></div>
        <div className="cart-quantity"><button disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, -1)}>−</button><b>{item.quantity}</b><button onClick={() => updateQuantity(item.id, 1)}>＋</button><button className="cart-remove" aria-label={`删除${item.name}`} onClick={() => setCart(current => current.filter(candidate => candidate.id !== item.id))}>删除</button></div>
      </article>) : <div className="cart-empty"><i>🛒</i><p>还没有待下单菜品</p><button onClick={() => setCartOpen(false)}>继续点餐</button></div>}</div>
      <footer><div><span>待下单合计</span><strong>¥{money(cartTotal)}</strong></div><button className="primary" disabled={!cart.length} onClick={submit}>提交下单</button></footer>
    </section></div>}
  </main>
}
