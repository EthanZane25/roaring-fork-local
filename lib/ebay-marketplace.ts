import { createHash } from "crypto";

type SearchDefinition = {
  query: string;
  category: string;
};

type Hub = {
  postalCode: string;
  town: string;
  radius: number;
};

export type EbayMarketplaceItem = {
  itemId: string;
  title: string;
  description: string;
  price: number;
  town: string;
  category: string;
  condition?: string;
  locationNote?: string;
  itemWebUrl: string;
  images: string[];
  sourceExpiresAt: string;
};

const HUBS: Hub[] = [
  { postalCode: "81611", town: "aspen", radius: 35 },
  { postalCode: "81623", town: "carbondale", radius: 35 },
  { postalCode: "81650", town: "rifle", radius: 35 }
];

const SEARCHES: SearchDefinition[] = [
  { query: "furniture", category: "furniture" },
  { query: "mountain bike", category: "bikes" },
  { query: "snowboard", category: "ski-snowboard" },
  { query: "skis", category: "ski-snowboard" },
  { query: "camping gear", category: "outdoor-gear" },
  { query: "tools", category: "tools" },
  { query: "electronics", category: "electronics" },
  { query: "baby gear", category: "kids-baby" },
  { query: "tractor", category: "farm-ranch" }
];

const POSTAL_TO_TOWN: Record<string, string> = {
  "81611": "aspen",
  "81615": "snowmass-village",
  "81621": "basalt",
  "81623": "carbondale",
  "81601": "glenwood-springs",
  "81647": "new-castle",
  "81652": "silt",
  "81650": "rifle"
};

let cachedToken:
  | {
      value: string;
      expiresAt: number;
    }
  | null = null;

function credentials() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "eBay API credentials are not configured. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to .env.local."
    );
  }

  return { clientId, clientSecret };
}

async function getToken() {
  if (
    cachedToken &&
    cachedToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = credentials();

  const response = await fetch(
    "https://api.ebay.com/identity/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64"),
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope:
          "https://api.ebay.com/oauth/api_scope"
      }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `eBay OAuth failed (${response.status}).`
    );
  }

  const body = await response.json();

  cachedToken = {
    value: body.access_token,
    expiresAt:
      Date.now() +
      Math.max(60, Number(body.expires_in || 7200) - 120) *
        1000
  };

  return cachedToken.value;
}

async function ebayGet(
  url: string,
  token: string
) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      "Accept-Language": "en-US"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `eBay request failed (${response.status}).`
    );
  }

  return response.json();
}

function cleanTitle(value: unknown) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function townFromLocation(
  location: any,
  fallback: string
) {
  const postal = String(
    location?.postalCode || ""
  ).slice(0, 5);

  if (POSTAL_TO_TOWN[postal]) {
    return POSTAL_TO_TOWN[postal];
  }

  const city = String(
    location?.city || ""
  )
    .toLowerCase()
    .trim();

  const cityMap: Record<string, string> = {
    aspen: "aspen",
    "snowmass village": "snowmass-village",
    snowmass: "snowmass-village",
    basalt: "basalt",
    carbondale: "carbondale",
    "glenwood springs": "glenwood-springs",
    "new castle": "new-castle",
    silt: "silt",
    rifle: "rifle"
  };

  return cityMap[city] || fallback;
}

function locationText(location: any) {
  return [
    location?.city,
    location?.stateOrProvince,
    location?.postalCode
  ]
    .filter(Boolean)
    .join(", ");
}

function collectImages(
  detail: any,
  summary: any
) {
  const values = [
    detail?.image?.imageUrl,
    ...(Array.isArray(detail?.additionalImages)
      ? detail.additionalImages.map(
          (image: any) => image?.imageUrl
        )
      : []),
    summary?.image?.imageUrl
  ]
    .filter(
      (url): url is string =>
        typeof url === "string" &&
        url.startsWith("https://")
    );

  return [...new Set(values)].slice(0, 12);
}

export function externalSlug(
  title: string,
  itemId: string
) {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 58) || "item";

  const suffix = createHash("sha1")
    .update(itemId)
    .digest("hex")
    .slice(0, 8);

  return `${base}-ebay-${suffix}`;
}

export async function discoverLocalEbayItems(
  maximum = 48
): Promise<EbayMarketplaceItem[]> {
  const token = await getToken();

  const candidates = new Map<
    string,
    {
      summary: any;
      category: string;
      fallbackTown: string;
    }
  >();

  for (const hub of HUBS) {
    for (const search of SEARCHES) {
      const params = new URLSearchParams({
        q: search.query,
        limit: "8",
        fieldgroups: "EXTENDED",
        filter: [
          "deliveryOptions:{SELLER_ARRANGED_LOCAL_PICKUP}",
          "pickupCountry:US",
          `pickupPostalCode:${hub.postalCode}`,
          `pickupRadius:${hub.radius}`,
          "pickupRadiusUnit:mi"
        ].join(",")
      });

      try {
        const body = await ebayGet(
          `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
          token
        );

        for (const summary of body.itemSummaries || []) {
          const itemId = String(
            summary?.itemId || ""
          );

          if (!itemId) continue;

          if (
            summary?.price?.currency &&
            summary.price.currency !== "USD"
          ) {
            continue;
          }

          if (
            summary?.itemEndDate &&
            new Date(summary.itemEndDate).getTime() <=
              Date.now()
          ) {
            continue;
          }

          if (!candidates.has(itemId)) {
            candidates.set(itemId, {
              summary,
              category: search.category,
              fallbackTown: hub.town
            });
          }
        }
      } catch (error) {
        console.error(
          "eBay search failed:",
          search.query,
          hub.postalCode,
          error
        );
      }
    }
  }

  const selected = [
    ...candidates.entries()
  ].slice(0, maximum);

  const results: EbayMarketplaceItem[] = [];

  for (const [
    itemId,
    candidate
  ] of selected) {
    try {
      const detail = await ebayGet(
        `https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(
          itemId
        )}`,
        token
      );

      const title = cleanTitle(
        detail?.title || candidate.summary?.title
      );

      const price = Number(
        detail?.price?.value ??
          candidate.summary?.price?.value ??
          0
      );

      if (
        title.length < 3 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        continue;
      }

      const location =
        detail?.itemLocation ||
        candidate.summary?.itemLocation ||
        {};

      const town = townFromLocation(
        location,
        candidate.fallbackTown
      );

      const condition = String(
        detail?.condition ||
          candidate.summary?.condition ||
          ""
      )
        .trim()
        .slice(0, 100);

      const locationNote =
        locationText(location);

      const description = [
        condition
          ? `${condition}.`
          : null,
        "External eBay listing available for local pickup.",
        "Check the original listing for current availability, seller details and complete terms."
      ]
        .filter(Boolean)
        .join(" ");

      const itemWebUrl = String(
        detail?.itemWebUrl ||
          candidate.summary?.itemWebUrl ||
          ""
      );

      if (!itemWebUrl.startsWith("https://")) {
        continue;
      }

      const images = collectImages(
        detail,
        candidate.summary
      );

      const sourceExpiresAt =
        detail?.itemEndDate ||
        candidate.summary?.itemEndDate ||
        new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        ).toISOString();

      results.push({
        itemId,
        title,
        description,
        price,
        town,
        category: candidate.category,
        condition: condition || undefined,
        locationNote:
          locationNote || undefined,
        itemWebUrl,
        images,
        sourceExpiresAt
      });
    } catch (error) {
      console.error(
        "Unable to load eBay item:",
        itemId,
        error
      );
    }
  }

  return results;
}
