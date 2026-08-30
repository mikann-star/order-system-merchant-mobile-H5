import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthService, demoAccount, dishes as seedDishes, orders as seedOrders, reservations as seedReservations, tables as seedTables } from './services/mock'
import { StoreSettingsPage } from './StoreSettingsPage'
import { AiSettingsPage } from './AiSettingsPage'
import { DishManagePage } from './DishManagePage'
import { MerchantOrderingPage, type PendingOrderItem } from './MerchantOrderingPage'
import type { Dish, DishCategory, Order, Reservation, Table, TableStatus } from './types'

type Tab = 'tables' | 'orders' | 'reservations' | 'more' | 'service' | 'feedback' | 'me'
type ServiceCategory = '添水' | '额外餐具' | '清理' | '催单' | '人工帮助'
type ServiceRequest = { id: string; table: string; source: '用户' | 'AI'; time: string; content: string; status: '待处理' | '已处理'; category?: ServiceCategory; note?: string }
type Detail = { type: 'table'; value: Table } | { type: 'openTable'; value: Table } | { type: 'editTable'; value: Table } | { type: 'order'; value: Order } | { type: 'reservation'; value: Reservation } | { type: 'service'; value: ServiceRequest } | { type: 'feedback'; value: ServiceRequest } | { type: 'module'; value: string; table?: Table } | null

const tabItems: { key: Tab; icon: string; label: string }[] = [
  { key: 'tables', icon: '▦', label: '桌台' }, { key: 'orders', icon: '▤', label: '订单' },
  { key: 'more', icon: '⊞', label: '更多' }, { key: 'service', icon: '♧', label: '服务请求' }, { key: 'me', icon: '◉', label: '我的' },
]
const statusIcon: Record<TableStatus, string> = { 空闲: '○', 就餐中: '●', 待清理: '◐' }

function CurrencySymbolSync({ symbol }: { symbol: string }) {
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    const sync = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      while (walker.nextNode()) nodes.push(walker.currentNode as Text)
      nodes.forEach(node => {
        if (node.parentElement?.closest('[data-currency-static]')) return
        if (node.nodeValue?.includes('¥') || node.nodeValue?.includes('$')) node.nodeValue = node.nodeValue.replace(/[¥$]/g, symbol)
      })
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [symbol])
  return null
}

function Status({ children }: { children: string }) { return <span className={`status ${children}`}>{children}</span> }
function Toast({ message }: { message: string | null }) { return message ? <div className="toast">{message}</div> : null }
function Header({ title, right, back }: { title: string; right?: ReactNode; back?: () => void }) {
  return <header className="header">{back ? <button className="icon-button" onClick={back}>‹</button> : <span className="header-space" />}<h1>{title}</h1><span>{right}</span></header>
}

