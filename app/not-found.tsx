import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-site py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-black">We couldn't find that local page.</h1>
      <p className="mt-4 text-[#606860]">Try the homepage or search the valley instead.</p>
      <Link href="/" className="mt-7 inline-block rounded-full bg-[#163b2d] px-6 py-3 text-sm font-black text-white">Go home</Link>
    </main>
  );
}
