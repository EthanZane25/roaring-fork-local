import { notFound, redirect } from "next/navigation";
import { TOWNS, getTown } from "@/lib/constants";
import { getAdminContext } from "@/lib/admin";
import {
  createAdvertiser,
  createCampaign,
  createEvent,
  createHousing,
  createJob,
  saveSiteSetting,
  setEventPublished,
  setUserRole,
  updateStatus
} from "@/app/admin/actions";

export const metadata = { title: "Admin Management", robots: { index: false, follow: false } };

const FIELD = "w-full rounded-md border border-[#d4d7d1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#73917f]";
const BUTTON = "rounded-md bg-[#173f30] px-4 py-2.5 text-sm font-semibold text-white";
const SAVE = "rounded-md border border-[#cfd3cc] bg-white px-3 text-xs font-semibold";

const SECTIONS = new Set(["advertising","marketplace","events","jobs","housing","users","reports","settings","system"]);

const PLACEMENTS = [
  "home_featured","home_sponsored","restaurants_featured","marketplace_featured",
  "events_featured","jobs_featured","housing_featured","sitewide_banner"
];

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!SECTIONS.has(section)) notFound();

  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin");

  if (section === "advertising") {
    const [{ data: advertisers }, { data: campaigns }, { data: adEvents }] = await Promise.all([
      ctx.supabase.from("advertisers").select("id,business_name,contact_name,email,phone,status,created_at").order("created_at", { ascending: false }),
      ctx.supabase.from("ad_campaigns").select("id,advertiser_id,name,placement,town_slug,headline,status,priority,monthly_price,starts_at,ends_at,created_at").order("created_at", { ascending: false }),
      ctx.supabase.from("ad_events").select("campaign_id,event_type,created_at").order("created_at", { ascending: false }).limit(500)
    ]);

    const impressions = new Map<string, number>();
    const clicks = new Map<string, number>();
    for (const event of adEvents ?? []) {
      const map = event.event_type === "click" ? clicks : impressions;
      map.set(event.campaign_id, (map.get(event.campaign_id) ?? 0) + 1);
    }

    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Advertising</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667069]">Manage local advertisers, campaign placement, timing and paid placement status. Public advertising should remain clearly labeled Sponsored.</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <form action={createAdvertiser} className="card p-5">
            <h2 className="text-lg font-semibold">Add advertiser</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="business_name" required placeholder="Business name" className={FIELD} />
              <input name="contact_name" placeholder="Contact name" className={FIELD} />
              <input name="email" type="email" placeholder="Email" className={FIELD} />
              <input name="phone" placeholder="Phone" className={FIELD} />
              <input name="website" placeholder="Website" className={`${FIELD} sm:col-span-2`} />
              <textarea name="notes" placeholder="Internal notes" className={`${FIELD} min-h-24 sm:col-span-2`} />
            </div>
            <button className={`mt-4 ${BUTTON}`}>Add advertiser</button>
          </form>

          <form action={createCampaign} className="card p-5">
            <h2 className="text-lg font-semibold">Create campaign</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select name="advertiser_id" required className={FIELD}><option value="">Choose advertiser</option>{(advertisers ?? []).map((a) => <option key={a.id} value={a.id}>{a.business_name}</option>)}</select>
              <input name="name" required placeholder="Campaign name" className={FIELD} />
              <select name="placement" required className={FIELD}><option value="">Placement</option>{PLACEMENTS.map((v) => <option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select>
              <select name="town_slug" className={FIELD}><option value="">All towns</option>{TOWNS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select>
              <input name="headline" placeholder="Public headline" className={`${FIELD} sm:col-span-2`} />
              <textarea name="body" placeholder="Public body copy" className={`${FIELD} min-h-20 sm:col-span-2`} />
              <input name="image_url" placeholder="Image URL" className={FIELD} />
              <input name="destination_url" placeholder="Destination URL" className={FIELD} />
              <input name="starts_at" placeholder="2026-09-08T08:00:00-06:00" className={FIELD} />
              <input name="ends_at" placeholder="2026-10-08T23:59:00-06:00" className={FIELD} />
              <input name="monthly_price" type="number" min="0" step="0.01" placeholder="Monthly price" className={FIELD} />
              <input name="billing_notes" placeholder="Billing notes" className={FIELD} />
            </div>
            <button className={`mt-4 ${BUTTON}`}>Create draft campaign</button>
          </form>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Advertisers</h2>
          <div className="card mt-4 overflow-hidden">
            {(advertisers ?? []).map((a) => (
              <div key={a.id} className="grid gap-3 border-b border-[#e3e4de] p-4 last:border-0 md:grid-cols-[1fr_220px] md:items-center">
                <div><strong>{a.business_name}</strong><p className="mt-1 text-xs text-[#6a736d]">{[a.contact_name,a.email,a.phone].filter(Boolean).join(" · ") || "No contact details"}</p></div>
                <form action={updateStatus} className="flex gap-2"><input type="hidden" name="table" value="advertisers" /><input type="hidden" name="id" value={a.id} /><select name="status" defaultValue={a.status} className={`${FIELD} min-w-0 flex-1`}><option value="prospect">Prospect</option><option value="active">Active</option><option value="inactive">Inactive</option></select><button className={SAVE}>Save</button></form>
              </div>
            ))}
            {!advertisers?.length ? <p className="p-5 text-sm text-[#69716b]">No advertisers yet.</p> : null}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Campaigns</h2>
          <div className="card mt-4 overflow-hidden">
            {(campaigns ?? []).map((c) => (
              <div key={c.id} className="grid gap-4 border-b border-[#e3e4de] p-4 last:border-0 lg:grid-cols-[1fr_auto_220px] lg:items-center">
                <div><strong>{c.name}</strong><p className="mt-1 text-xs text-[#6a736d]">{c.placement.replaceAll("_"," ")}{c.town_slug ? ` · ${c.town_slug}` : " · valley-wide"}{c.monthly_price != null ? ` · $${Number(c.monthly_price).toLocaleString()}/mo` : ""}</p><p className="mt-1 text-xs text-[#818881]">{impressions.get(c.id) ?? 0} impressions · {clicks.get(c.id) ?? 0} clicks</p></div>
                <span className="text-xs text-[#6d756f]">{c.headline || "No headline"}</span>
                <form action={updateStatus} className="flex gap-2"><input type="hidden" name="table" value="ad_campaigns" /><input type="hidden" name="id" value={c.id} /><select name="status" defaultValue={c.status} className={`${FIELD} min-w-0 flex-1`}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select><button className={SAVE}>Save</button></form>
              </div>
            ))}
            {!campaigns?.length ? <p className="p-5 text-sm text-[#69716b]">No campaigns yet.</p> : null}
          </div>
        </section>
      </main>
    );
  }

  if (section === "marketplace") {
    const { data: listings } = await ctx.supabase.from("marketplace_listings").select("id,slug,title,town_slug,category_slug,price,status,seller_name,seller_verified,views_count,created_at").order("created_at", { ascending: false }).limit(200);
    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Marketplace</h1>
        <div className="card mt-8 overflow-hidden">
          {(listings ?? []).map((item) => (
            <div key={item.id} className="grid gap-4 border-b border-[#e2e4de] p-4 last:border-0 lg:grid-cols-[1fr_240px] lg:items-center">
              <div><strong>{item.title}</strong><p className="mt-1 text-xs text-[#68716a]">{getTown(item.town_slug)?.name || item.town_slug} · {item.category_slug} · ${Number(item.price).toLocaleString()} · {item.seller_name || "Unknown seller"}{item.seller_verified ? " · verified" : ""} · {item.views_count ?? 0} views</p></div>
              <form action={updateStatus} className="flex gap-2"><input type="hidden" name="table" value="marketplace_listings" /><input type="hidden" name="id" value={item.id} /><select name="status" defaultValue={item.status} className={`${FIELD} min-w-0 flex-1`}><option value="draft">Draft</option><option value="active">Active</option><option value="sold">Sold</option><option value="expired">Expired</option><option value="removed">Removed</option></select><button className={SAVE}>Save</button></form>
            </div>
          ))}
          {!listings?.length ? <p className="p-5 text-sm text-[#69716b]">No Marketplace listings yet.</p> : null}
        </div>
      </main>
    );
  }

  if (section === "events") {
    const { data: events } = await ctx.supabase.from("events").select("id,title,town_slug,venue,category_slug,starts_at,published").order("starts_at", { ascending: false }).limit(200);
    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Events</h1>
        <form action={createEvent} className="card mt-8 p-5">
          <h2 className="text-lg font-semibold">Add event</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input name="title" required placeholder="Event title" className={FIELD} />
            <select name="town_slug" required className={FIELD}><option value="">Town</option>{TOWNS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select>
            <input name="venue" required placeholder="Venue" className={FIELD} />
            <input name="category_slug" placeholder="Category" className={FIELD} />
            <input name="starts_at" required placeholder="2026-09-08T18:00:00-06:00" className={FIELD} />
            <input name="ends_at" placeholder="Optional end time with offset" className={FIELD} />
            <input name="source_url" placeholder="Source URL" className={FIELD} />
            <input name="ticket_url" placeholder="Ticket URL" className={FIELD} />
            <input name="image_url" placeholder="Image URL" className={FIELD} />
            <textarea name="description" placeholder="Description" className={`${FIELD} min-h-24 sm:col-span-2 lg:col-span-3`} />
          </div>
          <button className={`mt-4 ${BUTTON}`}>Publish event</button>
        </form>
        <div className="card mt-8 overflow-hidden">
          {(events ?? []).map((e) => <div key={e.id} className="grid gap-4 border-b border-[#e2e4de] p-4 last:border-0 lg:grid-cols-[1fr_190px] lg:items-center"><div><strong>{e.title}</strong><p className="mt-1 text-xs text-[#69716b]">{getTown(e.town_slug)?.name || e.town_slug} · {e.venue} · {new Date(e.starts_at).toLocaleString()}</p></div><form action={setEventPublished} className="flex gap-2"><input type="hidden" name="id" value={e.id} /><select name="published" defaultValue={String(e.published)} className={`${FIELD} min-w-0 flex-1`}><option value="true">Published</option><option value="false">Hidden</option></select><button className={SAVE}>Save</button></form></div>)}
          {!events?.length ? <p className="p-5 text-sm text-[#69716b]">No events yet.</p> : null}
        </div>
      </main>
    );
  }

  if (section === "jobs") {
    const { data: jobs } = await ctx.supabase.from("jobs").select("id,title,company,town_slug,pay_text,employment_type,status").order("created_at", { ascending: false }).limit(200);
    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Jobs</h1>
        <form action={createJob} className="card mt-8 p-5"><h2 className="text-lg font-semibold">Add job</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><input name="title" required placeholder="Job title" className={FIELD} /><input name="company" required placeholder="Company" className={FIELD} /><select name="town_slug" required className={FIELD}><option value="">Town</option>{TOWNS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select><input name="pay_text" placeholder="$25–$32/hr" className={FIELD} /><input name="employment_type" placeholder="Full time" className={FIELD} /><textarea name="description" placeholder="Description" className={`${FIELD} min-h-24 sm:col-span-2 lg:col-span-3`} /></div><button className={`mt-4 ${BUTTON}`}>Publish job</button></form>
        <div className="card mt-8 overflow-hidden">{(jobs ?? []).map((j) => <div key={j.id} className="grid gap-4 border-b border-[#e2e4de] p-4 last:border-0 lg:grid-cols-[1fr_240px] lg:items-center"><div><strong>{j.title}</strong><p className="mt-1 text-xs text-[#69716b]">{j.company} · {getTown(j.town_slug)?.name || j.town_slug} · {j.pay_text || "Pay not listed"} · {j.employment_type}</p></div><form action={updateStatus} className="flex gap-2"><input type="hidden" name="table" value="jobs" /><input type="hidden" name="id" value={j.id} /><select name="status" defaultValue={j.status} className={`${FIELD} min-w-0 flex-1`}><option value="active">Active</option><option value="filled">Filled</option><option value="expired">Expired</option><option value="removed">Removed</option></select><button className={SAVE}>Save</button></form></div>)}{!jobs?.length ? <p className="p-5 text-sm text-[#69716b]">No jobs yet.</p> : null}</div>
      </main>
    );
  }

  if (section === "housing") {
    const { data: housing } = await ctx.supabase.from("housing_listings").select("id,title,town_slug,price,bedrooms,listing_type,status").order("created_at", { ascending: false }).limit(200);
    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Housing</h1>
        <form action={createHousing} className="card mt-8 p-5"><h2 className="text-lg font-semibold">Add housing listing</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><input name="title" required placeholder="Listing title" className={FIELD} /><select name="town_slug" required className={FIELD}><option value="">Town</option>{TOWNS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select><input name="listing_type" required placeholder="Apartment, Room, Studio..." className={FIELD} /><input name="price" required type="number" min="0" step="1" placeholder="Monthly price" className={FIELD} /><input name="bedrooms" type="number" min="0" step="0.5" defaultValue="0" className={FIELD} /><textarea name="description" placeholder="Description" className={`${FIELD} min-h-24 sm:col-span-2 lg:col-span-3`} /></div><button className={`mt-4 ${BUTTON}`}>Publish housing</button></form>
        <div className="card mt-8 overflow-hidden">{(housing ?? []).map((h) => <div key={h.id} className="grid gap-4 border-b border-[#e2e4de] p-4 last:border-0 lg:grid-cols-[1fr_240px] lg:items-center"><div><strong>{h.title}</strong><p className="mt-1 text-xs text-[#69716b]">{getTown(h.town_slug)?.name || h.town_slug} · ${Number(h.price).toLocaleString()}/mo · {h.bedrooms} bed · {h.listing_type}</p></div><form action={updateStatus} className="flex gap-2"><input type="hidden" name="table" value="housing_listings" /><input type="hidden" name="id" value={h.id} /><select name="status" defaultValue={h.status} className={`${FIELD} min-w-0 flex-1`}><option value="active">Active</option><option value="rented">Rented</option><option value="expired">Expired</option><option value="removed">Removed</option></select><button className={SAVE}>Save</button></form></div>)}{!housing?.length ? <p className="p-5 text-sm text-[#69716b]">No housing listings yet.</p> : null}</div>
      </main>
    );
  }

  if (section === "users") {
    const { data: profiles } = await ctx.supabase.from("profiles").select("id,display_name,role,phone_verified,home_town_slug,created_at").order("created_at", { ascending: false }).limit(500);
    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Users</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667069]">Privileged profile fields are protected from self-escalation by the V15 database security migration.</p>
        <div className="card mt-8 overflow-hidden">{(profiles ?? []).map((p) => <div key={p.id} className="grid gap-4 border-b border-[#e2e4de] p-4 last:border-0 lg:grid-cols-[1fr_240px] lg:items-center"><div><strong>{p.display_name || "Unnamed user"}</strong><p className="mt-1 break-all text-xs text-[#69716b]">{p.id}</p><p className="mt-1 text-xs text-[#818881]">{p.phone_verified ? "Phone verified" : "Phone not verified"}{p.home_town_slug ? ` · ${p.home_town_slug}` : ""}</p></div><form action={setUserRole} className="flex gap-2"><input type="hidden" name="id" value={p.id} /><select name="role" defaultValue={p.role} className={`${FIELD} min-w-0 flex-1`}><option value="user">User</option><option value="business">Business</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select><button className={SAVE}>Save</button></form></div>)}{!profiles?.length ? <p className="p-5 text-sm text-[#69716b]">No user profiles yet.</p> : null}</div>
      </main>
    );
  }

  if (section === "reports") {
    const [{ data: reports }, { data: reviews }] = await Promise.all([
      ctx.supabase.from("reports").select("id,target_type,target_id,reason,details,status,created_at").order("created_at", { ascending: false }).limit(200),
      ctx.supabase.from("restaurant_reviews").select("id,restaurant_id,user_id,rating,title,body,verified_local,status,created_at").order("created_at", { ascending: false }).limit(200)
    ]);
    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Reports & moderation</h1>
        <section className="mt-8"><h2 className="text-2xl font-semibold">Community reports</h2><div className="card mt-4 overflow-hidden">{(reports ?? []).map((r) => <div key={r.id} className="grid gap-4 border-b border-[#e2e4de] p-4 last:border-0 lg:grid-cols-[1fr_240px] lg:items-center"><div><strong>{r.reason}</strong><p className="mt-1 text-xs text-[#69716b]">{r.target_type} · {r.target_id}</p>{r.details ? <p className="mt-2 text-sm leading-6 text-[#555f58]">{r.details}</p> : null}</div><form action={updateStatus} className="flex gap-2"><input type="hidden" name="table" value="reports" /><input type="hidden" name="id" value={r.id} /><select name="status" defaultValue={r.status} className={`${FIELD} min-w-0 flex-1`}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select><button className={SAVE}>Save</button></form></div>)}{!reports?.length ? <p className="p-5 text-sm text-[#69716b]">No reports.</p> : null}</div></section>
        <section className="mt-10"><h2 className="text-2xl font-semibold">Restaurant reviews</h2><div className="card mt-4 overflow-hidden">{(reviews ?? []).map((r) => <div key={r.id} className="grid gap-4 border-b border-[#e2e4de] p-4 last:border-0 lg:grid-cols-[1fr_240px] lg:items-center"><div><strong>{r.rating}/5 {r.title ? `· ${r.title}` : ""}</strong><p className="mt-1 text-xs text-[#69716b]">Restaurant {r.restaurant_id} · User {r.user_id}{r.verified_local ? " · verified local" : ""}</p><p className="mt-2 text-sm leading-6 text-[#555f58]">{r.body}</p></div><form action={updateStatus} className="flex gap-2"><input type="hidden" name="table" value="restaurant_reviews" /><input type="hidden" name="id" value={r.id} /><select name="status" defaultValue={r.status} className={`${FIELD} min-w-0 flex-1`}><option value="published">Published</option><option value="held">Held</option><option value="removed">Removed</option></select><button className={SAVE}>Save</button></form></div>)}{!reviews?.length ? <p className="p-5 text-sm text-[#69716b]">No reviews.</p> : null}</div></section>
      </main>
    );
  }

  if (section === "settings") {
    const { data: settings } = await ctx.supabase.from("site_settings").select("key,value,description,updated_at").order("key");
    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">Site settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667069]">Editable content and feature values live here. Application source code remains code-controlled.</p>
        <div className="mt-8 grid gap-5">{(settings ?? []).map((s) => <form key={s.key} action={saveSiteSetting} className="card p-5"><div><h2 className="text-lg font-semibold">{s.key}</h2>{s.description ? <p className="mt-1 text-xs text-[#6e766f]">{s.description}</p> : null}</div><input type="hidden" name="key" value={s.key} /><textarea name="value" defaultValue={JSON.stringify(s.value, null, 2)} spellCheck={false} className="mt-4 min-h-44 w-full rounded-md border border-[#d4d7d1] bg-[#fbfcfa] p-4 font-mono text-xs leading-6 outline-none focus:border-[#73917f]" /><button className={`mt-4 ${BUTTON}`}>Save setting</button></form>)}</div>
      </main>
    );
  }

  if (section === "system") {
    const [{ data: audit }, { data: errors }, { data: metrics }] = await Promise.all([
      ctx.supabase.from("admin_audit_log").select("id,action,target_type,target_id,created_at").order("created_at", { ascending: false }).limit(100),
      ctx.supabase.from("site_error_logs").select("id,level,source,message,path,created_at").order("created_at", { ascending: false }).limit(100),
      ctx.supabase.from("site_metrics").select("id,metric,value,path,rating,created_at").order("created_at", { ascending: false }).limit(100)
    ]);
    return (
      <main className="container-site py-12">
        <p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold">System</h1>
        <section className="mt-8"><h2 className="text-2xl font-semibold">Admin audit log</h2><div className="card mt-4 overflow-hidden">{(audit ?? []).map((a) => <div key={a.id} className="border-b border-[#e2e4de] p-4 last:border-0"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{a.action}</strong><span className="text-[11px] text-[#848b85]">{new Date(a.created_at).toLocaleString()}</span></div><p className="mt-1 text-xs text-[#68716b]">{a.target_type || "system"}{a.target_id ? ` · ${a.target_id}` : ""}</p></div>)}{!audit?.length ? <p className="p-5 text-sm text-[#69716b]">No audit events yet.</p> : null}</div></section>
        <section className="mt-10"><h2 className="text-2xl font-semibold">Application errors</h2><div className="card mt-4 overflow-hidden">{(errors ?? []).map((e) => <div key={e.id} className="border-b border-[#e2e4de] p-4 last:border-0"><strong className="text-sm">{e.message}</strong><p className="mt-1 text-xs text-[#68716b]">{e.level} · {e.source}{e.path ? ` · ${e.path}` : ""} · {new Date(e.created_at).toLocaleString()}</p></div>)}{!errors?.length ? <p className="p-5 text-sm text-[#69716b]">No application errors logged.</p> : null}</div></section>
        <section className="mt-10"><h2 className="text-2xl font-semibold">Site metrics</h2><div className="card mt-4 overflow-hidden">{(metrics ?? []).map((m) => <div key={m.id} className="grid gap-2 border-b border-[#e2e4de] p-4 last:border-0 sm:grid-cols-[1fr_auto]"><div><strong className="text-sm">{m.metric}</strong><p className="mt-1 text-xs text-[#68716b]">{m.path || "site-wide"}{m.rating ? ` · ${m.rating}` : ""}</p></div><span className="text-sm font-semibold">{Number(m.value).toLocaleString()}</span></div>)}{!metrics?.length ? <p className="p-5 text-sm text-[#69716b]">No metrics logged yet.</p> : null}</div></section>
      </main>
    );
  }

  notFound();
}
