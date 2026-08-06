#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";
import { productRegistry } from "../core/productRegistry.js";
import {
  PRODUCT_LOCALIZATION_CONTRACT,
  getNestedValue,
  hasLocalizedValue,
} from "../core/localization.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const languages = ["en", "ar"];
const approvedArabicFragments = ["AI Source Hub", "Business Idea Validator", "MVP"];
const englishFallbackFragments = [
  "Status",
  "Form steps",
  "Assessment report",
  "Overall score",
  "Market potential",
  "Execution difficulty",
  "Competition level",
  "Main risks",
  "Key strengths",
  "Recommended next action",
  "Business name",
  "Industry",
  "Target customer",
  "Problem solved",
  "Current solution",
  "Competitive advantage",
  "Revenue model",
  "Previous",
  "Next",
  "Validate idea",
  "Copy Report",
  "Download Report",
  "Start Again",
  "Open product",
  "Coming soon",
];

const reports = [];

for (const product of productRegistry.filter((item) => item.route && item.route !== "#")) {
  reports.push(await validateProduct(product));
}

reports.push(validateSharedLanguageSwitching());

printReports(reports);

if (reports.some((report) => !report.valid)) {
  process.exitCode = 1;
}

async function validateProduct(product) {
  const checks = [];
  const productDir = getProductDir(product);
  const configModule = await importModule(path.join(productDir, "config.js"));
  const questionsModule = await importModule(path.join(productDir, "questions.js"));
  const contentByLanguage = await loadProductContent(productDir);
  const config = configModule.productConfig || configModule.default || product;
  const inputSchema = questionsModule.inputSchema || questionsModule.default?.inputSchema || [];

  PRODUCT_LOCALIZATION_CONTRACT.metadata.forEach((key) => {
    languages.forEach((language) => {
      checks.push({
        label: `${key}.${language}`,
        ok: hasLocalizedValue(config[key] || product[key], language),
        detail: "Product metadata must include Arabic and English values.",
      });
    });
  });

  languages.forEach((language) => {
    const content = contentByLanguage[language];
    checks.push({
      label: `content.${language}`,
      ok: Boolean(content),
      detail: "Product content resource found.",
    });

    if (!content) return;

    PRODUCT_LOCALIZATION_CONTRACT.content.forEach((keyPath) => {
      checks.push({
        label: `${language}.${keyPath}`,
        ok: hasText(getNestedValue(content, keyPath)),
        detail: "Required localized product interface key.",
      });
    });

    checks.push({
      label: `${language}.direction`,
      ok: language === "ar" ? content.direction === "rtl" : content.direction === "ltr",
      detail: "Arabic must be RTL and English must be LTR.",
    });
  });

  inputSchema.forEach((field) => {
    PRODUCT_LOCALIZATION_CONTRACT.formField.forEach((key) => {
      languages.forEach((language) => {
        checks.push({
          label: `${field.id}.${key}.${language}`,
          ok: hasLocalizedValue(field[key], language),
          detail: "Every product field must include bilingual labels and validation messages.",
        });
      });
    });

    if (field.placeholder) {
      languages.forEach((language) => checks.push({
        label: `${field.id}.placeholder.${language}`,
        ok: hasLocalizedValue(field.placeholder, language),
        detail: "Field placeholders must be bilingual when provided.",
      }));
    }

    if (field.helpText) {
      languages.forEach((language) => checks.push({
        label: `${field.id}.helpText.${language}`,
        ok: hasLocalizedValue(field.helpText, language),
        detail: "Field help text must be bilingual when provided.",
      }));
    }

    if (field.options) {
      field.options.forEach((option) => {
        languages.forEach((language) => checks.push({
          label: `${field.id}.${option.value}.label.${language}`,
          ok: hasLocalizedValue(option.label, language),
          detail: "Choice labels must be bilingual.",
        }));
      });
    }
  });

  const arabicText = collectStringValues(contentByLanguage.ar || {}).join("\n");
  englishFallbackFragments
    .filter((fragment) => !approvedArabicFragments.includes(fragment))
    .forEach((fragment) => {
      checks.push({
        label: `ar.noFallback.${fragment}`,
        ok: !arabicText.includes(fragment),
        detail: "Arabic content should not include English fallback interface text.",
      });
    });

  return {
    target: product.id,
    valid: checks.every((check) => check.ok),
    checks,
  };
}

function validateSharedLanguageSwitching() {
  const files = [
    "src/App.jsx",
    "src/pages/HomePage.jsx",
    "src/pages/ProductPage.jsx",
    "src/pages/BusinessIdeaValidatorPage.jsx",
    "pages/Home/app.js",
    "products/business/idea-validator/index.js",
    "products/startup-risk-scanner/index.js",
    "components/LanguageSwitcher/index.js",
    "components/Header/index.js",
  ];
  const checks = files.map((file) => {
    const text = fs.readFileSync(path.join(rootDir, file), "utf8");
    return {
      label: `${file}.noReloadSwitch`,
      ok: !/location\.reload|window\.location\.reload/.test(text),
      detail: "Language switching must not reload or redirect product pages.",
    };
  });

  const sharedText = fs.readFileSync(path.join(rootDir, "core/localization.js"), "utf8");
  checks.push({
    label: "core.localization.contract",
    ok: sharedText.includes("PRODUCT_LOCALIZATION_CONTRACT") && sharedText.includes("bindLanguageSwitcher"),
    detail: "Shared localization contract and route-preserving switcher must exist.",
  });

  return {
    target: "shared-language-switching",
    valid: checks.every((check) => check.ok),
    checks,
  };
}

async function loadProductContent(productDir) {
  const contentFiles = {
    en: path.join(productDir, "content.en.js"),
    ar: path.join(productDir, "content.ar.js"),
  };

  if (fs.existsSync(contentFiles.en) && fs.existsSync(contentFiles.ar)) {
    const [enModule, arModule] = await Promise.all([
      importModule(contentFiles.en),
      importModule(contentFiles.ar),
    ]);

    return {
      en: enModule.contentEn || enModule.default,
      ar: arModule.contentAr || arModule.default,
    };
  }

  const metadataPath = path.join(productDir, "metadata.js");
  if (fs.existsSync(metadataPath)) {
    const metadataModule = await importModule(metadataPath);
    if (metadataModule.content?.en && metadataModule.content?.ar) {
      return metadataModule.content;
    }
  }

  return {};
}

function getProductDir(product) {
  const route = product.route.replace(/\\/g, "/").replace(/\/index\.html$/, "");
  return path.resolve(rootDir, route);
}

async function importModule(filePath) {
  return import(`${pathToFileURL(filePath).href}?v=${Date.now()}`);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function collectStringValues(source) {
  if (typeof source === "string") return [source];
  if (Array.isArray(source)) return source.flatMap(collectStringValues);
  if (!source || typeof source !== "object") return [];
  return Object.values(source).flatMap(collectStringValues);
}

function printReports(reports) {
  console.log("AI Source Hub Localization Validation");
  console.log("");

  reports.forEach((report) => {
    console.log(`${report.valid ? "PASS" : "FAIL"} ${report.target}`);
    report.checks.forEach((check) => {
      console.log(`  ${check.ok ? "[ok]" : "[fail]"} ${check.label} - ${check.detail}`);
    });
    console.log("");
  });
}
