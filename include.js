// include.js
// Incrémente SITE_VERSION quand tu modifies le header/footer/menu/styles (ex: "5" -> "6")
const SITE_VERSION = "5";

async function inject(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  // Ajoute ?v=... (ou &v=... si déjà un ?)
  const sep = file.includes("?") ? "&" : "?";
  const url = `${file}${sep}v=${encodeURIComponent(SITE_VERSION)}`;

  const res = await fetch(url, { cache: "no-store" });
  const html = await res.text();
  el.innerHTML = html;
}

function normalizeHref(href) {
  if (!href) return "";
  href = href.split("#")[0].split("?")[0];
  href = href.replace(/^\.\//, "");
  return href.toLowerCase();
}

function markActiveLink() {
  const current =
    normalizeHref(location.pathname.split("/").pop() || "index.html");

  document.querySelectorAll(".menu a").forEach(a => {
    const href = normalizeHref(a.getAttribute("href"));
    if (href === current) {
      a.setAttribute("aria-current", "page");
    } else {
      a.removeAttribute("aria-current");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await inject("site-header", "./header.html");
  await inject("site-footer", "./footer.html");
  markActiveLink();
});
