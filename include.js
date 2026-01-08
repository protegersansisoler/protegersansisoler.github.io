// include.js
// La version est lue depuis /site-version.txt (no-store).
// Pour forcer un refresh global, change seulement le contenu de site-version.txt.

async function getSiteVersion() {
  try {
    const res = await fetch("/site-version.txt", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = (await res.text()).trim();
    return txt || "0";
  } catch (e) {
    console.warn("[include.js] Impossible de lire /site-version.txt, fallback v=0", e);
    return "0";
  }
}

async function inject(id, file, version) {
  const el = document.getElementById(id);
  if (!el) return;

  const sep = file.includes("?") ? "&" : "?";
  const url = `${file}${sep}v=${encodeURIComponent(version)}`;

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

function setVersionParam(url, version) {
  const [beforeHash, hash] = url.split("#");
  const [base, query = ""] = beforeHash.split("?");

  const params = new URLSearchParams(query);
  params.set("v", version);

  return `${base}?${params.toString()}` + (hash ? `#${hash}` : "");
}

function bustLocalAssets(version) {
  const isLocal = (url) =>
    url &&
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("//") &&
    !url.startsWith("data:") &&
    !url.startsWith("mailto:");

  // CSS : forcer un vrai reload en remplaçant le <link>
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach(link => {
    const href = link.getAttribute("href");
    if (!isLocal(href)) return;

    const newHref = setVersionParam(href, version);
    const clone = link.cloneNode(true);
    clone.setAttribute("href", newHref);

    // insère le nouveau, puis retire l’ancien (force le rechargement)
    link.parentNode.insertBefore(clone, link.nextSibling);
    link.remove();
  });

  // JS : ajouter v=... aux scripts locaux (sauf include.js)
  document.querySelectorAll("script[src]").forEach(s => {
    const src = s.getAttribute("src");
    if (!isLocal(src)) return;

    const base0 = src.split("#")[0].split("?")[0];
    if (base0.endsWith("/include.js") || base0.endsWith("include.js")) return;

    s.setAttribute("src", setVersionParam(src, version));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const version = await getSiteVersion();

  // 1) Force refresh des assets (CSS/JS) via ?v=version
  bustLocalAssets(version);

  // 2) Injection header/footer (eux aussi versionnés + no-store)
  await inject("site-header", "/header.html", version);
  await inject("site-footer", "/footer.html", version);

  // 3) Actif dans le menu
  markActiveLink();
});
