#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");

const requiredFiles = [
  "README.md",
  "ROADMAP.md",
  "LAUNCH_CHECKLIST.md",
  "DEPLOYMENT_GUIDE.md",
  "CHANGELOG.md",
  "VERSION",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "assets/brand/favicon.svg",
  "assets/brand/app-icon.svg",
  "assets/brand/maskable-icon.svg",
  "assets/brand/social-preview.svg",
  "privacy/index.html",
  "terms/index.html",
  "disclaimer/index.html",
  "contact/index.html",
];

const htmlPages = [
  "pages/Home/index.html",
  "products/business/idea-validator/index.html",
  "products/startup-risk-scanner/index.html",
  "privacy/index.html",
  "terms/index.html",
  "disclaimer/index.html",
  "contact/index.html",
];

const productFolders = [
  "products/startup-risk-scanner",
  "products/business/idea-validator",
  "products/template",
];

const launchBlockers = [
  {
    label: "Production domain placeholder",
    pattern: /your-domain\.example/,
    files: ["robots.txt", "sitemap.xml", ...htmlPages, "DEPLOYMENT_GUIDE.md"],
    resolution: "Replace `https://your-domain.example` with the real production domain.",
  },
  {
    label: "Contact method placeholder",
    pattern: /official support email|official public contact method|real contact method/i,
    files: ["contact/index.html", "README.md", "DEPLOYMENT_GUIDE.md"],
    resolution: "Add the approved public contact method before launch.",
  },
  {
    label: "Legal review placeholder",
    pattern: /qualified counsel|counsel-reviewed|legal pages are reviewed/i,
    files: ["terms/index.html", "README.md", "DEPLOYMENT_GUIDE.md"],
    resolution: "Complete legal review and replace template language where required.",
  },
  {
    label: "Analytics placeholder IDs",
    pattern: /GA_MEASUREMENT_ID|GOOGLE_SEARCH_CONSOLE_TOKEN|MICROSOFT_CLARITY_PROJECT_ID/,
    files: ["config/analytics.js", "DEPLOYMENT_GUIDE.md"],
    resolution: "Keep disabled or replace with approved IDs after privacy and consent are approved.",
  },
];

const report = {
  requiredFiles: requiredFiles.map(checkRequiredFile),
  htmlMetadata: htmlPages.map(checkHtmlMetadata),
  products: productFolders.map(checkProductFolder),
  productionCleanliness: checkProductionCleanliness(),
  launchBlockers: findLaunchBlockers(),
};

printReport(report);

if (!isLaunchReady(report)) {
  process.exitCode = 1;
}

function checkRequiredFile(file) {
  return {
    file,
    ok: fs.existsSync(path.join(rootDir, file)),
  };
}

function checkHtmlMetadata(file) {
  const filePath = path.join(rootDir, file);

  if (!fs.existsSync(filePath)) {
    return { file, ok: false, missing: ["file"] };
  }

  const html = fs.readFileSync(filePath, "utf8");
  const checks = {
    title: /<title>[^<]+<\/title>/.test(html),
    description: /<meta\s+name="description"/.test(html),
    canonical: /rel="canonical"/.test(html),
    robots: /name="robots"/.test(html),
    openGraph: /property="og:title"/.test(html) && /property="og:description"/.test(html),
    twitterCard: /name="twitter:card"/.test(html),
    favicon: /rel="icon"/.test(html),
    manifest: /rel="manifest"/.test(html),
  };

  return {
    file,
    ok: Object.values(checks).every(Boolean),
    checks,
  };
}

function checkProductFolder(folder) {
  const requiredProductFiles = [
    "config.js",
    "metadata.js",
    "prompts.js",
    "questions.js",
    "analyzer.js",
    "scoring.js",
    "recommendations.js",
    "report.js",
  ];
  const requiredTemplateFiles = folder === "products/template" ? ["ProductPage.jsx", "ResultPage.jsx"] : [];
  const checks = [...requiredProductFiles, ...requiredTemplateFiles].map((file) => ({
    file,
    ok: fs.existsSync(path.join(rootDir, folder, file)),
  }));

  return {
    folder,
    ok: checks.every((check) => check.ok),
    checks,
  };
}

function checkProductionCleanliness() {
  const allFiles = listFiles(rootDir);
  const dsStoreFiles = allFiles.filter((file) => file.endsWith(".DS_Store"));
  const debugPattern = new RegExp(["debug", "ger"].join("") + "|" + ["console", "debug"].join("\\."));
  const debugMatches = scanFiles(allFiles, debugPattern);
  const accidentalTracking = scanFiles(allFiles, /gtag\(|clarity\(|googletagmanager\.com|clarity\.ms/);

  return {
    ok: dsStoreFiles.length === 0 && debugMatches.length === 0 && accidentalTracking.length === 0,
    dsStoreFiles,
    debugMatches,
    accidentalTracking,
  };
}

function findLaunchBlockers() {
  return launchBlockers.flatMap((blocker) =>
    blocker.files.flatMap((file) => {
      const filePath = path.join(rootDir, file);

      if (!fs.existsSync(filePath)) {
        return [];
      }

      const text = fs.readFileSync(filePath, "utf8");
      return blocker.pattern.test(text)
        ? [
            {
              label: blocker.label,
              file,
              resolution: blocker.resolution,
            },
          ]
        : [];
    })
  );
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if ([".git", "node_modules"].includes(entry.name)) {
        return [];
      }
      return listFiles(fullPath);
    }

    return [relativePath];
  });
}

function scanFiles(files, pattern) {
  return files.flatMap((file) => {
    const filePath = path.join(rootDir, file);
    const text = fs.readFileSync(filePath, "utf8");

    return pattern.test(text) ? [file] : [];
  });
}

function isLaunchReady(currentReport) {
  return (
    currentReport.requiredFiles.every((check) => check.ok) &&
    currentReport.htmlMetadata.every((check) => check.ok) &&
    currentReport.products.every((check) => check.ok) &&
    currentReport.productionCleanliness.ok &&
    currentReport.launchBlockers.length === 0
  );
}

function printReport(currentReport) {
  console.log("AI Source Hub Launch Validation");
  console.log("");
  printSection("Required files", currentReport.requiredFiles);
  printSection("HTML metadata", currentReport.htmlMetadata);
  printSection("Product folders", currentReport.products);
  printCleanliness(currentReport.productionCleanliness);
  printBlockers(currentReport.launchBlockers);
}

function printSection(title, checks) {
  console.log(title);
  checks.forEach((check) => {
    const label = check.file || check.folder;
    console.log(`  ${check.ok ? "[ok]" : "[fail]"} ${label}`);
  });
  console.log("");
}

function printCleanliness(cleanliness) {
  console.log("Production cleanliness");
  console.log(`  ${cleanliness.ok ? "[ok]" : "[fail]"} No .DS_Store, debug statements, or active tracking snippets`);
  cleanliness.dsStoreFiles.forEach((file) => console.log(`  [fail] .DS_Store: ${file}`));
  cleanliness.debugMatches.forEach((file) => console.log(`  [fail] Debug code: ${file}`));
  cleanliness.accidentalTracking.forEach((file) => console.log(`  [fail] Active tracking snippet: ${file}`));
  console.log("");
}

function printBlockers(blockers) {
  console.log("Launch blockers");

  if (!blockers.length) {
    console.log("  [ok] No unresolved launch blockers found.");
    console.log("");
    return;
  }

  blockers.forEach((blocker) => {
    console.log(`  [fail] ${blocker.label} in ${blocker.file}`);
    console.log(`         ${blocker.resolution}`);
  });
  console.log("");
}
