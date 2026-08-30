import type { Dish, Order, Reservation, Table, User } from '../types'

export const demoUser: User = { name: '陈晓丽', role: '店长', store: 'FKM · 湖滨店' }
export const demoAccount = { username: 'demo', password: '123456' }

export const tables: Table[] = [
  { id: 't1', name: 'A01', seats: 2, area: '大厅', status: '空闲' },
  { id: 't2', name: 'A02', seats: 4, area: '大厅', status: '就餐中', startedAt: '11:32', diners: 3 },
  { id: 't3', name: 'A03', seats: 4, area: '大厅', status: '待清理' },
  { id: 't4', name: 'B01', seats: 6, area: '包间', status: '空闲', reserved: true },
  { id: 't5', name: 'B02', seats: 8, area: '包间', status: '空闲' },
  { id: 't6', name: 'C01', seats: 4, area: '露台', status: '就餐中', startedAt: '12:05', diners: 4 },
]

export const orders: Order[] = [
  { id: 'FKM20260815001', table: 'A02', time: '08-16 11:42', status: '制作中', source: '商家代点', items: [{ id: 'oi-1', name: '招牌酸菜鱼', quantity: 1, originalUnitPrice: 108, discountedUnitPrice: 98, specs: '微辣 | 中份' }, { id: 'oi-2', name: '米饭', quantity: 3, originalUnitPrice: 3, discountedUnitPrice: 3, specs: '普通米饭' }] },
  { id: 'FKM20260815004', table: 'A02', time: '08-16 12:06', status: '待确认', source: '用户自点', wholeDiscount: { type: 'percentage', value: 0.1 }, items: [{ id: 'oi-3', name: '椒盐排骨', quantity: 1, originalUnitPrice: 58, discountedUnitPrice: 58, specs: '微辣' }, { id: 'oi-4', name: '清炒时蔬', quantity: 1, originalUnitPrice: 28, discountedUnitPrice: 25, specs: '少油' }] },
  { id: 'FKM20260815005', table: 'A02', time: '08-16 12:18', status: '制作中', source: '用户自点', items: [{ id: 'oi-5', name: '冰豆花', quantity: 2, originalUnitPrice: 12, discountedUnitPrice: 12 }] },
  { id: 'FKM20260815002', table: 'C01', time: '08-16 12:12', status: '制作中', source: '商家代点', items: [{ id: 'oi-6', name: '椒盐排骨', quantity: 1, originalUnitPrice: 58, discountedUnitPrice: 58 }, { id: 'oi-7', name: '清炒时蔬', quantity: 1, originalUnitPrice: 28, discountedUnitPrice: 28 }, { id: 'oi-8', name: '米饭', quantity: 4, originalUnitPrice: 3, discountedUnitPrice: 3 }] },
  { id: 'FKM20260815003', table: '外卖', time: '08-16 11:48', status: '已完成', source: '用户自点', items: [{ id: 'oi-9', name: '牛肉粉', quantity: 2, originalUnitPrice: 38, discountedUnitPrice: 38 }, { id: 'oi-10', name: '冰豆花', quantity: 1, originalUnitPrice: 13, discountedUnitPrice: 13 }] },
]

const reservationTime = (daysFromToday: number, hour: number, minute: number) => { const date = new Date(); date.setSeconds(0, 0); date.setDate(date.getDate() + daysFromToday); date.setHours(hour, minute, 0, 0); return date.toISOString() }
const reservationDisplay = (iso: string) => { const date = new Date(iso); return `${String(date.getFullYear()).slice(2)}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
export const reservations: Reservation[] = [
  (() => { const scheduledAt = reservationTime(0, Math.max(new Date().getHours() + 2, 18), 30); return { id: 'r1', guest: '王女士', phone: '138****2310', scheduledAt, time: reservationDisplay(scheduledAt), people: 4, table: 'B01', status: '待就餐' as const, note: '靠窗优先' } })(),
  (() => { const scheduledAt = reservationTime(1, 12, 0); return { id: 'r2', guest: '赵先生', phone: '186****9951', scheduledAt, time: reservationDisplay(scheduledAt), people: 2, table: 'A06', status: '已就餐' as const } })(),
  (() => { const scheduledAt = reservationTime(1, 19, 0); return { id: 'r3', guest: '林女士', phone: '139****6218', scheduledAt, time: reservationDisplay(scheduledAt), people: 6, table: 'B03', status: '待就餐' as const } })(),
]
export const dishes: Dish[] = [
  { id: 'd1', name: '招牌酸菜鱼', englishName: 'Pickled Fish', category: '招牌菜', price: 98, stock: 18, recommended: true, discount: 10, status: '已上架', description: '鲜香酸爽，可按口味选择辣度和加料', specs: [
    { id: 'spice', name: '辣度', englishName: 'Spice', selection: '单选', defaultOptionId: 'spice-mild', options: [
      { id: 'spice-none', name: '不辣', englishName: 'No spice', priceDelta: 0 },
      { id: 'spice-mild', name: '微辣', englishName: 'Mild', priceDelta: 0 },
      { id: 'spice-hot', name: '中辣', englishName: 'Medium', priceDelta: 0 },
    ] },
    { id: 'extras', name: '加料', englishName: 'Extras', selection: '多选', defaultOptionId: 'extra-tofu', options: [
      { id: 'extra-tofu', name: '豆腐', englishName: 'Tofu', priceDelta: 6 },
      { id: 'extra-noodle', name: '宽粉', englishName: 'Noodles', priceDelta: 8 },
      { id: 'extra-fish', name: '加鱼片', englishName: 'Extra fish', priceDelta: 18 },
    ] },
  ] },
  { id: 'd2', name: '椒盐排骨', englishName: 'Salt & Pepper Ribs', category: '热菜', price: 58, stock: 12, status: '已上架' },
  { id: 'd3', name: '冰豆花', englishName: 'Iced Tofu Pudding', category: '甜品', price: 12, stock: 0, status: '售罄' },
]

export const AuthService = {
  login: async (username: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 450))
    return username === demoAccount.username && password === demoAccount.password ? demoUser : null
  },
}

export const TableService = { list: async () => tables }
export const OrderService = { list: async () => orders }
export const ReservationService = { list: async () => reservations }
