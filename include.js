// include.js
// Incrémente SITE_VERSION quand tu modifies le header/footer/styles (ex: "5" -> "6")
const SITE_VERSION = "5";

async function inject(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  const sep = file.includes("?") ? "&" : "?";
  const url = `${file}${sep}v=${encodeURIComponent(SITE_VERSION)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[include.js] Échec chargement ${url} (${res.status})`);
      return;
    }
    el.innerHTML = await res.text();
  } catch (e) {
    console.warn(`[include.js] Erreur fetch ${url}`, e);
  }
}

function normalizeHref(href) {
  if (!href) return "";
  href = href.split("#")[0].split("?")[0];
  href = href.replace(/^\.\//, "");
  return href.toLowerCase();
}

function markActiveLink() {
  const current = normalizeHref(location.pathname.split("/").pop() || "index.html");

  document.querySelectorAll(".menu a").forEach(a => {
    const href = normalizeHref(a.getAttribute("href"));
    if (href === current) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Chemins absolus = plus fiable sur GitHub Pages + domaine perso
  await inject("site-header", "/header.html");
  await inject("site-footer", "/footer.html");

  // Relance après injection (le menu est dans header)
  markActiveLink();
});
