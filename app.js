
// ===== Router (hash) =====
const views = {
  daily: document.getElementById('view-daily'),
  weekly: document.getElementById('view-weekly'),
  search: document.getElementById('view-search'),
  settings: document.getElementById('view-settings'),
};
const tabs = {
  daily: document.getElementById('tab-daily'),
  weekly: document.getElementById('tab-weekly'),
  search: document.getElementById('tab-search'),
  settings: document.getElementById('tab-settings'),
};
function showView(name){
  Object.values(views).forEach(v=>v.classList.add('hidden'));
  Object.values(tabs).forEach(t=>t.classList.remove('active'));
  const v = views[name] || views.daily;
  const t = tabs[name] || tabs.daily;
  v.classList.remove('hidden');
  t.classList.add('active');
  location.hash = `#/${name}`;
}
window.addEventListener('hashchange', ()=>{
  const name = (location.hash.replace('#/','')||'daily');
  showView(name);
});
showView((location.hash.replace('#/',''))||'daily');

// ===== Toast =====
const toast = document.getElementById('toast');
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 1700);
}

// ===== Today / date =====
const dailyDate = document.getElementById('dailyDate');
function setToday(){
  const d = new Date(); d.setHours(9,0,0,0);
  dailyDate.valueAsDate = d;
}
document.getElementById('btnToday').addEventListener('click', setToday);
setToday();

// ===== Questions (simple local pool, no duplicates in a session) =====
const QUESTIONS = [
  "지금의 나에게 꼭 필요한 한 마디는?",
  "사람들에게 어떤 사람으로 기억되고 싶나요?",
  "오늘 나를 웃게 한 순간은?",
  "최근에 배운 작은 교훈은?",
  "오늘 더 고마웠던 사람은 누구였나요?",
  "내가 나에게 해주고 싶은 칭찬은?",
  "지금 놓치고 있는 작은 행복은?",
  "최근 바꿔보고 싶은 습관 한 가지는?",
  "내가 지키고 싶은 나만의 약속은?",
  "오늘의 나에게 점수를 준다면 몇 점? (이유는?)"
];
let usedQ = new Set();
function nextQuestion(){
  const pool = QUESTIONS.filter(q=>!usedQ.has(q));
  if(pool.length===0){ usedQ.clear(); }
  const list = pool.length?pool:QUESTIONS;
  const pick = list[Math.floor(Math.random()*list.length)];
  usedQ.add(pick);
  document.getElementById('qText').value = pick;
}
document.getElementById('btnNextQuestion').addEventListener('click', nextQuestion);
nextQuestion();

// ===== Local persistence (can be swapped to Firebase later) =====
function localKey(prefix){
  const d = dailyDate.value || new Date().toISOString().slice(0,10);
  return `${prefix}:${d}`;
}
function saveDaily(){
  const data = {
    date: dailyDate.value,
    q: document.getElementById('qText').value,
    a: document.getElementById('qAnswer').value,
    emo:{ e:emoEvent.value, t:emoThought.value, f:emoFeeling.value, r:emoResult.value },
    gr:[gr1.value,gr2.value,gr3.value],
    note: dailyNote.value,
    tags: tags.value
  };
  localStorage.setItem(localKey('daily'), JSON.stringify(data));
  showToast('저장 완료!');
}
function loadDaily(){
  const raw = localStorage.getItem(localKey('daily'));
  if(!raw){ return; }
  try{
    const d = JSON.parse(raw);
    document.getElementById('qText').value = d.q || '';
    document.getElementById('qAnswer').value = d.a || '';
    emoEvent.value = d.emo?.e || '';
    emoThought.value = d.emo?.t || '';
    emoFeeling.value = d.emo?.f || '';
    emoResult.value = d.emo?.r || '';
    gr1.value = d.gr?.[0]||''; gr2.value = d.gr?.[1]||''; gr3.value = d.gr?.[2]||'';
    dailyNote.value = d.note || '';
    tags.value = d.tags || '';
  }catch(e){}
}
document.getElementById('btnDailySave').addEventListener('click', saveDaily);
document.getElementById('btnDailyClear').addEventListener('click', ()=>{
  localStorage.removeItem(localKey('daily'));
  document.querySelectorAll('#view-daily .input, #view-daily .textarea').forEach(el=>{ if(!el.readOnly) el.value=''; });
  showToast('비웠어요!');
});
dailyDate.addEventListener('change', loadDaily);
loadDaily();

