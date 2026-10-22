/* Optional daily cockpit. Uses the existing local planner state; no accounts or telemetry. */
(()=>{'use strict';
const host=window.ButlerHost,M=window.LifeModel;
if(!host||!M)return;
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const press=(title,fn,cls='')=>{const b=node('button',cls,title);b.type='button';b.addEventListener('click',fn);return b};
const dateOf=d=>M.localDate(d);
const two=n=>String(n).padStart(2,'0');
const clock=d=>two(d.getHours())+':'+two(d.getMinutes());
function state(){return host.getState()}
function inbox(){const s=state();let section=s.sections.find(x=>x.id==='inbox'&&x.type==='routine');if(!section){section={id:'inbox',title:'Разовые дела',type:'routine',visible:true};s.sections.push(section)}return section}
function addOneOff(title,when,remind=true){title=title.trim().slice(0,120);if(!title||!(when instanceof Date)||Number.isNaN(when.getTime()))return false;
const s=state(),section=inbox();s.tasks.push({id:M.uid(),sectionId:section.id,title,time:clock(when),oneOffDate:dateOf(when),days:[0,1,2,3,4,5,6],remind,active:true,essential:false,note:''});host.save();host.render();render();return true}
function applyPause(ms){state().preferences.pauseUntil=ms?Date.now()+ms:0;host.save();render();host.notice(ms?'Напоминания временно приостановлены.':'Напоминания возобновлены.')}
function alertCard(){const mount=node('section','cockpit settings-card');mount.id='butlerCockpit';mount.setAttribute('aria-label','Сегодня: важное');
mount.innerHTML='<div class="settings-head"><h3>Сегодня без перегруза</h3><small>Главное · только выбранные пункты</small></div><div id="butlerTodaySummary" class="hint" aria-live="polite"></div><div id="butlerEssentials" class="butler-essentials"></div><div class="settings-head gap-top"><h3>Добавить одно дело</h3><small>Не повторяется каждую неделю</small></div><form id="butlerQuickForm" class="butler-quick form-flex"><label class="grow">Что сделать<input id="butlerQuickTitle" required maxlength="120" placeholder="Например, забрать заказ"></label><label>Дата<input id="butlerQuickDate" required type="date"></label><label>Время<input id="butlerQuickTime" required type="time"></label><label class="check-line compact"><input id="butlerQuickRemind" type="checkbox" checked> Напомнить</label><button class="primary" type="submit">Добавить</button></form><div class="butler-shortcuts" id="butlerShortcuts"></div>';
const target=$('page-week');const ref=target?.querySelector('.progress-line');if(target&&ref)ref.insertAdjacentElement('afterend',mount);else target?.append(mount);
$('butlerQuickDate').value=dateOf(new Date());$('butlerQuickTime').value=clock(new Date(Date.now()+30*60000));
$('butlerQuickForm').addEventListener('submit',e=>{e.preventDefault();const date=$('butlerQuickDate').value,time=$('butlerQuickTime').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!M.validTime(time)){host.notice('Проверь дату и время.');return}const when=new Date(date+'T'+time+':00');if(dateOf(when)!==date){host.notice('Недопустимая дата.');return}if(addOneOff($('butlerQuickTitle').value,when,$('butlerQuickRemind').checked)){$('butlerQuickTitle').value='';host.notice('Разовое дело добавлено.')}});
const buttons=$('butlerShortcuts');buttons.append(press('Перекус через 15 минут',()=>{if(addOneOff('Сделать паузу и поесть',new Date(Date.now()+15*60000)))host.notice('Напоминание о еде добавлено.')},'subtle'),press('Перерыв через 10 минут',()=>{if(addOneOff('Остановиться и отойти от экрана',new Date(Date.now()+10*60000)))host.notice('Перерыв добавлен.')},'subtle'));
}
function settingsCard(){const div=node('section','settings-card');div.id='butlerPauseCard';div.innerHTML='<div class="settings-head"><h3>Пауза для уведомлений</h3><small>Без удаления расписания и без чувства долга</small></div><p class="note">Приостановить сигналы на время работы, сна или отдыха. Уже отмеченные дела не сбрасываются. Пауза применяется к открытому приложению и к новой JSON-копии для Mac.</p><div id="butlerPauseStatus" class="hint" role="status"></div><div class="actions" id="butlerPauseActions"></div><p class="note">Браузерная версия не умеет будить закрытый iPhone или насильно открывать вкладку. Для автономных напоминаний используйте экспорт .ics; Mac-помощник читает последнюю экспортированную копию.</p>';
$('page-settings')?.append(div);
const buttons=$('butlerPauseActions');buttons.append(press('На 1 час',()=>applyPause(60*60000)),press('На 3 часа',()=>applyPause(3*60*60000)),press('На 12 часов',()=>applyPause(12*60*60000)),press('Снять паузу',()=>applyPause(0),'subtle'));
}
function render(){const current=state();if(!current||!$('butlerTodaySummary'))return;const now=new Date(),day=dateOf(now),visible=new Set(current.sections.filter(s=>s.visible&&s.type==='routine').map(s=>s.id));
const active=current.tasks.filter(t=>visible.has(t.sectionId)&&M.taskOccurs(t,now));const completed=t=>!!current.completions[day+'::'+t.id];const pending=active.filter(t=>!completed(t));const essentials=pending.filter(t=>t.essential).sort((a,b)=>a.time.localeCompare(b.time));const done=active.length-pending.length;
const earlier=pending.filter(t=>t.time<clock(now));const next=pending.filter(t=>t.time>=clock(now)).sort((a,b)=>a.time.localeCompare(b.time))[0];
$('butlerTodaySummary').textContent='Сегодня отмечено '+done+' из '+active.length+'. '+(earlier.length?'Есть '+earlier.length+' неотмеченных пунктов — можно вернуться к ним позже. ':'Нет накопившихся пунктов. ')+(next?'Следующее: '+next.time+' · '+next.title+'.':'');
const list=$('butlerEssentials');list.replaceChildren();if(!essentials.length){list.append(node('p','hint','Главные пункты на сегодня отмечены или пока не выбраны. Метку «Главное» можно поставить в настройках каждого пункта.'))}else{
for(const t of essentials.slice(0,8)){const item=node('div','butler-essential'),time=node('span','time',t.time),name=node('span','butler-essential-name',t.title),button=press('Готово',()=>{current.completions[day+'::'+t.id]=true;host.save();host.render();render()},'subtle');button.setAttribute('aria-label','Отметить выполненным: '+t.title);item.append(time,name,button);list.append(item)}if(essentials.length>8)list.append(node('p','hint','Ещё '+(essentials.length-8)+' пунктов — в недельном списке.'));}
const until=Number(current.preferences.pauseUntil)||0;const text=until>Date.now()?'Пауза активна до '+new Date(until).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Напоминания работают по индивидуальным переключателям.';if($('butlerPauseStatus'))$('butlerPauseStatus').textContent=text;
}
function init(){if(!$('page-week')||!$('page-settings'))return;alertCard();settingsCard();render();setInterval(render,60000);window.addEventListener('storage',render);}
window.ButlerExtras={refresh:render};init();
})();
