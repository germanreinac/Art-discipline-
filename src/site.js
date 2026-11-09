// Small bits of interactivity. The site works without it.
(() => {

  const sessionGet = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
  const sessionSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch {} };

  // Sticky subscribe bar: one signup on screen at a time. On the homepage it
  // shows right away; elsewhere once the reader scrolls a bit. It hides while
  // any other signup box, or the footer, is visible. Closing it hides it until the next visit.
  const bar = document.querySelector(".sticky-sub");
  const barOn = bar && !document.body.classList.contains("links-page");
  if (bar && barOn && !sessionGet("ad-bar-closed")) {
    const others = document.querySelectorAll(".sub-card, .inline-sub, main [data-sub], .foot");
    const visible = new Set();
    const start = document.body.classList.contains("home") ? 0 : 400;
    const update = () => { bar.hidden = window.scrollY < start || visible.size > 0; };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
        update();
      });
      others.forEach((el) => io.observe(el));
    }
    addEventListener("scroll", update, { passive: true });
    update();
    bar.querySelector(".sticky-close").addEventListener("click", () => {
      sessionSet("ad-bar-closed", "1");
      bar.remove();
    });
  }

  // Homepage: sections rise into view as you scroll. Items in a row come in
  // one after another. With reduced motion it is a plain fade (see styles.css).
  if (document.body.classList.contains("home") && "IntersectionObserver" in window) {
    const groups = [".hero-copy > *", ".hero-art", ".section-head", ".start li", ".grid > *", ".gift", ".about-strip"];
    const items = [];
    groups.forEach((sel) => document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--delay", `${(i % 4) * 90}ms`);
      items.push(el);
    }));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      io.unobserve(el);
      // hand hover effects back to the element's own transitions
      el.addEventListener("transitionend", () => el.classList.remove("reveal", "in"), { once: true });
    }), { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  }

  // Substack signup boxes: shift the crop on narrow widths (Substack's layout
  // moves up below 340px), and open the box to show Substack's terms line
  // as soon as someone clicks into it.
  const embeds = document.querySelectorAll(".sub-embed");
  const sizeEmbeds = () => embeds.forEach((el) => el.classList.toggle("narrow", el.offsetWidth + 24 < 340));
  sizeEmbeds();
  addEventListener("resize", sizeEmbeds);
  addEventListener("blur", () => setTimeout(() => {
    const box = document.activeElement?.closest?.(".sub-embed");
    if (box) box.classList.add("open");
  }));

  // Homepage: end the intro paragraph where the headline's last line ends.
  const nb = document.querySelector(".hero h1 .nb");
  if (nb) {
    const fit = () => {
      const copy = nb.closest(".hero-copy");
      copy.style.setProperty("--dot-w", nb.getBoundingClientRect().right - copy.getBoundingClientRect().left + "px");
    };
    fit();
    addEventListener("resize", fit);
    document.fonts?.ready.then(fit);
  }

  // Share buttons inside posts.
  document.querySelectorAll("[data-share]").forEach((b) =>
    b.addEventListener("click", async () => {
      const data = { title: document.title, url: location.href };
      if (navigator.share) { try { await navigator.share(data); } catch {} return; }
      try { await navigator.clipboard.writeText(location.href); b.textContent = "Link copied ✓"; } catch {}
    }));

  // Archive topic filters.
  const grid = document.querySelector("[data-archive]");
  document.querySelectorAll("[data-topic]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const topic = btn.dataset.topic;
      document.querySelectorAll("[data-topic]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      grid.querySelectorAll("[data-topics]").forEach((el) => {
        el.hidden = topic && !el.dataset.topics.split("|").includes(topic);
      });
    }));
})();
