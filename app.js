
// Keys
const storeKey = 'jinijjang-journal-v1-3-5';
const settingsKey = 'jinijjang-settings-v1-3-5'; // {darkMode, lockEnabled, pinHash, credId}

// Basic store helpers
function loadAll(){ try{ return JSON.parse(localStorage.getItem(storeKey)) || {daily:{}, weekly:{}}; }catch(e){ return {daily:{}, weekly:{}}; } }
function saveAll(d){ localStorage.setItem(storeKey, JSON.stringify(d)); }
function loadSettings(){ try{ return JSON.parse(localStorage.getItem(settingsKey)) || {}; }catch(e){ return {}; } }
function saveSettings(s){ localStorage.setItem(settingsKey, JSON.stringify(s)); }

// Utils
function ymd(date){ const d=new Date(date); const tz=d.getTimezoneOffset()*60000; const local=new Date(d.getTime()-tz); return local.toISOString().slice(0,10); }
function weekId(date){ const d=new Date(date); const t=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-n+3); const ft=new Date(Date.UTC(t.getUTCFullYear(),0,4)); const w=1+Math.round(((t-ft)/86400000-3+((ft.getUTCDay()+6)%7))/7); const y=t.getUTCFullYear(); return `${y}-W${String(w).padStart(2,'0')}`; }
function parseTags(s){ if(!s) return []; return s.split(',').map(t=>t.trim()).filter(Boolean).map(t=>t.startsWith('#')?t:'#'+t); }
function normalize(s){ return (s||'').toLowerCase(); }
function setStatus(el,msg){ el.textContent = msg; setTimeout(()=>{ el.textContent = '저장됨'; }, 1500); }

// Theme
const htmlEl = document.documentElement;
function applyTheme(){ const s=loadSettings(); const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; const useDark = (s.darkMode==='dark')||(s.darkMode==='system'&&prefersDark); htmlEl.classList.toggle('dark', useDark); }
applyTheme();

// Routing
const pages = {
  daily: document.getElementById('page-daily'),
  weekly: document.getElementById('page-weekly'),
  search: document.getElementById('page-search'),
  settings: document.getElementById('page-settings')
};
function showPage(name){
  Object.values(pages).forEach(p=>p.classList.remove('active'));
  (pages[name]||pages.daily).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(a=>a.classList.toggle('active', a.dataset.tab===name));
}
function handleHash(){
  const h = location.hash || '#/daily';
  const name = h.replace('#/','');
  showPage(name);
}
window.addEventListener('hashchange', handleHash);
if(!location.hash) location.hash = '#/daily';
handleHash();

// Daily elements
const dailyDate = document.getElementById('dailyDate');
const prevDay = document.getElementById('prevDay');
const nextDay = document.getElementById('nextDay');
const todayBtn = document.getElementById('todayBtn');
const eventField = document.getElementById('eventField');
const thoughtField = document.getElementById('thoughtField');
const feelingField = document.getElementById('feelingField');
const resultField = document.getElementById('resultField');
const grat1 = document.getElementById('grat1');
const grat2 = document.getElementById('grat2');
const grat3 = document.getElementById('grat3');
const dailyNote = document.getElementById('dailyNote');
const tagsField = document.getElementById('tagsField');
const saveDaily = document.getElementById('saveDaily');
const clearDaily = document.getElementById('clearDaily');
const statusDaily = document.getElementById('statusDaily');
const dailyQuestion = document.getElementById('dailyQuestion');
const dailyAnswer = document.getElementById('dailyAnswer');
const nextQuestion = document.getElementById('nextQuestion');

const QUESTIONS = [
  '사람들에게 어떤 사람으로 기억되고 싶나요?',
  '오늘 나를 웃게 만든 순간은 무엇이었나요?',
  '요즘 가장 배우고 싶은 것은 무엇인가요?',
  '힘들 때 나를 붙잡아준 문장은 무엇이었나요?',
  '오늘의 나는 어제와 비교해 무엇이 1% 나아졌나요?',
  '지금 내 삶에서 감사한 것을 세 가지 말해 보세요.',
  '내가 돌보고 싶은 관계는 무엇인가요?',
  '최근에 놓아버릴 수 있었던 집착은 무엇인가요?',
  '나를 닮았으면 하는 가치는 무엇인가요?',
  '오늘 내가 친절했던 순간은 언제였나요?'
];
function setRandomQuestion(){ dailyQuestion.value = QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)]; }

