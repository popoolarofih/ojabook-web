import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** The signed in app has nothing to index. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/app', '/login', '/onboarding'] }, sitemap: `${base}/sitemap.xml` };
}
