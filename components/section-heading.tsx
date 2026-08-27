import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, href, linkLabel = "See all" }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#dfe0da] pb-3">
      <div>
        <p className="text-xs font-semibold text-[#a94f32]">{eyebrow}</p>
        <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.025em] sm:text-2xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-[#173f30] hover:underline">
          {linkLabel} <ArrowRight size={15} />
        </Link>
      ) : null}
    </div>
  );
}
