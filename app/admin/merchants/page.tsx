import { redirect } from "next/navigation";

import { updateMerchantStatus } from "@/app/admin/merchant-actions";
import { getTown } from "@/lib/constants";
import { getAdminContext } from "@/lib/admin";

export const metadata = {
  title: "Manage Merchants",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminMerchantsPage() {
  const ctx = await getAdminContext();

  if (!ctx) {
    redirect("/admin");
  }

  const { data } = await ctx.supabase
    .from("merchant_businesses")
    .select(
      "id,owner_id,business_name,business_type,town_slug,address,status,created_at"
    )
    .order("created_at", {
      ascending: false
    });

  const businesses =
    (data ?? []) as Array<{
      id: string;
      owner_id: string;
      business_name: string;
      business_type: string;
      town_slug: string;
      address: string;
      status: string;
      created_at: string;
    }>;

  const ownerIds = Array.from(
    new Set(
      businesses.map(
        business => business.owner_id
      )
    )
  );

  const profileMap =
    new Map<
      string,
      {
        display_name: string;
        role: string;
      }
    >();

  const emailMap =
    new Map<string, string>();

  if (ownerIds.length) {
    const [
      { data: profiles },
      { data: users }
    ] = await Promise.all([
      ctx.supabase
        .from("profiles")
        .select("id,display_name,role")
        .in("id", ownerIds),

      ctx.supabase
        .from("users")
        .select("id,email")
        .in("id", ownerIds)
    ]);

    for (const profile of (profiles ?? []) as Array<{
      id: string;
      display_name: string;
      role: string;
    }>) {
      profileMap.set(
        profile.id,
        {
          display_name:
            profile.display_name,
          role: profile.role
        }
      );
    }

    for (const user of (users ?? []) as Array<{
      id: string;
      email: string;
    }>) {
      emailMap.set(
        user.id,
        user.email
      );
    }
  }

  return (
    <main className="container-site py-12">
      <p className="eyebrow">
        Admin
      </p>

      <h1 className="mt-3 text-4xl font-semibold">
        Merchants
      </h1>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667069]">
        Review restaurants, shops and local businesses before they can schedule Valley Drops.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-[#dedfd9] bg-white">
        {businesses.length ? (
          businesses.map(business => {
            const owner =
              profileMap.get(
                business.owner_id
              );

            return (
              <article
                key={business.id}
                className="grid gap-5 border-b border-[#e3e4de] p-5 last:border-0 lg:grid-cols-[1fr_240px] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>
                      {business.business_name}
                    </strong>

                    <span className="rounded-full bg-[#f1f2ed] px-2 py-1 text-[10px] font-bold uppercase tracking-[.07em]">
                      {business.business_type}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#646d66]">
                    {getTown(
                      business.town_slug
                    )?.name ||
                      business.town_slug}
                    {" · "}
                    {business.address}
                  </p>

                  <p className="mt-2 text-xs text-[#7a827c]">
                    {owner?.display_name ||
                      "Unnamed account"}
                    {emailMap.get(
                      business.owner_id
                    )
                      ? ` · ${emailMap.get(
                          business.owner_id
                        )}`
                      : ""}
                    {owner?.role
                      ? ` · ${owner.role}`
                      : ""}
                  </p>
                </div>

                <form
                  action={updateMerchantStatus}
                  className="flex gap-2"
                >
                  <input
                    type="hidden"
                    name="id"
                    value={business.id}
                  />

                  <select
                    name="status"
                    defaultValue={
                      business.status
                    }
                    className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#d5d9d3] bg-white px-3 text-sm"
                  >
                    <option value="pending">
                      Pending review
                    </option>
                    <option value="approved">
                      Approved
                    </option>
                    <option value="suspended">
                      Suspended
                    </option>
                    <option value="rejected">
                      Rejected
                    </option>
                  </select>

                  <button className="rounded-lg bg-[#173f30] px-4 text-sm font-semibold text-white">
                    Save
                  </button>
                </form>
              </article>
            );
          })
        ) : (
          <p className="p-6 text-sm text-[#69716b]">
            No merchant applications yet.
          </p>
        )}
      </div>
    </main>
  );
}
