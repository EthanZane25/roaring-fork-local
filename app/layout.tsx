import type { Metadata } from "next";
import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Aspen to Rifle`,
    template: `%s | ${SITE_NAME}`
  },
  description: "Restaurants, local classifieds, events, jobs, housing and community voting across the Roaring Fork Valley from Aspen to Rifle.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Aspen to Rifle`,
    description: "The useful local guide for dining, deals, events and everyday life across the Roaring Fork Valley."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
