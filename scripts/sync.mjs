// Pulls every post from Substack and every product from Gumroad into data/.
// Runs before each build. If a source is unreachable, the last saved data is kept.
import fs from "node:fs/promises";
import config from "../site.config.mjs";

const DATA = new URL("../data/", import.meta.url);
await fs.mkdir(DATA, { recursive: true });

async function get(url, as = "json") {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "artdiscipline-site-sync" } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return as === "json" ? await res.json() : await res.text();
    } catch (err) {
      if (i === 2) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

async function syncPosts() {
  const list = [];
  let cursor = null;
  do {
    const q = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
    const page = await get(`${config.substack}/api/v1/archive?sort=new${q}`);
    list.push(...page.posts);
    cursor = page.posts.length ? page.nextCursor : null;
  } while (cursor);

  // Reuse saved bodies for posts that haven't changed, fetch the rest.
  let saved = [];
  try { saved = JSON.parse(await fs.readFile(new URL("posts.json", DATA))); } catch {}
  const bySlug = new Map(saved.map((p) => [p.slug, p]));

  const posts = [];
  for (const p of list) {
    if (p.type !== "newsletter") continue;
    const old = bySlug.get(p.slug);
    const fresh = old && old.updated === (p.updated_at || p.post_date) && old.body;
    const full = fresh ? null : await get(`${config.substack}/api/v1/posts/${p.slug}`);
    const tags = (p.postTags || []).map((t) => t.name.toLowerCase());
    posts.push({
      slug: p.slug,
      title: p.title.trim(),
      subtitle: (p.subtitle || "").trim(),
      date: p.post_date,
      updated: p.updated_at || p.post_date,
      cover: p.cover_image,
      audience: p.audience,
      tags,
      url: p.canonical_url,
      reactions: p.reaction_count || 0,
      comments: p.comment_count || 0,
      excerpt: (p.truncated_body_text || p.description || "").trim(),
      body: fresh ? old.body : full.body_html || "",
      authorPhoto: p.publishedBylines?.[0]?.photo_url || old?.authorPhoto || null,
    });
  }
  await fs.writeFile(new URL("posts.json", DATA), JSON.stringify(posts, null, 1));
  console.log(`posts: ${posts.length}`);
}

async function syncProducts() {
  const html = await get(config.gumroad + "/", "text");
  const text = html.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const start = text.indexOf('"products":[');
  if (start < 0) throw new Error("Gumroad: product list not found");
  // Walk brackets to cut out the JSON array.
  let i = start + 11, depth = 0, inStr = false;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (c === "\\") i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") { if (--depth === 0) break; }
  }
  const raw = JSON.parse(text.slice(start + 11, i + 1));
  const products = raw.map((p) => ({
    id: p.permalink,
    slug: (p.url.match(/\/l\/([^?]+)/) || [])[1] || p.permalink,
    name: p.name.trim(),
    url: p.url.split("?")[0],
    image: p.thumbnail_url,
    price: p.price_cents / 100,
    currency: p.currency_code,
    payWhatYouWant: p.is_pay_what_you_want,
    rating: p.ratings?.average || 0,
    ratings: p.ratings?.count || 0,
    kind: p.native_type,
  }));
  await fs.writeFile(new URL("products.json", DATA), JSON.stringify(products, null, 1));
  console.log(`products: ${products.length}`);
}

for (const [name, job] of [["Substack", syncPosts], ["Gumroad", syncProducts]]) {
  try { await job(); } catch (err) { console.warn(`${name} sync failed, keeping saved data: ${err.message}`); }
}
