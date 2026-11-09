// Turns data/*.json into a static site in dist/.
import fs from "node:fs/promises";
import config from "../site.config.mjs";

const root = new URL("../", import.meta.url);

// Lets the site live in a subfolder (e.g. GitHub's free preview address).
const BASE = (process.env.BASE_PATH || "").replace(/\/$/, "");
if (process.env.SITE_URL) config.siteUrl = process.env.SITE_URL.replace(/\/$/, "");
const withBase = (html) =>
  BASE ? html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${BASE}/`).replace(/url=\/(?!\/)/g, `url=${BASE}/`) : html;
const out = new URL("dist/", root);
const read = async (p) => JSON.parse(await fs.readFile(new URL(p, root), "utf8"));

const posts = (await read("data/posts.json")).sort((a, b) => b.date.localeCompare(a.date));
const products = await read("data/products.json").catch(() => []);
const issues = posts.filter((p) => /\.\d+/.test(p.title));

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.cp(new URL("public/", root), out, { recursive: true });
await fs.cp(new URL("src/styles.css", root), new URL("styles.css", out));
await fs.cp(new URL("src/site.js", root), new URL("site.js", out));

// ---------- helpers ----------
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Resize any Substack image through its CDN.
function img(url, w) {
  if (!url) return "";
  let src = url;
  const m = url.match(/\/(https?%3A%2F%2F[^/?#]+)$/i);
  if (m) src = decodeURIComponent(m[1]);
  if (!/substack-post-media|substack\.com/.test(src)) return url;
  return `https://substackcdn.com/image/fetch/w_${w},c_limit,f_auto,q_auto:good,fl_progressive:steep/${encodeURIComponent(src)}`;
}

const date = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const issueNo = (p) => (p.title.match(/\.(\d+)/) || [])[1] || null;
const headline = (p) => (issueNo(p) && p.subtitle ? p.subtitle : p.title);
const kicker = (p) => (issueNo(p) ? `Issue .${issueNo(p)}` : "Note");
const postUrl = (p) => `/p/${p.slug}/`;
const subscribeUrl = `${config.substack}/subscribe`;
const product = (slug) => products.find((x) => x.slug === slug || x.id === slug);
const money = (p) =>
  p.price === 0 ? "Free" : `${p.payWhatYouWant ? "From " : ""}${new Intl.NumberFormat("en", { style: "currency", currency: p.currency.toUpperCase(), maximumFractionDigits: 0 }).format(p.price)}`;

function productFor(post) {
  for (const rule of config.productByTag) {
    if (rule.default || rule.tags.some((t) => post.tags.includes(t))) {
      const p = product(rule.product);
      if (p) return p;
    }
  }
  return null;
}

function topicsOf(post) {
  return config.topics.filter((t) => t.tags.some((x) => post.tags.includes(x))).map((t) => t.name);
}

