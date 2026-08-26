export type Town = {
  slug: string;
  name: string;
  county: string;
  latitude: number;
  longitude: number;
  tagline: string;
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  town: string;
  address: string;
  phone?: string;
  website?: string;
  description: string;
  cuisines: string[];
  meals: string[];
  priceLevel: 1 | 2 | 3 | 4;
  latitude: number;
  longitude: number;
  imageUrl: string;
  isAdvertiser: boolean;
  openNow?: boolean;
  verifiedAt: string;
  localVotes: number;
  tags: string[];
};

export type MarketplaceListing = {
  id: string;
  slug: string;
  title: string;
  town: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  sellerName: string;
  sellerVerified: boolean;
};

export type PollOption = {
  id: string;
  label: string;
  town?: string;
  votes: number;
  restaurantId?: string;
};

export type Poll = {
  id: string;
  slug: string;
  title: string;
  description: string;
  closesAt?: string;
  options: PollOption[];
};

export type EventItem = {
  id: string;
  title: string;
  town: string;
  venue: string;
  startsAt: string;
  category: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  town: string;
  pay: string;
  type: string;
};

export type Housing = {
  id: string;
  title: string;
  town: string;
  price: number;
  bedrooms: number;
  type: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  authorName: string;
  town?: string;
  publishedAt: string;
  imageUrl?: string;
};
