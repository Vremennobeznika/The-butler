#!/usr/bin/env python3
"""Optional macOS local helper. Reads an exported JSON snapshot; no networking.
launchd calls this once per minute. Opens the registered app URL in Safari.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl

DAY_NAMES=['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

def valid_time(value):
    try:
        hh,mm=map(int,value.split(':'))
        return 0<=hh<24 and 0<=mm<60 and len(value)==5
    except (TypeError,ValueError,AttributeError):
        return False

def quiet(time,start,end):
    if not valid_time(start) or not valid_time(end) or start==end:
        return False
    return (start<=time<end) if start<end else (time>=start or time<end)

def read_backup(path):
    if path.stat().st_size>6*1024*1024:
        raise ValueError('Файл больше 6 МБ')
    envelope=json.loads(path.read_text('utf-8'))
    if not isinstance(envelope,dict) or envelope.get('format')!='local-life-v2':
        raise ValueError('Нужна JSON-копия из приложения, а не произвольный файл')
    data=envelope.get('data')
    if not isinstance(data,dict) or not isinstance(data.get('tasks'),list):
        raise ValueError('Неверная структура расписания')
    return data

def due(data,now):
    section_ids={str(s.get('id')) for s in data.get('sections',[]) if isinstance(s,dict) and s.get('visible',True)}
    if float((data.get('preferences') or {}).get('pauseUntil') or 0)>now.timestamp()*1000:
        return []
    date=now.strftime('%Y-%m-%d'); weekday=now.weekday(); found=[]
    completed=data.get('completions',{}) or {}
    pref=data.get('preferences',{}) or {}
    for item in data.get('tasks',[]):
        if not isinstance(item,dict) or not item.get('remind') or item.get('active') is False or str(item.get('sectionId')) not in section_ids or ((item.get('oneOffDate') or item.get('date'))!=date if (item.get('oneOffDate') or item.get('date')) else weekday not in item.get('days',[])):
            continue
        time=item.get('time')
        if not valid_time(time) or quiet(now.strftime('%H:%M'),pref.get('quietStart','23:00'),pref.get('quietEnd','07:00')):
            continue
        hour,minute=map(int,time.split(':')); planned=now.replace(hour=hour,minute=minute,second=0,microsecond=0)
        if 0<=(now-planned).total_seconds()<=3600 and not completed.get(f"{date}::{item.get('id')}"):
            found.append({'id':str(item.get('id','')),'type':'task','title':str(item.get('title','Дело'))[:120],'time':time,'key':f"{date}::task::{item.get('id')}"})
    for item in data.get('shopping',[]):
        if not isinstance(item,dict) or not item.get('remind') or item.get('done') or str(item.get('sectionId')) not in section_ids:
            continue
        time=item.get('time')
        if not valid_time(time) or quiet(now.strftime('%H:%M'),pref.get('quietStart','23:00'),pref.get('quietEnd','07:00')):
            continue
        hour,minute=map(int,time.split(':'));planned=now.replace(hour=hour,minute=minute,second=0,microsecond=0)
        if 0<=(now-planned).total_seconds()<=3600:
            found.append({'id':str(item.get('id','')),'type':'shopping','title':str(item.get('title','Покупка'))[:120],'time':time,'key':f"{date}::shopping::{item.get('id')}"})
    return found

def read_state(path):
    try:
        obj=json.loads(path.read_text('utf-8'))
        if isinstance(obj,dict):return obj
    except (OSError,ValueError):pass
    return {}

def target_url(base,item):
    parts=urlsplit(base)
    if parts.scheme not in ('https','http','file'):
        raise ValueError('Разрешены только https://, http:// и file:// адреса')
    return urlunsplit((parts.scheme,parts.netloc,parts.path,urlencode([*[(k,v) for k,v in parse_qsl(parts.query) if k!='item'],('item',item['type']+':'+item['id'])]),parts.fragment))

def run(args):
    now=dt.datetime.fromisoformat(args.now) if args.now else dt.datetime.now()
    backup=read_backup(Path(args.data).expanduser())
    existing=read_state(Path(args.state).expanduser())
    candidates=[item for item in due(backup,now) if item['key'] not in existing]
    if args.dry_run:
        print(json.dumps({'when':now.isoformat(),'due':candidates},ensure_ascii=False))
        return 0
    if not candidates:
        return 0
    # Open only one Safari window per minute, to avoid multiplying tabs.
    target=target_url(args.url,candidates[0])
    subprocess.run(['/usr/bin/open','-a','Safari',target],check=True)
    subprocess.run(['/usr/bin/osascript','-e','tell application "Safari" to activate'],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    for item in candidates:
        # Notification body is local; only the already-opened first item opens a tab.
        subprocess.run(['/usr/bin/osascript','-e',f'display notification {json.dumps(item["title"])} with title "МОЯ НЕДЕЛЯ"'],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        existing[item['key']]=True
    cutoff=(now-dt.timedelta(days=40)).strftime('%Y-%m-%d')
    existing={k:v for k,v in existing.items() if k[:10]>=cutoff}
    path=Path(args.state).expanduser();path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(existing,ensure_ascii=False),encoding='utf-8')
    return 0

def main():
    p=argparse.ArgumentParser(description='Локальные напоминания для Safari на Mac')
    p.add_argument('--data',required=True,help='JSON-экспорт расписания из приложения')
    p.add_argument('--state',required=True,help='Файл отметок уже отправленных напоминаний')
    p.add_argument('--url',required=True,help='Адрес установленного приложения')
    p.add_argument('--now',help='Тестовая дата ISO, например 2026-10-22T13:00')
    p.add_argument('--dry-run',action='store_true',help='Показать кандидатов, не открывая Safari')
    args=p.parse_args()
    try:return run(args)
    except Exception as exc:
        print('Ошибка локального помощника:',exc,file=sys.stderr)
        return 1
if __name__=='__main__':raise SystemExit(main())
