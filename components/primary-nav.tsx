import Link from "next/link";

export const PRIMARY_NAV = [
  ["Home", "/"],
  ["Eat", "/restaurants"],
  ["Marketplace", "/marketplace"],
  ["Vote", "/vote"],
  ["Events", "/events"],
  ["Jobs", "/jobs"],
  ["Housing", "/housing"]
] as const;

export function PrimaryNav({ town, className = "" }: { town?: string; className?: string }) {
  return (
    <nav className={`overflow-x-auto ${className}`} aria-label="Primary navigation">
      <div className="flex min-w-max items-center gap-7">
        {PRIMARY_NAV.map(([label, href]) => {
          const destination = town ? `${href}${href.includes("?") ? "&" : "?"}town=${town}` : href;
          return (
            <Link
              key={href}
              href={destination}
              className="whitespace-nowrap py-3 text-[14px] font-medium text-[#3f4540] transition-colors hover:text-[#173f30]"
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
