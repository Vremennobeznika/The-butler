const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../model.js');
const base=()=>M.normalize({sections:[{id:'daily',type:'routine',title:'Быт',visible:true}],tasks:[{id:'one',sectionId:'daily',title:'Разовое дело',time:'13:00',days:[0,1,2,3,4,5,6],oneOffDate:'2026-10-22',active:true,remind:true,essential:true}],completions:{},sent:{},snoozes:{},preferences:{quietStart:'23:00',quietEnd:'07:00',pauseUntil:0}});
test('one-time reminder occurs only on its selected date',()=>{const s=base();assert.equal(M.dueTasks(s,new Date(2026,9,21,13,0)).length,0);assert.equal(M.dueTasks(s,new Date(2026,9,22,13,0)).length,1);assert.equal(M.dueTasks(s,new Date(2026,9,23,13,0)).length,0)});
test('one-off date and essential priority survive JSON normalization',()=>{const s=base();assert.equal(s.tasks[0].oneOffDate,'2026-10-22');assert.equal(s.tasks[0].essential,true);assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(s))),s)});
test('temporary pause suppresses alarms and expires automatically',()=>{const s=base();const now=new Date(2026,9,22,13,0);s.preferences.pauseUntil=now.getTime()+3600000;assert.equal(M.dueTasks(s,now).length,0);s.preferences.pauseUntil=now.getTime()-1000;assert.equal(M.dueTasks(s,now).length,1)});
test('invalid one-off date does not become a valid date',()=>{const s=base();s.tasks[0].oneOffDate='2026-02-31';const result=M.normalize(s);assert.equal(result.tasks[0].oneOffDate,'')});
test('calendar export respects one-off dates',()=>{const s=base();const ics=M.icsExport(s,new Date(2026,9,21,12),3);assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,1)});
