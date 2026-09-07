"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-site py-16">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em]">Couldn’t load this part of the valley.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#667069]">
        The page did not load correctly. Your town and account settings are still safe.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 rounded-lg bg-[#173f30] px-5 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
