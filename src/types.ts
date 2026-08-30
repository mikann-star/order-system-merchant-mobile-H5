export type TableStatus = '空闲' | '就餐中' | '待清理'
export type OrderStatus = '待确认' | '制作中' | '已完成'
export type ReservationStatus = '待就餐' | '已超时' | '已就餐' | '已取消'

export interface User { name: string; role: string; store: string }
export interface Table { id: string; name: string; seats: number; area: string; status: TableStatus; reserved?: boolean; startedAt?: string; diners?: number }
export interface OrderItem { id: string; name: string; quantity: number; originalUnitPrice: number; discountedUnitPrice: number; specs?: string }
export interface Order { id: string; table: string; time: string; status: OrderStatus; source: '商家代点' | '用户自点'; items: OrderItem[]; wholeDiscount?: { type: 'percentage' | 'fixed'; value: number } }
export interface Reservation { id: string; guest: string; phone: string; time: string; scheduledAt: string; people: number; table: string; status: ReservationStatus; note?: string }
export type DishStatus = '已上架' | '售罄' | '已下架'
export interface DishOption { id: string; name: string; englishName: string; priceDelta: number; costDelta?: number }
export interface DishSpecGroup { id: string; name: string; englishName: string; selection: '单选' | '多选'; defaultOptionId: string; options: DishOption[] }
export interface Dish { id: string; name: string; englishName?: string; imageUrl?: string; category: string; price: number; stock?: number; recommended?: boolean; discount?: number; status: DishStatus; estimatedCost?: number; description?: string; keywords?: string; specs?: DishSpecGroup[] }
export interface DishCategory { id: string; name: string; englishName: string; description?: string; priority: number }

