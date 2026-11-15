#!/usr/bin/env bash
# Installs the freshly built APK on the emulator and walks every screen with Maestro.
# Results (screenshots, logs, crash lines) go to ci-results/.
set -u
OUT=ci-results
mkdir -p "$OUT/shots"
APK=android/app/build/outputs/apk/release/app-release.apk

adb install -r "$APK" > "$OUT/install.txt" 2>&1
echo "install exit=$?" >> "$OUT/summary.txt"
adb logcat -c
touch "$OUT/.start"

run_flow() {
  local name=$1; shift
  echo "=== $name"
  maestro test "$@" "ci/maestro/$name.yaml" > "$OUT/$name.log" 2>&1
  local code=$?
  echo "$name exit=$code" | tee -a "$OUT/summary.txt"
  if [ "$name" != "06_ai" ]; then
    adb exec-out screencap -p > "$OUT/shots/${name}_end.png" 2>/dev/null
    adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1 && adb pull /sdcard/ui.xml "$OUT/${name}_end.xml" > /dev/null 2>&1
  fi
}

for f in 01_tabs 02_conversation 03_words 04_listening 05_settings; do
  run_flow "$f"
done

if [ -n "${API_KEY:-}" ]; then
  run_flow 06_ai -e "API_KEY=$API_KEY"
else
  echo "06_ai skipped (no API key secret)" | tee -a "$OUT/summary.txt"
fi

adb logcat -d > "$OUT/logcat.txt" 2>&1
grep -nE "FATAL EXCEPTION|AndroidRuntime: |ReactNativeJS|ExceptionsManager|com.yaufan.englishpractice.*(crash|Crash|died)" "$OUT/logcat.txt" > "$OUT/logcat-errors.txt" || true
# never keep anything that could contain the key
grep -v "sk-ant" "$OUT/logcat.txt" > "$OUT/logcat.tmp" && mv "$OUT/logcat.tmp" "$OUT/logcat.txt"
find . -path ./node_modules -prune -o -path "./$OUT" -prune -o -name "*.png" -newer "$OUT/.start" -print | while read -r f; do mv "$f" "$OUT/shots/"; done
rm -f "$OUT/.start"
ls -la "$OUT" "$OUT/shots"
exit 0
