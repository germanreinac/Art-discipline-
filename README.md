# artdiscipline.com

A branded home for the **Art Discipline** newsletter. You keep writing on Substack, and this site rebuilds itself from it.

## How it works

1. `npm run sync` downloads every post from Substack and every product from Gumroad into `data/`.
2. `npm run build` turns that into a static site in `dist/`.
3. A GitHub Action runs both every hour, and on every push to `main`, then publishes to GitHub Pages. When new posts arrive, it saves them in `data/`, which also keeps a backup of every issue.

**Publishing a new issue takes no extra work.** Post on Substack as usual and it shows up here within an hour. For an instant update, open the repo's **Actions** tab, pick **Build and deploy site** and press **Run workflow**.

No dependencies: just Node 22.

## Pages

| Page | What's there |
| --- | --- |
| `/` | Hero with the Substack signup, latest issue, "Start here" picks, latest issues, free Photoshop Toolkit, about strip |
| `/archive/` | Every issue, filterable by topic |
| `/p/<slug>/` | Full post, with the same URLs as Substack so old links keep working |
| `/shop/` | Gumroad products, with checkout in an overlay |
| `/about/` | Bio and links |
| `/links/` | Link-in-bio page for Instagram and other socials |

Subscribing always goes to Substack, so your list stays there.

## Changing things

Everything editable is in `site.config.mjs`: tagline, "Start here" picks, which product to suggest at the end of each post, archive topics and links. Styles are in `src/styles.css`.

## Preview address (no domain changes)

In GitHub, go to **Settings → Pages** and set **Source** to **GitHub Actions**. The site then publishes to
**https://germanreinac.github.io/Art-discipline-/**, and Substack keeps artdiscipline.com untouched.

## artdiscipline.com

The domain points straight at GitHub Pages. Substack stays at `artdiscipline.substack.com`, and every signup form subscribes people there.

DNS records at the domain registrar:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | germanreinac.github.io |

GitHub: **Settings → Pages → Custom domain** is `artdiscipline.com`, with **Enforce HTTPS** on. The build picks up the domain by itself.

Old links such as `artdiscipline.com/p/art-discipline-12` keep working, because posts live at the same paths as on Substack.
