import type { MetadataRoute } from 'next';
import { indexable, publicSite } from '../lib/site-url';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return indexable
    ? { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/decoding-of-practice/thank-you'] }, sitemap: new URL('/sitemap.xml', publicSite).href }
    : { rules: { userAgent: '*', disallow: '/' } };
}
