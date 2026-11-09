// Everything you might want to tweak lives here.
export default {
  title: "Art Discipline",
  tagline: "Stay creative, stay weird.",
  headline: "Find your voice as an artist",
  description:
    "Art Discipline is a monthly newsletter by Germán Reina Carmona, the artist behind OlliOlli World's BAFTA-nominated art: character design, world building, creativity and careers in games.",
  siteUrl: "https://artdiscipline.com",

  // Where the posts come from. The site rebuilds from this automatically.
  substack: "https://artdiscipline.substack.com",
  gumroad: "https://germanreinac.gumroad.com",

  // true: tell search engines the Substack copy of each post is the original.
  // false: this site (artdiscipline.com) is the main home of the posts.
  canonicalToSubstack: false,

  author: {
    name: "Germán Reina Carmona",
    bio: "Creative vision and art direction for video games and animation. Previously OlliOlli World (BAFTA-nominated art), Supercell, Rovio, Riot Games. Passionate about unique designs and world-building for new and existing IPs.",
  },

  // "Start here" picks on the homepage (Substack slugs).
  startHere: ["art-discipline-14", "art-discipline-15", "art-discipline-11", "art-discipline-02"],

  // Highlighted as the signup gift (Gumroad permalink).
  freebie: "photoshoptools",

  // Product suggested at the end of a post, picked by the post's Substack tags.
  // First match wins; "default" is used otherwise.
  productByTag: [
    { tags: ["mentorship", "pitching", "public speaking"], product: "cldiu" },
    { tags: ["character design"], product: "Characterdesign" },
    { tags: ["concept art", "illustration"], product: "artworkreview" },
    { default: true, product: "photoshoptools" },
  ],

  // Topic filters on the archive page, built from Substack tags.
  topics: [
    { name: "Character design", tags: ["character design", "comicbook", "toys"] },
    { name: "Games", tags: ["video game", "3d", "animation"] },
    { name: "Career", tags: ["mentorship", "pitching", "public speaking"] },
    { name: "Creativity", tags: ["creativity", "creative", "storytelling"] },
    { name: "Process", tags: ["process", "drawing", "learning", "book summary"] },
  ],

  instagram: "https://www.instagram.com/germanreinac/",

  // Other places you live. Shown on About and /links.
  links: [
    { label: "Shop on Gumroad", url: "https://germanreinac.gumroad.com/", note: "Free toolkit and tutorials" },
    { label: "1-on-1 mentorship", url: "https://germanreinac.gumroad.com/l/cldiu", note: "Book on Gumroad" },
    { label: "Megalith Islands", url: "https://www.patreon.com/MegalithIslands", note: "Comic book on Patreon" },
    { label: "Artist site", url: "http://www.germanreina.com", note: "germanreina.com" },
  ],
};
