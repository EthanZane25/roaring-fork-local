import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="Roaring Fork Local home">
      <span className="grid h-10 w-10 place-items-center bg-[#173f30] text-[12px] font-bold tracking-tight text-white">
        RF
      </span>
      <span className="leading-[1.02]">
        <strong className="block text-[15px] font-semibold tracking-[-0.01em]">Roaring Fork</strong>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a94f32]">Local</span>
      </span>
    </Link>
  );
}
