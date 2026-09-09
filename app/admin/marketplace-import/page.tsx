import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import { EbayImportPanel } from "@/components/ebay-import-panel";

export const metadata = {
  title: "Marketplace Import | Admin"
};

export default async function MarketplaceImportPage() {
  const ctx = await getAdminContext();

  if (!ctx) {
    redirect("/account");
  }

  return (
    <main className="container-site py-10 sm:py-12">
      <div className="max-w-3xl">
        <p className="text-[12px] font-bold uppercase tracking-[.15em] text-[#9a7422]">
          Admin
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-.03em]">
          Marketplace Import
        </h1>

        <p className="mt-3 text-[15px] leading-7 text-[#5e665e]">
          Seed the Marketplace with current external inventory
          while local sellers begin posting directly.
        </p>

        <div className="mt-8">
          <EbayImportPanel />
        </div>
      </div>
    </main>
  );
}
