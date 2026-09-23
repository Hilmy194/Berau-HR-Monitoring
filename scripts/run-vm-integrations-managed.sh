#!/usr/bin/env bash
set -u
umask 077

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
state_dir="${INTEGRATION_STATE_DIR:-$repo_root/runtime/integration-sync}"
trigger="${1:-scheduled}"
[[ "$trigger" == "manual" ]] || trigger="scheduled"

mkdir -p "$state_dir"
exec 9>"$state_dir/sync.lock"
if ! flock -n 9; then
  exit 75
fi

write_state() {
  local status="$1"
  local started="$2"
  local finished="$3"
  local exit_code="$4"
  local temporary="$state_dir/status.json.tmp.$$"
  printf '{"status":"%s","trigger":"%s","startedAt":"%s","finishedAt":%s,"exitCode":%s,"pid":%s}\n' \
    "$status" "$trigger" "$started" "$finished" "$exit_code" "$$" > "$temporary"
  mv -f "$temporary" "$state_dir/status.json"
}

started_at="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
write_state "running" "$started_at" "null" "null"

log_file="$state_dir/sync-$(date -u +'%Y%m%dT%H%M%SZ').log"
/usr/bin/bash "$repo_root/scripts/run-vm-integrations.sh" >> "$log_file" 2>&1
exit_code=$?
finished_at="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

if [[ $exit_code -eq 0 ]]; then
  write_state "success" "$started_at" "\"$finished_at\"" "$exit_code"
else
  write_state "failed" "$started_at" "\"$finished_at\"" "$exit_code"
fi
exit "$exit_code"
