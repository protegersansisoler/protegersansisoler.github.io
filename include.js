// include.js
// Change seulement SITE_VERSION quand tu veux forcer un refresh global (CSS/JS/includes)
const SITE_VERSION = "7";

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

// Ajoute ou remplace v=... dans une URL (sans perdre le #hash)
function setVersionParam(url) {
  const [beforeHash, hash] = url.split("#");
  const [base, query = ""] = beforeHash.split("?");

  const params = new URLSearchParams(query);
  params.set("v", SITE_VERSION);

  const newUrl = `${base}?${params.toString()}` + (hash ? `#${hash}` : "");
  return newUrl;
}

// Ajoute/replace ?v=... sur tes assets locaux (CSS/JS), sans toucher aux liens externes
function bustLocalAssets() {
  const isLocal = (url) =>
    url &&
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("//") &&
    !url.startsWith("data:") &&
    !url.startsWith("mailto:");

  // CSS
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach(link => {
    const href = link.getAttribute("href");
    if (!isLocal(href)) return;
    link.setAttribute("href", setVersionParam(href));
  });

  // JS
  document.querySelectorAll("script[src]").forEach(s => {
    const src = s.getAttribute("src");
    if (!isLocal(src)) return;

    // Ne pas se recharger soi-même
    const base0 = src.split("#")[0].split("?")[0];
    if (base0.endsWith("/include.js") || base0.endsWith("include.js")) return;

    s.setAttribute("src", setVersionParam(src));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Force refresh des assets (CSS/JS) via ?v=SITE_VERSION
  bustLocalAssets();

  // 2) Injection header/footer
  await inject("site-header", "/header.html");
  await inject("site-footer", "/footer.html");

  // 3) Actif dans le menu (menu est dans header.html)
  markActiveLink();
});
