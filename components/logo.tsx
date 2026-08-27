import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Roaring Fork Local home">
      <span className="grid h-8 w-8 place-items-center bg-[#173f30] text-[11px] font-bold tracking-tight text-white">
        RF
      </span>
      <span className="hidden leading-[1.02] sm:block">
        <strong className="block text-[14px] font-semibold tracking-[-0.01em]">Roaring Fork</strong>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a94f32]">Local</span>
      </span>
    </Link>
  );
}
