import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Roaring Fork Local home">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#163b2d] text-sm font-black tracking-tight text-white shadow-sm transition group-hover:-translate-y-0.5">
        RF
      </span>
      <span className="leading-none">
        <strong className="block text-[15px] tracking-[-0.02em]">Roaring Fork</strong>
        <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#b8502f]">Local</span>
      </span>
    </Link>
  );
}
