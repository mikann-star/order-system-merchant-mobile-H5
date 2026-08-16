import { useState } from 'react'

type Command = { id: string; text: string }

export function StoreSettingsPage({ onBack, notify }: { onBack: () => void; notify: (message: string) => void }) {
  const [name, setName] = useState('FKM · 湖滨店')
  const [intro, setIntro] = useState('为顾客提供轻松、舒适的餐饮体验。')
  const [open, setOpen] = useState(false)
  const [region, setRegion] = useState('中国大陆')
  const [commands, setCommands] = useState<Command[]>([{ id: 'c1', text: '请为我推荐店内的特色单品' }, { id: 'c2', text: '请为我推荐低卡路里的单品' }, { id: 'c3', text: '呼叫服务员加水' }])
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newOrder, setNewOrder] = useState('4')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const currency = region === '中国大陆' ? '¥' : '$'

  const save = () => { if (!name.trim()) { notify('请填写店铺名称'); return }; notify('保存成功') }
  const addCommand = () => {
    const order = Number(newOrder)
    if (!newText.trim()) { notify('键入内容禁止为空'); return }
    if (!Number.isInteger(order) || order < 1 || order > commands.length + 1) { notify(`排序请输入 1~${commands.length + 1} 的整数`); return }
    const next = [...commands]; next.splice(order - 1, 0, { id: `command-${Date.now()}`, text: newText.trim() })
    setCommands(next); setNewText(''); setNewOrder(String(next.length + 1)); setAdding(false)
  }
  const removeCommand = (id: string) => { if (window.confirm('确定删除该快捷指令吗？')) setCommands(current => current.filter(command => command.id !== id)) }
  const move = (index: number, direction: -1 | 1) => { const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= commands.length) return; const next = [...commands]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]]; setCommands(next) }
  const commitEdit = (id: string) => { if (!editingText.trim()) { notify('键入内容禁止为空'); return }; setCommands(current => current.map(command => command.id === id ? { ...command, text: editingText.trim() } : command)); setEditingId(null) }

  return <main className="store-settings-page"><header className="header"><button className="icon-button" onClick={onBack}>‹</button><h1>店铺设置</h1><span /></header><section className="store-heading"><h2>店铺设置</h2><p>店铺基础信息及相关设置</p></section><section className="store-section"><h3>基础信息</h3><label>餐厅名称 <em>*</em><input value={name} maxLength={50} onChange={event => setName(event.target.value)} placeholder="请输入店铺名称" /></label><label>餐厅简介 <small>（选填）</small><textarea value={intro} maxLength={200} onChange={event => setIntro(event.target.value)} placeholder="请输入店铺简介" /><span className="store-counter">{intro.length}/200</span></label><div className="store-switch-row"><div><b>营业状态</b><span>{open ? '营业中' : '休息中'}</span></div><button className={`store-switch ${open ? 'on' : ''}`} onClick={() => setOpen(value => !value)}><i /></button></div><label>店铺地区<select value={region} onChange={event => setRegion(event.target.value)}><option>新加坡（$）</option><option>中国香港（$）</option><option>中国大陆（¥）</option></select><span className="store-help">地区决定全局货币符号：新加坡 → $，中国香港 → $，中国大陆 → ¥。当前为 {currency}。</span></label></section><section className="store-section quick-command-section"><div className="store-section-head"><div><h3>AI 端快捷指令</h3><p>配置顾客使用 AI 时一键键入的常用话术</p></div><button className="store-add" onClick={() => { setAdding(true); setNewOrder(String(commands.length + 1)) }}>＋ 新增</button></div>{adding && <div className="command-add-form"><input autoFocus value={newText} maxLength={80} onChange={event => setNewText(event.target.value)} placeholder="请输入键入内容" /><label>排序<input value={newOrder} inputMode="numeric" onChange={event => setNewOrder(event.target.value.replace(/\D/g, ''))} /></label><div><button onClick={() => { setAdding(false); setNewText('') }}>取消</button><button className="primary" onClick={addCommand}>确定新增</button></div></div>}<div className="command-list">{commands.length ? commands.map((command, index) => <article key={command.id}><span className="command-order">{index + 1}</span><div>{editingId === command.id ? <input autoFocus value={editingText} onChange={event => setEditingText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') commitEdit(command.id) }} /> : <b title={command.text}>{command.text}</b>}</div><aside><button disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button disabled={index === commands.length - 1} onClick={() => move(index, 1)}>↓</button><button onClick={() => editingId === command.id ? commitEdit(command.id) : (setEditingId(command.id), setEditingText(command.text))}>{editingId === command.id ? '✓' : '✎'}</button><button className="danger" onClick={() => removeCommand(command.id)}>🗑</button></aside></article>) : <div className="command-empty">暂无快捷指令</div>}</div></section><footer className="fixed-action store-save"><button className="primary large" onClick={save}>保存更改</button></footer></main>
}
