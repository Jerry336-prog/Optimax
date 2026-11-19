# Optimax

React + JavaScript + Vite storefront using Supabase (Auth, Postgres, row-level policies, and payment Edge Functions), Supabase Storage images, and Paystack checkout.

## Connect the database

1. Put `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`. The legacy anon key variable is also supported. Never put service-role or Paystack secret keys in a `VITE_` variable.
2. In **Supabase Dashboard → SQL Editor → New query**, paste the complete contents of [`supabase/schema.sql`](supabase/schema.sql), then Run. This combines all store migrations. It can be rerun; it does not delete store records or insert invented products/prices. On an established project, review compatibility first: it deliberately replaces access policies on the Optimax tables.
3. In **Authentication → URL Configuration**, add the frontend origins and redirect paths, including `http://127.0.0.1:5173/`, `http://127.0.0.1:5173/reset-password`, and your production equivalents. Set the production Site URL before launch.
4. Sign up with your real owner email and complete confirmation. An existing administrator can promote your account under **Admin → Customers**. For a new installation without an administrator, the project owner must assign the first admin role through Supabase SQL Editor. No customer can grant themselves admin privileges. Refresh/sign in again to access `/admin`.
5. Create real products under **Admin → Products**. Existing image paths such as `/product 7.jpg` work; drafts are not public. Provide real price and stock before publishing. Category keys are `cameras`, `smart-locks`, `solar-energy`, and `smart-home`.
6. Update the example business details in **Admin → Settings**. These are read by the homepage, footer, Contact page, and product WhatsApp links. An empty WhatsApp number hides the ordering link.

`npm run check:backend` checks table availability without printing credentials.

## Paystack setup

The Edge Functions use **JavaScript** entrypoints configured in `supabase/config.toml`. They must be deployed; saving the frontend `.env` alone does not deploy server functions.

For repeatable deployment, set `SUPABASE_ACCESS_TOKEN`, `PAYSTACK_SECRET_KEY` and `APP_ORIGIN` in the ignored local `.env`, then run:

```sh
npm run deploy:payments
npm run check:payments
npm run audit:payments-db
```

The deployment script uses the official Supabase CLI, uploads only the three payment settings, and deploys only `paystack-init`, `paystack-verify` and `paystack-webhook`. It never sends frontend variables or the management access token as function secrets. The read-only checker validates Paystack authentication and checks hosted function authentication, webhook signature rejection and browser CORS without creating an order or charge.

Set these in **Supabase → Edge Functions → Secrets**, never in the frontend:

- `PAYSTACK_SECRET_KEY`: start with your Paystack test secret key.
- `APP_ORIGIN`: your exact deployed HTTPS origin (currently `https://optimax-eight.vercel.app`). This is the default payment return address.
- `APP_ALLOWED_ORIGINS`: optional comma-separated exact trusted origins, such as `http://127.0.0.1:5173`. Requests from those origins are allowed and return to the same origin. Wildcard domains are not accepted.

Payment functions run on Supabase, so adding a secret only to Vercel does not configure them. Set the active test secret under `PAYSTACK_SECRET_KEY` in the local `.env`, then run `npm run deploy:payments`. A variable named `PAYSTACK_TEST_SECRET_KEY` alone is not used by the runtime. Run `npm run check:payments` afterward; it verifies CORS, authentication and the active secret with read-only requests. Secrets must never have a `VITE_` prefix.

For an isolated authenticated initialization check, run `node --env-file=.env scripts/check-test-checkout.mjs`. It refuses live keys, creates a temporary QA account/order, opens a Paystack test transaction without submitting payment, verifies its mode/amount, and removes the temporary Supabase records.

Hosted functions receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically. `SB_SECRET_KEY` is a server-only alternative if your project uses new secret keys. Functions manually validate the signed-in user with Supabase Auth. The public webhook validates Paystack’s HMAC signature instead of a user token.

Set the Paystack webhook URL to:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

An order is created first with server-calculated prices and stock reservation. Its details page opens Paystack for the **product total**; delivery fees are explicitly arranged separately. The return page and webhook verify the transaction directly with Paystack before recording payment. Browser clients cannot mark orders paid. A pending payment blocks cancellation to avoid releasing paid stock. A verified failed transaction unlocks payment retry/cancellation. An abandoned/unconfirmed transaction remains pending until reconciled; the UI never assumes that closing checkout means a payment failed. Test the callback, webhook, failed-payment, and retry paths before switching to a live secret.

## Media

The product editor uploads JPG, PNG and WebP files (up to 10 MB each) to the Supabase `product-images` bucket. Profile photos upload to `profile-photos` (up to 5 MB). Both buckets deliver images publicly; authenticated customers can upload/delete only within their own profile-photo folder, and only administrators can manage product media. No Cloudinary account or keys are used. Existing image URLs continue to render.

