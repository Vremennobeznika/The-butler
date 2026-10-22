#!/bin/bash
set -euo pipefail
PLIST="$HOME/Library/LaunchAgents/local.life.cats.reminders.plist"
if [ -f "$PLIST" ]; then launchctl bootout "gui/$(id -u)" "$PLIST" >/dev/null 2>&1 || true; rm "$PLIST"; fi
echo 'Фоновый помощник отключён. Его локальные данные можно удалить из ~/Library/Application Support/LocalLifeCats.'
