#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const allowedCategories = new Set([
  "business",
  "ai-productivity",
  "marketing",
  "finance",
  "operations",
]);

const [, , category, slug] = process.argv;
const rootDir = path.resolve(__dirname, "..");
const templateDir = path.join(rootDir, "templates", "new-product");

main();

function main() {
  if (!category || !slug) {
    printUsage();
    process.exit(1);
  }

  validateCategory(category);
  validateSlug(slug);

  const destinationDir = path.join(rootDir, "products", category, slug);

  if (!fs.existsSync(templateDir)) {
    fail("Starter template not found at templates/new-product.");
  }

  if (fs.existsSync(destinationDir)) {
    fail(`Refusing to overwrite existing product folder: ${relative(destinationDir)}`);
  }

  fs.mkdirSync(destinationDir, { recursive: true });
  copyTemplateFiles(templateDir, destinationDir, buildReplacements(category, slug));
  printNextSteps(category, slug, destinationDir);
}

function validateCategory(value) {
  if (!allowedCategories.has(value)) {
    fail(`Invalid category "${value}". Allowed categories: ${Array.from(allowedCategories).join(", ")}`);
  }
}

function validateSlug(value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    fail("Invalid slug. Use lowercase letters, numbers, and single hyphens only.");
  }
}

function copyTemplateFiles(sourceDir, destinationDir, replacements) {
  for (const item of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, item.name);
    const outputName = item.name.replace(".template", "");
    const destinationPath = path.join(destinationDir, outputName);

    if (item.isDirectory()) {
      fs.mkdirSync(destinationPath, { recursive: true });
      copyTemplateFiles(sourcePath, destinationPath, replacements);
      continue;
    }

    const sourceText = fs.readFileSync(sourcePath, "utf8");
    const outputText = replacePlaceholders(sourceText, replacements);
    fs.writeFileSync(destinationPath, outputText, "utf8");
  }
}

function buildReplacements(categoryValue, slugValue) {
  const title = toTitleCase(slugValue);
  const route = `products/${categoryValue}/${slugValue}/index.html`;

  return {
    __PRODUCT_ID__: slugValue,
    __PRODUCT_SLUG__: slugValue,
    __PRODUCT_CATEGORY__: categoryValue,
    __PRODUCT_VERSION__: "0.1.0",
    __PRODUCT_STATUS__: "draft",
    __PRODUCT_TITLE_EN__: title,
    __PRODUCT_TITLE_AR__: "عنوان المنتج",
    __PRODUCT_SHORT_DESCRIPTION_EN__: "Describe the practical result this product creates.",
    __PRODUCT_SHORT_DESCRIPTION_AR__: "صف النتيجة العملية التي يقدمها هذا المنتج.",
    __PRODUCT_LONG_DESCRIPTION_EN__: "Explain the single business problem this product solves.",
    __PRODUCT_LONG_DESCRIPTION_AR__: "اشرح مشكلة العمل الواحدة التي يحلها هذا المنتج.",
    __PRODUCT_ICON__: "Sparkles",
    __ESTIMATED_COMPLETION_TIME__: "10 minutes",
    __AVAILABILITY_LABEL_EN__: "Draft",
    __AVAILABILITY_LABEL_AR__: "مسودة",
    __PRODUCT_ROUTE__: route,
  };
}

function replacePlaceholders(text, replacements) {
  return Object.entries(replacements).reduce((current, [placeholder, value]) => {
    return current.split(placeholder).join(value);
  }, text);
}

function toTitleCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function printUsage() {
  console.log("Usage:");
  console.log("  node tools/create-product.js business startup-risk-scanner");
}

function printNextSteps(categoryValue, slugValue, destinationDir) {
  console.log(`Created ${relative(destinationDir)}`);
  console.log("");
  console.log("Next steps:");
  console.log("1. Replace remaining product placeholders.");
  console.log("2. Edit schema.js for real inputs and outputs.");
  console.log("3. Edit rules.js with isolated product rules.");
  console.log("4. Add Arabic and English copy.");
  console.log("5. Register the product in platform/product-registry.js.");
  console.log(`6. Test products/${categoryValue}/${slugValue} in Arabic, English, mobile, and desktop.`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function relative(absolutePath) {
  return path.relative(rootDir, absolutePath);
}
