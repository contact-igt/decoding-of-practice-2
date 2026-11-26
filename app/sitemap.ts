import type { MetadataRoute } from 'next';
import { indexable, publicSite } from '../lib/site-url';
import { route } from '../lib/course';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  return indexable ? [{ url: new URL(route, publicSite).href }] : [];
}
