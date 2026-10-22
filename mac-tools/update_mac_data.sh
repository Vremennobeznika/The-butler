#!/bin/bash
set -euo pipefail
if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then echo 'Использование: ./update_mac_data.sh /путь/к/новой-копии.json'; exit 1; fi
mkdir -p "$HOME/Library/Application Support/LocalLifeCats"
cp "$1" "$HOME/Library/Application Support/LocalLifeCats/schedule.json"
echo 'Локальное расписание на Mac обновлено.'
