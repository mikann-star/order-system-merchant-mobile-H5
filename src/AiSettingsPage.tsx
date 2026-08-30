import { useState } from 'react'

type Command = { id: string; text: string }
type AddErrors = { text: string; order: string }

const defaults: Command[] = [
  { id: 'ai-1', text: '请为我推荐店内的特色单品' },
  { id: 'ai-2', text: '请为我推荐低卡路里的单品' },
  { id: 'ai-3', text: '呼叫服务员加水' },
]

export function AiSettingsPage({ onBack, notify }: { onBack: () => void; notify: (message: string, duration?: number) => void }) {
  const [commands, setCommands] = useState<Command[]>(defaults)
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newOrder, setNewOrder] = useState('')
  const [addErrors, setAddErrors] = useState<AddErrors>({ text: '', order: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const maxOrder = commands.length + 1

  const insert = (items: Command[], item: Command, order: number) => { const next = [...items]; next.splice(order - 1, 0, item); return next }
  const startAdd = () => { setNewText(''); setNewOrder(String(maxOrder)); setAddErrors({ text: '', order: '' }); setAdding(true) }
  const validateText = () => { const error = newText.trim() ? '' : '请输入键入内容'; setAddErrors(current => ({ ...current, text: error })); return !error }
  const validateOrder = () => { const value = Number(newOrder); const error = Number.isInteger(value) && value >= 1 && value <= maxOrder ? '' : `请输入1~${maxOrder}之间的正整数`; setAddErrors(current => ({ ...current, order: error })); return !error }
  const add = () => { const textValid = validateText(); const orderValid = validateOrder(); if (!textValid || !orderValid) return; setCommands(current => insert(current, { id: `ai-${Date.now()}`, text: newText.trim() }, Number(newOrder))); setAdding(false); notify('已成功新增快捷指令') }
  const startEdit = (command: Command) => { setEditingId(command.id); setEditingText(command.text) }
  const commitEdit = (id: string) => { const original = commands.find(item => item.id === id); if (!editingText.trim()) { setEditingText(original?.text ?? ''); setEditingId(null); notify('键入内容禁止为空', 1000); return }; setCommands(current => current.map(item => item.id === id ? { ...item, text: editingText.trim() } : item)); setEditingId(null) }
  const moveTo = (sourceId: string, targetId: string) => setCommands(current => { const source = current.find(item => item.id === sourceId); const targetIndex = current.findIndex(item => item.id === targetId); if (!source || targetIndex < 0 || sourceId === targetId) return current; return insert(current.filter(item => item.id !== sourceId), source, targetIndex) })
  const remove = () => { if (!deleteId) return; setCommands(current => current.filter(item => item.id !== deleteId)); setDeleteId(null) }

  return <main className="ai-settings-page" onClick={() => setExpandedId(null)}>
    <header className="header"><button className="icon-button" onClick={onBack}>‹</button><h1>AI 端设置</h1><span /></header>
    <section className="ai-heading"><div><h2>AI端快捷指令</h2><p>配置顾客使用 AI 时一键键入的常用话术</p></div><button onClick={event => { event.stopPropagation(); startAdd() }}>＋ 新增</button></section>
    <section className="ai-command-section" onClick={event => event.stopPropagation()}><div className="ai-table-head"><span /><span>排序</span><span>键入内容</span><span>操作</span></div><div className="ai-command-list">{commands.length ? commands.map((command, index) => <article className={dragId === command.id ? 'dragging' : ''} draggable key={command.id} onDragStart={() => setDragId(command.id)} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragId) moveTo(dragId, command.id); setDragId(null) }} onDragEnd={() => setDragId(null)}><button className="drag-handle" title="拖拽排序">⋮⋮</button><span>{index + 1}</span><div>{editingId === command.id ? <input autoFocus value={editingText} onChange={event => setEditingText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') commitEdit(command.id) }} /> : <b className={expandedId === command.id ? 'expanded' : ''} title={command.text} onClick={() => setExpandedId(current => current === command.id ? null : command.id)}>{command.text}</b>}</div><aside><button aria-label="编辑" onClick={() => editingId === command.id ? commitEdit(command.id) : startEdit(command)}>{editingId === command.id ? '✓' : '✎'}</button><button className="danger" aria-label="删除" onClick={() => setDeleteId(command.id)}>🗑</button></aside></article>) : <div className="ai-command-empty">暂未设置键入内容哦~</div>}</div><p className="ai-command-help">拖动左侧抓手可调整排序。</p></section>
    {adding && <div className="modal-backdrop" onClick={() => setAdding(false)}><section className="modal ai-command-modal" onClick={event => event.stopPropagation()}><header><h2>新增快捷指令</h2><button className="modal-close" aria-label="关闭新增快捷指令" onClick={() => setAdding(false)}>×</button></header><label>键入内容 <em>*</em><input autoFocus value={newText} maxLength={80} onBlur={validateText} onChange={event => { setNewText(event.target.value); setAddErrors(current => ({ ...current, text: '' })) }} placeholder="请输入键入内容" />{addErrors.text && <small className="field-error">{addErrors.text}</small>}</label><label>排序 <em>*</em><input value={newOrder} inputMode="numeric" onBlur={validateOrder} onChange={event => { setNewOrder(event.target.value.replace(/\D/g, '')); setAddErrors(current => ({ ...current, order: '' })) }} placeholder={`请输入1~${maxOrder}之间的正整数`} />{addErrors.order && <small className="field-error">{addErrors.order}</small>}</label><footer><button onClick={() => setAdding(false)}>取消</button><button className="primary" onClick={add}>确定新增</button></footer></section></div>}
    {deleteId && <div className="modal-backdrop" onClick={() => setDeleteId(null)}><section className="modal ai-command-modal delete-command-modal" onClick={event => event.stopPropagation()}><h2>删除快捷指令</h2><p>确认删除该条快捷指令吗？删除后排序将自动更新。</p><footer><button onClick={() => setDeleteId(null)}>取消</button><button className="primary" onClick={remove}>确认删除</button></footer></section></div>}
  </main>
}