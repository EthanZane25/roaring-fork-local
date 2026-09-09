import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";
import {
  discoverLocalEbayItems,
  externalSlug
} from "@/lib/ebay-marketplace";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const expectedOrigin = new URL(
    request.url
  ).origin;

  const origin =
    request.headers.get("origin");

  if (origin && origin !== expectedOrigin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const ctx = await getAdminContext();

  if (!ctx) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  let items;

  try {
    items =
      await discoverLocalEbayItems(48);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reach eBay."
      },
      { status: 503 }
    );
  }

  let created = 0;
  let updated = 0;
  let failed = 0;

  const checkedAt =
    new Date().toISOString();

  for (const item of items) {
    try {
      const { data: existing } =
        await ctx.supabase
          .from("marketplace_listings")
          .select("id,slug")
          .eq("source_type", "external")
          .eq("source_name", "eBay")
          .eq("source_item_id", item.itemId)
          .maybeSingle();

      const values = {
        title: item.title,
        description: item.description,
        town_slug: item.town,
        category_slug: item.category,
        price: item.price,
        image_url:
          item.images[0] || null,
        condition:
          item.condition || null,
        location_note:
          item.locationNote || null,
        status: "active",
        seller_name: "eBay seller",
        seller_verified: false,
        source_type: "external",
        source_name: "eBay",
        source_url: item.itemWebUrl,
        source_item_id: item.itemId,
        source_last_checked_at:
          checkedAt,
        source_expires_at:
          item.sourceExpiresAt,
        expires_at:
          item.sourceExpiresAt,
        updated_at: checkedAt
      };

      let listingId: string;

      if (existing) {
        const { error } =
          await ctx.supabase
            .from("marketplace_listings")
            .update(values)
            .eq("id", existing.id);

        if (error) throw error;

        listingId = existing.id;
        updated++;
      } else {
        const { data, error } =
          await ctx.supabase
            .from("marketplace_listings")
            .insert({
              ...values,
              owner_id: null,
              slug: externalSlug(
                item.title,
                item.itemId
              )
            })
            .select("id")
            .single();

        if (error) throw error;

        listingId = data.id;
        created++;
      }

      await ctx.supabase
        .from("marketplace_images")
        .delete()
        .eq("listing_id", listingId)
        .eq("source_type", "external");

      if (item.images.length) {
        const { error: imageError } =
          await ctx.supabase
            .from("marketplace_images")
            .insert(
              item.images.map(
                (url, index) => ({
                  listing_id: listingId,
                  storage_path: null,
                  public_url: url,
                  sort_order: index,
                  source_type: "external",
                  source_name: "eBay",
                  source_image_url: url
                })
              )
            );

        if (imageError) {
          console.error(
            "Image import error:",
            imageError
          );
        }
      }
    } catch (error) {
      console.error(
        "Marketplace import item failed:",
        error
      );
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    discovered: items.length,
    created,
    updated,
    failed
  });
}
