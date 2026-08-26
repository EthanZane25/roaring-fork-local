import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "RF Local",
    description: "Restaurants, classifieds, events, jobs and local life from Aspen to Rifle.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#163b2d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" }
    ]
  };
}
