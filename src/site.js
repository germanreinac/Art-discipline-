// Small bits of interactivity. The site works without it.
(() => {

  const sessionGet = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
  const sessionSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch {} };

  // Sticky subscribe bar: one signup on screen at a time. It waits 4 seconds
  // after the page opens (its Substack form loads then too, keeping the first
  // load light); on pages other than home it also waits for a bit of scrolling. It hides while
  // any other signup box, or the footer, is visible. Closing it hides it until the next visit.
  const bar = document.querySelector(".sticky-sub");
  const barOn = bar && !document.body.classList.contains("links-page");
  if (bar && barOn && !sessionGet("ad-bar-closed")) {
    const others = document.querySelectorAll(".sub-card, .inline-sub, main [data-sub], .foot");
    const visible = new Set();
    const start = document.body.classList.contains("home") ? 0 : 400;
    let ready = false;
    const update = () => { bar.hidden = !ready || window.scrollY < start || visible.size > 0; };
    setTimeout(() => {
      ready = true;
      const f = bar.querySelector("iframe[data-src]");
      if (f) f.src = f.dataset.src;
      update();
    }, 4000);
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
    const groups = [".section-head", ".start li", ".grid > *", ".gift", ".about-strip"];
    const items = [];
    groups.forEach((sel) => document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--delay", `${(i % 4) * 120}ms`);
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
    // wait for the hidden state to be painted, so items already on screen animate too
    requestAnimationFrame(() => requestAnimationFrame(() => items.forEach((el) => io.observe(el))));
  }

  // Gumroad's checkout script waits until the page has loaded and gone quiet,
  // and only loads on pages that sell something.
  const whenIdle = (fn) => addEventListener("load", () =>
    ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 1200)));
  whenIdle(() => {
    if (document.querySelector("[data-gumroad]")) {
      const s = document.createElement("script");
      s.src = "https://gumroad.com/js/gumroad.js";
      document.body.append(s);
    }
  });

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
    nb.closest("h1").addEventListener("animationend", fit); // measure again once it stops moving
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
