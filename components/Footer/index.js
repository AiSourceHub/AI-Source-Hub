export const Footer = {
  name: "Footer",
  element: "footer",
  slots: ["version", "links", "support"],
  supports: ["rtl", "darkMode", "responsive"],
};

export function renderFooter(content) {
  return `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div>${content.brand}</div>
        <div>${content.version}</div>
        ${
          content.links?.length
            ? `<nav class="site-footer__links" aria-label="${content.linksLabel || "Footer links"}">
                <ul class="site-footer__links-list">
                  ${content.links.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join("")}
                </ul>
              </nav>`
            : ""
        }
      </div>
    </footer>
  `;
}
