const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const [script, ...args] = process.argv.slice(2);
const allowedScripts = new Set([
  "scripts/sync_bigquery_raw.py",
  "scripts/sync_hsect_raw.py",
]);

if (!allowedScripts.has(script)) {
  console.error("Specify a supported integration script.");
  process.exit(2);
}

const root = path.resolve(__dirname, "..");
const vmPython = path.join(root, ".venv", "bin", "python");
const configuredPython = process.env.PYTHON_BIN ||
  (process.platform !== "win32" && fs.existsSync(vmPython) ? vmPython : null);
const command = configuredPython || (process.platform === "win32" ? "py" : "python3");
const commandArgs = !configuredPython && process.platform === "win32" ? ["-3"] : [];
const result = spawnSync(command, [...commandArgs, path.join(root, script), ...args], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