// ===== Weekly: missions + healing =====
const missionInput = document.getElementById('missionInput');
const missionList = document.getElementById('missionList');
function weekKey(){ return `week:${document.getElementById('weekPicker').value||'current'}`; }
function addMission(text='', checked=false){
  const li = document.createElement('li');
  li.innerHTML = `<input type="checkbox" ${checked?'checked':''}>
                  <input type="text" value="${text.replace(/"/g,'&quot;')}" class="input">
                  <button class="btn ghost tiny">삭제</button>`;
  missionList.appendChild(li);
  li.querySelector('button').addEventListener('click', ()=>li.remove());
}
document.getElementById('btnAddMission').addEventListener('click', ()=>{
  const v = missionInput.value.trim(); if(!v){ missionInput.focus(); return; }
  addMission(v,false); missionInput.value='';
});
function saveWeekly(){
  const items = [...missionList.children].map(li=>({
    done: li.querySelector('input[type="checkbox"]').checked,
    text: li.querySelector('input[type="text"]').value
  }));
  const data = {
    missions: items,
    healing: document.getElementById('healingText').value,
    copy: document.getElementById('healingCopy').value
  };
  localStorage.setItem(weekKey(), JSON.stringify(data));
  showToast('주간 저장 완료!');
}
function loadWeekly(){
  missionList.innerHTML='';
  const raw = localStorage.getItem(weekKey());
  if(!raw){ return; }
  try{
    const d = JSON.parse(raw);
    (d.missions||[]).forEach(m=>addMission(m.text, m.done));
    document.getElementById('healingText').value = d.healing||'';
    document.getElementById('healingCopy').value = d.copy||'';
  }catch(e){}
}
document.getElementById('btnWeeklySave').addEventListener('click', saveWeekly);
document.getElementById('weekPicker').addEventListener('change', loadWeekly);
loadWeekly();

// ===== Search (demo over localStorage) =====
function searchAll(){
  const q = (document.getElementById('searchInput').value||'').trim();
  const box = document.getElementById('searchResults');
  box.innerHTML='';
  if(!q){ return; }
  const hits=[];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(!k.startsWith('daily:') && !k.startsWith('week:')) continue;
    try{
      const v = JSON.parse(localStorage.getItem(k)||'{}');
      const text = JSON.stringify(v);
      if(text.includes(q)) hits.push({k, v});
    }catch(e){}
  }
  if(hits.length===0){ box.innerHTML='<p class="help">결과 없음</p>'; return; }
  hits.slice(0,100).forEach(h=>{
    const d = document.createElement('div');
    d.className='card';
    d.innerHTML = `<div class="help small">${h.k}</div><pre style="white-space:pre-wrap">${JSON.stringify(h.v,null,2)}</pre>`;
    box.appendChild(d);
  });
}
document.getElementById('searchInput').addEventListener('input', ()=>{ clearTimeout(searchAll._t); searchAll._t=setTimeout(searchAll, 250); });

// ===== Auth (dummy placeholders; replace with Firebase later) =====
const loginStatus = document.getElementById('loginStatus');
document.getElementById('btnLogin').addEventListener('click', ()=>{
  document.querySelector('#view-settings .card').scrollIntoView({behavior:'smooth'});
  showView('settings');
});
document.getElementById('btnDoLogin').addEventListener('click', ()=>{
  // 실제 Firebase 로그인 연결 전까지는 성공으로 처리
  loginStatus.textContent = '로그인됨';
  document.getElementById('btnLogin').classList.add('hidden');
  document.getElementById('btnLogout').classList.remove('hidden');
  showToast('로그인 성공!');
});
document.getElementById('btnLogout').addEventListener('click', ()=>{
  loginStatus.textContent = '로그아웃 상태';
  document.getElementById('btnLogin').classList.remove('hidden');
  document.getElementById('btnLogout').classList.add('hidden');
  showToast('로그아웃!');
});
document.getElementById('btnSignup').addEventListener('click', ()=>{
  showToast('회원가입은 로그인 방식 연결 후 활성화됩니다.');
});

// ===== Backup / restore =====
document.getElementById('btnExport').addEventListener('click', ()=>{
  const dump = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith('daily:')||k.startsWith('week:')) dump[k]=localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify(dump,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'thanksdiary-backup.json';
  a.click();
});
document.getElementById('btnShare').addEventListener('click', async ()=>{
  try{
    const dump = {};
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k.startsWith('daily:')||k.startsWith('week:')) dump[k]=localStorage.getItem(k);
    }
    const file = new File([JSON.stringify(dump,null,2)], 'thanksdiary.json', {type:'application/json'});
    await navigator.share({ files:[file], title:'ThanksDiary', text:'백업 파일' });
  }catch(e){
    showToast('공유가 지원되지 않아요.');
  }
});
document.getElementById('btnImport').addEventListener('click', ()=>{
  const f = document.getElementById('fileInput').files?.[0];
  if(!f){ showToast('파일을 먼저 선택해요.'); return; }
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      Object.entries(data).forEach(([k,v])=> localStorage.setItem(k, v));
      showToast('복원 완료!');
    }catch(e){ showToast('가져오기 실패'); }
  };
  reader.readAsText(f);
});
document.getElementById('btnClearLocal').addEventListener('click', ()=>{
  if(confirm('로컬 데이터를 모두 지울까요?')){
    const del = [];
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k.startsWith('daily:')||k.startsWith('week:')) del.push(k);
    }
    del.forEach(k=>localStorage.removeItem(k));
    showToast('로컬 초기화 완료');
  }
});
