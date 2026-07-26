export function ProductPage({ layout, content, language, form, resultSlot }) {
  return layout({
    content,
    language,
    main: `
      <div class="product-workspace">
        ${form}
        ${resultSlot}
      </div>
    `,
  });
}

export default ProductPage;

