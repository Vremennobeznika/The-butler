window.LIFE_CONFIG={
 id:'apple-cats-meals',name:'МОЯ НЕДЕЛЯ',subtitle:'Mac + iPhone · еда, кошки, дела',title:'Планировщик · Mac, iPhone и кошки',
 sections:[
  {id:'food',title:'Поесть',type:'routine',visible:true},{id:'cats',title:'Кошки',type:'routine',visible:true},{id:'work',title:'Работа',type:'routine',visible:true},{id:'home',title:'Быт',type:'routine',visible:true},
  {id:'groceries',title:'Продукты',type:'shopping',visible:true},{id:'cat-shopping',title:'Для кошек',type:'shopping',visible:true},{id:'household',title:'Для дома',type:'shopping',visible:true}
 ],
 tasks:[
  {id:'cat-am',sectionId:'cats',title:'Покормить кошек · утро',time:'08:00',days:[0,1,2,3,4,5,6],remind:true,active:true,note:''},
  {id:'human-breakfast',sectionId:'food',title:'Поесть · завтрак',time:'08:30',days:[0,1,2,3,4,5,6],remind:true,active:true,note:'Не откладывать из-за работы'},
  {id:'cat-water',sectionId:'cats',title:'Проверить воду у кошек',time:'10:00',days:[0,1,2,3,4,5,6],remind:true,active:true,note:''},
  {id:'lunch',sectionId:'food',title:'Поесть · обед',time:'13:00',days:[0,1,2,3,4,5,6],remind:true,active:true,note:'Поставить работу на паузу'},
  {id:'workbreak',sectionId:'work',title:'Отойти от Mac и размяться',time:'15:30',days:[0,1,2,3,4],remind:false,active:true,note:''},
  {id:'cat-evening',sectionId:'cats',title:'Покормить кошек · вечер',time:'19:00',days:[0,1,2,3,4,5,6],remind:true,active:true,note:''},
  {id:'dinner',sectionId:'food',title:'Поесть · ужин',time:'19:30',days:[0,1,2,3,4,5,6],remind:true,active:true,note:''},
  {id:'cat-litter',sectionId:'cats',title:'Проверить лотки',time:'20:30',days:[0,1,2,3,4,5,6],remind:true,active:true,note:''},
  {id:'plan',sectionId:'home',title:'Завтра: проверить дела',time:'21:30',days:[0,1,2,3,4,5,6],remind:false,active:true,note:''}
 ]
};
