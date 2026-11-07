// Small bits of interactivity. The site works without it.
(() => {
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };

  // Remember people who subscribed so we stop asking.
  document.querySelectorAll("[data-sub]").forEach((f) =>
    f.addEventListener("submit", () => store.set("ad-subscribed", "1")));

  // Sticky subscribe bar: shows after scrolling a bit, unless dismissed or subscribed.
  const bar = document.querySelector(".sticky-sub");
  if (bar && !store.get("ad-subscribed") && !store.get("ad-bar-closed")) {
    const onScroll = () => {
      const y = window.scrollY / (document.body.scrollHeight - innerHeight || 1);
      bar.hidden = !(y > 0.25 && y < 0.92);
    };
    addEventListener("scroll", onScroll, { passive: true });
    bar.querySelector(".sticky-close").addEventListener("click", () => {
      store.set("ad-bar-closed", "1");
      bar.remove();
    });
  }

  // Header "Subscribe" scrolls to the nearest signup on the page.
  document.querySelectorAll("[data-scroll-sub]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const t = document.getElementById("subscribe");
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth", block: "center" });
      t.querySelector("input")?.focus({ preventScroll: true });
    }));

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
