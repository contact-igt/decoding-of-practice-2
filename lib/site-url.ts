export const publicSite = process.env.DOP_SITE_URL || 'https://www.vlslawacademy.com';
export const indexable = process.env.DOP_ALLOW_INDEXING === 'true' && Boolean(process.env.DOP_SITE_URL);
