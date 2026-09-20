import { useEffect, useState } from 'react'

type FeeSetting = 'service' | 'tax'

const sanitizePercent = (raw: string) => {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const dotIndex = cleaned.indexOf('.')
  if (dotIndex < 0) return cleaned
  const integer = cleaned.slice(0, dotIndex)
  const decimal = cleaned.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2)
  return `${integer}.${decimal}`
}

const percentError = (enabled: boolean, value: string, _label: string) => {
  if (!enabled) return ''
  if (!value.trim()) return '请输入大于0且小于100的两位小数'
  const number = Number(value)
  return Number.isFinite(number) && number > 0 && number < 100 ? '' : '请输入大于0且小于100的两位小数'
}

export function StoreSettingsPage({ onBack, notify, region, onRegionChange }: { onBack: () => void; notify: (message: string) => void; region: string; onRegionChange: (region: string) => void }) {
  const [name, setName] = useState(() => localStorage.getItem('fkm-store-name') ?? 'FKM · 湖滨店')
  const [intro, setIntro] = useState(() => localStorage.getItem('fkm-store-intro') ?? '为顾客提供轻松、舒适的餐饮体验。')
  const [open, setOpen] = useState(() => localStorage.getItem('fkm-store-open') === 'true')
  const [serviceEnabled, setServiceEnabled] = useState(() => localStorage.getItem('fkm-service-enabled') === 'true')
  const [serviceRate, setServiceRate] = useState(() => localStorage.getItem('fkm-service-rate') ?? '')
  const [serviceError, setServiceError] = useState('')
  const [taxEnabled, setTaxEnabled] = useState(() => localStorage.getItem('fkm-tax-enabled') === 'true')
  const [taxRate, setTaxRate] = useState(() => localStorage.getItem('fkm-tax-rate') ?? '')
  const [taxError, setTaxError] = useState('')

  useEffect(() => { const timer = window.setTimeout(() => { if (name.trim()) localStorage.setItem('fkm-store-name', name.trim()) }, 500); return () => window.clearTimeout(timer) }, [name])
  useEffect(() => { const timer = window.setTimeout(() => localStorage.setItem('fkm-store-intro', intro), 500); return () => window.clearTimeout(timer) }, [intro])

  const validatePercent = (type: FeeSetting) => {
    const isService = type === 'service'
    const value = isService ? serviceRate : taxRate
    const error = percentError(isService ? serviceEnabled : taxEnabled, value, isService ? '服务费' : '消费税')
    if (isService) setServiceError(error); else setTaxError(error)
    if (!error) {
      localStorage.setItem(isService ? 'fkm-service-rate' : 'fkm-tax-rate', value)
      localStorage.setItem(isService ? 'fkm-service-enabled' : 'fkm-tax-enabled', 'true')
    }
    return !error
  }
  const rateField = (type: FeeSetting) => {
    const service = type === 'service'
    const label = service ? '服务费' : '消费税'
    const value = service ? serviceRate : taxRate
    const error = service ? serviceError : taxError
    const setValue = service ? setServiceRate : setTaxRate
    const setError = service ? setServiceError : setTaxError
    return <label className="fee-rate-field">每单收取{label}<div className={`fee-rate-input ${error ? 'invalid' : ''}`}><input inputMode="decimal" value={value} onChange={event => { setValue(sanitizePercent(event.target.value)); setError('') }} onBlur={() => { if (validatePercent(type)) notify('已自动保存') }} placeholder="请输入比例" /><span>%</span></div>{error && <small className="fee-error">{error}</small>}</label>
  }
  const toggle = (type: FeeSetting) => {
    const service = type === 'service'
    const enabled = service ? serviceEnabled : taxEnabled
    const setEnabled = service ? setServiceEnabled : setTaxEnabled
    const setError = service ? setServiceError : setTaxError
    const value = service ? serviceRate : taxRate
    const label = service ? '服务费' : '消费税'
    const enabledKey = service ? 'fkm-service-enabled' : 'fkm-tax-enabled'
    return <button type="button" className={`fee-switch ${enabled ? 'on' : ''}`} aria-pressed={enabled} onClick={() => { const next = !enabled; setEnabled(next); setError(''); if (!next) { localStorage.setItem(enabledKey, 'false'); notify('已自动保存') } else if (!percentError(true, value, label)) { localStorage.setItem(enabledKey, 'true'); notify('已自动保存') } }}><span>{enabled ? '是' : '否'}</span><i /></button>
  }
  const handleBack = () => {
    const settle = (enabled: boolean, value: string, label: string, enabledKey: string, rateKey: string) => {
      if (!enabled) return
      if (percentError(true, value, label)) localStorage.setItem(enabledKey, 'false')
      else { localStorage.setItem(enabledKey, 'true'); localStorage.setItem(rateKey, value) }
    }
    settle(serviceEnabled, serviceRate, '服务费', 'fkm-service-enabled', 'fkm-service-rate')
    settle(taxEnabled, taxRate, '消费税', 'fkm-tax-enabled', 'fkm-tax-rate')
    onBack()
  }
  return (
    <main className="store-settings-page">
      <header className="header"><button className="icon-button" onClick={handleBack}>‹</button><h1>店铺设置</h1><span /></header>
      <p className="store-group-label">基础信息</p>
      <section className="store-section store-basic-section">
        <label>餐厅名称 <em>*</em><input value={name} maxLength={50} onChange={event => setName(event.target.value)} onBlur={() => notify(name.trim() ? '已自动保存' : '请填写店铺名称')} placeholder="请输入店铺名称" /></label>
        <label>餐厅简介 <small>（选填）</small><textarea value={intro} maxLength={200} onChange={event => setIntro(event.target.value)} onBlur={() => notify('已自动保存')} placeholder="请输入店铺简介" /><span className="store-counter">{intro.length}/200</span></label>
      </section>
      <p className="store-group-label">经营设置</p>
      <section className="store-section store-operations-section">
        <div className="store-switch-row"><div><b>营业状态</b><span>{open ? '营业中' : '休息中'}</span></div><button className={`store-switch ${open ? 'on' : ''}`} onClick={() => { const next = !open; setOpen(next); localStorage.setItem('fkm-store-open', String(next)); notify('已自动保存') }}><i /></button></div>
        <label>店铺地区<select value={region} onChange={event => { onRegionChange(event.target.value); notify('已自动保存') }} data-currency-static><option>新加坡（$）</option><option>中国香港（$）</option><option>中国大陆（¥）</option></select><span className="store-help" data-currency-static>地区决定全局货币符号：新加坡 → $，中国香港 → $，中国大陆 → ¥。</span></label>
      </section>
      <p className="store-group-label">计费设置</p>
      <section className="store-section fee-settings-section">
        <article className="fee-setting-card"><div className="fee-setting-row"><div><b>收取服务费</b><span>开启后，按订单金额收取服务费</span></div>{toggle('service')}</div>{serviceEnabled && rateField('service')}</article>
        <article className="fee-setting-card"><div className="fee-setting-row"><div><b>收取消费税</b><span>开启后，按订单金额收取消费税</span></div>{toggle('tax')}</div>{taxEnabled && rateField('tax')}</article>
      </section>
    </main>
  )
}