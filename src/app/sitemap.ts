import type { MetadataRoute } from "next";
import { getIndex, getSummary } from "@/lib/data";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [index, summary] = await Promise.all([getIndex(), getSummary()]);
  const lastModified = new Date(summary.updatedAt);
  const url = (path: string) => `${SITE.url}${path}`;

  return [
    { url: url("/"), lastModified, priority: 1 },
    { url: url("/categories"), lastModified, priority: 0.9 },
    { url: url("/check"), lastModified, priority: 0.8 },
    { url: url("/methodology"), lastModified, priority: 0.7 },
    { url: url("/data"), lastModified, priority: 0.7 },
    { url: url("/disclosure"), lastModified, priority: 0.4 },
    ...index.categories.map((id) => ({
      url: url(`/categories/${id}`),
      lastModified,
      priority: 0.9,
    })),
    ...index.queries.map((id) => ({
      url: url(`/questions/${id}`),
      lastModified,
      priority: 0.8,
    })),
    ...index.domains.map((domain) => ({
      url: url(`/domains/${domain}`),
      lastModified,
      priority: 0.5,
    })),
  ];
}
