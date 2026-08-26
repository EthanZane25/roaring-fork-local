import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, href, linkLabel = "See all" }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="hidden items-center gap-1 text-sm font-bold text-[#163b2d] sm:inline-flex">
          {linkLabel} <ArrowRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}
