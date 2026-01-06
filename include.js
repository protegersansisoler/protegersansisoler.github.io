// include.js
// Change seulement SITE_VERSION quand tu veux forcer un refresh global (CSS/JS/includes)
const SITE_VERSION = "6";

async function inject(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  const sep = file.includes("?") ? "&" : "?";
  const url = `${file}${sep}v=${encodeURIComponent(SITE_VERSION)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    el.innerHTML = await res.text();
  } catch (e) {}
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

    const base = href.split("#")[0].split("?")[0];
    const hash = href.includes("#") ? "#" + href.split("#")[1] : "";
    link.setAttribute("href", `${base}?v=${encodeURIComponent(SITE_VERSION)}${hash}`);
  });

  // JS
  document.querySelectorAll("script[src]").forEach(s => {
    const src = s.getAttribute("src");
    if (!isLocal(src)) return;

    // Ne pas se recharger soi-même (évite des effets bizarres)
    const base0 = src.split("#")[0].split("?")[0];
    if (base0.endsWith("/include.js") || base0.endsWith("include.js")) return;

    const hash = src.includes("#") ? "#" + src.split("#")[1] : "";
    s.setAttribute("src", `${base0}?v=${encodeURIComponent(SITE_VERSION)}${hash}`);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Force refresh des assets (CSS/JS)
  bustLocalAssets();

  // 2) Injection header/footer
  await inject("site-header", "/header.html");
  await inject("site-footer", "/footer.html");

  // 3) Actif dans le menu
  markActiveLink();
});
