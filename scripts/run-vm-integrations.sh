#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Resolve app env file
app_env_file="${APP_ENV_FILE:-/etc/hr-monitoring/app.env}"
if [[ ! -r "$app_env_file" ]]; then
  if [[ -r "$repo_root/.env" ]]; then
    app_env_file="$repo_root/.env"
  fi
fi

# Resolve integration config file
integration_config_file="${INTEGRATION_CONFIG_FILE:-/etc/hr-monitoring/integrations.env}"
if [[ ! -r "$integration_config_file" ]]; then
  if [[ -r "$HOME/secure/integrations.env" ]]; then
    integration_config_file="$HOME/secure/integrations.env"
  elif [[ -r "$repo_root/scripts/bq-hr-sync.env" ]]; then
    integration_config_file="$repo_root/scripts/bq-hr-sync.env"
  elif [[ -r "$app_env_file" ]]; then
    integration_config_file="$app_env_file"
  fi
fi

# Resolve Python interpreter
python_bin="${PYTHON_BIN:-$repo_root/.venv/bin/python}"
if [[ ! -x "$python_bin" ]]; then
  if [[ -x "$HOME/hr-monitoring-venv/bin/python" ]]; then
    python_bin="$HOME/hr-monitoring-venv/bin/python"
  elif [[ -x "/usr/bin/python3" ]]; then
    python_bin="/usr/bin/python3"
  else
    python_bin="$(command -v python3 || command -v python || true)"
  fi
fi

if [[ ! -r "$app_env_file" ]]; then
  echo "App environment file ($app_env_file) is not readable." >&2
  exit 1
fi

# app.env is a trusted shell-compatible KEY=VALUE file owned by the VM operator.
set -a
source "$app_env_file"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must be set." >&2
  exit 1
fi

if [[ -z "$python_bin" || ! -x "$python_bin" ]]; then
  echo "Python interpreter not found or not executable: $python_bin" >&2
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
