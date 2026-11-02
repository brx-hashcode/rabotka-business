import { careersCompanyServer } from "#/lib/api/careers-server";
import { siteOrigin } from "#/lib/seo/site";

/**
 * The browser tab of a business's careers pages (the company, its offers,
 * the application form) shows the business's logo, not Rabotka's. A redirect
 * to the logo itself rather than a redrawn image: any format the business
 * uploaded works. No logo, or the page gone: Rabotka's icon.
 */
export default async function Icon({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await careersCompanyServer(slug);
  const logo = page?.company.logoUrl;
  if (logo && /^https?:\/\//.test(logo)) return Response.redirect(logo, 302);
  const { origin } = await siteOrigin();
  return Response.redirect(new URL("/icon.png", origin), 302);
}
