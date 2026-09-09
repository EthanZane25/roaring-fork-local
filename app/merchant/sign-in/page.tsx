import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = {
  title: "Merchant sign in",
  robots: { index: false, follow: false }
};

export default function MerchantSignInPage() {
  return (
    <main className="container-site max-w-lg py-14">
      <p className="eyebrow">For local businesses</p>

      <h1 className="mt-3 font-serif text-4xl tracking-[-.025em]">
        Merchant sign in
      </h1>

      <p className="mb-8 mt-4 leading-7 text-[#5e665e]">
        Restaurants, shops and local businesses can manage Valley Drops,
        scheduled offers and redemptions from one account.
      </p>

      <SignInForm nextPath="/merchant" />

      <p className="mt-6 text-center text-sm text-[#687069]">
        Looking for regular account access?{" "}
        <Link href="/sign-in" className="font-semibold text-[#173f30] hover:underline">
          Account sign in
        </Link>
      </p>
    </main>
  );
}
