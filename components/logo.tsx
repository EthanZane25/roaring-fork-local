import Image from "next/image";
import Link from "next/link";

export function Logo({
  compact = false
}: {
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center"
      aria-label="Roaring Fork Local home"
    >
      <Image
        src="/roaring-fork-local-logo.png"
        alt="Roaring Fork Local — People · Places · Community"
        width={648}
        height={436}
        priority
        className={
          compact
            ? "h-auto w-[130px] object-contain mix-blend-multiply"
            : "h-auto w-[160px] object-contain mix-blend-multiply lg:w-[172px]"
        }
      />
    </Link>
  );
}
