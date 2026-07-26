export const Card = {
  name: "Card",
  variants: ["plain", "interactive", "muted", "warning"],
  radius: "8px",
  supports: ["rtl", "darkMode", "responsive"],
};

export function renderCard(content, className = "") {
  return `
    <article class="card ${className}">
      <div class="card__body">${content}</div>
    </article>
  `;
}
