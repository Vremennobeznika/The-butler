#!/bin/bash
# Run locally on macOS. No network requests; no password needed.
set -euo pipefail
if [ "$#" -ne 2 ]; then echo 'Использование: ./install_mac.sh /путь/к/moya-nedelya.json https://ваш-сайт/планировщик/' ; exit 1; fi
if ! command -v python3 >/dev/null 2>&1; then echo 'Нужен Python 3 на Mac.'; exit 1; fi
ORIGINAL_DATA="$1"; APP_URL="$2"
if [ ! -f "$ORIGINAL_DATA" ]; then echo 'Не найден JSON-файл: '$ORIGINAL_DATA; exit 1; fi
BASE="$HOME/Library/Application Support/LocalLifeCats"; LAUNCH="$HOME/Library/LaunchAgents"; PLIST="$LAUNCH/local.life.cats.reminders.plist"
mkdir -p "$BASE" "$LAUNCH"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/mac_reminders.py" "$BASE/mac_reminders.py"
cp "$ORIGINAL_DATA" "$BASE/schedule.json"
PYTHON="$(command -v python3)"
# macOS plutil safely escapes XML, but here each CLI argument is validated by Python when run.
export BASE PYTHON APP_URL PLIST
python3 - <<'PY'
import os,plistlib
from pathlib import Path
base=os.environ['BASE'];app_url=os.environ['APP_URL']
from urllib.parse import urlsplit
if urlsplit(app_url).scheme not in ('https','http','file'):
 raise SystemExit('Укажите корректный адрес http/https/file')
args=[os.environ['PYTHON'],base+'/mac_reminders.py','--data',base+'/schedule.json','--state',base+'/sent.json','--url',app_url]
plist={'Label':'local.life.cats.reminders','ProgramArguments':args,'StartInterval':60,'RunAtLoad':True,'StandardErrorPath':base+'/helper-errors.log','StandardOutPath':base+'/helper-output.log'}
Path(os.environ['PLIST']).write_bytes(plistlib.dumps(plist))
PY
launchctl bootout "gui/$(id -u)" "$PLIST" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo 'Готово. Mac будет локально проверять экспортированное расписание каждую минуту.'
echo 'После изменений в веб-приложении обнови его JSON-файл через update_mac_data.sh.'
