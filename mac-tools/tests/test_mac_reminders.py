import datetime as dt
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

HERE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('mac_reminders', HERE/'mac_reminders.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def backup():
    return {
        'sections':[{'id':'food','visible':True},{'id':'cat','visible':False},{'id':'shop','visible':True}],
        'tasks':[{'id':'lunch','sectionId':'food','title':'Обед','time':'13:00','days':list(range(7)),'remind':True,'active':True},
                 {'id':'one','sectionId':'food','title':'Врач','time':'13:00','days':[],'oneOffDate':'2026-10-23','remind':True,'active':True},
                 {'id':'invisible','sectionId':'cat','title':'Корм','time':'13:00','days':list(range(7)),'remind':True,'active':True}],
        'shopping':[{'id':'milk','sectionId':'shop','title':'Молоко','time':'13:00','remind':True,'done':False}],
        'completions':{},'preferences':{'quietStart':'23:00','quietEnd':'07:00'}
    }

class HelperTests(unittest.TestCase):
    def test_mac_repeats_and_one_off(self):
        names={e['id'] for e in mod.due(backup(),dt.datetime(2026,10,23,13,0))}
        self.assertEqual(names,{'lunch','one','milk'})
        names={e['id'] for e in mod.due(backup(),dt.datetime(2026,10,22,13,0))}
        self.assertEqual(names,{'lunch','milk'})

    def test_legacy_one_off_date(self):
        data=backup();data['tasks'][1].pop('oneOffDate');data['tasks'][1]['date']='2026-10-23'
        ids={x['id'] for x in mod.due(data,dt.datetime(2026,10,23,13,0))}
        self.assertIn('one',ids)
        ids={x['id'] for x in mod.due(data,dt.datetime(2026,10,22,13,0))}
        self.assertNotIn('one',ids)

    def test_completed_and_disabled_are_suppressed(self):
        b=backup();b['completions']['2026-10-23::lunch']=True;b['shopping'][0]['done']=True;b['tasks'][1]['remind']=False
        self.assertFalse(mod.due(b,dt.datetime(2026,10,23,13,0)))

    def test_pause_mutes_mac(self):
        b=backup()
        b['preferences']['pauseUntil']=dt.datetime(2026,10,23,14,0).timestamp()*1000
        self.assertFalse(mod.due(b,dt.datetime(2026,10,23,13,0)))

    def test_late_wake_grace(self):
        self.assertEqual(len(mod.due(backup(),dt.datetime(2026,10,23,13,40))),3)
        self.assertFalse(mod.due(backup(),dt.datetime(2026,10,23,14,1)))

    def test_quiet_hours_by_actual_delivery_time(self):
        b=backup();b['preferences']={'quietStart':'13:10','quietEnd':'14:00'}
        self.assertFalse(mod.due(b,dt.datetime(2026,10,23,13,40)))
        self.assertTrue(mod.due(b,dt.datetime(2026,10,23,13,5)))

    def test_target_url_keeps_existing_query_and_escapes_id(self):
        target=mod.target_url('https://example.test/app/?x=a&item=old#top',{'type':'task','id':'a b'})
        q=parse_qs(urlsplit(target).query)
        self.assertEqual(q,{'x':['a'],'item':['task:a b']})

    def test_invalid_backup_not_accepted(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'backup.json';p.write_text(json.dumps({'format':'other','data':{}}))
            with self.assertRaises(ValueError):mod.read_backup(p)

    def test_read_valid_local_export(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'backup.json';p.write_text(json.dumps({'format':'local-life-v2','data':backup()}),encoding='utf-8')
            self.assertEqual(mod.read_backup(p)['tasks'][0]['id'],'lunch')

if __name__=='__main__': unittest.main()