function setDailyDate(d){ dailyDate.value = ymd(d); loadDaily(); }
function shiftDaily(days){ const cur = new Date(dailyDate.value || new Date()); cur.setDate(cur.getDate()+days); setDailyDate(cur); }
prevDay.addEventListener('click', ()=>shiftDaily(-1));
nextDay.addEventListener('click', ()=>shiftDaily(1));
todayBtn.addEventListener('click', ()=>setDailyDate(new Date()));
dailyDate.addEventListener('change', loadDaily);
nextQuestion.addEventListener('click', setRandomQuestion);

function loadDaily(){
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  const d = data.daily[key] || {};
  dailyQuestion.value = d.question || QUESTIONS[0];
  dailyAnswer.value = d.answer || '';
  eventField.value = d.event || '';
  thoughtField.value = d.thought || '';
  feelingField.value = d.feeling || '';
  resultField.value = d.result || '';
  grat1.value = (d.gratitude && d.gratitude[0]) || '';
  grat2.value = (d.gratitude && d.gratitude[1]) || '';
  grat3.value = (d.gratitude && d.gratitude[2]) || '';
  dailyNote.value = d.note || '';
  tagsField.value = (d.tags || []).join(', ');
  statusDaily.textContent = '불러옴';
}

saveDaily.addEventListener('click', ()=>{
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  data.daily[key] = {
    question: dailyQuestion.value.trim(),
    answer: dailyAnswer.value.trim(),
    event: eventField.value.trim(),
    thought: thoughtField.value.trim(),
    feeling: feelingField.value.trim(),
    result: resultField.value.trim(),
    gratitude: [grat1.value.trim(), grat2.value.trim(), grat3.value.trim()],
    note: dailyNote.value.trim(),
    tags: parseTags(tagsField.value),
    updatedAt: new Date().toISOString()
  };
  saveAll(data);
  setStatus(statusDaily, '저장됨');
  alert('저장되었습니다.');
});

clearDaily.addEventListener('click', ()=>{
  if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  delete data.daily[key];
  saveAll(data);
  loadDaily();
  statusDaily.textContent = '삭제됨';
  alert('삭제되었습니다.');
});

// Weekly
const weekPicker = document.getElementById('weekPicker');
const prevWeek = document.getElementById('prevWeek');
const nextWeek = document.getElementById('nextWeek');
const thisWeekBtn = document.getElementById('thisWeekBtn');
const missionList = document.getElementById('missionList');
const newMission = document.getElementById('newMission');
const addMission = document.getElementById('addMission');
const healingText = document.getElementById('healingText');
const saveWeekly = document.getElementById('saveWeekly');
const clearWeekly = document.getElementById('clearWeekly');
const randomHealing = document.getElementById('randomHealing');
const startCopy = document.getElementById('startCopy');
const copyArea = document.getElementById('copyArea');
const copyText = document.getElementById('copyText');
const statusWeekly = document.getElementById('statusWeekly');

const HEALING = [
  '부러움 대신 배움을 고르면 마음은 가벼워진다',
  '오늘의 나를 어제의 나와만 비교하면 삶이 단단해진다',
  '완벽보다 꾸준함이 더 조용히 이긴다',
  '친절은 돌아오지 않아도 흔적을 남긴다',
  '해야 할 일 앞에서 숨고 싶을 땐 아주 작은 시작부터',
  '내 속도가 느려 보여도 멈추지 않으면 결국 닿는다',
  '인정은 포기와 다르지 않다 받아들임은 시작이다',
  '한 번의 깊은 호흡이 마음의 재부팅이다',
  '불안은 계획을 좋아한다 작은 계획 하나면 충분하다',
  '사랑받는 것보다 믿을 만한 사람이 되는 게 오래간다',
  '상처를 말로 꺼내면 무게가 나눠진다',
  '오늘의 수고를 내일의 나에게 친절로 남긴다'
];

