import { buildSitemapXml, getPublicSitemapEntries } from "@/lib/seo/sitemap";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const xml = buildSitemapXml(getPublicSitemapEntries());

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
