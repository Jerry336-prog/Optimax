import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
const admin = "00000000-0000-4000-8000-000000000003";
const product = "10000000-0000-4000-8000-000000000001";
const address = "20000000-0000-4000-8000-000000000001";
const addressB = "20000000-0000-4000-8000-000000000002";
const request = "30000000-0000-4000-8000-000000000001";
let checks = 0;
async function check(name, action) {
  await action();
  checks++;
  console.log(`PASS ${name}`);
}
async function identity(user, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    user || "",
  ]);
  await db.exec(`set role ${role}`);
}
async function root() {
  await db.exec("reset role");
}
async function stock() {
  await root();
  return (
    await db.query("select stock from public.products where id=$1", [product])
  ).rows[0].stock;
}
async function place(items, addr = address, key = request) {
  return (
    await db.query(
      "select public.place_order($1::jsonb,$2::uuid,$3::uuid) as id",
      [JSON.stringify(items), addr, key],
    )
  ).rows[0].id;
}
try {
  await db.exec(
    `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema public,auth to anon,authenticated;`,
  );
  // Minimal Storage schema for policy checks; hosted Supabase supplies this.
  await db.exec(`create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant select,insert,delete on storage.objects to anon,authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
    create function storage.extension(text) returns text language sql immutable as $$ select reverse(split_part(reverse($1),'.',1)) $$;`);
  const invoices = await readFile(new URL("../supabase/migrations/202611180001_paid_invoices.sql", import.meta.url), "utf8");
  const photos = await readFile(new URL("../supabase/migrations/202611170006_profile_photos.sql", import.meta.url), "utf8");
  const migration = await readFile(
    new URL(
      "../supabase/migrations/202611170001_store_backend.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const payments = await readFile(
    new URL(
      "../supabase/migrations/202611170002_paystack.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const roles = await readFile(
    new URL(
      "../supabase/migrations/202611170003_account_roles.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const closure = await readFile(new URL("../supabase/migrations/202611170004_store_closure.sql", import.meta.url), "utf8");
  const closureMessage = await readFile(new URL("../supabase/migrations/202611170005_closure_message.sql", import.meta.url), "utf8");
  const noCoupons = await readFile(new URL("../supabase/migrations/202611180002_remove_coupons.sql", import.meta.url), "utf8");
  const references = await readFile(new URL("../supabase/migrations/202611180003_order_references.sql", import.meta.url), "utf8");
  const noRotation = await readFile(new URL("../supabase/migrations/202611180004_remove_product_rotation.sql", import.meta.url), "utf8");
  const restock = await readFile(new URL("../supabase/migrations/202611180005_product_restock.sql", import.meta.url), "utf8");
  await check("migrations apply and can be reapplied", async () => {
    await db.exec(migration);
    await db.exec(payments);
    await db.exec(roles);
    await db.exec(closure);
    await db.exec(closureMessage);
    await db.exec(photos);
    await db.exec(invoices);
    await db.exec(noCoupons);
    await db.exec(references);
    await db.exec(noRotation);
    await db.exec(restock);
    await db.exec(migration);
    await db.exec(payments);
    await db.exec(roles);
    await db.exec(closure);
    await db.exec(closureMessage);
    await db.exec(photos);
    await db.exec(invoices);
    await db.exec(noCoupons);
    await db.exec(references);
    await db.exec(noRotation);
    await db.exec(restock);
  });
  await db.query("insert into auth.users(id) values($1),($2),($3)", [
    a,
    b,
    admin,
  ]);
  await db.query("update public.profiles set role='admin' where id=$1", [
    admin,
  ]);
  await db.query(
    "insert into public.products(id,name,category,price,stock,active) values($1,'Camera','cameras',100,3,true)",
    [product],
  );
  await db.query(
    "insert into public.addresses(id,user_id,label,address_line,city,state) values($1,$2,'Home','123 Example Road','Lagos','Lagos'),($3,$4,'Home','456 Example Road','Lagos','Lagos')",
    [address, a, addressB, b],
  );
  await check("only admins can restock; increments preserve existing stock and reject invalid units", async () => {
    await identity(a);
    await assert.rejects(() => db.query("select public.add_product_stock($1,20)", [product]), /administrators/);
    await identity(null, "anon");
    await assert.rejects(() => db.query("select public.add_product_stock($1,20)", [product]), /permission denied/);
    await identity(admin);
    for (const quantity of [0, -1, null]) await assert.rejects(() => db.query("select public.add_product_stock($1,$2)", [product, quantity]), /positive whole/);
    assert.equal((await db.query("select public.add_product_stock($1,20) as stock", [product])).rows[0].stock,23);
    assert.equal((await db.query("select public.add_product_stock($1,7) as stock", [product])).rows[0].stock,30);
    await assert.rejects(() => db.query("select public.add_product_stock($1,1)", ["10000000-0000-4000-8000-000000000099"]), /not found/);
    await root();
    await db.query("update public.products set stock=3 where id=$1", [product]);
  });
  await check("coupon storage and the old discounted checkout endpoint are removed", async () => {
    assert.equal((await db.query("select to_regclass('public.coupons') as coupons")).rows[0].coupons,null);
    await assert.rejects(()=>db.query("select public.place_order('[]'::jsonb,$1::uuid,$2::uuid,'SAVE10')",[address,request]),/does not exist/);
  });
  await check("anonymous checkout is denied", async () => {
    await identity(null, "anon");
    await assert.rejects(() => place([{ id: product, quantity: 1 }]));
  });
  await check("customers cannot promote their own role", async () => {
    await identity(a);
    await assert.rejects(() =>
      db.query("update public.profiles set role='admin' where id=$1", [a]),
    );
  });
  await check("customers can update permitted profile fields", async () => {
    await identity(a);
    await db.query(
      "update public.profiles set full_name='Test Customer' where id=$1",
      [a],
    );
  });
  await check("profile photo edits are owner-only and visible to administrators", async () => {
    await identity(a);
    await db.query("update public.profiles set avatar_url=$1 where id=$2", ['https://example.com/photo.jpg',a]);
    await identity(b);
    await db.query("update public.profiles set avatar_url='' where id=$1",[a]);
    await identity(admin);
    assert.equal((await db.query("select avatar_url from public.profiles where id=$1",[a])).rows[0].avatar_url,'https://example.com/photo.jpg');
    await identity(a);
    await assert.rejects(() => db.query("update public.profiles set avatar_url='javascript:alert(1)' where id=$1",[a]));
    await db.query("update public.profiles set avatar_url='' where id=$1",[a]);
  });
  await check("storage policies deny guest and cross-account photo uploads/deletion", async () => {
    await identity(null,'anon');
    await assert.rejects(() => db.query("insert into storage.objects(bucket_id,name) values('profile-photos',$1)",[`${a}/guest.jpg`]));
    await identity(a);
    await db.query("insert into storage.objects(bucket_id,name) values('profile-photos',$1)",[`${a}/own.jpg`]);
    await assert.rejects(() => db.query("insert into storage.objects(bucket_id,name) values('profile-photos',$1)",[`${b}/other.jpg`]));
    await assert.rejects(() => db.query("insert into storage.objects(bucket_id,name) values('profile-photos',$1)",[`${a}/bad.svg`]));
    await identity(b);
    assert.equal((await db.query("delete from storage.objects where name=$1 returning *",[`${a}/own.jpg`])).rows.length,0);
    await identity(a);
    assert.equal((await db.query("delete from storage.objects where name=$1 returning *",[`${a}/own.jpg`])).rows.length,1);
  });
  await check("only administrators can upload product media and bucket limits match the UI", async () => {
    await identity(a);
    await assert.rejects(() => db.query("insert into storage.objects(bucket_id,name) values('product-images',$1)",[`${a}/product.jpg`]));
    await identity(admin);
    await db.query("insert into storage.objects(bucket_id,name) values('product-images',$1)",[`${admin}/product.jpg`]);
    await root();
    const bucket=(await db.query("select * from storage.buckets where id='profile-photos'")).rows[0];
    assert.equal(Number(bucket.file_size_limit),5242880);
    assert.equal(bucket.public,true);
    assert.ok(!bucket.allowed_mime_types.includes('image/svg+xml'));
  });
  await check("another customer’s address cannot be used", async () => {
    await identity(a);
    await assert.rejects(
      () => place([{ id: product, quantity: 1 }], addressB),
      /saved delivery addresses/,
    );
  });
  await check("malformed and negative quantities are rejected", async () => {
    await identity(a);
    for (const q of [-1, 0, 1.5, "bad"])
      await assert.rejects(() => place([{ id: product, quantity: q }]));
  });
  let order;
  await check(
    "server calculates full price, stock and order snapshot",
    async () => {
      await identity(a);
      order = await place(
        [{ id: product, quantity: 2, price: 0, total: 0 }],
        address,
        request,
      );
      await root();
      const o = (
        await db.query("select * from public.orders where id=$1", [order])
      ).rows[0];
      assert.equal(Number(o.total), 200);
      assert.equal(Number(o.discount), 0);
      assert.equal(o.payment_status, "unpaid");
      assert.equal(o.address_snapshot.address_line, "123 Example Road");
      assert.equal(await stock(), 1);
    },
  );
  await check(
    "retry returns the same order without reserving twice",
    async () => {
      await identity(a);
      assert.equal(
        await place([{ id: product, quantity: 2 }], address, request),
        order,
      );
      assert.equal(await stock(), 1);
    },
  );
  await check("overselling fails and leaves stock unchanged", async () => {
    await identity(a);
    await assert.rejects(
      () =>
        place(
          [{ id: product, quantity: 2 }],
          address,
          "30000000-0000-4000-8000-000000000002",
        ),
      /Not enough stock/,
    );
    assert.equal(await stock(), 1);
  });
  await check(
    "duplicate product lines cannot bypass stock checks",
    async () => {
      await identity(a);
      await assert.rejects(
        () =>
          place(
            [
              { id: product, quantity: 1 },
              { id: product, quantity: 1 },
            ],
            address,
            "30000000-0000-4000-8000-000000000003",
          ),
        /Not enough stock/,
      );
    },
  );
  await check("customers cannot directly create or change orders", async () => {
    await identity(a);
    await assert.rejects(() =>
      db.query("insert into public.orders(user_id,total) values($1,0)", [a]),
    );
    await assert.rejects(() =>
      db.query("update public.orders set payment_status='paid' where id=$1", [
        order,
      ]),
    );
  });
  await check("other customers cannot read orders or order items", async () => {
    await identity(b);
    assert.equal(
      (await db.query("select * from public.orders")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.order_items")).rows.length,
      0,
    );
    await assert.rejects(
      () => db.query("select public.update_order($1,'cancelled')", [order]),
      /Order not available/,
    );
  });
  await check("pending cancellation restores stock exactly once", async () => {
    await identity(a);
    await db.query(
      "select public.update_order($1,'cancelled','Cancelled by customer')",
      [order],
    );
    assert.equal(await stock(), 3);
    await identity(a);
    await assert.rejects(() =>
      db.query("select public.update_order($1,'cancelled')", [order]),
    );
    assert.equal(await stock(), 3);
  });
  await check(
    "unverified purchases cannot submit product reviews",
    async () => {
      await identity(a);
      await assert.rejects(() =>
        db.query(
          "insert into public.reviews(user_id,product_id,rating,body) values($1,$2,5,'A great product indeed.')",
          [a, product],
        ),
      );
    },
  );
  await check(
    "admin can progress an order and customer cannot skip stages",
    async () => {
      await identity(a);
      order = await place(
        [{ id: product, quantity: 1 }],
        address,
        "30000000-0000-4000-8000-000000000004",
      );
      await assert.rejects(() =>
        db.query("select public.update_order($1,'shipped')", [order]),
      );
      await identity(admin);
      await assert.rejects(() =>
        db.query("select public.update_order($1,'delivered')", [order]),
      );
      for (const status of ["confirmed", "processing", "shipped", "delivered"])
        await db.query("select public.update_order($1,$2,$3,$4)", [
          order,
          status,
          "Test update",
          "TRACK-1",
        ]);
    },
  );
  await check(
    "delivered buyer can submit a review but cannot self-approve",
    async () => {
      await identity(a);
      await db.query(
        "insert into public.reviews(user_id,product_id,rating,body) values($1,$2,5,'A great product indeed.')",
        [a, product],
      );
      await db.query(
        "update public.reviews set approved=true where user_id=$1",
        [a],
      );
      assert.equal(
        (
          await db.query(
            "select approved from public.reviews where user_id=$1",
            [a],
          )
        ).rows[0].approved,
        false,
      );
    },
  );
  await check(
    "notification owners cannot rewrite message contents",
    async () => {
      await identity(a);
      await assert.rejects(() =>
        db.query(
          "update public.notifications set body='changed' where user_id=$1",
          [a],
        ),
      );
      await db.query(
        "update public.notifications set read_at=now() where user_id=$1",
        [a],
      );
    },
  );
  await check(
    "customers can save only their own cart and favourites",
    async () => {
      await identity(a);
      await db.query(
        "insert into public.saved_products(user_id,product_id,kind) values($1,$2,'wishlist')",
        [a, product],
      );
      await assert.rejects(() =>
        db.query(
          "insert into public.saved_products(user_id,product_id,kind) values($1,$2,'wishlist')",
          [b, product],
        ),
      );
      await db.query("insert into public.carts(user_id,items) values($1,$2)", [
        a,
        JSON.stringify([{ id: product, quantity: 1 }]),
      ]);
      await identity(b);
      assert.equal(
        (await db.query("select * from public.carts")).rows.length,
        0,
      );
      assert.equal(
        (await db.query("select * from public.saved_products")).rows.length,
        0,
      );
    },
  );
  await check(
    "customers cannot initialize or finalize payments through database RPCs",
    async () => {
      await identity(a);
      await assert.rejects(() =>
        db.query("select public.begin_payment($1,$2)", [order, a]),
      );
      await assert.rejects(() =>
        db.query("select public.complete_payment('fake',1,100,'NGN')"),
      );
    },
  );
  await check("unpaid orders cannot issue invoices", async () => {
    await root();
    assert.equal((await db.query("select * from public.invoices where order_id=$1",[order])).rows.length,0);
    await assert.rejects(()=>db.query("select public.create_paid_invoice($1)",[order]),/verified paid order/);
  });
  let session;
  await identity(a);
  order = await place(
    [{ id: product, quantity: 1 }],
    address,
    "30000000-0000-4000-8000-000000000005",
  );
  await check(
    "payment initialization is server-only and uses the stored order total",
    async () => {
      await identity(null, "service_role");
      session = (
        await db.query("select public.begin_payment($1,$2) as payment", [
          order,
          a,
        ])
      ).rows[0].payment;
      assert.equal(Number(session.amount), 10000);
      const second = (
        await db.query("select public.begin_payment($1,$2) as payment", [
          order,
          a,
        ])
      ).rows[0].payment;
      assert.equal(session.reference, second.reference);
    },
  );
  await check("customers cannot close the store; admin closure requires a reason and WhatsApp", async () => {
    await identity(b);
    await db.exec("update public.site_settings set store_open=false, closure_reason='Not authorized',whatsapp='2348000000000' where id='store'");
    await root();
    assert.equal((await db.query("select store_open from public.site_settings")).rows[0].store_open, true);
    await identity(admin);
    await assert.rejects(() => db.exec("update public.site_settings set store_open=false where id='store'"));
    await db.exec("update public.site_settings set store_open=false,closure_reason='Closed for scheduled maintenance.',whatsapp='2348000000000' where id='store'");
  });
  await check("closure accepts short and long messages but requires a separate WhatsApp contact", async () => {
    await identity(admin);
    for (const message of ["Restock", "x", "A".repeat(5000)]) {
      await db.query("update public.site_settings set closure_reason=$1 where id='store'", [message]);
    }
    await assert.rejects(() => db.exec("update public.site_settings set closure_reason=' ' where id='store'"));
    await assert.rejects(() => db.exec("update public.site_settings set whatsapp='' where id='store'"));
  });
  await check("closure blocks new orders and payment starts without changing stock", async () => {
    const before = await stock();
    await identity(a);
    await assert.rejects(() => place([{id:product,quantity:1}],address,"30000000-0000-4000-8000-000000000099"), /temporarily closed/);
    assert.equal(await stock(),before);
    await identity(null,"service_role");
    await assert.rejects(() => db.query("select public.begin_payment($1,$2)",[order,a]), /temporarily closed/);
  });
  await check("closure preserves account access and idempotent order retrieval", async () => {
    await identity(a);
    assert.equal(await place([{id:product,quantity:1}],address,"30000000-0000-4000-8000-000000000005"),order);
    assert.equal((await db.query("select * from public.profiles where id=$1",[a])).rows.length,1);
    assert.ok((await db.query("select * from public.orders")).rows.length>0);
    assert.equal((await db.query("select * from public.addresses")).rows.length,1);
  });
  await check(
    "pending payments prevent stock-releasing cancellation",
    async () => {
      await identity(admin);
      await assert.rejects(() =>
        db.query("select public.update_order($1,'cancelled')", [order]),
      );
    },
  );
  await check(
    "mismatched payment amounts or currencies are rejected",
    async () => {
      await identity(null, "service_role");
      await assert.rejects(() =>
        db.query("select public.complete_payment($1,99,1,$2)", [
          session.reference,
          "NGN",
        ]),
      );
      await assert.rejects(() =>
        db.query("select public.complete_payment($1,99,10000,$2)", [
          session.reference,
          "USD",
        ]),
      );
    },
  );
  await check("payment reconciliation is idempotent", async () => {
    await identity(null, "service_role");
    const first = (
      await db.query(
        "select public.complete_payment($1,99,10000,'NGN') as id",
        [session.reference],
      )
    ).rows[0].id;
    const second = (
      await db.query(
        "select public.complete_payment($1,99,10000,'NGN') as id",
        [session.reference],
      )
    ).rows[0].id;
    assert.equal(first, second);
    await root();
    assert.equal(
      (
        await db.query("select payment_status from public.orders where id=$1", [
          order,
        ])
      ).rows[0].payment_status,
      "paid",
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as count from public.notifications where order_id=$1 and title='Payment confirmed'",
          [order],
        )
      ).rows[0].count,
      1,
    );
  });
  await check("verified payment automatically issues one immutable invoice", async () => {
    await identity(a);
    const invoice=(await db.query("select * from public.invoices where order_id=$1",[order])).rows[0];
    assert.ok(invoice.invoice_number.startsWith('OPT-'));
    assert.equal(Number(invoice.total),100);
    assert.equal(invoice.payment_reference,session.reference);
    assert.equal(invoice.order_ref,(await db.query("select order_ref from public.orders where id=$1",[order])).rows[0].order_ref);
    assert.equal(invoice.items[0].name,'Camera');
    assert.equal((await db.query("select * from public.invoices where order_id=$1",[order])).rows.length,1);
    await assert.rejects(()=>db.query("update public.invoices set total=0 where id=$1",[invoice.id]));
    await assert.rejects(()=>db.query("select public.create_paid_invoice($1)",[order]));
    await identity(b);
    assert.equal((await db.query("select * from public.invoices")).rows.length,0);
    await identity(admin);
    assert.equal((await db.query("select * from public.invoices where order_id=$1",[order])).rows.length,1);
    await root();
    await assert.rejects(()=>db.query("update public.invoices set payment_reference='tampered' where id=$1",[invoice.id]),/cannot be changed/);
    await db.exec(invoices);
    await db.exec(noCoupons);
    await db.exec(references);
    await db.exec(noRotation);
    await db.exec(restock);
    assert.equal((await db.query("select * from public.invoices where order_id=$1",[order])).rows.length,1);
  });
  await check("reopening restores checkout and payments", async () => {
    await identity(admin);
    await db.exec("update public.site_settings set store_open=true where id='store'");
    await identity(a);
    const reopened = await place([{id:product,quantity:1}],address,"30000000-0000-4000-8000-000000000098");
    await identity(null,"service_role");
    assert.equal((await db.query("select public.begin_payment($1,$2) as p",[reopened,a])).rows[0].p.paid,false);
  });
  await check("non-admin customers cannot change account roles", async () => {
    await identity(b);
    await assert.rejects(
      () => db.query("select public.set_account_role($1,$2)", [b, "admin"]),
      /Administrator access required/,
    );
  });
  await check("the final administrator cannot be demoted", async () => {
    await identity(admin);
    await assert.rejects(
      () =>
        db.query("select public.set_account_role($1,$2)", [admin, "customer"]),
      /At least one administrator must remain/,
    );
  });
  await check(
    "administrators can promote customers and demote another administrator",
    async () => {
      await identity(admin);
      const promoted = (
        await db.query("select public.set_account_role($1,$2) as account", [
          a,
          "admin",
        ])
      ).rows[0].account;
      assert.equal(promoted.role, "admin");
      await identity(a);
      const demoted = (
        await db.query("select public.set_account_role($1,$2) as account", [
          admin,
          "customer",
        ])
      ).rows[0].account;
      assert.equal(demoted.role, "customer");
    },
  );
  await check(
    "demoted administrators immediately lose permission to manage roles",
    async () => {
      await identity(admin);
      await assert.rejects(
        () => db.query("select public.set_account_role($1,$2)", [b, "admin"]),
        /Administrator access required/,
      );
    },
  );
  await check(
    "role changes are logged and customers cannot forge or read audit records",
    async () => {
      await identity(a);
      assert.equal(
        (
          await db.query(
            "select count(*)::int as count from public.account_role_events",
          )
        ).rows[0].count,
        2,
      );
      await identity(b);
      assert.equal(
        (await db.query("select * from public.account_role_events")).rows
          .length,
        0,
      );
      await assert.rejects(() =>
        db.query(
          "insert into public.account_role_events(actor_id,target_id,previous_role,new_role) values($1,$2,'customer','admin')",
          [b, b],
        ),
      );
    },
  );
  await check(
    "role changes reject invalid roles and preserve the last admin after prior changes",
    async () => {
      await identity(a);
      await assert.rejects(
        () => db.query("select public.set_account_role($1,$2)", [b, "owner"]),
        /valid account role/,
      );
      await assert.rejects(
        () =>
          db.query("select public.set_account_role($1,$2)", [a, "customer"]),
        /At least one administrator must remain/,
      );
    },
  );
  await check("issued invoice snapshots survive later product, profile and business edits", async () => {
    await root();
    const before=(await db.query("select * from public.invoices order by created_at limit 1")).rows[0];
    await db.exec("update public.site_settings set email='changed@example.com' where id='store'");
    await db.query("update public.products set price=999,name='Changed product' where id=$1",[product]);
    await db.query("update public.profiles set full_name='Changed name' where id=$1",[a]);
    const after=(await db.query("select * from public.invoices where id=$1",[before.id])).rows[0];
    assert.deepEqual(after,before);
    await assert.rejects(()=>db.query("delete from public.invoices where id=$1",[before.id]),/cannot be changed/);
  });
  await check("migration backfills historical verified payments without duplicating invoices", async () => {
    await root();
    const pending=(await db.query("select s.* from public.payment_sessions s join public.orders o on o.id=s.order_id where s.status='pending' and o.payment_status='pending' limit 1")).rows[0];
    assert.ok(pending);
    await db.exec("drop trigger invoice_after_verified_payment on public.orders");
    await identity(null,'service_role');
    await db.query("select public.complete_payment($1,1001,$2,'NGN')",[pending.reference,pending.amount]);
    await root();
    assert.equal((await db.query("select * from public.invoices where order_id=$1",[pending.order_id])).rows.length,0);
    await db.exec(references);
    await db.exec(noRotation);
    await db.exec(restock);
    await db.exec(noCoupons);
    await db.exec(references);
    await db.exec(noRotation);
    await db.exec(restock);
    await db.exec(references);
    await db.exec(noRotation);
    await db.exec(restock);
    await db.exec(noCoupons);
    await db.exec(references);
    await db.exec(noRotation);
    await db.exec(restock);
    const generated=(await db.query("select * from public.invoices where order_id=$1",[pending.order_id])).rows;
    assert.equal(generated.length,1);
    assert.equal(generated[0].payment_reference,pending.reference);
  });
  console.log(
    `\n${checks} backend checks passed in isolated PostgreSQL. No live data changed.`,
  );
} finally {
  await db.close();
}
