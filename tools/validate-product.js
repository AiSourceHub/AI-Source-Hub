#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const defaultTargets = [
  "products/template",
  "products/business/idea-validator",
];

const productTargets = process.argv.slice(2);
const targets = productTargets.length ? productTargets : defaultTargets;

const productRequiredFiles = [
  "config.js",
  "metadata.js",
  "prompts.js",
  "questions.js",
  "analyzer.js",
  "scoring.js",
  "recommendations.js",
  "report.js",
];

const templateOnlyFiles = [
  "ProductPage.jsx",
  "ResultPage.jsx",
];

const contentChecks = [
  {
    label: "Metadata exists",
    file: "metadata.js",
    patterns: [/metadata|productMetadataTemplate/],
  },
  {
    label: "Questions exist",
    file: "questions.js",
    patterns: [/inputSchema|questionTemplate|questions/],
  },
  {
    label: "Analyzer exists",
    file: "analyzer.js",
    patterns: [/analyze|Analyzer/],
  },
  {
    label: "Scoring exists",
    file: "scoring.js",
    patterns: [/score|Scoring/i],
  },
  {
    label: "Recommendations exist",
    file: "recommendations.js",
    patterns: [/recommend|Recommendation/i],
  },
  {
    label: "Report exists",
    file: "report.js",
    patterns: [/report|Report/i],
  },
];

const reports = targets.map(validateTarget);
printReports(reports);

if (reports.some((report) => !report.valid)) {
  process.exitCode = 1;
}

function validateTarget(target) {
  const targetPath = path.resolve(rootDir, target);
  const relativeTarget = path.relative(rootDir, targetPath);
  const checks = [];

  if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
    return {
      target: relativeTarget,
      valid: false,
      checks: [
        {
          label: "Product folder exists",
          ok: false,
          detail: "Folder was not found.",
        },
      ],
    };
  }

  checks.push({
    label: "Product folder exists",
    ok: true,
    detail: "Folder found.",
  });

  const requiredFiles = isTemplateTarget(relativeTarget)
    ? [...productRequiredFiles, ...templateOnlyFiles]
    : productRequiredFiles;

  requiredFiles.forEach((fileName) => {
    const exists = fs.existsSync(path.join(targetPath, fileName));
    checks.push({
      label: `Required file: ${fileName}`,
      ok: exists,
      detail: exists ? "Found." : "Missing.",
    });
  });

  contentChecks.forEach((check) => {
    checks.push(validateContentCheck(targetPath, check));
  });

  return {
    target: relativeTarget,
    valid: checks.every((check) => check.ok),
    checks,
  };
}

function validateContentCheck(targetPath, check) {
  const filePath = path.join(targetPath, check.file);

  if (!fs.existsSync(filePath)) {
    return {
      label: check.label,
      ok: false,
      detail: `${check.file} is missing.`,
    };
  }

  const fileText = fs.readFileSync(filePath, "utf8");
  const ok = check.patterns.some((pattern) => pattern.test(fileText));

  return {
    label: check.label,
    ok,
    detail: ok ? "Found expected module content." : `Expected content was not found in ${check.file}.`,
  };
}

function isTemplateTarget(target) {
  return target.replace(/\\/g, "/") === "products/template";
}

function printReports(reports) {
  console.log("AI Source Hub Product Validation");
  console.log("");

  reports.forEach((report) => {
    console.log(`${report.valid ? "PASS" : "FAIL"} ${report.target}`);

    report.checks.forEach((check) => {
      console.log(`  ${check.ok ? "[ok]" : "[missing]"} ${check.label} - ${check.detail}`);
    });

    console.log("");
  });
}