function Login({ onLogin, onForgot }: { onLogin: () => void; onForgot: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    const user = await AuthService.login(username, password)
    setLoading(false)
    if (user) onLogin(); else setError(`账号或密码不正确（演示：${demoAccount.username} / ${demoAccount.password}）`)
  }
  return <main className="login-page">
    <section className="login-hero"><div className="brand-mark">F</div><p>FKM 商家端</p><span>让门店经营更从容</span></section>
    <form className="login-form" onSubmit={submit}>
      <label>账号<input value={username} autoComplete="username" onChange={e => setUsername(e.target.value)} placeholder="请输入账号" /></label>
      <label>密码<input value={password} type="password" autoComplete="current-password" onChange={e => setPassword(e.target.value)} placeholder="请输入密码" /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="primary large" disabled={loading}>{loading ? '登录中…' : '登录'}</button>
      <button type="button" className="text-button" onClick={onForgot}>忘记密码？</button>
    </form>
    <footer>登录即代表您同意 <a>服务协议</a> 和 <a>隐私政策</a></footer>
  </main>
}

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [account, setAccount] = useState('')
  const [channel, setChannel] = useState<'phone' | 'email'>('phone')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [unbound, setUnbound] = useState(false)
  const passwordLengthOk = password.length >= 8 && password.length <= 20
  const passwordKinds = [/[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*_]/].filter(rule => rule.test(password)).length
  const passwordOk = passwordLengthOk && passwordKinds >= 3
  const next = () => {
    setError('')
    if (!account.trim()) return setError('请输入账号')
    if (account.trim().toLowerCase() === 'unbound') { setUnbound(true); return }
    setStep(2)
  }
  const sendCode = () => { setNotice(`验证码已发送至${channel === 'phone' ? ' 138****2310' : ' c***@fkm.com'}`); window.setTimeout(() => setNotice(''), 2400) }
  const reset = () => {
    setError('')
    if (code.length !== 6) return setError('请输入 6 位验证码')
    if (!passwordOk) return setError('新密码需为 8-20 位，并至少包含三类字符组合')
    if (password !== confirmPassword) return setError('两次输入的密码不一致')
    setStep(3)
  }
  if (unbound) return <main className="reset-page"><Header title="找回密码" back={onBack} /><section className="reset-content unbound"><div className="reset-illustration">⌁</div><h1>暂无法自助找回</h1><p>该账号尚未绑定手机号或邮箱，无法接收身份验证码。</p><div className="support-box"><b>请联系门店管理员或平台客服重置密码</b><span>客服热线：400-888-8888</span></div><button className="primary large" onClick={onBack}>返回登录</button></section></main>
  return <main className="reset-page"><Header title="找回密码" back={onBack} /><section className="reset-content">
    <div className="reset-progress"><span className={step >= 1 ? 'done' : ''}>1<i>验证账号</i></span><b /><span className={step >= 2 ? 'done' : ''}>2<i>重置密码</i></span><b /><span className={step >= 3 ? 'done' : ''}>3<i>完成</i></span></div>
    {step === 1 && <><h1>验证账号</h1><p>请输入需要找回密码的商家账号</p><label>账号<input value={account} autoFocus onChange={e => setAccount(e.target.value)} placeholder="请输入账号" /></label>{error && <div className="form-error">{error}</div>}<button className="primary large" onClick={next}>下一步</button><small className="reset-hint">演示账号 demo 已绑定联系方式；输入 unbound 可查看未绑定提示。</small></>}
    {step === 2 && <><h1>重置密码</h1><p>请选择验证方式，完成身份验证后设置新密码</p><div className="channel-options"><button className={channel === 'phone' ? 'selected' : ''} onClick={() => setChannel('phone')}><b>手机号</b><span>138****2310</span></button><button className={channel === 'email' ? 'selected' : ''} onClick={() => setChannel('email')}><b>邮箱</b><span>c***@fkm.com</span></button></div><label>新密码<input value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="请输入新密码" /></label><div className="password-rule"><span className={passwordLengthOk ? 'valid' : ''}>● 长度限制：8-20 位字符</span><span className={passwordKinds >= 3 ? 'valid' : ''}>● 组合要求：大写字母、小写字母、数字、常用特殊符号(!@#$%^&amp;*_)中，至少包含三类</span></div><label>确认新密码<input value={confirmPassword} type="password" onChange={e => setConfirmPassword(e.target.value)} placeholder="请再次输入新密码" /></label><label>验证码<div className="code-row"><input value={code} maxLength={6} inputMode="numeric" onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="请输入 6 位验证码" /><button type="button" onClick={sendCode}>获取验证码</button></div></label>{error && <div className="form-error">{error}</div>}{notice && <div className="success-tip">✓ {notice}</div>}<button className="primary large" onClick={reset}>确认重置</button></>}
    {step === 3 && <div className="reset-success"><div>✓</div><h1>密码重置成功</h1><p>请使用新密码重新登录。</p><button className="primary large" onClick={onBack}>返回登录</button></div>}
  </section></main>
}
function AddTablePage({ tables, onCancel, onSave, notify }: { tables: Table[]; onCancel: () => void; onSave: (table: Table) => void; notify: (message: string) => void }) {
  const [tableNumber, setTableNumber] = useState('')
  const [seats, setSeats] = useState('')
  const [area, setArea] = useState('大厅')
  const [errors, setErrors] = useState({ tableNumber: '', seats: '' })
  const isPositiveInteger = (value: string) => /^[1-9]\d*$/.test(value)
  const validateTableNumber = () => {
    const error = isPositiveInteger(tableNumber) ? '' : '请输入有效的正整数桌号'
    setErrors(current => ({ ...current, tableNumber: error }))
    return !error
  }
  const validateSeats = () => {
    const error = isPositiveInteger(seats) ? '' : '请输入有效的正整数容纳人数'
    setErrors(current => ({ ...current, seats: error }))
    return !error
  }
  const submit = () => {
    const numberValid = validateTableNumber(); const seatsValid = validateSeats()
    if (!numberValid || !seatsValid) return
    const duplicated = tables.some(table => Number(table.name.replace(/\D/g, '')) === Number(tableNumber))
    if (duplicated) { notify('桌号已存在，请使用其他桌号'); return }
    onSave({ id: `t-${Date.now()}`, name: tableNumber, seats: Number(seats), area, status: '空闲' })
  }
  return <main className="add-table-page"><Header title="添加桌台" back={onCancel} /><section className="add-table-form"><div className="form-intro"><h2>桌台基础信息</h2><p>请填写桌号、容纳人数与所属区域</p></div><label>桌号 <em>*</em><input value={tableNumber} inputMode="numeric" maxLength={6} onBlur={validateTableNumber} onChange={event => { setTableNumber(event.target.value.replace(/\D/g, '')); setErrors(current => ({ ...current, tableNumber: '' })) }} placeholder="请输入桌号" />{errors.tableNumber && <small className="field-error">{errors.tableNumber}</small>}</label><label>容纳人数 <em>*</em><input value={seats} inputMode="numeric" maxLength={3} onBlur={validateSeats} onChange={event => { setSeats(event.target.value.replace(/\D/g, '')); setErrors(current => ({ ...current, seats: '' })) }} placeholder="请输入容纳人数" />{errors.seats && <small className="field-error">{errors.seats}</small>}</label><fieldset><legend>所属区域 <em>*</em></legend><div className="area-options">{['大厅', '包间', '户外'].map(item => <button type="button" className={area === item ? 'selected' : ''} onClick={() => setArea(item)} key={item}>{item}</button>)}</div></fieldset></section><footer className="form-actions"><button onClick={onCancel}>取消</button><button className="primary" onClick={submit}>确认</button></footer></main>
}

function EditTablePage({ table, tables, onCancel, onSave, notify }: { table: Table; tables: Table[]; onCancel: () => void; onSave: (table: Table) => void; notify: (message: string, duration?: number) => void }) {
  const [tableNumber, setTableNumber] = useState(table.name.replace(/\D/g, ''))
  const [seats, setSeats] = useState(String(table.seats))
  const [area, setArea] = useState(table.area)
  const [errors, setErrors] = useState({ tableNumber: '', seats: '' })
  const isPositiveInteger = (value: string) => /^[1-9]\d*$/.test(value)
  const validateTableNumber = () => {
    const error = isPositiveInteger(tableNumber) ? '' : '请输入有效的正整数桌号'
    setErrors(current => ({ ...current, tableNumber: error }))
    return !error
  }
  const validateSeats = () => {
    const error = isPositiveInteger(seats) ? '' : '请输入有效的正整数容纳人数'
    setErrors(current => ({ ...current, seats: error }))
    return !error
  }
  const submit = () => {
    const numberValid = validateTableNumber(); const seatsValid = validateSeats()
    if (!numberValid || !seatsValid) {
      const fields = [!numberValid && '桌号', !seatsValid && '容纳人数'].filter(Boolean).join('、')
      notify(`请按要求填写${fields}`, 1000)
      return
    }
    const duplicated = tables.some(item => item.id !== table.id && Number(item.name.replace(/\D/g, '')) === Number(tableNumber))
    if (duplicated) { notify('该桌号已存在，请使用其他桌号', 1000); return }
    onSave({ ...table, name: tableNumber, seats: Number(seats), area })
  }
  return <main className="add-table-page"><Header title={`${table.name}·编辑桌台`} back={onCancel} /><section className="add-table-form"><div className="form-intro"><h2>桌台基础信息</h2><p>请修改桌号、容纳人数与所属区域</p></div><label>桌号 <em>*</em><input value={tableNumber} inputMode="numeric" maxLength={6} onBlur={validateTableNumber} onChange={event => { setTableNumber(event.target.value.replace(/\D/g, '')); setErrors(current => ({ ...current, tableNumber: '' })) }} placeholder="请输入桌号" />{errors.tableNumber && <small className="field-error">{errors.tableNumber}</small>}</label><label>容纳人数 <em>*</em><input value={seats} inputMode="numeric" maxLength={3} onBlur={validateSeats} onChange={event => { setSeats(event.target.value.replace(/\D/g, '')); setErrors(current => ({ ...current, seats: '' })) }} placeholder="请输入容纳人数" />{errors.seats && <small className="field-error">{errors.seats}</small>}</label><fieldset><legend>所属区域 <em>*</em></legend><div className="area-options">{['大厅', '包间', '户外'].map(item => <button type="button" className={area === item ? 'selected' : ''} onClick={() => setArea(item)} key={item}>{item}</button>)}</div></fieldset></section><footer className="form-actions"><button onClick={onCancel}>取消</button><button className="primary" onClick={submit}>确认</button></footer></main>
}

function LegacyDishManagePage({ dishes, onBack, onChange, notify }: { dishes: Dish[]; onBack: () => void; onChange: (dishes: Dish[]) => void; notify: (message: string) => void }) {
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('所有分类')
  const [status, setStatus] = useState('所有状态')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Dish | null>(null)
  const categories = ['所有分类', ...Array.from(new Set(dishes.map(dish => dish.category)))]
  const visible = dishes.filter(dish => (category === '所有分类' || dish.category === category) && (status === '所有状态' || dish.status === status) && `${dish.name}${dish.englishName ?? ''}`.toLowerCase().includes(keyword.toLowerCase())).sort((a, b) => Number(a.status === '售罄') - Number(b.status === '售罄'))
  const setStatusForDish = (id: string, nextStatus: Dish['status']) => { onChange(dishes.map(dish => dish.id === id ? { ...dish, status: nextStatus } : dish)); setMenuId(null); notify(nextStatus === '已上架' ? '菜品已上架' : '菜品已下架') }
  const deleteDish = (id: string) => { const target = dishes.find(dish => dish.id === id); if (target && window.confirm(`确定删除「${target.name}」吗？删除后无法恢复。`)) { onChange(dishes.filter(dish => dish.id !== id)); notify('菜品已删除') } setMenuId(null) }
  if (editing) return <DishForm dish={editing.id ? editing : undefined} categories={categories.filter(item => item !== '所有分类')} onCancel={() => setEditing(null)} onSave={dish => { const exists = dishes.some(item => item.id !== dish.id && (item.name === dish.name || item.englishName === dish.englishName)); if (exists) { notify('菜品名称已存在'); return } onChange(dish.id ? dishes.map(item => item.id === dish.id ? dish : item) : [...dishes, dish]); setEditing(null); notify(dish.id ? '菜品已保存' : '菜品添加成功') }} />
  return <main className="dish-page"><Header title="菜品管理" back={onBack} right={<button className="text-action" onClick={() => notify('分类管理功能已预留')}>分类管理</button>} /><section className="dish-heading"><h2>菜品管理</h2><p>管理菜品、分类和库存状态</p></section><section className="dish-filters"><div className="dish-search"><span>⌕</span><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索菜品名称…" />{keyword && <button onClick={() => setKeyword('')}>×</button>}</div><div className="dish-selects"><select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select><select value={status} onChange={event => setStatus(event.target.value)}>{['所有状态', '已上架', '已下架', '售罄'].map(item => <option key={item}>{item}</option>)}</select></div></section><div className="dish-list-head"><b>菜品列表</b><span>{visible.length} 道菜品</span></div><section className="dish-list">{visible.length ? visible.map(dish => <article className={`dish-card ${dish.status === '售罄' ? 'sold-out' : ''}`} key={dish.id}><div className="dish-image">{dish.name.slice(0, 1)}{dish.discount && <em>{dish.discount}% OFF</em>}</div><div className="dish-info"><div><h3>{dish.name}{dish.recommended && <span className="dish-recommend">⭐</span>}</h3><button aria-label={`${dish.name} 更多操作`} onClick={() => setMenuId(menuId === dish.id ? null : dish.id)}>•••</button></div><p>{dish.englishName}</p><span>{dish.category}　库存 {dish.stock ?? 0}</span><div className="dish-price"><strong>¥{dish.price.toFixed(2)}</strong><Status>{dish.status}</Status></div>{menuId === dish.id && <div className="dish-menu"><button onClick={() => { setEditing(dish); setMenuId(null) }}>编辑</button>{dish.status === '已上架' ? <button onClick={() => setStatusForDish(dish.id, '已下架')}>下架</button> : <button onClick={() => setStatusForDish(dish.id, '已上架')}>上架</button>}<button className="danger" onClick={() => deleteDish(dish.id)}>删除</button></div>}</div></article>) : <div className="dish-empty"><i>⌑</i><b>暂无匹配菜品</b><span>请调整搜索内容或筛选条件</span></div>}</section><button className="floating dish-add" onClick={() => setEditing({ id: '', name: '', englishName: '', category: categories[1] ?? '', price: 0, stock: 0, status: '已上架' })}>＋ 新增菜品</button></main>
}

function DishForm({ dish, categories, onCancel, onSave }: { dish?: Dish; categories: string[]; onCancel: () => void; onSave: (dish: Dish) => void }) {
  const [form, setForm] = useState<Dish>(dish ?? { id: '', name: '', englishName: '', category: categories[0] ?? '', price: 0, stock: 0, status: '已上架' })
  const [errors, setErrors] = useState<string[]>([])
  const update = <K extends keyof Dish,>(key: K, value: Dish[K]) => setForm(current => ({ ...current, [key]: value }))
  const save = () => { const nextErrors = [!form.name && '请输入菜品中文名称', !form.englishName && '请输入菜品英文名称', !form.category && '请选择菜品分类', form.price < 0 && '请输入不超过两位小数的菜品价格'].filter(Boolean) as string[]; setErrors(nextErrors); if (!nextErrors.length) onSave({ ...form, id: form.id || `d-${Date.now()}`, price: Number(form.price), stock: Number(form.stock) || 0, status: Number(form.stock) === 0 ? '售罄' : form.status }) }
  return <main className="dish-page"><Header title={dish?.id ? '编辑菜品' : '新增菜品'} back={onCancel} /><section className="dish-form"><label>菜品名称（中文）<em>*</em><input value={form.name} onChange={event => update('name', event.target.value)} placeholder="请输入菜品中文名称" /></label><label>菜品名称（英文）<em>*</em><input value={form.englishName} onChange={event => update('englishName', event.target.value)} placeholder="请输入菜品英文名称" /></label><label>价格（¥）<em>*</em><input value={form.price || ''} inputMode="decimal" onChange={event => update('price', Number(event.target.value))} placeholder="请输入菜品价格" /></label><label>所属分类<em>*</em><select value={form.category} onChange={event => update('category', event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>库存<input value={form.stock || ''} inputMode="numeric" onChange={event => update('stock', Number(event.target.value))} placeholder="库存为空时默认为 0" /></label><label>状态<select value={form.status} onChange={event => update('status', event.target.value as Dish['status'])}>{['已上架', '已下架', '售罄'].map(item => <option key={item}>{item}</option>)}</select></label><label className="recommend-switch">是否推荐<button type="button" className={form.recommended ? 'on' : ''} onClick={() => update('recommended', !form.recommended)}><i /></button></label>{errors.map(error => <small className="field-error" key={error}>{error}</small>)}</section><footer className="form-actions"><button onClick={onCancel}>取消</button><button className="primary" onClick={save}>保存</button></footer></main>
}

function OpenTablePage({ table, onCancel, onConfirm, notify }: { table: Table; onCancel: () => void; onConfirm: (diners: number, startedAt: string) => void; notify: (message: string, duration?: number) => void }) {
  const [diners, setDiners] = useState('')
  const [guest, setGuest] = useState('')
  const [phone, setPhone] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [dinersError, setDinersError] = useState('')
  const [timeError, setTimeError] = useState('')
  const [timePickerOpen, setTimePickerOpen] = useState(false)
  const [pickerDate, setPickerDate] = useState('')
  const [pickerHour, setPickerHour] = useState('')
  const [pickerMinute, setPickerMinute] = useState('')
  const [pickerError, setPickerError] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const now = new Date()
  const maxDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const validateDiners = () => {
    const count = Number(diners)
    const valid = Number.isInteger(count) && count >= 1 && count <= table.seats
    setDinersError(valid ? '' : `请输入 1~${table.seats} 之间的正整数用餐人数`)
    return valid
  }
  const validateTime = () => {
    const valid = !startedAt || new Date(startedAt) <= new Date()
    setTimeError(valid ? '' : '开台时间不能晚于当前时间')
    return valid
  }
  const setPickerTo = (value: string) => { setPickerDate(value.slice(0, 10)); setPickerHour(value.slice(11, 13)); setPickerMinute(value.slice(14, 16)); setCalendarMonth(new Date(`${value.slice(0, 10)}T00:00:00`)); setPickerError('') }
  const openTimePicker = () => { setPickerTo(startedAt || maxDateTime); setTimePickerOpen(true) }
  const confirmTimePicker = () => {
    const value = `${pickerDate}T${pickerHour}:${pickerMinute}`
    if (!pickerDate || !pickerHour || !pickerMinute || new Date(value) > new Date()) { setPickerError('开台时间不能晚于当前时间'); return }
    setStartedAt(value); setTimeError(''); setTimePickerOpen(false)
  }
  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()
  const firstWeekday = new Date(calendarYear, calendarMonthIndex, 1).getDay()
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarYear, calendarMonthIndex, index - firstWeekday + 1)
    return { day: date.getDate(), value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, currentMonth: date.getMonth() === calendarMonthIndex }
  })
  const todayDate = maxDateTime.slice(0, 10)
  const chooseDate = (value: string) => { if (value <= todayDate) { setPickerDate(value); setPickerError('') } }
  const confirm = () => {
    const validDiners = validateDiners()
    const validTime = validateTime()
    if (!validDiners || !validTime) { notify(`请按要求正确填写 ${[!validDiners && '用餐人数', !validTime && '开台时间'].filter(Boolean).join('、')}`, 1000); return }
    const value = startedAt ? new Date(startedAt) : new Date()
    const displayTime = `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    onConfirm(Number(diners), displayTime)
  }
  return <main className="open-table-page"><Header title={`${table.name}·开台`} back={onCancel} right={<button className="text-action" onClick={onCancel}>×</button>} /><section className="open-table-info"><span>当前桌台</span><b>{table.name} 号桌</b><small>{table.seats} 人桌 · {table.area}</small></section><section className="open-table-form"><label>用餐人数 <em>*</em><input value={diners} inputMode="numeric" onBlur={validateDiners} onChange={event => { setDiners(event.target.value); setDinersError('') }} placeholder={`请输入 1~${table.seats} 人`} />{dinersError && <small className="field-error">{dinersError}</small>}</label><label>顾客称呼 <small>（选填）</small><input value={guest} onChange={event => setGuest(event.target.value)} placeholder="请输入顾客称呼" /></label><label>顾客电话 <small>（选填）</small><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="请输入顾客电话" /></label><label>开台时间 <small>（选填）</small><div className="time-picker-field"><button type="button" className={startedAt ? 'selected' : ''} onClick={openTimePicker}><span>{startedAt ? startedAt.replace('T', ' ') : '不填写则以确认开台时刻为准'}</span><i>▦</i></button></div>{timeError && <small className="field-error">{timeError}</small>}</label><p>仅可选择当前时刻或更早的开台时间。</p></section><footer className="form-actions"><button onClick={onCancel}>取消</button><button className="primary" onClick={confirm}>确认开台</button></footer>{timePickerOpen && <div className="modal-backdrop time-picker-backdrop"><section className="modal custom-time-picker"><h2>选择开台时间</h2><section className="calendar-panel"><header><span><button type="button" aria-label="上一年" onClick={() => setCalendarMonth(new Date(calendarYear - 1, calendarMonthIndex, 1))}>«</button><button type="button" aria-label="上个月" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}>‹</button></span><b>{calendarYear}年 {String(calendarMonthIndex + 1).padStart(2, '0')}月</b><span><button type="button" aria-label="下个月" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}>›</button><button type="button" aria-label="下一年" onClick={() => setCalendarMonth(new Date(calendarYear + 1, calendarMonthIndex, 1))}>»</button></span></header><div className="calendar-weekdays">{['日', '一', '二', '三', '四', '五', '六'].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-days">{calendarDays.map((day, index) => <button type="button" key={index} disabled={day.value > todayDate} className={`${!day.currentMonth ? 'outside ' : ''}${pickerDate === day.value ? 'selected' : ''}`} onClick={() => chooseDate(day.value)}>{day.day}</button>)}</div></section><div className="time-selects"><label>时<select size={5} value={pickerHour} onChange={event => { setPickerHour(event.target.value); setPickerError('') }}>{Array.from({ length: 24 }, (_, value) => String(value).padStart(2, '0')).map(value => <option key={value}>{value}</option>)}</select></label><span>:</span><label>分<select size={5} value={pickerMinute} onChange={event => { setPickerMinute(event.target.value); setPickerError('') }}>{Array.from({ length: 60 }, (_, value) => String(value).padStart(2, '0')).map(value => <option key={value}>{value}</option>)}</select></label></div>{pickerError && <small className="field-error">{pickerError}</small>}<footer><button onClick={() => { setStartedAt(maxDateTime); setTimeError(''); setTimePickerOpen(false) }}>此刻</button><div><button onClick={() => setTimePickerOpen(false)}>取消</button><button className="primary" onClick={confirmTimePicker}>确认</button></div></footer></section></div>}</main>
}

function TablesPage({ tables, setDetail, updateTable }: { tables: Table[]; setDetail: (d: Detail) => void; updateTable: (id: string, status: TableStatus) => void }) {
  const [area, setArea] = useState('全部')
  const [searchOpen, setSearchOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [menuTable, setMenuTable] = useState<Table | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('ready')
  const areaTables = tables.filter(table => area === '全部' || table.area === area)
  const list = (selectedTable ? areaTables.filter(table => table.name === selectedTable) : areaTables).sort((a, b) => Number(a.name.replace(/\D/g, '')) - Number(b.name.replace(/\D/g, '')) || a.name.localeCompare(b.name))
  const suggestions = keyword ? areaTables.filter(table => table.name.toLowerCase().includes(keyword.toLowerCase())).sort((a, b) => Number(a.name.replace(/\D/g, '')) - Number(b.name.replace(/\D/g, ''))) : []
  const stats = (status: TableStatus) => areaTables.filter(t => t.status === status).length
  const clearSearch = () => { setKeyword(''); setSelectedTable(null); setSearchOpen(false) }
  const selectTable = (table: Table) => { setKeyword(table.name); setSelectedTable(table.name); setSearchOpen(false) }
  const onSearchKeyDown = (key: string) => { if (key === 'Enter' && suggestions.length) selectTable(suggestions[0]) }
  const openCard = (table: Table) => {
    if (table.status === '空闲') setDetail({ type: 'openTable', value: table })
    else if (table.status === '待清理') updateTable(table.id, '空闲')
    else setDetail({ type: 'table', value: table })
  }
  return <><div className="store-strip"><div><small>当前门店</small><strong>FKM · 湖滨店⌄</strong></div><button className="bell">♧<i /></button></div>
    <section className="page-heading"><h2>桌台管理</h2><p>实时掌握门店桌台与用餐状态</p></section>
    <div className="chips">{['全部', '大厅', '包间', '露台'].map(item => <button onClick={() => { setArea(item); clearSearch() }} className={area === item ? 'active' : ''} key={item}>{item}</button>)}</div>
    <div className="table-stats">{(['空闲', '就餐中', '待清理'] as TableStatus[]).map(s => <div key={s}><b className={s}>{statusIcon[s]}</b><span>{s}</span><strong>{stats(s)}</strong></div>)}</div>
    <div className="section-line table-list-header"><div><h3>桌台列表</h3><span>{loadState === 'ready' ? `${list.length} 张` : ''}</span></div><div className="search-inline"><span>⌕</span><input value={keyword} onFocus={() => setSearchOpen(true)} onKeyDown={event => onSearchKeyDown(event.key)} onChange={event => { setKeyword(event.target.value); setSelectedTable(null) }} placeholder="搜索桌台编号" />{searchOpen && keyword && <div className="suggestions">{suggestions.length ? suggestions.map(table => <button key={table.id} onMouseDown={event => event.preventDefault()} onClick={() => selectTable(table)}><b>{table.name} 号桌</b><span>{table.area} · {table.status}</span></button>) : <p>未找到相关桌台</p>}</div>}</div><button className="clear-search" onClick={clearSearch}>清空</button></div>
    {loadState === 'loading' && <section className="table-grid skeleton-grid">{[1, 2, 3, 4].map(item => <div className="table-card skeleton" key={item}><span>加载中</span></div>)}</section>}
    {loadState === 'error' && <section className="table-state"><i>!</i><b>桌台加载失败，请检查网络后重试</b><button onClick={() => { setLoadState('loading'); window.setTimeout(() => setLoadState('ready'), 500) }}>重新加载</button></section>}
    {loadState === 'ready' && !list.length && <section className="table-state"><i>⌂</i><b>{selectedTable ? '未找到相关桌台' : '暂未添加桌台'}</b>{selectedTable && <button onClick={clearSearch}>清除搜索</button>}</section>}
    {loadState === 'ready' && !!list.length && <section className="table-grid">{list.map(table => {
      return <article className={`table-card ${table.status}`} key={table.id} onClick={() => openCard(table)}>
        <button className="dots" aria-label={`${table.name} 号桌更多操作`} onClick={event => { event.stopPropagation(); setMenuTable(table) }}>•••</button><div className="table-title"><strong>{table.name}</strong>{table.reserved && <span title="存在有效预订">🛎️</span>}</div><small>{table.seats} 人桌 · {table.area}</small>
        <span className="table-desc">{table.status === '就餐中' ? `${table.startedAt}开始·${table.diners}人用餐` : table.status === '待清理' ? '点击完成清理' : '点击即可开台'}</span>
        <Status>{table.status}</Status>
      </article>
    })}</section>}
    {menuTable && <div className="modal-backdrop" onClick={() => setMenuTable(null)}><section className="modal table-menu" onClick={event => event.stopPropagation()}><header><h2>{menuTable.name} 号桌</h2><button className="modal-close" aria-label="关闭更多操作" onClick={() => setMenuTable(null)}>×</button></header>{menuTable.status === '空闲' && <button className="primary" onClick={() => { setDetail({ type: 'openTable', value: menuTable }); setMenuTable(null) }}>开台</button>}<button onClick={() => { setDetail({ type: 'table', value: menuTable }); setMenuTable(null) }}>详情 / 点餐</button></section></div>}
    <button className="floating" onClick={() => setDetail({ type: 'module', value: '添加桌台' })}>＋ 添加桌台</button>
  </>
}

function OrdersPage({ orders, setDetail, confirmOrder }: { orders: Order[]; setDetail: (d: Detail) => void; confirmOrder: (id: string) => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const savedFilters = (() => { try { return JSON.parse(sessionStorage.getItem('fkm-order-filters') ?? '{}') as Partial<{ startDate: string; endDate: string; confirmationFilter: '待确认' | '已确认' | '全部'; paymentFilter: '全部' | '已支付' | '待支付' }> } catch { return {} } })()
  const [startDate, setStartDate] = useState(savedFilters.startDate || today)
  const [endDate, setEndDate] = useState(savedFilters.endDate || today)
  const [confirmationFilter, setConfirmationFilter] = useState<'待确认' | '已确认' | '全部'>(savedFilters.confirmationFilter || '待确认')
  const [paymentFilter, setPaymentFilter] = useState<'全部' | '已支付' | '待支付'>(savedFilters.paymentFilter || '全部')
  const [confirmAll, setConfirmAll] = useState(false)
  useEffect(() => { sessionStorage.setItem('fkm-order-filters', JSON.stringify({ startDate, endDate, confirmationFilter, paymentFilter })) }, [startDate, endDate, confirmationFilter, paymentFilter])
  const list = orders.filter(order => {
    const orderDate = `2026-${order.time.slice(0, 5)}`
    const confirmationMatched = confirmationFilter === '全部' || (confirmationFilter === '待确认' ? order.status === '待确认' : order.status !== '待确认')
    const paymentStatus = order.status === '已完成' ? '已支付' : '待支付'
    return orderDate >= startDate && orderDate <= endDate && confirmationMatched && (paymentFilter === '全部' || paymentStatus === paymentFilter)
  })
  const pendingCount = orders.filter(order => order.status === '待确认').length
  const orderAmount = (order: Order) => {
    const original = order.items.reduce((sum, item) => sum + item.originalUnitPrice * item.quantity, 0)
    const dishDiscount = order.items.reduce((sum, item) => sum + (item.originalUnitPrice - item.discountedUnitPrice) * item.quantity, 0)
    const base = original - dishDiscount
    const wholeDiscount = order.wholeDiscount ? order.wholeDiscount.type === 'percentage' ? base * order.wholeDiscount.value : Math.min(base, order.wholeDiscount.value) : 0
    return base - wholeDiscount
  }
  const confirmEveryOrder = () => { orders.filter(order => order.status === '待确认').forEach(order => confirmOrder(order.id)); setConfirmAll(false) }
  return <><Header title="订单管理" /><section className="order-filter-panel"><label>日期范围<div className="date-range"><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /><span>至</span><input type="date" min={startDate} value={endDate} onChange={event => setEndDate(event.target.value)} /></div></label><div className="order-filter-actions"><label>确认状态<select value={confirmationFilter} onChange={event => setConfirmationFilter(event.target.value as '待确认' | '已确认' | '全部')}><option>待确认</option><option>已确认</option><option>全部</option></select></label><label>支付状态<select value={paymentFilter} onChange={event => setPaymentFilter(event.target.value as '全部' | '已支付' | '待支付')}><option>全部</option><option>已支付</option><option>待支付</option></select></label><button className="confirm-all-button" disabled={!pendingCount} onClick={() => setConfirmAll(true)}>全部确认{pendingCount ? ` (${pendingCount})` : ''}</button></div></section><div className="order-list-title"><b>订单列表</b><span>共 {list.length} 条</span></div>
    <section className="list order-list">{list.map(order => { const paid = order.status === '已完成'; const diningMode = order.table === '外卖' ? '外带' : '堂食'; return <article className="list-card order-list-card" key={order.id} onClick={() => setDetail({ type: 'order', value: order })}><div className="order-id-row"><b>{order.id}</b><Status>{order.status === '待确认' ? '未确认' : '已确认'}</Status></div><div className="order-table-row"><div><strong>{order.table === '外卖' ? '无桌号' : `${order.table} 桌`}</strong><em className={`dining-mode ${diningMode}`}>{diningMode}</em></div><span className="order-source-time">{order.source} · {order.time}</span></div><div className="order-status-row"><span><em className={paid ? 'paid' : 'unpaid'}>{paid ? '已支付' : '待支付'}</em><i>无退款</i></span><strong>¥{orderAmount(order).toFixed(2)}</strong></div>{order.status === '待确认' && <button className="confirm-order" onClick={event => { event.stopPropagation(); confirmOrder(order.id) }}>✓ 确认订单</button>}</article> })}</section>{confirmAll && <div className="modal-backdrop"><section className="modal confirm-all-modal"><h2>确认全部订单</h2><p>当前有 {pendingCount} 条待确认订单，是否全部确认？</p><div><button onClick={() => setConfirmAll(false)}>取消</button><button className="primary" onClick={confirmEveryOrder}>确定</button></div></section></div>}</>
}

const reservationDateValue = (iso: string) => { const date = new Date(iso); const pad = (value: number) => String(value).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}` }
const reservationTimeLabel = (iso: string) => { const date = new Date(iso); const pad = (value: number) => String(value).padStart(2, '0'); return `${String(date.getFullYear()).slice(2)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}` }
const reservationStatus = (reservation: Reservation) => reservation.status === '待就餐' && new Date(reservation.scheduledAt) < new Date() ? '已超时' as const : reservation.status

function ReservationForm({ tables, onBack, onCreate, notify }: { tables: Table[]; onBack: () => void; onCreate: (reservation: Reservation) => void; notify: (message: string, duration?: number) => void }) {
  const [people, setPeople] = useState(''); const [guest, setGuest] = useState(''); const [phone, setPhone] = useState(''); const [scheduledAt, setScheduledAt] = useState(''); const [note, setNote] = useState(''); const [tableQuery, setTableQuery] = useState(''); const [selectedTable, setSelectedTable] = useState<Table | null>(null); const [errors, setErrors] = useState<Record<string, string>>({})
  const minTime = reservationDateValue(new Date().toISOString()); const peopleValid = /^[1-9]\d*$/.test(people); const candidates = tables.filter(table => table.name.toLowerCase().includes(tableQuery.toLowerCase()))
  const chooseTable = (table: Table) => { if (!peopleValid) { setErrors(current => ({ ...current, table: '请先输入正整数就餐人数' })); return }; if (Number(people) > table.seats) { notify('目标桌台容纳人数不足', 1000); return }; setSelectedTable(table); setTableQuery(table.name); setErrors(current => ({ ...current, table: '' })) }
  const submit = () => { const next: Record<string, string> = {}; if (!peopleValid) next.people = '请输入正整数就餐人数'; if (!guest.trim()) next.guest = '请输入顾客称呼'; const date = scheduledAt ? new Date(scheduledAt) : null; if (!date || Number.isNaN(date.getTime()) || date <= new Date()) next.time = '请选择晚于当前时间的预订时间'; if (selectedTable && Number(people) > selectedTable.seats) next.table = '目标桌台容纳人数不足'; setErrors(next); if (Object.keys(next).length) { notify(`请按要求正确填写 ${Object.keys(next).map(key => ({ people: '就餐人数', guest: '顾客称呼', time: '预订时间', table: '预选桌台' }[key])).join('、')}`, 1000); return }; const iso = date!.toISOString(); onCreate({ id: `r${Date.now()}`, guest: guest.trim(), phone: phone.trim() || '—', scheduledAt: iso, time: reservationTimeLabel(iso), people: Number(people), table: selectedTable?.name ?? '未选桌台', note: note.trim(), status: '待就餐' }); notify('预订创建成功', 1000); onBack() }
  return <><Header title="预订" back={onBack} right={<button className="text-action" onClick={onBack}>×</button>} /><section className="reservation-form"><label>就餐人数 <b>*</b><input inputMode="numeric" value={people} onChange={event => { setPeople(event.target.value.replace(/\D/g, '')); setErrors(current => ({ ...current, people: '' })) }} placeholder="请输入就餐人数" />{errors.people && <small>{errors.people}</small>}</label><label>顾客称呼 <b>*</b><input value={guest} onChange={event => { setGuest(event.target.value); setErrors(current => ({ ...current, guest: '' })) }} placeholder="请输入顾客称呼" />{errors.guest && <small>{errors.guest}</small>}</label><label>联系电话<input value={phone} onChange={event => setPhone(event.target.value)} placeholder="请输入联系电话（选填）" /></label><label>预订时间 <b>*</b><input type="datetime-local" min={minTime} value={scheduledAt} onChange={event => { setScheduledAt(event.target.value); setErrors(current => ({ ...current, time: '' })) }} />{errors.time && <small>{errors.time}</small>}</label><label>预选桌台 <span className="optional">（选填）</span><div className="reservation-table-input"><input disabled={!peopleValid} value={tableQuery} onChange={event => { setTableQuery(event.target.value); setSelectedTable(null) }} placeholder={peopleValid ? '搜索并选择桌台' : '请先填写就餐人数'} />{selectedTable && <button type="button" onClick={() => { setSelectedTable(null); setTableQuery('') }}>×</button>}</div>{peopleValid && <div className="reservation-table-options">{candidates.map(table => <button type="button" key={table.id} onClick={() => chooseTable(table)}><b>{table.name}号桌</b><span>{table.seats}人 · {table.area}</span></button>)}</div>}{errors.table && <small>{errors.table}</small>}</label><label>备注 <span className="optional">（选填）</span><textarea value={note} maxLength={200} onChange={event => setNote(event.target.value)} placeholder="请输入备注" /></label><label>预订状态<input disabled value="待就餐" /></label></section><footer className="fixed-action reservation-form-actions"><button onClick={onBack}>取消</button><button className="primary" onClick={submit}>确认预订</button></footer></>
}

function ReservationsPage({ reservations, setDetail, updateReservation, onBack, notify }: { reservations: Reservation[]; setDetail: (d: Detail) => void; updateReservation: (id: string, status: Reservation['status']) => void; onBack?: () => void; notify: (message: string, duration?: number) => void }) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const [statusFilter, setStatusFilter] = useState<'全部' | Reservation['status']>('全部')
  const [startDate, setStartDate] = useState(todayKey)
  const [endDate, setEndDate] = useState(todayKey)
  const effective = reservations.map(item => ({ ...item, status: reservationStatus(item) }))
  const today = effective.filter(item => item.scheduledAt.slice(0, 10) === todayKey)
  const statusPriority: Record<Reservation['status'], number> = { 已超时: 0, 待就餐: 1, 已就餐: 2, 已取消: 3 }
  const list = effective
    .filter(item => (statusFilter === '全部' || item.status === statusFilter) && item.scheduledAt.slice(0, 10) >= startDate && item.scheduledAt.slice(0, 10) <= endDate)
    .sort((a, b) => statusPriority[a.status] - statusPriority[b.status] || new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  const applyDates = (setter: (value: string) => void, value: string) => {
    if ((setter === setEndDate && value < startDate) || (setter === setStartDate && value > endDate)) {
      notify('开始日期不可晚于结束日期', 1000)
      return
    }
    setter(value)
  }
  const statusOptions: Array<'全部' | Reservation['status']> = ['全部', '待就餐', '已超时', '已就餐', '已取消']
  return <><div className="reservation-sticky-header"><Header title="预订管理" back={onBack} /></div>
    <section className="reservation-stats-panel"><h2>今日预订数据统计</h2><div className="reservation-stats">
      <div><b>{today.filter(item => item.status === '待就餐').length}</b><span>待就餐</span></div>
      <div><b>{today.filter(item => item.status === '已超时').length}</b><span>已超时</span></div>
      <div><b>{today.filter(item => item.status === '已就餐').length}</b><span>已就餐</span></div>
      <div><b>{today.filter(item => item.status === '已取消').length}</b><span>已取消</span></div>
    </div></section>
    <section className="reservation-toolbar"><button className="primary" onClick={() => setDetail({ type: 'module', value: '新增预订' })}>＋ 新增预订</button></section>
    <section className="reservation-filters"><div><label>日期范围<input type="date" max={endDate} value={startDate} onChange={event => applyDates(setStartDate, event.target.value)} /><span>至</span><input type="date" min={startDate} value={endDate} onChange={event => applyDates(setEndDate, event.target.value)} /></label></div>
      <div className="chips padded">{statusOptions.map(status => <button key={status} className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>{status}</button>)}</div>
    </section>
    <div className="reservation-list-title"><b>预订列表</b><span>共 {list.length} 条</span></div>
    <section className="list reservation-list">{list.length ? list.map(item => <article className="list-card reservation-card" key={item.id} onClick={() => setDetail({ type: 'reservation', value: item })}><div className="reservation-card-main"><div className="card-top"><b>{item.guest} · {item.people} 人</b><Status>{item.status}</Status></div><p>{item.time} · {item.table === '未选桌台' ? '未选桌台' : `${item.table} 桌`}</p><div className="card-bottom"><span>{item.phone}</span>{(item.status === '待就餐' || item.status === '已超时') && <button className="inline-primary" onClick={event => { event.stopPropagation(); updateReservation(item.id, '已就餐') }}>确认到店</button>}</div></div></article>) : <div className="placeholder reservation-empty"><i>◷</i><h2>暂无符合条件的预订</h2><p>可调整预订日期或就餐情况后重试。</p></div>}</section>
  </>
}
const modules = [ ['◷', '预订管理'], ['🍽', '菜品管理'], ['✉', '客户反馈'], ['▥', '财务统计'], ['⌂', '店铺设置'], ['✦', 'AI 端设置'] ]
function MorePage({ setDetail, onOpenReservations, onOpenFeedback, pendingFeedbackCount, aiSubscribed: _aiSubscribed }: { setDetail: (d: Detail) => void; onOpenReservations: () => void; onOpenFeedback: () => void; pendingFeedbackCount: number; aiSubscribed?: boolean }) { return <><Header title="更多功能" /><section className="module-grid">{modules.map(([icon, name]) => <button key={name} onClick={() => name === '预订管理' ? onOpenReservations() : name === '客户反馈' ? onOpenFeedback() : setDetail({ type: 'module', value: name })}><i>{icon}</i><span>{name}</span>{name === '客户反馈' && pendingFeedbackCount > 0 && <b>{pendingFeedbackCount}</b>}</button>)}</section></> }

function ServiceRequestsPage({ items, setItems, setDetail, notify }: { items: ServiceRequest[]; setItems: (items: ServiceRequest[]) => void; setDetail: (detail: Detail) => void; notify: (message: string) => void }) {
  const [filter, setFilter] = useState('待处理'); const [expandedId, setExpandedId] = useState<string | null>(null); const [swipedId, setSwipedId] = useState<string | null>(null); const [pointerStart, setPointerStart] = useState<{ id: string; x: number } | null>(null); const [deleteTarget, setDeleteTarget] = useState<ServiceRequest | null>(null)
  const visible = items.filter(item => filter === '全部' || item.status === filter); const pendingCount = items.filter(item => item.status === '待处理').length; const processedCount = items.filter(item => item.status === '已处理').length
  const handle = (id: string) => { setItems(items.map(item => item.id === id ? { ...item, status: '已处理' } : item)); notify('服务请求已处理') }
  const handleAll = () => { if (!pendingCount) return; setItems(items.map(item => ({ ...item, status: '已处理' }))); notify(`已处理 ${pendingCount} 条服务请求`) }
  const deleteProcessed = () => { if (!processedCount) return; if (window.confirm(`确定删除 ${processedCount} 条已处理服务请求吗？`)) { setItems(items.filter(item => item.status !== '已处理')); notify('已删除已处理服务请求') } }
  const endSwipe = (id: string, x: number) => { if (!pointerStart || pointerStart.id !== id) return; const delta = x - pointerStart.x; if (delta < -36) setSwipedId(id); else if (delta > 18) setSwipedId(null); setPointerStart(null) }
  const confirmDelete = () => { if (!deleteTarget) return; setItems(items.filter(item => item.id !== deleteTarget.id)); setSwipedId(null); setDeleteTarget(null); notify('服务请求已删除') }
  return <><Header title="服务请求" /><section className="service-toolbar"><button className="primary" disabled={!pendingCount} onClick={handleAll}>✓ 全部处理{pendingCount ? ` (${pendingCount})` : ''}</button><button disabled={!processedCount} onClick={deleteProcessed}>删除已处理</button></section><div className="chips padded service-filters">{['全部', '待处理', '已处理'].map(item => <button className={filter === item ? 'active' : ''} onClick={() => { setFilter(item); setExpandedId(null); setSwipedId(null) }} key={item}>{item}</button>)}</div><div className="service-list-title"><b>请求列表</b><span>共 {visible.length} 条</span></div><section className="list service-list" onClick={() => setExpandedId(null)}>{visible.length ? visible.map(item => <div className="swipe-card-row" key={item.id}><button className="swipe-delete" onClick={event => { event.stopPropagation(); setDeleteTarget(item) }}>删除</button><article className={`list-card service-card swipe-card ${swipedId === item.id ? 'revealed' : ''}`} onPointerDown={event => setPointerStart({ id: item.id, x: event.clientX })} onPointerUp={event => endSwipe(item.id, event.clientX)} onClick={() => { if (swipedId === item.id) { setSwipedId(null); return }; setDetail({ type: 'service', value: item }) }}><div className="service-card-top"><div><b>{item.table} 桌 · {item.source}</b><time>{item.time}</time></div><button className={`request-handle ${item.status === '已处理' ? 'done' : ''}`} disabled={item.status === '已处理'} onClick={event => { event.stopPropagation(); handle(item.id) }}>{item.status === '已处理' ? '已处理' : '✓ 确认处理'}</button></div><p className={expandedId === item.id ? 'expanded' : ''} onClick={event => { event.stopPropagation(); setExpandedId(expandedId === item.id ? null : item.id) }}>{item.category && `【${item.category}】`}{item.content}</p></article></div>) : <div className="service-empty"><i>✓</i><b>{filter === '待处理' ? '暂无待处理服务请求' : filter === '已处理' ? '暂无已处理服务请求' : '暂无服务请求'}</b></div>}</section>{deleteTarget && <div className="modal-backdrop item-delete-backdrop"><section className="modal item-delete-modal"><h2>删除服务请求</h2><p>确定删除该条服务请求吗？删除后无法恢复。</p><div><button onClick={() => setDeleteTarget(null)}>取消</button><button className="primary" onClick={confirmDelete}>确认删除</button></div></section></div>}</>
}
function CustomerFeedbackPage({ items, setItems, setDetail, notify, onBack }: { items: ServiceRequest[]; setItems: (items: ServiceRequest[]) => void; setDetail: (detail: Detail) => void; notify: (message: string) => void; onBack: () => void }) {
  const [filter, setFilter] = useState('待处理'); const [expandedId, setExpandedId] = useState<string | null>(null); const [swipedId, setSwipedId] = useState<string | null>(null); const [pointerStart, setPointerStart] = useState<{ id: string; x: number } | null>(null); const [deleteTarget, setDeleteTarget] = useState<ServiceRequest | null>(null)
  const visible = items.filter(item => filter === '全部' || item.status === filter); const pendingCount = items.filter(item => item.status === '待处理').length; const processedCount = items.filter(item => item.status === '已处理').length
  const handle = (id: string) => { setItems(items.map(item => item.id === id ? { ...item, status: '已处理' } : item)); notify('客户反馈已处理') }
  const handleAll = () => { if (!pendingCount) return; setItems(items.map(item => ({ ...item, status: '已处理' }))); notify(`已处理 ${pendingCount} 条客户反馈`) }
  const deleteProcessed = () => { if (!processedCount) return; if (window.confirm(`确定删除 ${processedCount} 条已处理客户反馈吗？`)) { setItems(items.filter(item => item.status !== '已处理')); notify('已删除已处理客户反馈') } }
  const endSwipe = (id: string, x: number) => { if (!pointerStart || pointerStart.id !== id) return; const delta = x - pointerStart.x; if (delta < -36) setSwipedId(id); else if (delta > 18) setSwipedId(null); setPointerStart(null) }
  const confirmDelete = () => { if (!deleteTarget) return; setItems(items.filter(item => item.id !== deleteTarget.id)); setSwipedId(null); setDeleteTarget(null); notify('客户反馈已删除') }
  return <><Header title="客户反馈" back={onBack} /><section className="service-toolbar"><button className="primary" disabled={!pendingCount} onClick={handleAll}>✓ 全部处理{pendingCount ? ` (${pendingCount})` : ''}</button><button disabled={!processedCount} onClick={deleteProcessed}>删除已处理</button></section><div className="chips padded service-filters">{['全部', '待处理', '已处理'].map(item => <button className={filter === item ? 'active' : ''} onClick={() => { setFilter(item); setExpandedId(null); setSwipedId(null) }} key={item}>{item}</button>)}</div><div className="service-list-title"><b>反馈列表</b><span>共 {visible.length} 条</span></div><section className="list service-list" onClick={() => setExpandedId(null)}>{visible.length ? visible.map(item => <div className="swipe-card-row" key={item.id}><button className="swipe-delete" onClick={event => { event.stopPropagation(); setDeleteTarget(item) }}>删除</button><article className={`list-card service-card swipe-card ${swipedId === item.id ? 'revealed' : ''}`} onPointerDown={event => setPointerStart({ id: item.id, x: event.clientX })} onPointerUp={event => endSwipe(item.id, event.clientX)} onClick={() => { if (swipedId === item.id) { setSwipedId(null); return }; setDetail({ type: 'feedback', value: item }) }}><div className="service-card-top"><div><b>{item.table} 桌 · {item.source}</b><time>{item.time}</time></div><button className={`request-handle ${item.status === '已处理' ? 'done' : ''}`} disabled={item.status === '已处理'} onClick={event => { event.stopPropagation(); handle(item.id) }}>{item.status === '已处理' ? '已处理' : '✓ 确认处理'}</button></div><p className={expandedId === item.id ? 'expanded' : ''} onClick={event => { event.stopPropagation(); setExpandedId(expandedId === item.id ? null : item.id) }}>{item.content}</p></article></div>) : <div className="service-empty"><i>✓</i><b>{filter === '待处理' ? '暂无待处理客户反馈' : filter === '已处理' ? '暂无已处理客户反馈' : '暂无客户反馈'}</b></div>}</section>{deleteTarget && <div className="modal-backdrop item-delete-backdrop"><section className="modal item-delete-modal"><h2>删除客户反馈</h2><p>确定删除该条客户反馈吗？删除后无法恢复。</p><div><button onClick={() => setDeleteTarget(null)}>取消</button><button className="primary" onClick={confirmDelete}>确认删除</button></div></section></div>}</>
}
type ContactType = 'phone' | 'email'
type ContactAction = 'bind' | 'replace' | 'unbind'

const phoneRegions = [{ label: '中国大陆 +86', code: '+86' }, { label: '中国香港 +852', code: '+852' }, { label: '新加坡 +65', code: '+65' }]
const maskPhone = (value: string) => value ? `${value.slice(0, Math.ceil(value.length / 4))}${'*'.repeat(Math.floor(value.length / 2))}${value.slice(Math.ceil(value.length * 3 / 4))}` : ''
const maskEmail = (value: string) => { const [prefix, domain] = value.split('@'); if (!domain) return value; const visible = Math.ceil(prefix.length / 4); return `${prefix.slice(0, visible)}${'*'.repeat(Math.floor(prefix.length / 2))}${prefix.slice(prefix.length - visible)}@${domain}` }

function ContactModal({ type, action, current, onClose, onSave, notify }: { type: ContactType; action: ContactAction; current: string | null; onClose: () => void; onSave: (value: string | null) => void; notify: (message: string) => void }) {
  const [step, setStep] = useState(action === 'replace' ? 1 : 2)
  const [region, setRegion] = useState('+86')
  const [value, setValue] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  useEffect(() => { if (!seconds) return; const timer = window.setTimeout(() => setSeconds(current => current - 1), 1000); return () => window.clearTimeout(timer) }, [seconds])
  const contactName = type === 'phone' ? '手机号' : '邮箱'
  const validValue = () => type === 'email' ? /^[A-Za-z0-9_.-]{1,64}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value) && value.length <= 128 : region === '+86' ? /^1[3-9]\d{9}$/.test(value) : region === '+852' ? /^[5689]\d{7}$/.test(value) : /^[89]\d{7}$/.test(value)
  const currentDisplay = current ? type === 'phone' ? `${region} ${maskPhone(current)}` : maskEmail(current) : ''
  const sendCode = () => { if (step === 2 && action !== 'unbind' && !validValue()) { setError(type === 'phone' ? '请输入正确的手机号' : '请输入正确的邮箱地址'); return }; setError(''); setSeconds(60); notify(`验证码已发送至${step === 1 || action === 'unbind' ? currentDisplay : type === 'phone' ? `${region} ${maskPhone(value)}` : maskEmail(value)}`) }
  const submit = () => {
    if (step === 1) { if (code !== '123456') { setError('验证码不正确，请重新输入'); return }; setCode(''); setError(''); setStep(2); return }
    if (action !== 'unbind' && !validValue()) { setError(type === 'phone' ? '请输入正确的手机号' : '请输入正确的邮箱地址'); return }
    if (code !== '123456') { setError('验证码不正确，请重新输入'); return }
    onSave(action === 'unbind' ? null : value); notify(`${contactName}${action === 'unbind' ? '解绑' : '绑定'}成功`); onClose()
  }
  const title = `${action === 'bind' ? '绑定' : action === 'replace' ? '更换' : '解绑'}${contactName}`
  const identityStep = step === 1
  return <div className="modal-backdrop"><section className="modal account-modal"><header><h2>{title}</h2><button className="modal-close" aria-label="关闭" onClick={onClose}>×</button></header>{identityStep && <><p className="account-step">验证原{contactName}身份</p><label>当前{contactName}<input value={currentDisplay} readOnly /></label></>}{!identityStep && action !== 'unbind' && <label>{action === 'replace' ? `新${contactName}` : contactName}<div className="contact-input">{type === 'phone' && <select value={region} onChange={event => setRegion(event.target.value)}>{phoneRegions.map(item => <option value={item.code} key={item.code}>{item.label}</option>)}</select>}<input value={value} inputMode={type === 'phone' ? 'numeric' : 'email'} onBlur={() => { if (value && !validValue()) setError(type === 'phone' ? '请输入正确的手机号' : '请输入正确的邮箱地址') }} onChange={event => { setValue(type === 'phone' ? event.target.value.replace(/\D/g, '') : event.target.value); setError('') }} placeholder={type === 'phone' ? '请输入手机号' : '请输入邮箱地址'} /></div></label>}{action === 'unbind' && <label>当前{contactName}<input value={currentDisplay} readOnly /></label>}<label>验证码<div className="code-row"><input value={code} inputMode="numeric" maxLength={6} onChange={event => { setCode(event.target.value.replace(/\D/g, '')); setError('') }} placeholder="请输入 6 位验证码" /><button type="button" disabled={!!seconds || (step === 2 && action !== 'unbind' && !validValue())} onClick={sendCode}>{seconds ? `${seconds}s 后重试` : '获取验证码'}</button></div></label>{error && <small className="field-error">{error}</small>}<p className="account-hint">验证码 10 分钟内有效；演示验证码为 123456。</p><div><button onClick={onClose}>取消</button><button className="primary" onClick={submit}>{identityStep ? '下一步' : action === 'unbind' ? '确认解绑' : action === 'replace' ? '确定更换' : '确定'}</button></div></section></div>
}


