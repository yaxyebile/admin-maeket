# Mogadishu Market — Admin Portal

Modern React admin portal for **Mogadishu Market** (HELLO — Buy. Sell. Anything. Anywhere.).

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style components
- Supabase (`@supabase/supabase-js`)
- Sonner toasts

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables (already in `.env.local` if generated):

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Apply database schema in Supabase SQL Editor: `supabase/migrations/001_initial_schema.sql`

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default admin login

| Field    | Value              |
|----------|--------------------|
| Email    | `admin@market.com` |
| Password | `admin123`         |

## Auth

Custom auth via `profiles` table (not Supabase Auth). Login matches email or phone + password. Session stored in `localStorage` (`current_user`, `current_user_id`).

## Routes

| Role   | Base path |
|--------|-----------|
| Admin  | `/admin`  |
| Seller | `/seller` |

## Multi-store checkout (3 dukaan)

**Hal dalab** — customer wuxuu sameeyaa **one `orders` row** with all items (each item has `storeId` / `storeName` in JSON).

**Admin:** Confirm Payment → choose **one delivery person** → Approve once (whole order).

**Sellers:** See orders where their items appear in `items[]` (their subtotal only); status is shared on the same order.

**Revenue:** Per-store revenue uses item subtotals inside paid orders (`revenueByStoreFromOrders` in `src/lib/order-split.ts`).

Mobile checkout: insert **one order** with full `items` array and `total_amount` = cart total. Do **not** split into multiple order rows.

```dart
// ❌ WRONG — loop per store
for (final store in cart.stores) {
  await supabase.from('orders').insert({...one store...});
}

// ✅ RIGHT — one insert, all cart items
final items = cart.allItems.map((i) => i.toJson()).toList();
await supabase.from('orders').insert({
  'id': uuid,
  'user_id': userId,
  'items': items,
  'total_amount': cart.grandTotal,
  'store_id': items.first['storeId'], // legacy field
  'status': 'pending',
  'payment_method': method,
  'customer_name': name,
  'customer_phone': phone,
  'customer_address': address,
  ...
});
```

Admin: haddii 3 dalab horey u sameeyay app-ku → **Pending Orders** → banner **Isku dar hal dalab**.

## Brand colors

- Primary orange: `#FF6B00`
- Accent green: `#00D285`
- Text: `#0F172A`
- Background: `#F8FAFC`
