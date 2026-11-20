import { assertViteTarget } from "./env/assert-vite-target.mjs";

try {
  assertViteTarget("staging");
  console.log("[staging:guard] PASS: registered staging target and public key only");
} catch (error) {
  console.error(`[staging:guard] FAIL: ${error.message}`);
  process.exitCode = 1;
}
