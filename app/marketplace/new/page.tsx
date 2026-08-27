import type { Metadata } from "next";
import { NewListingForm } from "@/components/new-listing-form";

export const metadata: Metadata = {
  title: "Post a Local Classified",
  robots: { index: false, follow: true }
};

export default function NewMarketplaceListingPage() {
  return (
    <main className="container-site max-w-3xl py-12">
      <p className="eyebrow">Marketplace</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.02em]">Post a local listing</h1>
      <p className="mt-4 mb-8 text-[#5f675f]">Listings are intended for local pickup or exchange in the Aspen-to-Rifle corridor.</p>
      <NewListingForm />
    </main>
  );
}