Run `supabase/migrations/202611170006_profile_photos.sql` in Supabase SQL Editor for existing projects. It adds `profiles.avatar_url`, creates both buckets, installs owner/admin policies, and reloads the API schema cache. The combined schema includes this migration. Use RLS; do not enable anonymous uploads.

Signup includes an optional photo picker. When email confirmation is required, the selected photo stays in IndexedDB on that device until sign-in (pending photos expire after seven days and are discarded on their next access) and uploads after confirmation/sign-in in the same browser. Confirmation on another device still activates the account; the customer can add a photo in Profile Settings. Photos are uploaded only after authentication. An upload failure keeps the account usable and offers a retry in Profile Settings. Profile Settings supports replacing/removing photos; replacements use a new filename to avoid cached images, preserve the previous photo if saving fails, and delete the old file after a successful save. The shared Avatar component updates the header, account drawer, profile picker and administrator customer list, with initials/icon fallback for missing or broken images.

## Implemented flows

- Public catalog, categories, search, sorting, homepage products, image galleries, specifications, comparison, and stock status.
- Auth signup/signin/signout, confirmation redirect, forgot/reset password, session persistence, and role-protected administration.
- Profile editing, address CRUD, customer order history/detail/timeline, and pending/unpaid order cancellation.
- Guest device cart/wishlist/history; signed-in cart, wishlist and history are stored per user in Supabase. Comparison/theme remain device-local.
- Transactional checkout with owned-address validation, stock locking, full-price totals, idempotent requests, and price snapshots.
- Paystack initialization, callback verification, signed-webhook reconciliation, and idempotent payment recording.
- Admin product CRUD/publishing/stock, order-status transitions/tracking, customer notifications, review moderation, enquiry inbox, contact settings, and analytics based on stored records.
- Contact enquiries saved for signed-in users, verified-purchase reviews, notification inbox/read status, and polling for new order alerts.

Browser notifications require the customer’s explicit permission and work while the website is open. Background Web Push and transactional order email require separate delivery-provider/service-worker setup; neither is simulated. Supabase’s Auth service handles its own confirmation/recovery emails. Public product photography and brand copy are editorial assets; example contact details remain clearly labelled until replaced.

## Run and validate

```sh
npm install
npm run dev
npm run lint
npm run build
npm test
```

`npm test` runs isolated PostgreSQL migration/access/checkout/payment tests plus Paystack signature and amount validation tests. It does not create live users, orders, or charges. Live authenticated tests and Paystack test-mode checkout require the deployment/setup steps above.

## Structure

- `src/app`: auth lifecycle, settings, cart sync, notification polling, error boundary
- `src/components`: shared layout, controls, product cards/reviews/payment controls
- `src/pages`: storefront, auth, customer pages, and administration
- `src/services`: Supabase queries, uploads, and payment-function calls
- `src/store`: session and device-persisted shopping state
- `supabase/migrations`: database setup and payment transactions
- `supabase/functions`: Paystack server functions and verification helpers
- `scripts`: backend health and local security/transaction tests

## Customer and administrator roles

Customer accounts are listed in a compact, searchable table with role filters. Notifications are composed in a separate dialog. **Make admin** and **Make customer** call the admin-only `set_account_role` function. Existing projects must run `supabase/migrations/202611170003_account_roles.sql` once in SQL Editor. The combined schema includes it for new setups. Role changes are recorded in `account_role_events`, and a serialized database check prevents removing the final administrator. Customers cannot update role columns directly. Open sessions refresh profile roles on focus and periodically; database authorization takes effect immediately.

## Temporarily close the store

Existing projects must run `supabase/migrations/202611170004_store_closure.sql` in Supabase SQL Editor. In **Admin → Settings**, choose Closed, enter your customer-facing reason and a separate WhatsApp contact number with country code (for example `+234 803 633 8604`), then save. Choose Open and save to reopen. Only Shop All (including its search alias) is replaced by the closure screen. Every page displays a top closure banner with the message and urgent WhatsApp link. The homepage, product pages, cart, checkout, story, contact, account and administration remain accessible; checkout submission and payment starts remain paused. Availability refreshes on window focus and every 15 seconds, with realtime updates when the table is in your Supabase realtime publication. Initial settings loading uses a skeleton; a failed availability check hides shopping until the next successful refresh.

The database blocks new order reservations and Paystack payment starts while closed, including direct RPC calls. Existing order retries remain idempotent, and payment verification/webhooks still record payments already made. Account records remain accessible under their existing RLS policies. Apply migrations in order; the combined schema includes the closure migration.

## Account redirects and validation

