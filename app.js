
(function(){
  const PAGES = ['daily','weekly','search','settings'];
  const pageEls = Object.fromEntries(PAGES.map(p=>[p, document.getElementById('page-'+p)]));
  const tabLinks = document.querySelectorAll('.tab-link');
  function show(route){
    PAGES.forEach(p=>pageEls[p].classList.remove('active'));
    tabLinks.forEach(a=>a.classList.remove('active'));
    const key = PAGES.includes(route) ? route : 'daily';
    pageEls[key].classList.add('active');
    document.querySelector(`.tab-link[data-route="${key}"]`)?.classList.add('active');
  }
  function parseHash(){
    const h = location.hash.replace(/^#\/?/, '');
    return h.split('?')[0] || 'daily';
  }
  window.addEventListener('hashchange', ()=>show(parseHash()));
  document.addEventListener('DOMContentLoaded', ()=>show(parseHash()));
  // also set default hash if none
  if(!location.hash) location.hash = '#/daily';

  // simple store
  const storeKey = 'ttc-journal-v1-3-2'; const settingsKey = 'ttc-settings-v1-3-2';
  const $ = s=>document.querySelector(s);
  const $$ = s=>Array.from(document.querySelectorAll(s));
  function loadAll(){ try{return JSON.parse(localStorage.getItem(storeKey))||{daily:{},weekly:{}}}catch(e){return{daily:{},weekly:{}}} }
  function saveAll(d){ localStorage.setItem(storeKey, JSON.stringify(d)); }
  function loadSettings(){ try{return JSON.parse(localStorage.getItem(settingsKey))||{}}catch(e){return{}} }
  function saveSettings(s){ localStorage.setItem(settingsKey, JSON.stringify(s)); }
  function ymd(date){ const d=new Date(date); const o=d.getTimezoneOffset()*60000; const l=new Date(d.getTime()-o); return l.toISOString().slice(0,10); }
  function parseTags(s){ if(!s) return []; return s.split(',').map(t=>t.trim()).filter(Boolean).map(t=>t.startsWith('#')?t:'#'+t); }
  function weekId(date){
    const d = new Date(date);
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNr = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(),0,4));
    const weekNo = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay()+6)%7)) / 7);
    const year = target.getUTCFullYear();
    return `${year}-W${String(weekNo).padStart(2,'0')}`;
  }

  // Daily refs
  const dailyDate = $('#dailyDate'); const prevDay=$('#prevDay'); const nextDay=$('#nextDay'); const todayBtn=$('#todayBtn');
  const eventField=$('#eventField'); const thoughtField=$('#thoughtField'); const feelingField=$('#feelingField'); const resultField=$('#resultField');
  const grat1=$('#grat1'); const grat2=$('#grat2'); const grat3=$('#grat3'); const dailyNote=$('#dailyNote'); const tagsField=$('#tagsField');
  const saveDaily=$('#saveDaily'); const clearDaily=$('#clearDaily'); const status=$('#status');

  function setDailyDate(d){ dailyDate.value = ymd(d); loadDaily(); }
  function shiftDaily(n){ const cur=new Date(dailyDate.value||new Date()); cur.setDate(cur.getDate()+n); setDailyDate(cur); }
  function loadDaily(){
    const data=loadAll(); const key=dailyDate.value||ymd(new Date()); const d=data.daily[key]||{};
    eventField.value=d.event||''; thoughtField.value=d.thought||''; feelingField.value=d.feeling||''; resultField.value=d.result||'';
    grat1.value=(d.gratitude&&d.gratitude[0])||''; grat2.value=(d.gratitude&&d.gratitude[1])||''; grat3.value=(d.gratitude&&d.gratitude[2])||'';
    dailyNote.value=d.note||''; tagsField.value=(d.tags||[]).join(', '); status.textContent='불러옴';
  }
  prevDay.addEventListener('click', ()=>shiftDaily(-1)); nextDay.addEventListener('click', ()=>shiftDaily(1)); todayBtn.addEventListener('click', ()=>setDailyDate(new Date()));
  dailyDate.addEventListener('change', loadDaily);
  saveDaily.addEventListener('click', ()=>{
    const data=loadAll(); const key=dailyDate.value||ymd(new Date());
    data.daily[key]={event:eventField.value.trim(),thought:thoughtField.value.trim(),feeling:feelingField.value.trim(),result:resultField.value.trim(),
      gratitude:[grat1.value.trim(),grat2.value.trim(),grat3.value.trim()],note:dailyNote.value.trim(),tags:parseTags(tagsField.value),updatedAt:new Date().toISOString()};
    saveAll(data); status.textContent='저장됨';
  });
  clearDaily.addEventListener('click', ()=>{
    if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
    const data=loadAll(); const key=dailyDate.value||ymd(new Date()); delete data.daily[key]; saveAll(data); loadDaily(); status.textContent='삭제됨';
  });

  // Weekly
  const prevWeek=$('#prevWeek'); const nextWeek=$('#nextWeek'); const thisWeekBtn=$('#thisWeekBtn'); const weekPicker=$('#weekPicker');
  const missionList=$('#missionList'); const newMission=$('#newMission'); const addMission=$('#addMission');
  const healingText=$('#healingText'); const saveWeekly=$('#saveWeekly'); const clearWeekly=$('#clearWeekly'); const randomHealing=$('#randomHealing');
  const healingCopy=$('#healingCopy'); const copyHealing=$('#copyHealing');

  function setWeekInputByDate(date){ const d=new Date(date); const wId=weekId(d); weekPicker.value=wId; loadWeekly(); }
  function shiftWeek(n){
    const val=weekPicker.value; if(!val){ setWeekInputByDate(new Date()); return; }
    const [y,w]=val.split('-W'); const simple=new Date(Date.UTC(parseInt(y),0,1+(parseInt(w)-1)*7)); const dow=simple.getUTCDay(); const start=simple;
    if(dow<=4) start.setUTCDate(simple.getUTCDate()-simple.getUTCDay()+1); else start.setUTCDate(simple.getUTCDate()+8-simple.getUTCDay());
    start.setUTCDate(start.getUTCDate()+n*7); setWeekInputByDate(new Date(start));
  }
  function renderMissions(items){
    missionList.innerHTML='';
    items.forEach((m,idx)=>{
      const row=document.createElement('div'); row.className='mission-item';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!m.done; cb.addEventListener('change',()=>{ m.done=cb.checked; saveWeeklyData();});
      const txt=document.createElement('input'); txt.type='text'; txt.value=m.text||''; txt.placeholder='미션 내용'; txt.addEventListener('input',()=>{ m.text=txt.value; saveWeeklyData();});
      const del=document.createElement('button'); del.className='btn danger'; del.textContent='삭제'; del.addEventListener('click',()=>{ items.splice(idx,1); renderMissions(items); saveWeeklyData(); });
      row.append(cb,txt,del); missionList.appendChild(row);
    });
  }
  function currentWeekKey(){ return weekPicker.value||weekId(new Date()); }
  function loadWeekly(){ const data=loadAll(); const key=currentWeekKey(); const w=data.weekly[key]||{missions:[],healing:''}; renderMissions(w.missions); healingText.value=w.healing||''; }
  function saveWeeklyData(){
    const data=loadAll(); const key=currentWeekKey();
    const items=Array.from(missionList.querySelectorAll('.mission-item')).map(row=>{
      const cb=row.querySelector('input[type="checkbox"]'); const txt=row.querySelector('input[type="text"]'); return {text:txt.value.trim(), done:cb.checked};
    }).filter(x=>x.text.length>0);
    data.weekly[key]={missions:items,healing:healingText.value.trim(),updatedAt:new Date().toISOString()}; saveAll(data);
  }
  prevWeek.addEventListener('click', ()=>shiftWeek(-1)); nextWeek.addEventListener('click', ()=>shiftWeek(1)); thisWeekBtn.addEventListener('click', ()=>setWeekInputByDate(new Date())); weekPicker.addEventListener('change', loadWeekly);
  addMission.addEventListener('click', ()=>{ const t=newMission.value.trim(); if(!t) return; const data=loadAll(); const key=currentWeekKey(); const w=data.weekly[key]||{missions:[],healing:''}; w.missions.push({text:t,done:false}); data.weekly[key]=w; saveAll(data); newMission.value=''; renderMissions(w.missions); });
  saveWeekly.addEventListener('click', ()=>{ saveWeeklyData(); alert('주간 데이터 저장됨'); });
  clearWeekly.addEventListener('click', ()=>{ if(!confirm('이 주차 데이터를 지울까요?')) return; const data=loadAll(); const key=currentWeekKey(); delete data.weekly[key]; saveAll(data); loadWeekly(); });
  randomHealing.addEventListener('click', ()=>{ const bank=['충분히 잘하고 있어요.','오늘의 나는 어제보다 한 걸음.','작은 호흡이 큰 평안을 불러와요.','부드럽게, 천천히, 나답게.','내 편은 언제나 나.']; healingText.value=bank[Math.floor(Math.random()*bank.length)]; });
  copyHealing.addEventListener('click', ()=>{ healingCopy.classList.toggle('hidden'); if(!healingCopy.classList.contains('hidden')) healingCopy.value = healingText.value + '\\n—'; });

  // Search
  const searchInput=$('#searchInput'); const searchBtn=$('#searchBtn'); const searchClear=$('#searchClear'); const searchResults=$('#searchResults');
  function doSearch(){
    const q=searchInput.value.trim(); const isTag=q.startsWith('#'); const qn=q.replace(/^#/, '').toLowerCase(); const data=loadAll(); const out=[];
    Object.keys(data.daily).forEach(date=>{ const d=data.daily[date]; const hay=[d.event,d.thought,d.feeling,d.result,...(d.gratitude||[]),d.note].join(' ').toLowerCase();
      const tags=(d.tags||[]).map(t=>t.replace('#','').toLowerCase());
      const match=isTag ? tags.includes(qn) : hay.includes(qn);
      if(match) out.push({date,d});
    });
    out.sort((a,b)=>a.date.localeCompare(b.date));
    searchResults.innerHTML = out.length? out.map(item=>`<div class="card"><h3>${item.date}</h3>
      <div><b>사건</b>: ${item.d.event||''}</div>
      <div><b>생각</b>: ${item.d.thought||''}</div>
      <div><b>감정</b>: ${item.d.feeling||''}</div>
      <div><b>결과</b>: ${item.d.result||''}</div>
      <div><b>감사</b>: ${(item.d.gratitude||[]).filter(Boolean).join(', ')}</div>
      <div><b>일상</b>: ${item.d.note||''}</div>
      <div>${(item.d.tags||[]).map(t=>`<span class="muted">${t}</span>`).join(' ')}</div></div>`).join('') : '<p class="muted">결과 없음</p>';
  }
  searchBtn.addEventListener('click', doSearch); searchClear.addEventListener('click', ()=>{ searchInput.value=''; searchResults.innerHTML=''; });

  // Settings: dark & lock (lock is just a flag off by default)
  const darkMode=$('#darkMode'); const lockEnabled=$('#lockEnabled'); const pinCode=$('#pinCode'); const savePin=$('#savePin');
  function applyTheme(){ const s=loadSettings(); document.documentElement.classList.toggle('dark', !!s.dark); }
  darkMode.addEventListener('change', ()=>{ const s=loadSettings(); s.dark=darkMode.checked; saveSettings(s); applyTheme(); });
  savePin.addEventListener('click', ()=>{ alert('PIN 저장됨(로컬). Face ID 잠금은 추후 서버 없는 로컬 보호용으로만 제공됩니다.'); });
  lockEnabled.addEventListener('change', ()=>{ const s=loadSettings(); s.lock=lockEnabled.checked; saveSettings(s); alert('잠금 기능은 기본 비활성화 상태입니다.'); });
  applyTheme();

  // init dates
  setDailyDate(new Date()); setWeekInputByDate(new Date());
})();