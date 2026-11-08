// Small bits of interactivity. The site works without it.
(() => {
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };

  // Remember people who subscribed so we stop asking.
  document.querySelectorAll("[data-sub]").forEach((f) =>
    f.addEventListener("submit", () => store.set("ad-subscribed", "1")));

  // Sticky subscribe bar: one signup on screen at a time. It shows once the
  // reader scrolls a bit and hides while any other signup box is visible.
  const bar = document.querySelector(".sticky-sub");
  if (bar && !store.get("ad-subscribed") && !store.get("ad-bar-closed")) {
    const others = document.querySelectorAll(".embed, .sub-card, .inline-sub, main [data-sub]");
    const visible = new Set();
    const update = () => { bar.hidden = window.scrollY < 400 || visible.size > 0; };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
        update();
      });
      others.forEach((el) => io.observe(el));
    }
    addEventListener("scroll", update, { passive: true });
    bar.querySelector(".sticky-close").addEventListener("click", () => {
      store.set("ad-bar-closed", "1");
      bar.remove();
    });
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