function setWeekInputByDate(date){ weekPicker.value = weekId(new Date(date)); loadWeekly(); }
function shiftWeek(delta){
  const val = weekPicker.value;
  if(!val){ setWeekInputByDate(new Date()); return; }
  const [y, w] = val.split('-W');
  const simple = new Date(Date.UTC(parseInt(y), 0, 1 + (parseInt(w)-1)*7));
  const dow = simple.getUTCDay();
  const start = simple;
  if (dow <= 4) start.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else start.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  start.setUTCDate(start.getUTCDate() + delta*7);
  setWeekInputByDate(start);
}
prevWeek.addEventListener('click', ()=>shiftWeek(-1));
nextWeek.addEventListener('click', ()=>shiftWeek(1));
thisWeekBtn.addEventListener('click', ()=>setWeekInputByDate(new Date()));
weekPicker.addEventListener('change', loadWeekly);

function renderMissions(items){
  missionList.innerHTML = '';
  items.forEach((m, idx)=>{
    const row = document.createElement('div');
    row.className = 'mission-item';
    const cb = document.createElement('input');
    cb.type='checkbox'; cb.checked=!!m.done;
    cb.addEventListener('change', ()=>{ m.done = cb.checked; saveWeeklyData(); });
    const txt = document.createElement('input');
    txt.type='text'; txt.value=m.text||''; txt.placeholder='미션 내용';
    txt.addEventListener('input', ()=>{ m.text = txt.value; saveWeeklyData(); });
    const del = document.createElement('button');
    del.className='btn danger'; del.textContent='삭제';
    del.addEventListener('click', ()=>{ if(!confirm('이 미션을 삭제할까요?')) return; items.splice(idx,1); renderMissions(items); saveWeeklyData(); });
    row.appendChild(cb); row.appendChild(txt); row.appendChild(del);
    missionList.appendChild(row);
  });
}
function currentWeekKey(){ return weekPicker.value || weekId(new Date()); }
function loadWeekly(){
  const data = loadAll();
  const key = currentWeekKey();
  const w = data.weekly[key] || {missions:[], healing:'', copy:''};
  renderMissions(w.missions);
  healingText.value = w.healing || '';
  copyText.value = w.copy || '';
  statusWeekly.textContent = '불러옴';
}
function saveWeeklyData(){
  const data = loadAll();
  const key = currentWeekKey();
  const items = Array.from(missionList.querySelectorAll('.mission-item')).map(row=>{
    const cb = row.querySelector('input[type="checkbox"]');
    const txt = row.querySelector('input[type="text"]');
    return {text: txt.value.trim(), done: cb.checked};
  }).filter(it=>it.text.length>0);
  data.weekly[key] = { missions: items, healing: healingText.value.trim(), copy: copyText.value.trim(), updatedAt: new Date().toISOString() };
  saveAll(data);
  statusWeekly.textContent = '저장됨';
}
addMission.addEventListener('click', ()=>{
  const txt = newMission.value.trim(); if(!txt) return;
  const data = loadAll();
  const key = currentWeekKey();
  const w = data.weekly[key] || {missions:[], healing:'', copy:''};
  w.missions.push({text: txt, done:false});
  data.weekly[key] = w; saveAll(data);
  newMission.value=''; renderMissions(w.missions); statusWeekly.textContent='저장됨';
});
saveWeekly.addEventListener('click', ()=>{ saveWeeklyData(); alert('주간 데이터가 저장되었습니다.'); });
clearWeekly.addEventListener('click', ()=>{
  if(!confirm('이 주차의 주간 데이터를 모두 지울까요?')) return;
  const data = loadAll(); const key = currentWeekKey();
  delete data.weekly[key]; saveAll(data); loadWeekly(); statusWeekly.textContent='삭제됨'; alert('삭제되었습니다.');
});
randomHealing.addEventListener('click', ()=>{ healingText.value = HEALING[Math.floor(Math.random()*HEALING.length)]; });
startCopy.addEventListener('click', ()=>{ copyArea.classList.toggle('hidden'); });

