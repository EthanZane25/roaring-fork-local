import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: true } };

export default function SignInPage() {
  return (
    <main className="container-site max-w-lg py-14">
      <p className="eyebrow">Account</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em]">Your local account</h1>
      <p className="mt-4 mb-8 leading-7 text-[#5e665e]">Vote, post classifieds, message sellers and save local favorites with one account.</p>
      <SignInForm />
    </main>
  );
}
