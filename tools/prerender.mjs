import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { create } = require('../js/render.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(fs.readFileSync(path.join(root, 'data', 'site.json'), 'utf8'));
const projects = JSON.parse(fs.readFileSync(path.join(root, 'data', 'projects.json'), 'utf8'));
const renderer = create(site, projects.projects || []);

const pages = [
  { file: 'index.html', page: 'home', body: renderer.home(), jsonLd: renderer.jsonLd() },
  { file: 'privacy.html', page: 'privacy', body: renderer.privacy() },
  { file: '404.html', page: 'notfound', body: renderer.notFound() }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceBlock(html, file, name, content) {
  const start = `<!-- prerender:${name}:start -->`;
  const end = `<!-- prerender:${name}:end -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);

  if (!pattern.test(html)) {
    throw new Error(`${file}: не найден блок ${start} … ${end}`);
  }

  return html.replace(pattern, `${start}\n${content}\n${end}`);
}

function markMain(html, file) {
  if (!/<main\b[^>]*>/.test(html)) {
    throw new Error(`${file}: не найден тег <main>`);
  }

  return html.replace(/<main\b([^>]*)>/, function (match, attributes) {
    if (/\bdata-prerendered\b/.test(attributes)) {
      return match;
    }
    return `<main${attributes} data-prerendered>`;
  });
}

function jsonLdTag(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

let changed = 0;

for (const page of pages) {
  const file = path.join(root, page.file);
  const before = fs.readFileSync(file, 'utf8');
  let html = before;

  html = replaceBlock(html, page.file, 'header', renderer.header(page.page));
  html = replaceBlock(html, page.file, 'menu', renderer.menu());
  html = replaceBlock(html, page.file, 'main', page.body);
  html = replaceBlock(html, page.file, 'footer', renderer.footer(page.page));
  html = markMain(html, page.file);

  if (page.jsonLd) {
    html = replaceBlock(html, page.file, 'jsonld', jsonLdTag(page.jsonLd));
  }

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
    console.log('prerendered', page.file);
  } else {
    console.log('prerendered', page.file, '(unchanged)');
  }
}

console.log('prerender pages changed:', changed);