function PasswordModal({ onClose, notify }: { onClose: () => void; notify: (message: string, duration?: number) => void }) {
  const [oldPassword, setOldPassword] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const [oldPasswordError, setOldPasswordError] = useState(false); const [modalToast, setModalToast] = useState('')
  const [showOld, setShowOld] = useState(false); const [showNew, setShowNew] = useState(false); const [showConfirm, setShowConfirm] = useState(false)
  const lengthOk = password.length >= 8 && password.length <= 20
  const kinds = [/[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*_]/].filter(rule => rule.test(password)).length
  const passwordOk = lengthOk && kinds >= 3
  const matches = !!confirm && confirm === password
  const showModalToast = (message: string) => { setModalToast(message); window.setTimeout(() => setModalToast(''), 1000) }; const submit = () => { setError(''); setOldPasswordError(false); if (!oldPassword.trim()) { showModalToast('请输入原密码'); return }; if (!passwordOk) { showModalToast('请输入符合规则的新密码'); return }; if (!matches) { showModalToast('请确认两次输入的新密码一致'); return }; if (oldPassword !== demoAccount.password) { setOldPasswordError(true); showModalToast('原密码错误，请重新输入'); return }; notify('密码修改成功', 1000); onClose() }
  const eye = (visible: boolean, toggle: () => void) => <button type="button" className="password-visibility" aria-label={visible ? '隐藏密码' : '显示密码'} title={visible ? '隐藏密码' : '显示密码'} onClick={toggle}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-5.5 9.5-5.5S21.5 12 21.5 12 18.1 17.5 12 17.5 2.5 12 2.5 12Z" />{!visible ? <><circle cx="12" cy="12" r="2.8" /><path d="M4 4l16 16" /></> : <circle cx="12" cy="12" r="2.8" />}</svg></button>
  const control = (input: ReactNode, valid = false) => <span className="password-control"><span className="password-input-wrap">{input}</span><span className="password-status">{valid && <i className="password-input-check">✓</i>}</span></span>
  return <div className="modal-backdrop"><section className="modal account-modal password-modal"><header><h2>修改登录密码</h2><button className="modal-close" aria-label="关闭" onClick={onClose}>×</button></header>{modalToast && <div className="modal-inline-toast">{modalToast}</div>}<div className="password-modal-body"><label>原密码{control(<><input className={`password-input ${oldPasswordError ? 'field-invalid-input' : ''}`} type={showOld ? 'text' : 'password'} value={oldPassword} onChange={event => { setOldPassword(event.target.value); setOldPasswordError(false); setError('') }} placeholder="请输入原密码" />{eye(showOld, () => setShowOld(value => !value))}</>)}</label><label>新密码{control(<><input className="password-input" type={showNew ? 'text' : 'password'} value={password} onChange={event => { setPassword(event.target.value); setError('') }} placeholder="请输入新密码" />{eye(showNew, () => setShowNew(value => !value))}</>, passwordOk)}</label><div className="password-rule"><span className={lengthOk ? 'valid' : ''}>{lengthOk ? '✓' : '○'} 长度限制：8-20 位字符</span><span className={kinds >= 3 ? 'valid' : ''}>{kinds >= 3 ? '✓' : '○'} 组合要求：大写字母、小写字母、数字、常用特殊符号(!@#$%^&amp;*_)中，至少包含三类</span></div><label>确认新密码{control(<><input className={`password-input ${confirm && !matches ? 'field-invalid-input' : ''}`} type={showConfirm ? 'text' : 'password'} value={confirm} onChange={event => { setConfirm(event.target.value); setError('') }} placeholder="请再次输入新密码" />{eye(showConfirm, () => setShowConfirm(value => !value))}</>, Boolean(confirm && matches && passwordOk))}</label>{confirm && !matches && <small className="field-error">两次输入的密码不一致</small>}{confirm && matches && !passwordOk && <small className="field-error">请输入符合要求的新密码</small>}{error && <small className="field-error">{error}</small>}</div><footer className="password-modal-actions"><button onClick={onClose}>取消</button><button className="primary" onClick={submit}>确定修改</button></footer></section></div>
}
function AccountSettingsPage({ onBack, notify, embedded = false }: { onBack?: () => void; notify: (message: string) => void; embedded?: boolean }) {
  const [phone, setPhone] = useState<string | null>('13800138000'); const [email, setEmail] = useState<string | null>('merchant@fkm.com'); const [modal, setModal] = useState<{ type: ContactType; action: ContactAction } | 'password' | null>(null)
  const contactRow = (type: ContactType, value: string | null) => {
    const name = type === 'phone' ? '手机号' : '邮箱'
    const display = value ? type === 'phone' ? `+86 ${maskPhone(value)}` : maskEmail(value) : '未绑定'
    return <section className="account-row" key={type} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr) auto', alignItems: 'center', gap: 11, minHeight: 64, padding: '14px 17px' }}>
      <i>{type === 'phone' ? '◫' : '✉'}</i>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}><b>{name}</b><span className={value ? '' : 'unbound'}>{display}</span></div>
      <aside>{value ? <><button className="account-main" onClick={() => setModal({ type, action: 'replace' })}>更换</button><button onClick={() => setModal({ type, action: 'unbind' })}>解绑</button></> : <button className="account-main" onClick={() => setModal({ type, action: 'bind' })}>去绑定</button>}</aside>
    </section>
  }
  const content = <><section className="account-group"><p>账号设置 · 绑定信息</p>{contactRow('phone', phone)}{contactRow('email', email)}</section><section className="account-group"><p>登录安全</p><section className="account-row"><i>◌</i><div><b>登录密码</b><span>上次修改：2026-08-01</span></div><aside><button className="account-main" onClick={() => setModal('password')}>修改密码</button></aside></section></section>{modal === 'password' && <PasswordModal onClose={() => setModal(null)} notify={notify} />}{modal && modal !== 'password' && <ContactModal type={modal.type} action={modal.action} current={modal.type === 'phone' ? phone : email} onClose={() => setModal(null)} onSave={value => modal.type === 'phone' ? setPhone(value) : setEmail(value)} notify={notify} />}</>
  return embedded ? content : <main className="account-page"><Header title="账号设置" back={onBack} />{content}</main>
}

