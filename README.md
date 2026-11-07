# artdiscipline.com

A branded home for the **Art Discipline** newsletter. You keep writing on Substack, and this site rebuilds itself from it.

## How it works

1. `npm run sync` downloads every post from Substack and every product from Gumroad into `data/`.
2. `npm run build` turns that into a static site in `dist/`.
3. A GitHub Action runs both every day, and on every push to `main`, then publishes to GitHub Pages.

**Publishing a new issue takes no extra work.** Post on Substack as usual and it shows up here within a day. For an instant update, open the repo's **Actions** tab, pick **Build and deploy site** and press **Run workflow**.

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

## Going live on artdiscipline.com

1. In GitHub: **Settings → Pages → Source: GitHub Actions**, then merge to `main`.
2. In Substack: **Settings → Domain**, move the publication off `artdiscipline.com`, either back to `artdiscipline.substack.com` or to a subdomain like `read.artdiscipline.com`.
3. At your domain registrar, point `artdiscipline.com` to GitHub Pages and add it under **Settings → Pages → Custom domain**.
4. In `site.config.mjs`, set `canonicalToSubstack: false` and set `substack` to the new Substack address.

Old links such as `artdiscipline.com/p/art-discipline-12` keep working, because posts live at the same paths.