// Search
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchClear = document.getElementById('searchClear');
const searchResults = document.getElementById('searchResults');

function doSearch(){
  const q = searchInput.value.trim();
  const data = loadAll();
  const results = [];
  const isTag = q.startsWith('#'); const term = normalize(q.replace(/^#/,''));
  Object.keys(data.daily).forEach(date=>{
    const d = data.daily[date];
    const hay = [d.question,d.answer,d.event,d.thought,d.feeling,d.result,...(d.gratitude||[]),d.note,(d.tags||[]).join(' ')].join(' ').toLowerCase();
    const tags = (d.tags||[]).map(t=>t.replace(/^#/,'').toLowerCase());
    const match = isTag ? tags.includes(term) : hay.includes(term);
    if(match) results.push({date, d});
  });
  results.sort((a,b)=> b.date.localeCompare(a.date)); // newest first
  renderResults(results);
}
function renderResults(list){
  searchResults.innerHTML = '';
  if(!list.length){ searchResults.innerHTML = '<p class="muted">결과가 없습니다.</p>'; return; }
  list.forEach(item=>{
    const div = document.createElement('div'); div.className='res card';
    const h4 = document.createElement('h4'); h4.textContent = `${item.date}`;
    const tags = (item.d.tags||[]).map(t=>`<span class="badge">${t}</span>`).join(' ');
    const p = document.createElement('p');
    p.innerHTML = `<strong>질문</strong>: ${item.d.question||''}<br>
                   <strong>답변</strong>: ${item.d.answer||''}<br>
                   <strong>사건</strong>: ${item.d.event||''}<br>
                   <strong>생각</strong>: ${item.d.thought||''}<br>
                   <strong>감정</strong>: ${item.d.feeling||''}<br>
                   <strong>결과</strong>: ${item.d.result||''}<br>
                   <strong>감사</strong>: ${(item.d.gratitude||[]).filter(Boolean).join(', ')}<br>
                   <strong>일상</strong>: ${item.d.note||''}<br>${tags}`;
    div.appendChild(h4); div.appendChild(p);
    searchResults.appendChild(div);
  });
}
searchBtn.addEventListener('click', doSearch);
searchClear.addEventListener('click', ()=>{ searchInput.value=''; searchResults.innerHTML=''; });

// Backup / Share
document.getElementById('exportJSON').addEventListener('click', ()=>{
  const data = loadAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `jinijjang_backup_${ymd(new Date())}.json`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
});

document.getElementById('shareJSON').addEventListener('click', async ()=>{
  try{
    const data = loadAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const file = new File([blob], `jinijjang_backup_${ymd(new Date())}.json`, {type:'application/json'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({title:'지니짱 감사일기 백업', text:'백업 파일', files:[file]});
    }else if(navigator.share){
      await navigator.share({title:'지니짱 감사일기 백업', text: JSON.stringify(data)});
    }else{
      // fallback: copy to clipboard
      await navigator.clipboard.writeText(JSON.stringify(data));
      alert('공유가 지원되지 않아 내용이 복사되었습니다. 카톡에 붙여넣기 하세요.');
    }
  }catch(e){
    alert('공유 실패/취소: ' + (e.message||e));
  }
});

document.getElementById('exportCSV').addEventListener('click', ()=>{
  const data = loadAll();
  const dailyRows = [['date','question','answer','event','thought','feeling','result','grat1','grat2','grat3','note','tags']];
  Object.keys(data.daily).sort().forEach(k=>{
    const d = data.daily[k]||{};
    dailyRows.push([k,d.question||'',d.answer||'',d.event||'',d.thought||'',d.feeling||'',d.result||'',(d.gratitude&&d.gratitude[0])||'',(d.gratitude&&d.gratitude[1])||'',(d.gratitude&&d.gratitude[2])||'',d.note||'',(d.tags||[]).join(' ')]);
  });
  const weeklyRows = [['week','missions(json)','healing','copy']];
  Object.keys(data.weekly).sort().forEach(k=>{
    const w = data.weekly[k]||{};
    weeklyRows.push([k, JSON.stringify(w.missions||[]), w.healing||'', w.copy||'']);
  });
  function toCSV(rows){ return rows.map(r=>r.map(x=>('"'+(x??'').toString().replace(/"/g,'""')+'"')).join(',')).join('\n'); }
  // Use JSZip from CDN
  function downloadZip(JSZip){
    const zip = new JSZip();
    zip.file(`daily_${ymd(new Date())}.csv`, toCSV(dailyRows));
    zip.file(`weekly_${ymd(new Date())}.csv`, toCSV(weeklyRows));
    zip.generateAsync({type:"blob"}).then((content)=>{
      const url = URL.createObjectURL(content);
      const a = document.createElement('a'); a.href=url; a.download=`jinijjang_csv_${ymd(new Date())}.zip`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    });
  }
  if(window.JSZip){ downloadZip(JSZip); }
  else{
    const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload=()=>downloadZip(JSZip); document.head.appendChild(s);
  }
});

document.getElementById('importJSON').addEventListener('click', ()=>{
  const f = document.getElementById('importFile').files[0];
  if(!f){ alert('JSON 파일을 선택하세요.'); return; }
  const reader = new FileReader();
  reader.onload = (e)=>{
    try{
      const incoming = JSON.parse(e.target.result);
      const current = loadAll();
      const merged = current;
      merged.daily = {...current.daily, ...(incoming.daily||{})};
      merged.weekly = {...current.weekly, ...(incoming.weekly||{})};
      saveAll(merged);
      alert('가져오기가 완료되었습니다.');
      loadDaily(); loadWeekly();
    }catch(err){ alert('가져오기 실패: 올바른 JSON이 아닙니다.'); }
  };
  reader.readAsText(f);
});

// App management
document.getElementById('refreshCache').addEventListener('click', async ()=>{
  if('serviceWorker' in navigator){
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r=>r.unregister()));
    location.href = location.pathname + '?updated=' + Date.now() + '#/daily';
  }else{
    location.reload();
  }
});
document.getElementById('resetLocal').addEventListener('click', ()=>{
  if(!confirm('로컬 데이터를 모두 초기화할까요? (되돌릴 수 없음)')) return;
  localStorage.removeItem(storeKey); localStorage.removeItem(settingsKey);
  alert('초기화되었습니다. 페이지를 새로고침합니다.'); location.reload();
});

// Security (Face ID disabled by default)
const lockEnabledChk = document.getElementById('lockEnabled');
const pinCodeInput = document.getElementById('pinCode');
const savePinBtn = document.getElementById('savePin');
const panicUnlock = document.getElementById('panicUnlock');
function sha256(str){ const enc=new TextEncoder(); return crypto.subtle.digest('SHA-256', enc.encode(str)).then(buf=>Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('')); }
async function setPin(pin){ const s=loadSettings(); s.pinHash = await sha256(pin); saveSettings(s); }
async function checkPin(pin){ const s=loadSettings(); if(!s.pinHash) return false; const h=await sha256(pin); return h===s.pinHash; }
savePinBtn.addEventListener('click', async ()=>{ const pin=pinCodeInput.value.trim(); if(!/^\d{6}$/.test(pin)){ alert('6자리 숫자 PIN을 입력하세요.'); return; } await setPin(pin); alert('PIN 저장 완료'); pinCodeInput.value=''; });
panicUnlock.addEventListener('click', ()=>{ const s=loadSettings(); s.lockEnabled=false; saveSettings(s); alert('비상 해제되었습니다.'); });

lockEnabledChk.addEventListener('change', ()=>{ const s=loadSettings(); s.lockEnabled = lockEnabledChk.checked; saveSettings(s); });
(function initLockUI(){ const s=loadSettings(); if(s.lockEnabled==null){ s.lockEnabled=false; saveSettings(s); } lockEnabledChk.checked = !!s.lockEnabled; })();

// Init
setDailyDate(new Date());
setWeekInputByDate(new Date());

// Register SW
if('serviceWorker' in navigator){ window.addEventListener('load', ()=>{ navigator.serviceWorker.register('service-worker.js'); }); }