function PreferenceSettingsPage({ onBack, notify, embedded = false }: { onBack?: () => void; notify: (message: string) => void; embedded?: boolean }) {
  const [language, setLanguage] = useState('简体中文'); const [orderSound, setOrderSound] = useState(true); const [callSound, setCallSound] = useState(true)
  const changeLanguage = (next: string) => { setLanguage(next); notify(next === '简体中文' ? '已切换至简体中文' : next === '繁體中文' ? '已切換至繁體中文' : 'Switched to English') }
  const playTone = (name: string) => { try { const Audio = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (Audio) { const context = new Audio(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.connect(gain); gain.connect(context.destination); oscillator.frequency.value = name === '订单' ? 880 : 660; gain.gain.setValueAtTime(.05, context.currentTime); oscillator.start(); oscillator.stop(context.currentTime + .16) } } catch { /* 浏览器不支持时仅展示提示 */ } notify(`正在播放${name}提示音`) }
  const soundRow = (title: string, description: string, enabled: boolean, setEnabled: (value: boolean) => void) => <section className="preference-row"><div><b>{title}</b><span>{description}</span><button className="sound-test" onClick={() => playTone(title === '订单提示音' ? '订单' : '呼叫')}>测试</button></div><button className={`preference-switch ${enabled ? 'on' : ''}`} aria-label={`${title}${enabled ? '已开启' : '已关闭'}`} onClick={() => setEnabled(!enabled)}><i /></button></section>
  const content = <><section className="account-group"><p>语言</p><section className="preference-row language-row"><div><b>语言设置</b><span>切换系统显示语言</span></div><select className="language-select" value={language} onChange={event => changeLanguage(event.target.value)} aria-label="选择系统显示语言">{['简体中文', '繁體中文', 'English'].map(item => <option key={item}>{item}</option>)}</select></section></section><section className="account-group"><p>提示音</p>{soundRow('订单提示音', '新订单进入订单管理时触发提示音', orderSound, setOrderSound)}{soundRow('呼叫提示音', '新服务请求进入服务请求时触发提示音', callSound, setCallSound)}</section></>
  return embedded ? content : <main className="account-page preference-page"><Header title="偏好设置" back={onBack} />{content}</main>
}

function MePage({ onLogout, notify }: { onLogout: () => void; notify: (message: string) => void }) { const [confirm, setConfirm] = useState(false); return <><Header title="我的" /><section className="profile"><div className="avatar">店</div><div><h2>FKM · 湖滨店</h2><p>当前门店</p></div><span>›</span></section><PreferenceSettingsPage embedded notify={notify} /><AccountSettingsPage embedded notify={notify} /><section className="settings"><p>其他</p><button><i>?</i>帮助与反馈<span>›</span></button></section><section className="settings"><p>关于</p><button><i>ⓘ</i>当前版本<span>v0.1.0</span></button></section><button className="logout" onClick={() => setConfirm(true)}>退出登录</button>{confirm && <div className="modal-backdrop"><section className="modal"><h2>确认退出登录？</h2><p>确定要退出当前账号吗？</p><div><button onClick={() => setConfirm(false)}>取消</button><button className="primary" onClick={onLogout}>确认</button></div></section></div>}</> }

type TableDiscount = { type: 'percentage' | 'fixed'; value: number } | null

function RefundModal({ target, quantity, setQuantity, error, setError, returnStock, setReturnStock, reason, setReason, wholeAmount, maxQuantity, onCancel, onConfirm }: { target: { order: Order; item?: Order['items'][number] }; quantity: number; setQuantity: (value: number) => void; error: string; setError: (value: string) => void; returnStock: boolean; setReturnStock: (value: boolean) => void; reason: string; setReason: (value: string) => void; wholeAmount: number; maxQuantity?: number; onCancel: () => void; onConfirm: () => void }) {
  const item = target.item
  const available = item ? (maxQuantity ?? item.quantity) : 0
  const amount = item ? item.discountedUnitPrice * quantity : wholeAmount
  return <div className="modal-backdrop"><section className="modal refund-modal"><header className="refund-header"><h2>{item ? '单品退款' : '整单退款'}</h2><button className="modal-close" aria-label="关闭退款弹窗" onClick={onCancel}>×</button></header>{item ? <section className="refund-product"><b>{item.name} · ¥{item.discountedUnitPrice.toFixed(2)}</b>{item.specs && <span>{item.specs}</span>}</section> : <p>订单 {target.order.id}</p>}{item ? <label>退款数量<div className="refund-quantity"><input type="number" min="1" max={available} value={quantity} onChange={event => { const value = Number(event.target.value); setQuantity(value); setError('') }} />{error && <em>{error}</em>}</div></label> : <label>退款金额<input value={`¥${wholeAmount.toFixed(2)}`} readOnly /></label>} {item && <label>退款金额<input value={`¥${amount.toFixed(2)}`} readOnly /></label>}<label>退款备注（选填）<input value={reason} onChange={event => setReason(event.target.value)} placeholder="请输入退款原因" /></label><section className="inventory-choice"><b>库存处理</b><button className={!returnStock ? 'selected' : ''} onClick={() => setReturnStock(false)}><i /><span>不退回库存<small>仅完成退款，不调整菜品库存</small></span></button><button className={returnStock ? 'selected' : ''} onClick={() => setReturnStock(true)}><i /><span>退回库存<small>退款商品将加回库存；售罄菜品可能恢复上架</small></span></button></section><div><button onClick={onCancel}>取消</button><button className="primary" onClick={onConfirm}>确认退款</button></div></section></div>
}

function TableOrderCore({ orders, discount, onCheckout, notify }: { orders: Order[]; discount: TableDiscount; onCheckout: () => void; notify: (message: string) => void }) {
  const [refundTarget, setRefundTarget] = useState<{ order: Order; item?: Order['items'][number] } | null>(null)
  const [refundQuantity, setRefundQuantity] = useState(1)
  const [refundError, setRefundError] = useState('')
  const [returnStock, setReturnStock] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refunded, setRefunded] = useState<Record<string, number>>({})
  const [checkoutConfirm, setCheckoutConfirm] = useState(false)
  const [checkoutTip, setCheckoutTip] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const itemTotal = (item: Order['items'][number]) => item.quantity
  const itemKey = (order: Order, item: Order['items'][number]) => `${order.id}-${item.id}`
  const originalAmount = orders.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.originalUnitPrice * item.quantity, 0), 0)
  const dishDiscountAmount = orders.reduce((total, order) => total + order.items.reduce((sum, item) => sum + (item.originalUnitPrice - item.discountedUnitPrice) * item.quantity, 0), 0)
  const refundAmount = orders.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.discountedUnitPrice * (refunded[itemKey(order, item)] ?? 0), 0), 0)
  const preDiscountAmount = originalAmount - dishDiscountAmount - refundAmount
  const wholeDiscountAmount = discount ? Math.min(preDiscountAmount, discount.type === 'percentage' ? preDiscountAmount * discount.value / 100 : discount.value) : 0
  const payableAmount = preDiscountAmount - wholeDiscountAmount
  const paymentAmountLabel = orders.length > 0 && orders.every(order => order.status === '已完成') ? '实付金额' : '待付金额'
  // 当前原型尚未配置待下单区域；接入后在此处关联待下单菜品数量。
  const hasPendingItems = false
  const checkoutUnavailableMessage = hasPendingItems ? '待下单区域存在未处理菜品，请先提交下单或删除待下单菜品后，再进行结账。' : payableAmount < 0 ? '当前待付金额为负数，请调整折扣后再结账。' : null
  const canCheckout = !checkoutUnavailableMessage
  const requestCheckout = () => { if (!canCheckout) { setCheckoutTip(checkoutUnavailableMessage!); window.setTimeout(() => setCheckoutTip(null), 1000); return }; setCheckoutConfirm(true) }
  const confirmRefund = () => {
    if (!refundTarget) return
    if (refundTarget.item) {
      const available = itemTotal(refundTarget.item) - (refunded[itemKey(refundTarget.order, refundTarget.item)] ?? 0)
      if (!Number.isInteger(refundQuantity) || refundQuantity < 1 || refundQuantity > available) { setRefundError(`请输入1~${available}之间的正整数`); return }
    }
    const message = refundTarget.item ? `确认要对菜品「${refundTarget.item.name}」发起退款吗？此操作不可撤销` : `确认要对订单${refundTarget.order.id}发起整单退款吗？此操作不可撤销`
    if (!window.confirm(message)) return
    const items = refundTarget.item ? [refundTarget.item] : refundTarget.order.items
    setRefunded(current => {
      const next = { ...current }
      items.forEach(item => { next[itemKey(refundTarget.order, item)] = refundTarget.item ? Math.min(itemTotal(item), (next[itemKey(refundTarget.order, item)] ?? 0) + refundQuantity) : itemTotal(item) })
      return next
    })
    const successMessage = refundTarget.item ? `${refundTarget.item.name}退款成功` : `订单 ${refundTarget.order.id} 退款成功`
    setRefundTarget(null); setRefundQuantity(1); setRefundError(''); setReturnStock(false); setRefundReason(''); notify(successMessage)
  }
  const orderFullyRefunded = (order: Order) => order.items.every(item => (refunded[itemKey(order, item)] ?? 0) >= itemTotal(item))
  const orderPartiallyRefunded = (order: Order) => !orderFullyRefunded(order) && order.items.some(item => (refunded[itemKey(order, item)] ?? 0) > 0)
  const refundedRows = Array.from(orders.flatMap(order => order.items.map(item => ({ item, quantity: refunded[itemKey(order, item)] ?? 0 })).filter(row => row.quantity > 0)).reduce((rows, { item, quantity }) => {
    const key = `${item.name}::${item.specs ?? ''}`
    const row = rows.get(key) ?? { name: item.name, specs: item.specs, quantity: 0, amount: 0 }
    row.quantity += quantity
    row.amount += item.discountedUnitPrice * quantity
    rows.set(key, row)
    return rows
  }, new Map<string, { name: string; specs?: string; quantity: number; amount: number }>()).values())
  const orderOriginalAmount = (order: Order) => order.items.reduce((sum, item) => sum + item.originalUnitPrice * item.quantity, 0)
  const wholeRefundAmount = refundTarget && !refundTarget.item ? refundTarget.order.items.reduce((sum, item) => sum + item.discountedUnitPrice * (item.quantity - (refunded[itemKey(refundTarget.order, item)] ?? 0)), 0) : 0
  return <><section className="detail-section table-order-core" onClick={() => setExpandedItem(null)}><div className="order-detail-title"><h3>订单详情</h3></div>{discount && <div className="current-discount"><span>当前折扣</span><b>{discount.type === 'percentage' ? `百分比折扣 ${discount.value}%` : `固定金额减免 ¥${discount.value.toFixed(2)}`}</b></div>}{orders.length ? <><section className="order-core-section"><h4>已下单</h4>{orders.map(order => <article className="submitted-order" key={order.id}><header className="order-primary"><div className="order-id-with-status"><b>{order.id}</b>{orderFullyRefunded(order) ? <em className="refund-status full">已退款</em> : orderPartiallyRefunded(order) ? <em className="refund-status partial">部分退款</em> : null}</div>{!orderFullyRefunded(order) && <button onClick={() => { setRefundTarget({ order }); setRefundQuantity(1) }}>整单退款</button>}</header><div className="order-meta"><span>{order.source}</span><time>{order.time}</time></div>{order.items.map(item => { const refundedCount = refunded[itemKey(order, item)] ?? 0; const total = itemTotal(item); const key = itemKey(order, item); return <div className={`submitted-item ${refundedCount === total ? 'fully-refunded' : ''}`} key={item.id}><div><div className="dish-name-row"><button className={`dish-name ${expandedItem === key ? 'expanded' : ''}`} onClick={event => { event.stopPropagation(); setExpandedItem(expandedItem === key ? null : key) }}>{item.name}</button>{refundedCount > 0 && <em>已退×{refundedCount}</em>}</div>{item.specs && <small>{item.specs}</small>}</div><span className="item-price"><b>¥{(item.discountedUnitPrice * item.quantity).toFixed(2)}</b>{item.originalUnitPrice > item.discountedUnitPrice && <del>¥{(item.originalUnitPrice * item.quantity).toFixed(2)}</del>}</span><span className="item-quantity">× {item.quantity}</span><button disabled={refundedCount === total} onClick={() => { setRefundTarget({ order, item }); setRefundQuantity(1) }}>{refundedCount === total ? '已退款' : '退款'}</button></div> })}</article>)}</section>{refundedRows.length > 0 && <section className="order-core-section refunded-section"><h4>已退款</h4>{refundedRows.map(row => <div className="refunded-item" key={`${row.name}-${row.specs ?? 'default'}`}><div><b>{row.name}</b><small>{row.specs || '默认规格'}</small></div><span>退款×{row.quantity}</span><strong>¥{row.amount.toFixed(2)}</strong></div>)}</section>}</> : <div className="order-empty"><i>⌑</i><p>当前暂无已下单菜品，快快去下单吧~</p></div>}<section className="amount-summary"><h4>金额统计</h4><p><span>菜品原价</span><b>¥{originalAmount.toFixed(2)}</b></p>{dishDiscountAmount > 0 && <p><span>菜品优惠</span><b>−¥{dishDiscountAmount.toFixed(2)}</b></p>}{refundAmount > 0 && <p><span>已退款金额</span><b>−¥{refundAmount.toFixed(2)}</b></p>}{wholeDiscountAmount > 0 && <p><span>整单优惠</span><b>−¥{wholeDiscountAmount.toFixed(2)}</b></p>}<div><span>{paymentAmountLabel}</span><strong>¥{payableAmount.toFixed(2)}</strong></div></section></section><footer className="fixed-action table-checkout"><button className="primary large" onClick={requestCheckout}>结账</button></footer>{checkoutTip && <div className="checkout-tip">{checkoutTip}</div>}{refundTarget && <RefundModal target={refundTarget} quantity={refundQuantity} setQuantity={setRefundQuantity} error={refundError} setError={setRefundError} returnStock={returnStock} setReturnStock={setReturnStock} reason={refundReason} setReason={setRefundReason} wholeAmount={wholeRefundAmount} maxQuantity={refundTarget.item ? itemTotal(refundTarget.item) - (refunded[itemKey(refundTarget.order, refundTarget.item)] ?? 0) : undefined} onCancel={() => setRefundTarget(null)} onConfirm={confirmRefund} />}{checkoutConfirm && <div className="modal-backdrop checkout-modal-backdrop"><section className="modal checkout-confirm-modal"><h2>确认结账</h2><p>是否确定对当前桌台进行结账，当前消费金额为 ¥{payableAmount.toFixed(2)}？</p><div><button onClick={() => setCheckoutConfirm(false)}>取消</button><button className="primary" onClick={onCheckout}>确定</button></div></section></div>}</>
}

