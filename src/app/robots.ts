import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * The dataset exists to be read and cited, including by the answer engines we
 * measure. Blocking them would defeat the point, so everything is open.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
