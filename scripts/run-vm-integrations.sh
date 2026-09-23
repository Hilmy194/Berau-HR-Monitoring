#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_env_file="${APP_ENV_FILE:-/etc/hr-monitoring/app.env}"
integration_config_file="${INTEGRATION_CONFIG_FILE:-/etc/hr-monitoring/integrations.env}"
python_bin="${PYTHON_BIN:-$repo_root/.venv/bin/python}"

if [[ ! -r "$app_env_file" || ! -r "$integration_config_file" ]]; then
  echo "App environment or integration configuration is not readable." >&2
  exit 1
fi

# app.env is a trusted shell-compatible KEY=VALUE file owned by the VM operator.
set -a
source "$app_env_file"
set +a

if [[ -z "${DATABASE_URL:-}" || -z "${DIRECT_URL:-}" ]]; then
  echo "DATABASE_URL and DIRECT_URL must be set in app.env." >&2
  exit 1
fi
if grep -Eq '^[[:space:]]*(BQ_RAW_DATABASE_URL|DIRECT_URL|DATABASE_URL)[[:space:]]*=' "$integration_config_file"; then
  echo "Remove database URLs from integrations.env; this VM job uses app.env for all stages." >&2
  exit 1
fi
if [[ ! -x "$python_bin" ]]; then
  echo "Python interpreter not executable: $python_bin" >&2
  exit 1
fi

cd "$repo_root"
echo "Starting BigQuery raw mirror."
"$python_bin" scripts/sync_bigquery_raw.py --config "$integration_config_file"
echo "Starting curated BigQuery HR import."
"$python_bin" scripts/sync_bigquery_hr.py --config "$integration_config_file"
echo "Starting HSE CT import."
"$python_bin" scripts/sync_hsect_raw.py --config "$integration_config_file" --import-db
echo "BigQuery and HSE CT integration completed."