function ServiceRequestDetail({ request, title, onBack, onSave, notify }: { request: ServiceRequest; title: string; onBack: () => void; onSave: (note: string) => void; notify: (message: string) => void }) {
  const [note, setNote] = useState(request.note ?? '')
  return <><Header title={title} back={onBack} /><section className="detail-section service-detail"><div className="service-detail-title"><h2>{request.table} 桌 · {request.source}</h2><Status>{request.status}</Status></div><div className="service-detail-meta"><span>请求时间</span><b>{request.time}</b></div><div className="service-detail-content"><span>{title.replace('详情', '内容')}</span><p>{request.content}</p></div></section><section className="detail-section service-note"><h3>备注 <small>（选填）</small></h3><textarea value={note} maxLength={200} onChange={event => setNote(event.target.value)} placeholder="请输入备注内容" /><p>{note.length}/200</p></section><footer className="fixed-action"><button className="primary large" onClick={() => { onSave(note.trim()); notify('备注已保存'); onBack() }}>保存备注</button></footer></>
}

function DetailPage({ detail, close, region, onRegionChange, openModule, openTablePage, openEditTable, openTableModule, returnToTable, openTable, transferTable, updateTableDetails, updateTable, confirmOrder, submitTableOrder, updateReservation, updateServiceRequest, updateFeedback, tables, orders, dishes, categories, onDishesChange, onCategoriesChange, addTable, addReservation, notify }: { detail: Exclude<Detail, null>; close: () => void; region: string; onRegionChange: (region: string) => void; openModule: (name: string) => void; openTablePage: (table: Table) => void; openEditTable: (table: Table) => void; openTableModule: (table: Table, name: string) => void; returnToTable: (table: Table) => void; openTable: (table: Table, diners: number, startedAt: string) => void; transferTable: (source: Table, target: Table) => boolean; updateTableDetails: (table: Table) => void; updateTable: (id: string, s: TableStatus) => void; confirmOrder: (id: string) => void; submitTableOrder: (table: Table, items: PendingOrderItem[]) => void; updateReservation: (id: string, s: Reservation['status']) => void; updateServiceRequest: (id: string, note: string) => void; updateFeedback: (id: string, note: string) => void; tables: Table[]; orders: Order[]; dishes: Dish[]; categories: DishCategory[]; onDishesChange: (dishes: Dish[]) => void; onCategoriesChange: (categories: DishCategory[]) => void; addTable: (table: Table) => void; addReservation: (reservation: Reservation) => void; notify: (message: string, duration?: number) => void }) {
  const [tableDiscount, setTableDiscount] = useState<TableDiscount>(null)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [detailRefunded, setDetailRefunded] = useState<Record<string, number>>({})
  const [detailRefundTarget, setDetailRefundTarget] = useState<{ order: Order; item?: Order['items'][number] } | null>(null)
  const [detailRefundQuantity, setDetailRefundQuantity] = useState(1)
  const [detailRefundError, setDetailRefundError] = useState('')
  const [detailReturnStock, setDetailReturnStock] = useState(false)
  const [detailRefundReason, setDetailRefundReason] = useState('')
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<Table | null>(null)
  if (detail.type === 'openTable') return <OpenTablePage table={detail.value} onCancel={() => returnToTable(detail.value)} onConfirm={(diners, startedAt) => openTable(detail.value, diners, startedAt)} notify={notify} />
  if (detail.type === 'editTable') return <EditTablePage table={detail.value} tables={tables} onCancel={() => returnToTable(detail.value)} onSave={updateTableDetails} notify={notify} />
  if (detail.type === 'service') return <ServiceRequestDetail request={detail.value} title="服务请求详情" onBack={close} onSave={note => updateServiceRequest(detail.value.id, note)} notify={notify} />
  if (detail.type === 'feedback') return <ServiceRequestDetail request={detail.value} title="客户反馈详情" onBack={close} onSave={note => updateFeedback(detail.value.id, note)} notify={notify} />
  if (detail.type === 'module' && detail.value === '新增预订') return <ReservationForm tables={tables} onBack={close} onCreate={addReservation} notify={notify} />
  if (detail.type === 'module' && detail.value === '添加桌台') return <AddTablePage tables={tables} onCancel={close} onSave={addTable} notify={notify} />
  if (detail.type === 'module' && detail.value === '菜品管理') return <DishManagePage dishes={dishes} categories={categories} onBack={close} onDishesChange={onDishesChange} onCategoriesChange={onCategoriesChange} notify={notify} />
  if (detail.type === 'module' && detail.value === '店铺设置') return <StoreSettingsPage onBack={close} notify={notify} region={region} onRegionChange={onRegionChange} />
  if (detail.type === 'module' && detail.value === 'AI 端设置') return <AiSettingsPage onBack={close} notify={notify} />
  if (detail.type === 'module' && detail.table && detail.value.endsWith('·点餐')) {
    const orderingTable = detail.table
    return <MerchantOrderingPage table={orderingTable} dishes={dishes} categories={categories} onBack={() => returnToTable(orderingTable)} onSubmit={items => submitTableOrder(orderingTable, items)} notify={notify} />
  }
  if (detail.type === 'module') return <><Header title={detail.value} back={detail.table ? () => returnToTable(detail.table!) : close} /><section className="placeholder"><i>{detail.value === '财务统计' ? '▥' : '⌑'}</i><h2>{detail.value}</h2><p>{detail.value === '财务统计' ? '今日营收、趋势与热门菜品将在这里展示。' : '该模块已预留移动端入口，后续可接入真实业务数据。'}</p></section></>
  if (detail.type === 'table') {
    const t = detail.value
    const tableOrders = orders.filter(order => order.table === t.name)
    const actions = ['开台', '点餐', '设置折扣', '换台', '编辑桌台']
    const description = t.status === '空闲' ? '当前桌台空闲，可进行开台' : t.status === '就餐中' ? `${t.startedAt} 开台 · ${t.diners} 人用餐` : '当前桌台待清理，请及时完成清台'
    const unavailableActionMessages: Record<TableStatus, Partial<Record<string, string>>> = {
      空闲: { 点餐: '当前桌台尚未开台，请先完成开台后再进行点餐。', 设置折扣: '当前桌台尚未开台，暂无法设置折扣。', 换台: '当前桌台尚未开台，暂无法进行换台操作。' },
      就餐中: { 开台: '当前桌台正在就餐中，无需重复开台。', 编辑桌台: '当前桌台正在就餐中，暂无法编辑桌台。' },
      待清理: { 开台: '当前桌台待清理，请先完成清台后再开台。', 点餐: '请先完成清台并开台后，再进行点餐。', 设置折扣: '当前桌台待清理，暂无法设置折扣。', 换台: '当前桌台待清理，暂无法进行换台操作。' },
    }
    const actionClick = (action: string) => {
      const message = unavailableActionMessages[t.status][action]
      if (message) { notify(message, 1000); return }
      if (action === '开台') openTablePage(t)
      else if (action === '设置折扣') setDiscountOpen(true)
      else if (action === '换台') setTransferOpen(true)
      else if (action === '编辑桌台') openEditTable(t)
      else openTableModule(t, action)
    }
    const applyDiscount = () => { const value = Number(discountValue); if (!value || value <= 0 || (discountType === 'percentage' && value > 100)) { notify(discountType === 'percentage' ? '请输入大于 0 且不超过 100 的数值，最多保留两位小数' : '请输入大于 0 的金额，最多保留两位小数'); return }; setTableDiscount({ type: discountType, value }); setDiscountOpen(false); notify('整单折扣已应用') }
    const availableTables = tables.filter(table => table.status === '空闲' && table.id !== t.id)
    const confirmTransfer = () => {
      if (!transferTarget) return
      if (!transferTable(t, transferTarget)) { notify('目标桌台容纳人数不足', 1000); setTransferTarget(null); return }
      setTransferTarget(null)
      setTransferOpen(false)
    }
    return <><Header title={`${t.name} 桌`} back={close} /><section className={`detail-hero table-detail-hero ${t.status}`}><div className="status-line"><Status>{t.status}</Status>{t.reserved && <span className="reservation-bell" title="存在有效预订">🛎️</span>}</div><h2>{t.seats} 人桌 · {t.area}</h2><p>{description}</p></section><section className="detail-section"><h3>快捷操作</h3><div className="action-grid table-actions">{actions.map(action => <button key={action} disabled={action === '换台' && t.status !== '就餐中'} title={action === '换台' && t.status !== '就餐中' ? '仅就餐中桌台可换台' : undefined} onClick={() => actionClick(action)}>{action}</button>)}</div></section>{transferOpen && <div className="modal-backdrop transfer-backdrop"><section className="modal transfer-modal"><header><h2>选择目标桌台 <small>（当前就餐人数：{t.diners ?? 0}人）</small></h2><button className="modal-close" aria-label="关闭选择目标桌台" onClick={() => { setTransferTarget(null); setTransferOpen(false) }}>×</button></header>{availableTables.length ? <div className="transfer-table-grid">{availableTables.map(table => <button className={transferTarget?.id === table.id ? 'selected' : ''} key={table.id} onClick={() => setTransferTarget(table)}><b>{table.name}号桌</b><span>{table.seats}人</span></button>)}</div> : <p className="transfer-empty">暂无可用桌台</p>}<footer className="transfer-actions"><button onClick={() => { setTransferTarget(null); setTransferOpen(false) }}>取消</button><button className="primary" disabled={!transferTarget} onClick={confirmTransfer}>确认换台</button></footer></section></div>}{t.status === '就餐中' && <TableOrderCore orders={tableOrders} discount={tableDiscount} onCheckout={() => updateTable(t.id, '待清理')} notify={notify} />}{discountOpen && <div className="modal-backdrop"><section className="modal discount-modal"><header><h2>{t.name}·设置折扣</h2><button className="modal-close" aria-label="关闭折扣设置" onClick={() => setDiscountOpen(false)}>×</button></header><div className="discount-type"><button className={discountType === 'percentage' ? 'selected' : ''} onClick={() => setDiscountType('percentage')}>百分比折扣</button><button className={discountType === 'fixed' ? 'selected' : ''} onClick={() => setDiscountType('fixed')}>固定金额减免</button></div><label>{discountType === 'percentage' ? '折扣比例（输入 10 表示减免 10%）' : '减免金额'}<input type="number" min="0" step="0.01" value={discountValue} onChange={event => setDiscountValue(event.target.value)} placeholder="请输入折扣数值" /></label><p className="discount-help">{discountType === 'percentage' ? '请输入大于 0 且不超过 100 的数值，最多保留两位小数' : '请输入大于 0 的金额，最多保留两位小数'}</p><div><button onClick={() => { setTableDiscount(null); setDiscountValue(''); setDiscountOpen(false); notify('已清除整单折扣') }}>清除折扣</button><button className="primary" onClick={applyDiscount}>应用折扣</button></div></section></div>}</>
  }
  if (detail.type === 'order') {
    const o = detail.value
    const originalAmount = o.items.reduce((sum, item) => sum + item.originalUnitPrice * item.quantity, 0)
    const dishDiscount = o.items.reduce((sum, item) => sum + (item.originalUnitPrice - item.discountedUnitPrice) * item.quantity, 0)
    const refundKey = (item: Order['items'][number]) => `${o.id}-${item.id}`
    const refundedQuantity = (item: Order['items'][number]) => detailRefunded[refundKey(item)] ?? 0
    const refundAmount = o.items.reduce((sum, item) => sum + item.discountedUnitPrice * refundedQuantity(item), 0)
    const amountBeforeWholeDiscount = originalAmount - dishDiscount - refundAmount
    const wholeDiscountAmount = o.wholeDiscount ? o.wholeDiscount.type === 'percentage' ? amountBeforeWholeDiscount * o.wholeDiscount.value : Math.min(amountBeforeWholeDiscount, o.wholeDiscount.value) : 0
    const amount = amountBeforeWholeDiscount - wholeDiscountAmount
    const diners = tables.find(table => table.name === o.table)?.diners ?? '—'
    const paymentStatus = o.status === '已完成' ? '已支付' : '待支付'
    const diningMode = o.table === '外卖' ? '外带' : '堂食'
    const orderYear = o.id.match(/FKM([0-9]{4})/)?.[1] ?? String(new Date().getFullYear())
    const fullOrderTime = /^[0-9]{2}-[0-9]{2} /.test(o.time) ? `${orderYear}-${o.time}` : o.time
    const fullyRefunded = o.items.every(item => refundedQuantity(item) >= item.quantity)
    const partiallyRefunded = !fullyRefunded && o.items.some(item => refundedQuantity(item) > 0)
    const refundStatus = fullyRefunded ? '整单退款' : partiallyRefunded ? '部分退款' : '未退款'
    const requestRefund = (item?: Order['items'][number]) => { setDetailRefundTarget({ order: o, item }); setDetailRefundQuantity(1); setDetailRefundError(''); setDetailReturnStock(false); setDetailRefundReason('') }
    const confirmDetailRefund = () => {
      if (!detailRefundTarget) return
      const targetItem = detailRefundTarget.item
      const available = targetItem ? targetItem.quantity - refundedQuantity(targetItem) : 0
      if (targetItem && (!Number.isInteger(detailRefundQuantity) || detailRefundQuantity < 1 || detailRefundQuantity > available)) { setDetailRefundError(`请输入1~${available}之间的正整数`); return }
      const confirmation = targetItem ? `确认要对${targetItem.name}发起${detailRefundQuantity}份退款吗？此操作不可撤销` : `确认要对订单${o.id}发起整单退款吗？此操作不可撤销`
      if (!window.confirm(confirmation)) return
      setDetailRefunded(current => targetItem ? { ...current, [refundKey(targetItem)]: (current[refundKey(targetItem)] ?? 0) + detailRefundQuantity } : ({ ...current, ...Object.fromEntries(o.items.map(target => [refundKey(target), target.quantity])) }))
      setDetailRefundTarget(null)
      notify(targetItem ? `${targetItem.name}退款成功` : `订单 ${o.id} 退款成功`)
    }
    const detailWholeRefundAmount = o.items.reduce((sum, item) => sum + item.discountedUnitPrice * (item.quantity - refundedQuantity(item)), 0)
    return <><div className="order-detail-sticky-head"><Header title="订单详情" back={close} /><section className="order-detail-hero"><span>订单ID</span><h2>{o.id}</h2><div><b>{o.table === '外卖' ? '无桌号' : `${o.table} 桌`}</b><em>{diningMode}</em><Status>{o.status === '待确认' ? '待确认' : '已确认'}</Status></div></section></div><section className="detail-section order-basic-info"><h3>订单信息</h3><div><p><span>下单时间</span><b>{fullOrderTime}</b></p><p><span>点餐方式</span><b>{o.source}</b></p><p><span>就餐人数</span><b>{diners === '—' ? '—' : `${diners} 人`}</b></p><p><span>支付状态</span><b className={paymentStatus}>{paymentStatus}</b></p><p><span>退款状态</span><b className={refundStatus}>{refundStatus}</b></p><p><span>确认状态</span><b>{o.status === '待确认' ? '待确认' : '已确认'}</b></p></div></section><section className="detail-section order-items-detail"><div className="order-detail-section-head"><h3>菜品明细 <span>{o.items.length} 种</span></h3>{!fullyRefunded && <button onClick={() => requestRefund()}>整单退款</button>}</div>{o.items.map(item => { const isRefunded = refundedQuantity(item) >= item.quantity; return <article className={isRefunded ? 'fully-refunded' : ''} key={item.id}><div className="dish-thumb">{item.name.slice(0, 1)}</div><div className="order-item-main"><b>{item.name}</b><small>{item.specs || '默认规格'}</small></div><strong>¥{item.originalUnitPrice.toFixed(2)} × {item.quantity}</strong><button className="item-refund" disabled={isRefunded} onClick={() => requestRefund(item)}>{isRefunded ? '已退款' : '退款'}</button></article> })}</section><section className="detail-section order-amount-detail"><h3>金额统计</h3><p><span>原价</span><b>¥{originalAmount.toFixed(2)}</b></p>{dishDiscount > 0 && <p><span>菜品优惠</span><b>−¥{dishDiscount.toFixed(2)}</b></p>}{refundAmount > 0 && <p><span>退款金额</span><b>−¥{refundAmount.toFixed(2)}</b></p>}{wholeDiscountAmount > 0 && <p><span>整单优惠</span><b>−¥{wholeDiscountAmount.toFixed(2)}</b></p>}<div><span>{paymentStatus === '已支付' ? '实付金额' : '待付金额'}</span><strong>¥{amount.toFixed(2)}</strong></div></section>{o.status === '待确认' && <footer className="fixed-action"><button className="primary large" onClick={() => confirmOrder(o.id)}>✓ 确认订单</button></footer>}{detailRefundTarget && <RefundModal target={detailRefundTarget} quantity={detailRefundQuantity} setQuantity={setDetailRefundQuantity} error={detailRefundError} setError={setDetailRefundError} returnStock={detailReturnStock} setReturnStock={setDetailReturnStock} reason={detailRefundReason} setReason={setDetailRefundReason} wholeAmount={detailWholeRefundAmount} maxQuantity={detailRefundTarget.item ? detailRefundTarget.item.quantity - refundedQuantity(detailRefundTarget.item) : undefined} onCancel={() => setDetailRefundTarget(null)} onConfirm={confirmDetailRefund} />}</>
  }
  const r = detail.value; return <><Header title="预订详情" back={close} /><section className="detail-section reservation-detail"><Status>{r.status}</Status><h2>{r.guest}</h2><p>{r.phone}</p><div className="row"><span>预订时间</span><b>{r.time}</b></div><div className="row"><span>就餐人数</span><b>{r.people} 人</b></div><div className="row"><span>预选桌台</span><b>{r.table} 桌</b></div></section>{r.status === '待就餐' && <footer className="fixed-action"><button className="primary large" onClick={() => updateReservation(r.id, '已就餐')}>确认顾客到店</button></footer>}</>
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('fkm-session') === 'active')
  const [storeRegion, setStoreRegion] = useState(() => localStorage.getItem('fkm-store-region') ?? '中国大陆')
  const aiSubscribed = true
  const [resettingPassword, setResettingPassword] = useState(false)
  const [tab, setTab] = useState<Tab>('tables'); const [detail, setDetail] = useState<Detail>(null); const [toast, setToast] = useState<string | null>(null)
  const [tables, setTables] = useState(seedTables); const [orders, setOrders] = useState(seedOrders); const [reservations, setReservations] = useState(seedReservations); const [dishes, setDishes] = useState(seedDishes)
  const [categories, setCategories] = useState<DishCategory[]>([{ id: 'cat-signature', name: '招牌菜', englishName: 'Signature', priority: 1 }, { id: 'cat-hot', name: '热菜', englishName: 'Hot dishes', priority: 2 }, { id: 'cat-dessert', name: '甜品', englishName: 'Desserts', priority: 3 }])
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([
    { id: 's1', table: 'A02', source: '用户', time: '08-16 12:26', category: '添水', content: '麻烦帮忙加两杯温水，谢谢。', status: '待处理' },
    { id: 's2', table: 'B01', source: 'AI', time: '08-16 12:18', category: '人工帮助', content: '识别到 B01 桌顾客在过去五分钟内多次查看服务铃并频繁向出餐口张望，建议服务员尽快前往桌台确认是否需要催菜、补充餐具或提供其他协助。', status: '待处理' },
    { id: 's3', table: 'C01', source: '用户', time: '08-16 12:05', category: '额外餐具', content: '请补充一套餐具。', status: '待处理' },
    { id: 's4', table: 'A01', source: 'AI', time: '08-16 11:48', category: '催单', content: '菜品等待时间较长，建议关注出餐进度。', status: '已处理' },
  ])
  const [feedbacks, setFeedbacks] = useState<ServiceRequest[]>([
    { id: 'f1', table: 'A02', source: '用户', time: '08-16 12:34', content: '今天的菜品口味很好，服务也很及时，整体用餐体验不错。', status: '待处理' },
    { id: 'f2', table: 'B01', source: '用户', time: '08-16 12:20', content: '希望可以适当加快出餐速度，等候主菜的时间稍长。', status: '待处理' },
    { id: 'f3', table: 'C01', source: '用户', time: '08-16 11:56', content: '环境舒适，餐具干净。', status: '已处理', note: '已记录并同步门店服务群。' },
  ])
  const notify = (message: string, duration = 1800) => { setToast(message); window.setTimeout(() => setToast(null), duration) }
  const openTable = (table: Table, diners: number, startedAt: string) => { const openedTable = { ...table, status: '就餐中' as TableStatus, diners, startedAt }; setTables(current => current.map(item => item.id === table.id ? openedTable : item)); setDetail({ type: 'table', value: openedTable }); notify('开台成功') }
  const transferTable = (source: Table, target: Table) => { if ((source.diners ?? 0) > target.seats) return false; const transferredAt = source.startedAt; const transferredDiners = source.diners; setTables(current => current.map(table => table.id === source.id ? { ...table, status: '空闲', startedAt: undefined, diners: undefined } : table.id === target.id ? { ...table, status: '就餐中', startedAt: transferredAt, diners: transferredDiners } : table)); setDetail(null); notify('已将' + source.name + '号桌换至' + target.name + '号桌'); return true }
  const updateTable = (id: string, status: TableStatus) => { setTables(current => current.map(t => t.id === id ? { ...t, status, startedAt: status === '就餐中' ? '现在' : undefined, diners: status === '就餐中' ? 2 : undefined } : t)); setDetail(null); notify(status === '空闲' ? '已完成清台' : '已成功开台') }
  const addTable = (table: Table) => { setTables(current => [...current, table]); setDetail(null); notify('桌台添加成功') }
  const updateTableDetails = (table: Table) => { setTables(current => current.map(item => item.id === table.id ? table : item)); setDetail({ type: 'table', value: table }); notify('桌台信息已保存') }
  const confirmOrder = (id: string) => { setOrders(current => current.map(o => o.id === id ? { ...o, status: '制作中' } : o)); setDetail(null); notify('订单已确认，已通知后厨') }
  const submitTableOrder = (table: Table, pendingItems: PendingOrderItem[]) => {
    const now = new Date()
    const two = (value: number) => String(value).padStart(2, '0')
    const datePrefix = `FKM${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}`
    const time = `${two(now.getMonth() + 1)}-${two(now.getDate())} ${two(now.getHours())}:${two(now.getMinutes())}`
    const createdAt = now.getTime()
    setOrders(current => {
      const sequence = current.filter(order => order.id.startsWith(datePrefix)).length + 1
      const order: Order = {
        id: `${datePrefix}${String(sequence).padStart(3, '0')}`,
        table: table.name,
        time,
        status: '制作中',
        source: '商家代点',
        items: pendingItems.map((item, index) => ({
          id: `oi-${createdAt}-${index}`,
          name: item.name,
          quantity: item.quantity,
          originalUnitPrice: item.originalUnitPrice,
          discountedUnitPrice: item.discountedUnitPrice,
          specs: item.specs,
        })),
      }
      return [...current, order]
    })
    const orderedQuantity = pendingItems.reduce<Record<string, number>>((total, item) => ({ ...total, [item.dishId]: (total[item.dishId] ?? 0) + item.quantity }), {})
    setDishes(current => current.map(dish => {
      if (dish.stock === undefined || !orderedQuantity[dish.id]) return dish
      const stock = Math.max(0, dish.stock - orderedQuantity[dish.id])
      return { ...dish, stock, status: stock === 0 ? '售罄' : dish.status }
    }))
    setDetail({ type: 'table', value: tables.find(item => item.id === table.id) ?? table })
    notify('下单成功，已进入当前桌台详情')
  }
  const updateReservation = (id: string, status: Reservation['status']) => { setReservations(current => current.map(r => r.id === id ? { ...r, status } : r)); setDetail(null); notify('预订状态已更新') }; const addReservation = (reservation: Reservation) => setReservations(current => [...current, reservation])
  const updateServiceRequest = (id: string, note: string) => setServiceRequests(current => current.map(item => item.id === id ? { ...item, note } : item))
  const updateFeedback = (id: string, note: string) => setFeedbacks(current => current.map(item => item.id === id ? { ...item, note } : item))
  const feedbackPendingCount = feedbacks.filter(item => item.status === '待处理').length
  const page = useMemo(() => ({ tables: <TablesPage tables={tables} setDetail={setDetail} updateTable={updateTable} />, orders: <OrdersPage orders={orders} setDetail={setDetail} confirmOrder={confirmOrder} />, reservations: <ReservationsPage reservations={reservations} setDetail={setDetail} updateReservation={updateReservation} notify={notify} onBack={() => setTab('more')} />, more: <MorePage setDetail={setDetail} onOpenReservations={() => setTab('reservations')} onOpenFeedback={() => setTab('feedback')} pendingFeedbackCount={feedbackPendingCount} aiSubscribed={aiSubscribed} />, service: <ServiceRequestsPage items={serviceRequests} setItems={setServiceRequests} setDetail={setDetail} notify={notify} />, feedback: <CustomerFeedbackPage items={feedbacks} setItems={setFeedbacks} setDetail={setDetail} notify={notify} onBack={() => setTab('more')} />, me: <MePage onLogout={() => { sessionStorage.removeItem('fkm-session'); setLoggedIn(false) }} notify={notify} /> })[tab], [tab, tables, orders, reservations, serviceRequests, feedbacks, feedbackPendingCount])
  const servicePendingCount = serviceRequests.filter(item => item.status === '待处理').length
  if (!loggedIn) return resettingPassword ? <ForgotPassword onBack={() => setResettingPassword(false)} /> : <Login onLogin={() => { sessionStorage.setItem('fkm-session', 'active'); setLoggedIn(true) }} onForgot={() => setResettingPassword(true)} />
  return <main className="app-shell"><div className="app-content">{detail ? <DetailPage detail={detail} close={() => setDetail(null)} region={storeRegion} onRegionChange={region => { setStoreRegion(region); localStorage.setItem('fkm-store-region', region) }} openModule={name => setDetail({ type: 'module', value: name })} openTablePage={table => setDetail({ type: 'openTable', value: table })} openEditTable={table => setDetail({ type: 'editTable', value: table })} openTableModule={(table, name) => setDetail({ type: 'module', value: `${table.name}·${name}`, table })} returnToTable={table => setDetail({ type: 'table', value: tables.find(item => item.id === table.id) ?? table })} openTable={openTable} transferTable={transferTable} updateTable={updateTable} confirmOrder={confirmOrder} submitTableOrder={submitTableOrder} updateReservation={updateReservation} updateServiceRequest={updateServiceRequest} updateFeedback={updateFeedback} tables={tables} orders={orders} dishes={dishes} categories={categories} onDishesChange={setDishes} onCategoriesChange={setCategories} addTable={addTable} addReservation={addReservation} updateTableDetails={updateTableDetails} notify={notify} /> : page}</div>{!detail && <nav className="tabbar">{tabItems.map(item => <button type="button" key={item.key} className={tab === item.key ? 'selected' : ''} onClick={() => setTab(item.key)}><i>{item.icon}</i>{item.label}{item.key === 'service' && servicePendingCount > 0 && <b>{servicePendingCount}</b>}{item.key === 'more' && feedbackPendingCount > 0 && <b>{feedbackPendingCount}</b>}</button>)}</nav>}<Toast message={toast} /></main>
}
