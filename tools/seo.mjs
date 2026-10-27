import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(fs.readFileSync(path.join(root, 'data', 'site.json'), 'utf8'));
const base = site.url.endsWith('/') ? site.url : site.url + '/';
const ogImage = new URL(site.meta.ogImage, base).href;
const today = new Date().toISOString().slice(0, 10);

const pages = [
  { file: 'index.html', canonical: base, ogUrl: base },
  { file: 'privacy.html', canonical: new URL('privacy.html', base).href, ogUrl: new URL('privacy.html', base).href }
];

let changed = 0;

for (const page of pages) {
  const file = path.join(root, page.file);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${page.canonical}$2`
  );
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${page.ogUrl}$2`);
  html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${ogImage}$2`);
  html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${ogImage}$2`);

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
    console.log('updated', page.file);
  } else {
    console.log('unchanged', page.file);
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${new URL('privacy.html', base).href}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
`;

fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');

const robots = `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap.xml', base).href}
`;

fs.writeFileSync(path.join(root, 'robots.txt'), robots, 'utf8');

console.log('updated sitemap.xml and robots.txt');
console.log('pages changed:', changed);
