import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../../../src/App.jsx", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../../../src/pages/BusinessIdeaValidatorRoute.jsx", import.meta.url), "utf8");
const prototypeSource = readFileSync(new URL("../../../src/pages/BusinessIdeaDiscoveryPrototypePage.jsx", import.meta.url), "utf8");
const productionBivSource = readFileSync(new URL("../../../src/pages/BusinessIdeaValidatorPage.jsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../../../src/pages/HomePage.jsx", import.meta.url), "utf8");

assert.equal(appSource.includes("VITE_BIV_GUIDED_DISCOVERY_CANDIDATE === 'true'"), true);
assert.equal(appSource.includes("const enableGuidedDiscoveryCandidate ="), true);
assert.equal(routeSource.includes("candidateEnabled = false"), true);
assert.equal(routeSource.includes("if (candidateEnabled && CandidatePage)"), true);
assert.equal(routeSource.includes("<BusinessIdeaValidatorPage"), true);
assert.equal(routeSource.includes("<CandidatePage"), true);
assert.equal(routeSource.includes("allowUrlSemanticControls={false}"), true);
assert.equal(routeSource.includes("import.meta.env.DEV"), false);
assert.equal(routeSource.includes("VITE_BIV_GUIDED_DISCOVERY_CANDIDATE"), false);

assert.equal(appSource.split('path="/products/business-idea-validator"').length - 1, 1);
assert.equal(homeSource.includes("#/products/business-idea-validator"), true);
assert.equal(homeSource.includes("#/dev/biv-guided-discovery"), false);
assert.equal(appSource.includes("INTENT_DISCOVERY_ROUTE"), true);
assert.equal(appSource.includes("enableDevelopmentRoutes"), true);
assert.equal(appSource.includes("enableDevelopmentRoutes && BusinessIdeaDiscoveryCandidatePage"), true);
assert.equal(appSource.includes("enableGuidedDiscoveryCandidate"), true);

assert.equal(appSource.includes("BusinessIdeaDiscoveryCandidatePage"), true);
assert.equal(appSource.includes("lazy(() => import('./pages/BusinessIdeaDiscoveryPrototypePage.jsx'))"), true);
assert.equal(prototypeSource.includes("executeBusinessIdeaValidation"), true);
assert.equal(prototypeSource.includes("adaptGuidedDiscoveryHandoffToBiv"), true);
assert.equal(prototypeSource.includes("LocalBivExecutionPanel"), true);
assert.equal(prototypeSource.includes("allowUrlSemanticControls = true"), true);
assert.equal(prototypeSource.includes("allowUrlSemanticControls ? semanticParams.get('semanticScenario')"), true);
assert.equal(prototypeSource.includes("allowUrlSemanticControls ? semanticParams.get('lang')"), true);
assert.equal(productionBivSource.includes("BusinessIdeaDiscoveryPrototypePage"), false);

for (const source of [appSource, routeSource]) {
  assert.equal(/OPENAI_API_KEY|VITE_OPENAI_API_KEY|BIV_SEMANTIC_SHADOW_ENABLED/.test(source), false);
}

console.log("BIV route candidate gate tests: PASS");
