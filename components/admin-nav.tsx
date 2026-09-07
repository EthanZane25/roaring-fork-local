import Link from "next/link";

const ADMIN_LINKS = [
  ["Dashboard", "/admin"],
  ["Restaurants", "/admin/restaurants"],
  ["Advertising", "/admin/advertising"],
  ["Marketplace", "/admin/marketplace"],
  ["Events", "/admin/events"],
  ["Jobs", "/admin/jobs"],
  ["Housing", "/admin/housing"],
  ["Users", "/admin/users"],
  ["Reports", "/admin/reports"],
  ["Voting", "/admin/votes"],
  ["Blog", "/admin/blog"],
  ["Settings", "/admin/settings"],
  ["System", "/admin/system"]
] as const;

export function AdminNav() {
  return (
    <div className="border-b border-[#dddcd5] bg-[#f4f1e9]">
      <div className="container-site overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex min-w-max items-center gap-1 py-2" aria-label="Administration">
          {ADMIN_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-[13px] font-semibold text-[#405047] hover:bg-white hover:text-[#173f30]">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