Signup redirects home with a status message. When Supabase requires confirmation, customers remain signed out and the homepage asks them to check their inbox; confirmation links also return home. Add the homepage URL to Supabase Authentication redirect allowlists. Normal sign-in redirects home; an explicit protected-page `next` destination is preserved after sign-in. Invalid fields show inline messages; incorrect credentials and Supabase failures show an alert above the form. Sign-in accepts existing passwords shorter than the new-account minimum, so those customers can still authenticate.

Closure messages have no minimum or maximum character/word count; they must simply contain text. Existing projects must also apply `supabase/migrations/202611170005_closure_message.sql` to remove the old database length constraint. The separate WhatsApp field beside the message accepts international formatting and normalizes it to digits before saving. The general phone display remains independent.

If saving settings reports missing `closure_reason` or `store_open` columns, apply migrations `202611170004_store_closure.sql` and `202611170005_closure_message.sql` in order in Supabase SQL Editor, then run `notify pgrst, 'reload schema';` and refresh the app. Running only migration 005 cannot add missing columns.

Pending/abandoned Paystack transactions remain pending and cannot be treated as failed. Failed verification responses must match the stored order/reference/amount/currency before unlocking a retry. Successful payments reconcile idempotently. If saving an initialized checkout link fails, initialization still returns the verified Paystack URL; payment verification uses the stored reference.

For Paystack accounts with the Webhook Endpoints API enabled, `npm run setup:payment-webhook` registers only this project's URL for `charge.success`, preserves other endpoints, verifies registration and sends a no-charge delivery ping. `npm run check:payment-webhook` is a read-only registration check. Accounts without endpoint API access must set the webhook URL in the Paystack dashboard.

## Automatic paid invoices

Migration `supabase/migrations/202611180001_paid_invoices.sql` creates immutable invoice snapshots automatically when verified Paystack payment changes an order to paid. Repeated verification/webhooks produce one invoice per order. Existing paid orders with matching successful payments are backfilled. Unpaid orders cannot issue invoices. Invoice creation is in the payment transaction, so a verified paid order and its invoice commit together.

Customers can view/download invoices from paid orders and the successful-payment return page. Administrators have an **Invoices** tab plus invoice actions on paid orders. The authenticated `/invoices/:orderId` route uses owner/admin RLS. Invoice records cannot be inserted, changed or deleted by browser clients or the payment service role; the database trigger creates them. Customer, business, item and payment details are preserved at issue time.

The white invoice preview and downloadable A4 PDF carry a faint, centred, diagonal OPTIMAX watermark in the Vinoff reference style. Each PDF page has the watermark and page numbering. There are no stamps, approval gates, signatures or administrator names. Amounts are labelled NGN; product payment excludes separately arranged delivery charges. PDF files are produced from the saved invoice snapshot when viewed/downloaded; no public storage bucket is used for private customer invoices. `npm run test:invoices` validates totals and pagination; `node scripts/test-invoice.mjs --write-preview` writes synthetic samples under the ignored `output/pdf/` directory.

## Demo catalog and pricing

Coupons are removed from administration and checkout. Migration `202611180002_remove_coupons.sql` removes the coupon table and replaces the old four-argument checkout RPC with the full-price three-argument `place_order`. Existing financial snapshots retain their original values; no new coupon or discount can be applied. Customer orders and invoice previews/PDFs no longer display a discount row. Any separately negotiated arrangement is handled directly with the team.

`scripts/data/demo-products.mjs` contains 27 fictional listings: nine cameras, six locks, seven solar-energy items and five smart-home items. Prices, stock and specifications are explicitly labelled as demo data. Existing camera/lock photos are reused; four representative Wikimedia images have attribution under `/image-credits` and `src/config/imageCredits.js`. `npm run seed:demo-products` uploads the referenced images to Supabase Storage and inserts missing demo IDs only. Rerunning does not overwrite existing product edits or reset sold stock, and does not change store availability.

## Professional order references

Orders use `OPT-YYYYMMDD-000001` references based on their creation date in Africa/Lagos. A database counter assigns a unique serial across accounts each day; row locking prevents duplicate numbers. The counter resets for the next local date and expands beyond six digits when needed. Order retries reuse the existing reference. Customers cannot choose/change references or modify counters. Internal UUIDs and foreign-key links remain stable.

Migration `202611180003_order_references.sql` backfills existing orders in creation order, adds their references to invoice metadata without altering issued numbers or amounts, and includes the reference in future invoice snapshots. Admin's top search finds orders by order reference, invoice number, customer name or phone; Orders and Invoices tabs also have filters. Customer order history, details, tracking, invoice preview and PDF use the readable reference. Customer tracking remains restricted to the signed-in account.


Admin inventory: **Units to add → Add stock** increases the existing quantity using an admin-only atomic database operation. Product edits preserve stock changed by orders. Order creation reserves units, cancellation restores them, and shop/product/admin stock displays refresh every 15 seconds and when the page regains focus. On desktop, the inventory list scrolls independently from the product editor.
