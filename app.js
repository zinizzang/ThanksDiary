
// Keys
const storeKey = 'jj-journal-v1-3-4';
const settingsKey = 'jj-settings-v1-3-4'; // {darkMode, lockEnabled, pinHash, credId}

// Storage helpers
function loadAll(){ try{ return JSON.parse(localStorage.getItem(storeKey)) || {daily:{}, weekly:{}}; }catch(e){ return {daily:{}, weekly:{}}; } }
function saveAll(data){ localStorage.setItem(storeKey, JSON.stringify(data)); }
function loadSettings(){ try{ return JSON.parse(localStorage.getItem(settingsKey)) || {}; }catch(e){ return {}; } }
function saveSettings(s){ localStorage.setItem(settingsKey, JSON.stringify(s)); }

// Date helpers
function ymd(date){ const d = new Date(date); const tzOffset = d.getTimezoneOffset()*60000; const local = new Date(d.getTime()-tzOffset); return local.toISOString().slice(0,10); }
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

// Theme
const darkToggle = document.getElementById('darkToggle');
const darkModeChk = document.getElementById('darkMode');
function applyTheme(){
  const s = loadSettings();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = (s.darkMode === 'dark') || (s.darkMode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', useDark);
  if(darkModeChk) darkModeChk.checked = (s.darkMode === 'dark');
}
if(darkToggle){
  darkToggle.addEventListener('click', ()=>{
    const isDark = document.documentElement.classList.contains('dark');
    const s = loadSettings(); s.darkMode = isDark ? 'light':'dark'; saveSettings(s); applyTheme();
  });
}
if(darkModeChk){
  darkModeChk.addEventListener('change', ()=>{
    const s = loadSettings(); s.darkMode = darkModeChk.checked ? 'dark':'light'; saveSettings(s); applyTheme();
  });
}
applyTheme();

// Router
const routes = ['daily','weekly','search','settings'];
const pages = {
  daily: document.getElementById('page-daily'),
  weekly: document.getElementById('page-weekly'),
  search: document.getElementById('page-search'),
  settings: document.getElementById('page-settings'),
};
function navTo(hash){
  const r = (hash||'#/daily').replace('#/','');
  document.querySelectorAll('.tab-btn').forEach(a=>a.classList.toggle('active', a.dataset.tab===r));
  Object.keys(pages).forEach(k=>pages[k].classList.remove('active'));
  (pages[r]||pages['daily']).classList.add('active');
}
window.addEventListener('hashchange', ()=>navTo(location.hash));
navTo(location.hash||'#/daily');

// Daily elements
const dailyDate = document.getElementById('dailyDate');
const prevDay = document.getElementById('prevDay'); const nextDay = document.getElementById('nextDay'); const todayBtn = document.getElementById('todayBtn');
const reflectionQuestion = document.getElementById('reflectionQuestion'); const newQuestion = document.getElementById('newQuestion'); const reflectionAnswer = document.getElementById('reflectionAnswer');
const eventField = document.getElementById('eventField'); const thoughtField = document.getElementById('thoughtField'); const feelingField = document.getElementById('feelingField'); const resultField = document.getElementById('resultField');
const grat1 = document.getElementById('grat1'); const grat2 = document.getElementById('grat2'); const grat3 = document.getElementById('grat3'); const dailyNote = document.getElementById('dailyNote');
const tagsField = document.getElementById('tagsField');
const saveDaily = document.getElementById('saveDaily'); const clearDaily = document.getElementById('clearDaily'); const statusDaily = document.getElementById('statusDaily');

function setDailyDate(d){ dailyDate.value = ymd(d); loadDaily(); }
function shiftDaily(days){ const cur = new Date(dailyDate.value || new Date()); cur.setDate(cur.getDate()+days); setDailyDate(cur); }
prevDay.addEventListener('click', ()=>shiftDaily(-1)); nextDay.addEventListener('click', ()=>shiftDaily(1)); todayBtn.addEventListener('click', ()=>setDailyDate(new Date()));
dailyDate.addEventListener('change', loadDaily);

const questions = [
  '사람들에게 어떤 사람으로 기억되고 싶나요?',
  '오늘 나를 웃게 한 작은 순간은 무엇이었나요?',
  '최근에 스스로에게 고마웠던 점은 무엇인가요?',
  '지금의 나를 만드는 데 도움을 준 사람은 누구인가요?',
  '오늘 놓아주고 싶은 걱정은 무엇인가요?',
  '내가 진심으로 원하는 삶의 풍경은 어떤 모습인가요?'
];
function pickQuestion(){ return questions[Math.floor(Math.random()*questions.length)]; }

function loadDaily(){
  const data = loadAll(); const key = dailyDate.value || ymd(new Date()); const d = data.daily[key] || {};
  reflectionQuestion.value = d.q || pickQuestion();
  reflectionAnswer.value = d.qa || '';
  eventField.value = d.event || ''; thoughtField.value = d.thought || ''; feelingField.value = d.feeling || ''; resultField.value = d.result || '';
  grat1.value = (d.gratitude && d.gratitude[0]) || ''; grat2.value = (d.gratitude && d.gratitude[1]) || ''; grat3.value = (d.gratitude && d.gratitude[2]) || '';
  dailyNote.value = d.note || ''; tagsField.value = (d.tags || []).join(', ');
  statusDaily.textContent = '불러옴';
}

newQuestion.addEventListener('click', ()=>{ reflectionQuestion.value = pickQuestion(); });

saveDaily.addEventListener('click', ()=>{
  const data = loadAll(); const key = dailyDate.value || ymd(new Date());
  data.daily[key] = {
    q: reflectionQuestion.value, qa: reflectionAnswer.value.trim(),
    event: eventField.value.trim(), thought: thoughtField.value.trim(), feeling: feelingField.value.trim(), result: resultField.value.trim(),
    gratitude: [grat1.value.trim(), grat2.value.trim(), grat3.value.trim()], note: dailyNote.value.trim(),
    tags: tagsField.value.split(',').map(t=>t.trim()).filter(Boolean).map(t=> t.startsWith('#')?t:'#'+t ),
    updatedAt: new Date().toISOString()
  };
  saveAll(data); statusDaily.textContent = '저장됨';
});

clearDaily.addEventListener('click', ()=>{
  if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
  const data = loadAll(); const key = dailyDate.value || ymd(new Date()); delete data.daily[key]; saveAll(data); loadDaily(); statusDaily.textContent = '삭제됨';
});

// Weekly
const weekPicker = document.getElementById('weekPicker'); const prevWeek = document.getElementById('prevWeek'); const nextWeek = document.getElementById('nextWeek'); const thisWeekBtn = document.getElementById('thisWeekBtn');
const missionList = document.getElementById('missionList'); const newMission = document.getElementById('newMission'); const addMission = document.getElementById('addMission');
const healingText = document.getElementById('healingText'); const saveWeekly = document.getElementById('saveWeekly'); const clearWeekly = document.getElementById('clearWeekly');
const randomHealing = document.getElementById('randomHealing'); const startCopy = document.getElementById('startCopy'); const copyArea = document.getElementById('copyArea'); const copyPad = document.getElementById('copyPad'); const statusWeekly = document.getElementById('statusWeekly');

function setWeekInputByDate(date){ const d = new Date(date); weekPicker.value = weekId(d); loadWeekly(); }
function shiftWeek(delta){
  const val = weekPicker.value; if(!val){ setWeekInputByDate(new Date()); return; }
  const [y, w] = val.split('-W'); const simple = new Date(Date.UTC(parseInt(y), 0, 1 + (parseInt(w)-1)*7));
  const dow = simple.getUTCDay(); const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  ISOweekStart.setUTCDate(ISOweekStart.getUTCDate() + delta*7); setWeekInputByDate(new Date(ISOweekStart));
}
prevWeek.addEventListener('click', ()=>shiftWeek(-1)); nextWeek.addEventListener('click', ()=>shiftWeek(1)); thisWeekBtn.addEventListener('click', ()=>setWeekInputByDate(new Date()));
weekPicker.addEventListener('change', loadWeekly);

function renderMissions(items){
  missionList.innerHTML='';
  items.forEach((m, idx)=>{
    const row = document.createElement('div'); row.className='mission-item';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=!!m.done; cb.addEventListener('change', ()=>{ m.done = cb.checked; saveWeeklyData(); });
    const txt = document.createElement('input'); txt.type='text'; txt.value = m.text||''; txt.placeholder='미션 내용'; txt.addEventListener('input', ()=>{ m.text=txt.value; saveWeeklyData(); });
    const del = document.createElement('button'); del.className='btn danger'; del.textContent='삭제'; del.addEventListener('click', ()=>{ if(!confirm('이 미션을 삭제할까요?')) return; items.splice(idx,1); renderMissions(items); saveWeeklyData(); });
    row.appendChild(cb); row.appendChild(txt); row.appendChild(del); missionList.appendChild(row);
  });
}

function currentWeekKey(){ return weekPicker.value || weekId(new Date()); }
function loadWeekly(){
  const data = loadAll(); const key = currentWeekKey(); const w = data.weekly[key] || {missions:[], healing:'', copy:''};
  renderMissions(w.missions); healingText.value = w.healing || ''; copyPad.value = w.copy || ''; copyArea.classList.toggle('hidden', !copyPad.value);
  statusWeekly.textContent = '불러옴';
}
function saveWeeklyData(){
  const data = loadAll(); const key = currentWeekKey();
  const items = Array.from(missionList.querySelectorAll('.mission-item')).map(row=>{
    const cb = row.querySelector('input[type="checkbox"]'); const txt = row.querySelector('input[type="text"]');
    return {text: txt.value.trim(), done: cb.checked};
  }).filter(it=>it.text.length>0);
  data.weekly[key] = { missions: items, healing: healingText.value.trim(), copy: copyPad.value.trim(), updatedAt: new Date().toISOString() };
  saveAll(data); statusWeekly.textContent = '저장됨';
}
addMission.addEventListener('click', ()=>{ const txt = newMission.value.trim(); if(!txt) return; const data = loadAll(); const key = currentWeekKey(); const w = data.weekly[key] || {missions:[], healing:''}; w.missions.push({text: txt, done:false}); data.weekly[key]=w; saveAll(data); newMission.value=''; renderMissions(w.missions); statusWeekly.textContent='저장됨'; });
saveWeekly.addEventListener('click', saveWeeklyData);
clearWeekly.addEventListener('click', ()=>{ if(!confirm('이 주차의 주간 데이터를 모두 지울까요?')) return; const data = loadAll(); const key = currentWeekKey(); delete data.weekly[key]; saveAll(data); loadWeekly(); statusWeekly.textContent='삭제됨'; });
startCopy.addEventListener('click', ()=>{ copyArea.classList.remove('hidden'); copyPad.focus(); });

// Healing quotes (two-line essay style)
const healingBank = [
  '어제의 나를 탓하기보다\\n오늘의 나를 다독이는 사람이 되자.',
  '기분은 파도처럼 오가도\\n마음은 늘 나에게로 돌아온다.',
  '천천히 가도 괜찮아\\n넘어지지 말고, 멈추지 말자.',
  '부러움 대신 배움을 고르면\\n마음이 한결 가벼워진다.',
  '빛은 멀리서 오는 게 아니라\\n내 안에서 켜야 비친다.'
];
randomHealing.addEventListener('click', ()=>{ const pick = healingBank[Math.floor(Math.random()*healingBank.length)]; healingText.value = pick; });

// Search
const searchInput = document.getElementById('searchInput'); const searchBtn = document.getElementById('searchBtn'); const searchClear = document.getElementById('searchClear'); const searchResults = document.getElementById('searchResults');
function doSearch(){
  const q = searchInput.value.trim(); const data = loadAll(); const results = []; const isTagQuery = q.startsWith('#'); const qn = q.replace(/^#/, '').toLowerCase();
  Object.keys(data.daily).forEach(date => {
    const d = data.daily[date]; const hay = [d.q, d.qa, d.event, d.thought, d.feeling, d.result, ...(d.gratitude||[]), d.note].join(' ').toLowerCase(); const tags = (d.tags||[]).map(t=>t.replace(/^#/, '').toLowerCase());
    const match = isTagQuery ? tags.includes(qn) : hay.includes(qn);
    if(match) results.push({date, d});
  });
  results.sort((a,b)=> a.date.localeCompare(b.date)); renderResults(results);
}
function renderResults(list){
  searchResults.innerHTML = ''; if(list.length===0){ searchResults.innerHTML = '<p class="muted">결과가 없습니다.</p>'; return; }
  list.forEach(item=>{
    const div = document.createElement('div'); div.className='res'; div.style.borderTop='1px dashed var(--line)'; div.style.padding='.6rem 0';
    const h4 = document.createElement('h4'); h4.textContent = `${item.date}`;
    const p = document.createElement('p'); p.innerHTML = `<strong>질문</strong>: ${item.d.q||''}<br><strong>대답</strong>: ${item.d.qa||''}<br><strong>사건</strong>: ${item.d.event||''}<br><strong>생각</strong>: ${item.d.thought||''}<br><strong>감정</strong>: ${item.d.feeling||''}<br><strong>결과</strong>: ${item.d.result||''}<br><strong>감사</strong>: ${(item.d.gratitude||[]).filter(Boolean).join(', ')}<br><strong>일상</strong>: ${item.d.note||''}`;
    div.appendChild(h4); div.appendChild(p); searchResults.appendChild(div);
  });
}
searchBtn.addEventListener('click', doSearch); searchClear.addEventListener('click', ()=>{ searchInput.value=''; searchResults.innerHTML=''; });

// Export / Import
document.getElementById('exportJSON').addEventListener('click', ()=>{
  const data = loadAll(); const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `jinijjang_backup_${ymd(new Date())}.json`; a.click(); URL.revokeObjectURL(url);
});
document.getElementById('exportCSV').addEventListener('click', ()=>{
  const data = loadAll();
  const dailyRows = [['date','question','answer','event','thought','feeling','result','grat1','grat2','grat3','note','tags']];
  Object.keys(data.daily).sort().forEach(k=>{
    const d = data.daily[k];
    dailyRows.push([k, d.q||'', d.qa||'', d.event||'', d.thought||'', d.feeling||'', d.result||'', (d.gratitude&&d.gratitude[0])||'', (d.gratitude&&d.gratitude[1])||'', (d.gratitude&&d.gratitude[2])||'', d.note||'', (d.tags||[]).join(' ')]);
  });
  const weeklyRows = [['week','missions(json)','healing','copy']];
  Object.keys(data.weekly).sort().forEach(k=>{
    const w = data.weekly[k];
    weeklyRows.push([k, JSON.stringify(w.missions||[]), (w.healing||'').replace(/\\n/g,' / '), (w.copy||'').replace(/\\n/g,' / ')]);
  });
  function toCSV(rows){ return rows.map(r=>r.map(x=>{ const s=(x??'').toString().replace(/"/g,'""'); return `"${s}"`; }).join(',')).join('\\n'); }
  // ZIP via JSZip CDN
  function downloadZip(JSZip){ const zip = new JSZip(); zip.file(`daily_${ymd(new Date())}.csv`, toCSV(dailyRows)); zip.file(`weekly_${ymd(new Date())}.csv`, toCSV(weeklyRows)); zip.generateAsync({type:"blob"}).then((content)=>{ const url=URL.createObjectURL(content); const a=document.createElement('a'); a.href=url; a.download=`jinijjang_csv_${ymd(new Date())}.zip`; a.click(); URL.revokeObjectURL(url); }); }
  if(window.JSZip){ downloadZip(JSZip); } else { const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload=()=>downloadZip(JSZip); document.head.appendChild(s); }
});
document.getElementById('importJSON').addEventListener('click', ()=>{
  const f = document.getElementById('importFile').files[0]; if(!f){ alert('JSON 파일을 선택하세요.'); return; }
  const reader = new FileReader(); reader.onload = (e)=>{ try{ const incoming = JSON.parse(e.target.result); const current = loadAll(); const merged=current; merged.daily={...current.daily,...(incoming.daily||{})}; merged.weekly={...current.weekly,...(incoming.weekly||{})}; saveAll(merged); alert('가져오기가 완료되었습니다.'); loadDaily(); loadWeekly(); }catch(err){ alert('가져오기 실패: 올바른 JSON이 아닙니다.'); } }; reader.readAsText(f);
});

// Lock (disabled by default; only enabled when user toggles)
const lockEnabledChk = document.getElementById('lockEnabled'); const pinCodeInput = document.getElementById('pinCode'); const savePinBtn = document.getElementById('savePin');
function sha256(str){ const enc=new TextEncoder(); return crypto.subtle.digest('SHA-256', enc.encode(str)).then(buf=>Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('')); }
async function setPin(pin){ const s=loadSettings(); s.pinHash=await sha256(pin); saveSettings(s); }
savePinBtn.addEventListener('click', async ()=>{ const pin = pinCodeInput.value.trim(); if(!/^\d{6}$/.test(pin)){ alert('6자리 숫자 PIN을 입력하세요.'); return; } await setPin(pin); alert('PIN 저장 완료'); pinCodeInput.value=''; });
function applyLockUI(){ const s=loadSettings(); lockEnabledChk.checked=!!s.lockEnabled; } applyLockUI();
lockEnabledChk.addEventListener('change', ()=>{ const s=loadSettings(); s.lockEnabled=lockEnabledChk.checked; saveSettings(s); });
// No auto lock screen at startup in this build.

// Init
setDailyDate(new Date()); setWeekInputByDate(new Date());
