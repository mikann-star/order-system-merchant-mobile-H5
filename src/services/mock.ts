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

export const reservations: Reservation[] = [
  { id: 'r1', guest: '王女士', phone: '138****2310', time: '今天 18:30', people: 4, table: 'B01', status: '待就餐' },
  { id: 'r2', guest: '赵先生', phone: '186****9951', time: '今天 12:00', people: 2, table: 'A06', status: '已到店' },
  { id: 'r3', guest: '林女士', phone: '139****6218', time: '明天 19:00', people: 6, table: 'B03', status: '待就餐' },
]

export const dishes: Dish[] = [
  { id: 'd1', name: '招牌酸菜鱼', englishName: 'Pickled Fish', category: '招牌菜', price: 98, stock: 18, recommended: true, discount: 10, status: '已上架' },
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
