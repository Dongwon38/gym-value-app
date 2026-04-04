#!/usr/bin/env bash
# Pick a specific emulator by AVD name (or start it), then run react-native run-android.
# Works with multiple emulators (e.g. tablet always on + phone for this app).
set -euo pipefail

# Exact name from `emulator -list-avds`
TARGET_AVD="${ANDROID_AVD_NAME:-Pixel_7a}"

cd "$(dirname "$0")/.."

emulator_bin() {
  local h="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  if [[ -n "$h" && -x "$h/emulator/emulator" ]]; then
    echo "$h/emulator/emulator"
  elif command -v emulator >/dev/null 2>&1; then
    command -v emulator
  else
    echo ""
  fi
}

avd_exists() {
  local target="$1" line
  while IFS= read -r line; do
    [[ "$line" == "$target" ]] && return 0
  done < <(emulator -list-avds 2>/dev/null || true)
  return 1
}

serial_for_avd() {
  local target="$1"
  local serial name
  while read -r serial _; do
    [[ "$serial" == emulator-* ]] || continue
    name="$(adb -s "$serial" emu avd name 2>/dev/null | head -1 | tr -d '\r\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -n "$name" && "$name" == "$target" ]] && echo "$serial" && return 0
  done < <(adb devices | awk '$2=="device"{print $1}')
  return 1
}

wait_for_avd_boot() {
  local serial="$1"
  local i
  for ((i = 0; i < 90; i++)); do
    if [[ "$(adb -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
      return 0
    fi
    sleep 2
  done
  echo "run-android-avd: timeout waiting for boot on $serial"
  return 1
}

start_avd_if_needed() {
  local target="$1"
  local path

  SERIAL="$(serial_for_avd "$target" || true)"
  [[ -n "${SERIAL:-}" ]] && return 0

  if ! avd_exists "$target"; then
    echo "run-android-avd: no AVD named '$target'. Check \`emulator -list-avds\` or set ANDROID_AVD_NAME."
    exit 1
  fi

  path="$(emulator_bin)"
  if [[ -z "$path" ]]; then
    echo "run-android-avd: emulator binary not found. Set ANDROID_HOME and install Android Emulator."
    exit 1
  fi

  echo "run-android-avd: no running '$target' — starting emulator..."
  "$path" -avd "$target" >/dev/null 2>&1 &

  local attempt
  for ((attempt = 0; attempt < 60; attempt++)); do
    SERIAL="$(serial_for_avd "$target" || true)"
    if [[ -n "${SERIAL:-}" ]]; then
      echo "run-android-avd: waiting for Android boot on $SERIAL..."
      wait_for_avd_boot "$SERIAL"
      return 0
    fi
    if ((attempt > 0 && attempt % 5 == 0)); then
      echo "run-android-avd: still waiting for '$target' to appear in adb..."
    fi
    sleep 2
  done

  echo "run-android-avd: emulator '$target' did not show up in adb in time."
  exit 1
}

start_avd_if_needed "$TARGET_AVD"

export ANDROID_SERIAL="$SERIAL"
echo "run-android-avd: using $SERIAL (AVD $TARGET_AVD)"
# RN CLI ignores ANDROID_SERIAL for install/launch; --device selects the emulator explicitly.
exec npx react-native run-android --device "$SERIAL" "$@"
