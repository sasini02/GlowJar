/** Public origin of the app, without a trailing slash. Used to build links that leave the app, like magic links. */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error("Missing environment variable NEXT_PUBLIC_SITE_URL. Copy .env.example to .env.local and fill it in.");
  }
  return url.replace(/\/+$/, "");
}
