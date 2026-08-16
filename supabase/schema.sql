-- FKM 商家端：在 Supabase Dashboard 的 SQL Editor 中执行一次。
-- 此脚本适用于免费 Supabase 项目；所有业务数据按门店隔离。

create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'manager', 'staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'staff',
  primary key (store_id, user_id)
);

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  seats integer not null check (seats > 0),
  area text not null,
  status text not null default '空闲' check (status in ('空闲', '就餐中', '待清理', '已预订')),
  started_at text,
  diners integer check (diners is null or diners > 0),
  unique (store_id, name)
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  english_name text,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  recommended boolean not null default false,
  discount integer check (discount is null or discount between 0 and 100),
  status text not null default '已上架' check (status in ('已上架', '已下架', '售罄')),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_no text not null,
  table_name text not null,
  status text not null default '待确认',
  source text not null default '用户自点',
  whole_discount numeric(5, 4),
  created_at timestamptz not null default now(),
  unique (store_id, order_no)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  dish_name text not null,
  quantity integer not null check (quantity > 0),
  original_unit_price numeric(10, 2) not null check (original_unit_price >= 0),
  discounted_unit_price numeric(10, 2) not null check (discounted_unit_price >= 0),
  specs text
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  guest text not null,
  phone text not null,
  reserved_at timestamptz not null,
  people integer not null check (people > 0),
  table_name text,
  status text not null default '待就餐',
  created_at timestamptz not null default now()
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  table_name text not null,
  source text not null default '用户',
  category text,
  content text not null,
  note text,
  status text not null default '待处理',
  created_at timestamptz not null default now()
);

create or replace function public.is_store_member(target_store_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_store(target_store_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store_id
      and user_id = auth.uid()
      and role in ('owner', 'manager')
  );
$$;

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.dishes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reservations enable row level security;
alter table public.service_requests enable row level security;

create policy "users read own profile" on public.profiles for select using (id = auth.uid());
create policy "users update own profile" on public.profiles for update using (id = auth.uid());
create policy "members read stores" on public.stores for select using (public.is_store_member(id));
create policy "members read store members" on public.store_members for select using (public.is_store_member(store_id));

create policy "members read tables" on public.restaurant_tables for select using (public.is_store_member(store_id));
create policy "managers change tables" on public.restaurant_tables for all using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "members read dishes" on public.dishes for select using (public.is_store_member(store_id));
create policy "managers change dishes" on public.dishes for all using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "members read orders" on public.orders for select using (public.is_store_member(store_id));
create policy "managers change orders" on public.orders for all using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "members read order items" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and public.is_store_member(orders.store_id))
);
create policy "managers change order items" on public.order_items for all using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and public.can_manage_store(orders.store_id))
) with check (
  exists (select 1 from public.orders where orders.id = order_items.order_id and public.can_manage_store(orders.store_id))
);
create policy "members read reservations" on public.reservations for select using (public.is_store_member(store_id));
create policy "managers change reservations" on public.reservations for all using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "members read service requests" on public.service_requests for select using (public.is_store_member(store_id));
create policy "managers change service requests" on public.service_requests for all using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));

-- 创建首个门店请在 Dashboard 的 SQL Editor 中：
-- 1) 先用 Supabase Auth 注册账号；2) 把 auth.users 的 id 写入 profiles；
-- 3) 插入 stores；4) 将该用户插入 store_members，role 设为 owner。