// Clean Substack's HTML so it fits our layout.
function cleanBody(html, slug) {
  let n = 0;
  const inline = () => `<div class="inline-sub"><p>Enjoying it? Get every issue by email.</p>${subscribeForm(`in-${slug}-${n++}`, "Subscribe")}</div>`;
  return html
    // full name everywhere
    .replace(/Germán Reina(?! Carmona)/g, config.author.name)
    .replace(/<div class="image-link-expand">[\s\S]*?<\/svg><\/button><\/div><\/div>/g, "")
    .replace(/<button[\s\S]*?<\/button>/g, "")
    // Substack's signed image links refuse other sites; use plain CDN resizes instead
    .replace(/<picture>[\s\S]*?<img ([^>]*?)src="([^"]+)"([^>]*)>[\s\S]*?<\/picture>/g, (m, a, src, b) => {
      const w = (m.match(/width="(\d+)"/) || [])[1], h = (m.match(/height="(\d+)"/) || [])[1];
      const alt = (m.match(/alt="([^"]*)"/) || [])[1] || "";
      return `<img src="${img(src, 1456)}" srcset="${img(src, 720)} 720w, ${img(src, 1456)} 1456w" sizes="(max-width: 800px) 100vw, 800px"${w ? ` width="${w}" height="${h}"` : ""} alt="${alt}">`;
    })
    .replace(/(<a class="image-link[^"]*"[^>]*href=")([^"]+)"/g, (m, pre, href) => `${pre}${img(href, 2400)}"`)
    // Substack's own subscribe boxes and buttons -> our branded versions
    .replace(/<div class="subscription-widget-wrap[\s\S]*?<\/form><\/div><\/div>/g, inline)
    .replace(/<p class="button-wrapper"[^>]*>[\s\S]*?<\/p>/g, (m) =>
      />Share</.test(m) ? `<p class="share-row"><button type="button" class="btn btn-ghost" data-share>Share this issue</button></p>`
      : /subscribe/i.test(m) ? inline()
      : m.replace(/class="button primary"/, 'class="btn"'))
    // links between posts stay on this site
    .replace(/https?:\/\/(?:artdiscipline\.substack\.com|(?:www\.)?artdiscipline\.com)\/p\/([a-z0-9-]+)/g, "/p/$1/")
    .replace(/https?:\/\/artdiscipline\.substack\.com\/subscribe[^"]*/g, subscribeUrl)
    .replace(/<img /g, '<img loading="lazy" decoding="async" ')
    .replace(/<a ([^>]*href="https?:\/\/(?!substackcdn)[^"]*")/g, '<a target="_blank" rel="noopener" $1');
}

// ---------- shared pieces ----------
const flame = (cls = "") => `<img class="flame ${cls}" src="/flame.png" alt="" width="147" height="256">`;

function subscribeForm(id, label = "", lazy = true) {
  // Substack's own signup form: subscribes in one step. Cropped to the email
  // field and Substack's terms line.
  return `<div class="sub-embed" id="${id}" data-sub>
  <iframe src="${config.substack}/embed" title="Subscribe to Art Discipline by email"${lazy ? ' loading="lazy"' : ""} scrolling="no"></iframe>
</div>`;
}

function subscribeCard({ id, title, text }) {
  const gift = product(config.freebie);
  return `<section class="sub-card" id="${id}">
  ${flame("sub-flame")}
  <div class="sub-copy">
    <p class="eyebrow">Free monthly newsletter</p>
    <h2>${title}</h2>
    <p>${text}</p>
    ${subscribeForm(id + "-email", "Subscribe free")}
    <p class="fine">No spam, one email a month. ${gift ? `Grab the free <a href="${gift.url}" target="_blank" rel="noopener">${esc(gift.name)}</a> too.` : ""}</p>
  </div>
</section>`;
}

function card(p, size = "") {
  return `<a class="card ${size}" href="${postUrl(p)}">
  <div class="card-img"><img src="${img(p.cover, size === "lg" ? 1100 : 600)}" alt="" loading="lazy" decoding="async"></div>
  <div class="card-body">
    <p class="meta"><span>${kicker(p)}</span><span>${date(p.date)}</span></p>
    <h3>${esc(headline(p))}</h3>
    ${size === "lg" ? `<p class="excerpt">${esc(p.excerpt.slice(0, 220))}${p.excerpt.length > 220 ? "…" : ""}</p>` : ""}
  </div>
</a>`;
}

function productCard(p, feature = false) {
  return `<a class="product ${feature ? "feature" : ""}" href="${p.url}" target="_blank" rel="noopener" data-gumroad>
  <div class="product-img"><img src="${p.image}" alt="" loading="lazy" decoding="async"></div>
  <div class="product-body">
    <h3>${esc(p.name)}</h3>
    <p class="meta"><span class="price">${money(p)}</span>${p.ratings ? `<span>★ ${p.rating.toFixed(1)} · ${p.ratings} ratings</span>` : ""}</p>
  </div>
</a>`;
}

function layout({ title, description = config.description, path, body, canonical, image, bodyClass = "" }) {
  const full = title ? `${title} · ${config.title}` : `${config.title} by ${config.author.name}`;
  const nav = [["/archive/", "Read"], ["/shop/", "Shop"], ["/about/", "About"]];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical || config.siteUrl + path}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${image || config.siteUrl + "/logo.png"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.png">
<link rel="alternate" type="application/rss+xml" title="${config.title}" href="${config.substack}/feed">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="${bodyClass}">
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="/">${flame()}<span>Art Discipline</span></a>
    <nav>${nav.map(([h, l]) => `<a href="${h}"${path.startsWith(h) ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
    <a class="btn btn-sm" href="${subscribeUrl}" target="_blank" rel="noopener">Subscribe</a>
  </div>
</header>
<main>
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div>
      <a class="brand" href="/">${flame()}<span>Art Discipline</span></a>
      <p>${esc(config.tagline)}</p>
    </div>
    <div class="foot-links">
      <a href="/archive/">Read</a><a href="/shop/">Shop</a><a href="/about/">About</a>
      <a href="${config.substack}" target="_blank" rel="noopener">Substack</a>
    </div>
    <p class="fine">© ${new Date().getFullYear()} ${esc(config.author.name)}</p>
  </div>
</footer>
<div class="sticky-sub" hidden>
  <img class="sticky-flame" src="/flame.png" alt="" width="147" height="256">
  <p class="sticky-copy"><strong>Get Art Discipline by email</strong><span>Free, once a month. Join 2,000+ artists finding their own voice.</span></p>
  ${subscribeForm("sticky-email", "", false)}
  <button class="sticky-close" type="button" aria-label="Dismiss">×</button>
</div>
<script src="/site.js" defer></script>
<script src="https://gumroad.com/js/gumroad.js" defer></script>
</body>
</html>`;
}

async function page(path, html) {
  const dir = new URL("." + path, out);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(new URL("index.html", dir), withBase(html));
}

// ---------- home ----------
const latest = posts[0];
const gift = product(config.freebie);
const start = config.startHere.map((s) => posts.find((p) => p.slug === s)).filter(Boolean);

await page("/", layout({
  path: "/",
  bodyClass: "home",
  body: `
<section class="hero wrap">
  <div class="hero-copy">
    <p class="eyebrow">A monthly newsletter by ${esc(config.author.name)}</p>
    <h1><span class="line">Find your voice</span><br> <span class="nb">as an artist<span class="cursor" aria-hidden="true">_</span></span></h1>
    <p class="lede">Character design, world building and careers in games, from the artist behind OlliOlli World's BAFTA-nominated art.</p>
    <p class="motto">Stay creative, stay weird.</p>
  </div>
  <div class="hero-art">${card(latest, "lg")}</div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Start here</h2><p>The issues readers come back to.</p></div>
  <ol class="start">${start.map((p, i) => `<li><a href="${postUrl(p)}"><span class="num">0${i + 1}</span><span><span class="meta">${kicker(p)}</span><strong>${esc(headline(p))}</strong></span></a></li>`).join("")}</ol>
</section>

<section class="wrap section">
  <div class="section-head"><h2>Latest issues</h2><a class="more" href="/archive/">All ${issues.length} issues →</a></div>
  <div class="grid">${posts.slice(1, 7).map((p) => card(p)).join("")}</div>
</section>

${gift ? `<section class="wrap section">
  <div class="gift">
    <div class="gift-img"><img src="${gift.image}" alt="" loading="lazy"></div>
    <div>
      <p class="eyebrow">Free download</p>
      <h2>${esc(gift.name)}</h2>
      <p>The brushes and tools I use every day. ${gift.ratings} artists rated it ${gift.rating.toFixed(1)}★. Pay what you want, or nothing at all.</p>
      <a class="btn" href="${gift.url}" target="_blank" rel="noopener" data-gumroad>Get it free</a>
      <a class="more" href="/shop/">See the shop →</a>
    </div>
  </div>
</section>` : ""}

<section class="wrap section about-strip">
  ${posts[0].authorPhoto ? `<img class="avatar" src="${img(posts[0].authorPhoto, 240)}" alt="${esc(config.author.name)}">` : ""}
  <div><h2>Hi, I'm ${esc(config.author.name.split(" ")[0])}.</h2><p>${esc(config.author.bio)}</p><a class="more" href="/about/">More about me →</a></div>
</section>

`,
}));

// ---------- archive ----------
const allTopics = config.topics.filter((t) => posts.some((p) => topicsOf(p).includes(t.name)));
await page("/archive/", layout({
  title: "All issues",
  path: "/archive/",
  body: `
<section class="wrap page-head">
  <p class="eyebrow">Archive</p>
  <h1>Every issue of Art Discipline</h1>
  <div class="filters" role="group" aria-label="Filter by topic">
    <button type="button" data-topic="" aria-pressed="true">All</button>
    ${allTopics.map((t) => `<button type="button" data-topic="${esc(t.name)}" aria-pressed="false">${esc(t.name)}</button>`).join("")}
  </div>
</section>
<section class="wrap">
  <div class="grid" data-archive>${posts.map((p) => `<div data-topics="${esc(topicsOf(p).join("|"))}">${card(p)}</div>`).join("")}</div>
</section>
<div class="wrap">${subscribeCard({ id: "subscribe", title: "Never miss an issue", text: "One email a month on art, games and the creative grind." })}</div>
`,
}));

// ---------- posts ----------
for (let i = 0; i < posts.length; i++) {
  const p = posts[i];
  const newer = posts[i - 1], older = posts[i + 1];
  const prod = productFor(p);
  await page(postUrl(p), layout({
    title: headline(p),
    description: p.excerpt.slice(0, 160) || config.description,
    path: postUrl(p),
    canonical: config.canonicalToSubstack ? p.url : undefined,
    image: img(p.cover, 1200),
    bodyClass: "post-page",
    body: `
<article class="post">
  <header class="post-head wrap-narrow">
    <p class="meta"><span>${kicker(p)}</span><span>${date(p.date)}</span></p>
    <h1>${esc(headline(p))}</h1>
    <div class="byline">
      ${p.authorPhoto ? `<img src="${img(p.authorPhoto, 96)}" alt="">` : ""}
      <span>${esc(config.author.name)}</span>
    </div>
  </header>
  <div class="prose wrap-narrow">${cleanBody(p.body, p.slug)}</div>
  <div class="wrap-narrow post-end">
    <a class="discuss" href="${p.url}" target="_blank" rel="noopener">♥ ${p.reactions} · Comment on Substack →</a>
    ${subscribeCard({ id: "subscribe", title: "Enjoyed this? Get the next one.", text: "Art Discipline lands once a month. Free, honest, a little weird." })}
    ${prod ? `<div class="post-product"><p class="eyebrow">From the shop</p>${productCard(prod)}</div>` : ""}
    <nav class="pager">
      ${older ? `<a href="${postUrl(older)}"><span class="meta">← Previous</span><strong>${esc(headline(older))}</strong></a>` : "<span></span>"}
      ${newer ? `<a class="next" href="${postUrl(newer)}"><span class="meta">Next →</span><strong>${esc(headline(newer))}</strong></a>` : ""}
    </nav>
  </div>
</article>`,
  }));
}

// ---------- shop ----------
const sorted = [...products].sort((a, b) => (a.slug === config.freebie ? -1 : b.slug === config.freebie ? 1 : a.price - b.price));
await page("/shop/", layout({
  title: "Shop",
  path: "/shop/",
  body: `
<section class="wrap page-head">
  <p class="eyebrow">Shop</p>
  <h1>Tools, demos and feedback</h1>
  <p class="lede">Everything is sold through Gumroad. Checkout opens right here.</p>
</section>
<section class="wrap">
  <div class="grid products">${sorted.map((p) => productCard(p, p.slug === config.freebie)).join("")}</div>
  <p class="fine center"><a href="${config.gumroad}" target="_blank" rel="noopener">Visit the full Gumroad store →</a></p>
</section>
<div class="wrap">${subscribeCard({ id: "subscribe", title: "New products land in the newsletter first", text: "Subscribers hear about new toolkits, demos and mentorship spots before anyone else." })}</div>
`,
}));

// ---------- about ----------
await page("/about/", layout({
  title: "About",
  path: "/about/",
  body: `
<section class="wrap-narrow page-head about">
  ${posts[0].authorPhoto ? `<img class="avatar lg" src="${img(posts[0].authorPhoto, 320)}" alt="${esc(config.author.name)}">` : ""}
  <p class="eyebrow">About</p>
  <h1>${esc(config.author.name)}</h1>
  <p class="lede">${esc(config.author.bio)}</p>
  <p>Art Discipline is my independently-run newsletter. Once a month I share what I'm learning about character design, world building, careers in games and staying creative, plus the side projects I'm building, like Megalith Islands.</p>
</section>
<section class="wrap-narrow">
  <ul class="link-list">${config.links.map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener"><strong>${esc(l.label)}</strong><span>${esc(l.note)}</span></a></li>`).join("")}</ul>
</section>
<div class="wrap-narrow">${subscribeCard({ id: "subscribe", title: "Follow along", text: "The newsletter is where everything gets announced first." })}</div>
`,
}));

// ---------- link-in-bio ----------
await page("/links/", layout({
  title: "Links",
  path: "/links/",
  bodyClass: "links-page",
  body: `
<section class="wrap-narrow links">
  ${flame("links-flame")}
  <h1>Art Discipline</h1>
  <p>${esc(config.tagline)}</p>
  ${subscribeForm("links-email", "Subscribe to the newsletter")}
  <ul class="link-list">
    <li><a href="${postUrl(latest)}"><strong>Latest issue: ${esc(headline(latest))}</strong><span>${kicker(latest)}</span></a></li>
    ${gift ? `<li><a href="${gift.url}" target="_blank" rel="noopener"><strong>Free ${esc(gift.name)}</strong><span>Gumroad</span></a></li>` : ""}
    ${config.links.map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener"><strong>${esc(l.label)}</strong><span>${esc(l.note)}</span></a></li>`).join("")}
  </ul>
</section>`,
}));

// ---------- 404 + extras ----------
await fs.writeFile(new URL("404.html", out), withBase(layout({
  title: "Not found",
  path: "/404",
  body: `<section class="wrap-narrow page-head center">${flame("links-flame")}<h1>Lost?</h1><p class="lede">This page doesn't exist. <a href="/archive/">Browse every issue</a> instead.</p></section>`,
})));
await fs.writeFile(new URL("robots.txt", out), `User-agent: *\nAllow: /\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
const urls = ["/", "/archive/", "/shop/", "/about/", "/links/", ...posts.map(postUrl)];
await fs.writeFile(new URL("sitemap.xml", out),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${config.siteUrl}${u}</loc></url>`).join("")}</urlset>\n`);
// Substack-style /subscribe link keeps working
await page("/subscribe/", `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/#subscribe"><link rel="canonical" href="${config.siteUrl}/#subscribe">`);
if (process.env.CNAME) await fs.writeFile(new URL("CNAME", out), process.env.CNAME + "\n");

console.log(`built ${urls.length} pages into dist/`);
