"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin";

export async function updateMerchantStatus(
  formData: FormData
) {
  const ctx = await getAdminContext();

  if (!ctx) {
    throw new Error(
      "Administrator access is required."
    );
  }

  const id = String(
    formData.get("id") || ""
  ).trim();

  const status = String(
    formData.get("status") || ""
  ).trim();

  if (
    !id ||
    ![
      "pending",
      "approved",
      "suspended",
      "rejected"
    ].includes(status)
  ) {
    throw new Error(
      "Invalid merchant status."
    );
  }

  const { data: business, error: readError } =
    await ctx.supabase
      .from("merchant_businesses")
      .select("owner_id,business_name")
      .eq("id", id)
      .single();

  if (readError || !business) {
    throw new Error(
      readError?.message ||
        "Merchant business not found."
    );
  }

  const { error } = await ctx.supabase
    .from("merchant_businesses")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  if (status === "approved") {
    const { data: profile } =
      await ctx.supabase
        .from("profiles")
        .select("role")
        .eq("id", business.owner_id)
        .maybeSingle();

    if (profile?.role === "user") {
      await ctx.supabase
        .from("profiles")
        .update({
          role: "business"
        })
        .eq("id", business.owner_id);
    }
  }

  await ctx.supabase
    .from("admin_audit_log")
    .insert({
      actor_id: ctx.user.id,
      action: "merchant.status",
      target_type: "merchant_businesses",
      target_id: id,
      metadata: {
        status,
        business_name:
          business.business_name
      }
    });

  revalidatePath("/admin/merchants");
  revalidatePath("/admin");
  revalidatePath("/merchant");
}
