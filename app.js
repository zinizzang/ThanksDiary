
// ---------- storage ----------
const storeKey = 'ttc-journal-v1-3-7';
const settingsKey = 'ttc-settings-v1-3-7';

function loadAll(){
  try{ return JSON.parse(localStorage.getItem(storeKey)) || {daily:{}, weekly:{}}; }
  catch(e){ return {daily:{}, weekly:{}}; }
}
function saveAll(data){ localStorage.setItem(storeKey, JSON.stringify(data)); }
function loadSettings(){
  try{ return JSON.parse(localStorage.getItem(settingsKey)) || {}; }
  catch(e){ return {}; }
}
function saveSettings(s){ localStorage.setItem(settingsKey, JSON.stringify(s)); }

// ---------- utils ----------
function ymd(date){
  const d = new Date(date);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0,10);
}
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
function parseTags(s){
  if(!s) return [];
  return s.split(',').map(t=>t.trim()).filter(Boolean).map(t=>{
    if(t[0]!=='#') return '#'+t;
    return t;
  });
}
function normalizeText(s){ return (s||'').toLowerCase(); }

// auto-resize textareas
function autoResize(el){
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight+2)+'px';
}
document.addEventListener('input', (e)=>{
  if(e.target.classList.contains('auto')) autoResize(e.target);
});
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.auto').forEach(autoResize);
});

// ---------- theme ----------
const darkModeChk = document.getElementById('darkMode');
function applyTheme(){
  const s = loadSettings();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = (s.darkMode === 'dark') || (s.darkMode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', useDark);
  if(darkModeChk) darkModeChk.checked = (s.darkMode === 'dark');
}
if(darkModeChk){
  darkModeChk.addEventListener('change', ()=>{
    const s = loadSettings();
    s.darkMode = darkModeChk.checked ? 'dark':'light';
    saveSettings(s); applyTheme();
  });
}
applyTheme();

// ---------- routing ----------
const pages = {
  daily: document.getElementById('page-daily'),
  weekly: document.getElementById('page-weekly'),
  search: document.getElementById('page-search'),
  settings: document.getElementById('page-settings'),
};
const tabs = document.querySelectorAll('.tab-btn');
function setActiveTab(name){
  Object.values(pages).forEach(p=>p.classList.remove('active'));
  pages[name].classList.add('active');
  tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
}
function handleRoute(){
  const hash = location.hash || '#/daily';
  const name = hash.replace('#/','');
  if(pages[name]) setActiveTab(name); else setActiveTab('daily');
}
window.addEventListener('hashchange', handleRoute);
handleRoute();

// ---------- daily ----------
const dailyDate = document.getElementById('dailyDate');
const prevDay = document.getElementById('prevDay');
const nextDay = document.getElementById('nextDay');
const todayBtn = document.getElementById('todayBtn');

const qToday = document.getElementById('qToday');
const aToday = document.getElementById('aToday');
const newQ = document.getElementById('newQ');

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

const questions = [
  '사람들에게 어떤 사람으로 기억되고 싶나요?',
  '오늘 나를 웃게 만든 순간은 무엇이었나요?',
  '요즘 내 마음이 자주 머무는 곳은 어디인가요?',
  '내가 지키고 싶은 가치 한 가지는 무엇인가요?',
  '작게라도 용기 냈던 순간이 있나요?',
  '오늘 배운 것 중 내일도 가져가고 싶은 건 무엇인가요?'
];
function setQuestionRandom(){
  qToday.value = questions[Math.floor(Math.random()*questions.length)];
  autoResize(qToday);
}
newQ.addEventListener('click', ()=>{ setQuestionRandom(); });

function setDailyDate(d){
  dailyDate.value = ymd(d);
  loadDaily();
}
function shiftDaily(days){
  const cur = new Date(dailyDate.value || new Date());
  cur.setDate(cur.getDate()+days);
  setDailyDate(cur);
}
prevDay.addEventListener('click', ()=>shiftDaily(-1));
nextDay.addEventListener('click', ()=>shiftDaily(1));
todayBtn.addEventListener('click', ()=>setDailyDate(new Date()));
dailyDate.addEventListener('change', loadDaily);

function loadDaily(){
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  const d = data.daily[key] || {};
  qToday.value = d.q || questions[0];
  aToday.value = d.a || '';
  eventField.value = d.event || '';
  thoughtField.value = d.thought || '';
  feelingField.value = d.feeling || '';
  resultField.value = d.result || '';
  grat1.value = (d.gratitude && d.gratitude[0]) || '';
  grat2.value = (d.gratitude && d.gratitude[1]) || '';
  grat3.value = (d.gratitude && d.gratitude[2]) || '';
  dailyNote.value = d.note || '';
  tagsField.value = (d.tags || []).join(', ');
  [qToday,aToday,eventField,thoughtField,feelingField,resultField,dailyNote].forEach(autoResize);
  statusDaily.textContent = '불러옴';
}

saveDaily.addEventListener('click', ()=>{
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  data.daily[key] = {
    q: qToday.value.trim(),
    a: aToday.value.trim(),
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
  statusDaily.textContent = '저장됨';
});
clearDaily.addEventListener('click', ()=>{
  if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  delete data.daily[key];
  saveAll(data);
  loadDaily();
  statusDaily.textContent = '삭제됨';
});

// init daily
setDailyDate(new Date());
setQuestionRandom();

// ---------- weekly ----------
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
const transcribe = document.getElementById('transcribe');
const transcribeArea = document.getElementById('transcribeArea');
const transcribeBox = document.getElementById('transcribeBox');
const statusWeekly = document.getElementById('statusWeekly');

const healingBank = [
 '부러움 대신 배움을 고르면 마음은 가벼워진다',
 '오늘의 나를 어제의 나와만 비교하면 삶이 단단해진다',
 '완벽보다 꾸준함이 더 조용히 이긴다',
 '친절은 돌아오지 않아도 흔적을 남긴다',
 '불안은 계획을 좋아한다 작은 계획 하나면 충분하다',
 '내 속도가 느려 보여도 멈추지 않으면 결국 닿는다'
];
function setWeekInputByDate(date){
  const d = new Date(date);
  weekPicker.value = weekId(d);
  loadWeekly();
}
function shiftWeek(delta){
  const val = weekPicker.value;
  if(!val){ setWeekInputByDate(new Date()); return; }
  const [y, w] = val.split('-W');
  const simple = new Date(Date.UTC(parseInt(y), 0, 1 + (parseInt(w)-1)*7));
  const dow = simple.getUTCDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  ISOweekStart.setUTCDate(ISOweekStart.getUTCDate() + delta*7);
  setWeekInputByDate(new Date(ISOweekStart));
}
prevWeek.addEventListener('click', ()=>shiftWeek(-1));
nextWeek.addEventListener('click', ()=>shiftWeek(1));
thisWeekBtn.addEventListener('click', ()=>setWeekInputByDate(new Date()));
weekPicker.addEventListener('change', loadWeekly);

function renderMissions(items){
  missionList.innerHTML = '';
  items.forEach((m, idx)=>{
    const row = document.createElement('div');
    row.className = 'mission-item row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!m.done;
    cb.addEventListener('change', ()=>{ m.done = cb.checked; saveWeeklyData(); });
    const txt = document.createElement('input');
    txt.type = 'text';
    txt.value = m.text || '';
    txt.placeholder = '미션 내용';
    txt.addEventListener('input', ()=>{ m.text = txt.value; saveWeeklyData(); });
    const del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = '삭제';
    del.addEventListener('click', ()=>{
      if(!confirm('이 미션을 삭제할까요?')) return;
      items.splice(idx,1);
      renderMissions(items);
      saveWeeklyData();
    });
    row.appendChild(cb); row.appendChild(txt); row.appendChild(del);
    missionList.appendChild(row);
  });
}
function currentWeekKey(){ return weekPicker.value || weekId(new Date()); }
function loadWeekly(){
  const data = loadAll();
  const key = currentWeekKey();
  const w = data.weekly[key] || {missions:[], healing:'', transcribe:''};
  renderMissions(w.missions);
  healingText.value = w.healing || '';
  transcribeBox.value = w.transcribe || '';
  transcribeArea.classList.toggle('hidden', !(w.transcribe && w.transcribe.length));
  [healingText, transcribeBox].forEach(autoResize);
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
  data.weekly[key] = { missions: items, healing: healingText.value.trim(), transcribe: transcribeBox.value.trim(), updatedAt: new Date().toISOString() };
  saveAll(data);
  statusWeekly.textContent = '저장됨';
}
addMission.addEventListener('click', ()=>{
  const txt = newMission.value.trim(); if(!txt) return;
  const data = loadAll();
  const key = currentWeekKey();
  const w = data.weekly[key] || {missions:[], healing:''};
  w.missions.push({text: txt, done: false});
  data.weekly[key] = w; saveAll(data);
  newMission.value=''; renderMissions(w.missions);
  statusWeekly.textContent = '저장됨';
});
saveWeekly.addEventListener('click', ()=>{ saveWeeklyData(); });
clearWeekly.addEventListener('click', ()=>{
  if(!confirm('이 주차의 주간 데이터를 모두 지울까요?')) return;
  const data = loadAll(); const key = currentWeekKey();
  delete data.weekly[key]; saveAll(data); loadWeekly(); statusWeekly.textContent = '삭제됨';
});
randomHealing.addEventListener('click', ()=>{
  const pick = healingBank[Math.floor(Math.random()*healingBank.length)];
  healingText.value = pick; autoResize(healingText);
});
transcribe.addEventListener('click', ()=>{
  transcribeArea.classList.toggle('hidden');
  if(!transcribeArea.classList.contains('hidden')) transcribeBox.focus();
});

// init weekly
setWeekInputByDate(new Date());

// ---------- search ----------
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchClear = document.getElementById('searchClear');
const searchResults = document.getElementById('searchResults');

function doSearch(){
  const q = searchInput.value.trim();
  const data = loadAll();
  const results = [];
  const isTagQuery = q.startsWith('#');
  const qn = normalizeText(q.replace(/^#/, ''));
  Object.keys(data.daily).forEach(date => {
    const d = data.daily[date];
    const hay = [d.q, d.a, d.event, d.thought, d.feeling, d.result, ...(d.gratitude||[]), d.note].join(' ').toLowerCase();
    const tags = (d.tags||[]).map(t=>t.replace(/^#/, '').toLowerCase());
    let match = false;
    if(isTagQuery) match = tags.includes(qn);
    else match = hay.includes(qn);
    if(match) results.push({date, d});
  });
  results.sort((a,b)=> a.date.localeCompare(b.date));
  renderResults(results);
}
function renderResults(list){
  searchResults.innerHTML = '';
  if(list.length===0){ searchResults.innerHTML = '<p class="muted">결과가 없습니다.</p>'; return; }
  list.forEach(item=>{
    const div = document.createElement('div'); div.className='res card';
    const tags = (item.d.tags||[]).map(t=>`<span class="badge">${t}</span>`).join(' ');
    div.innerHTML = `<h4>${item.date}</h4>
      <p><strong>Q</strong> ${item.d.q||''}<br>
         <strong>A</strong> ${item.d.a||''}</p>
      <p><strong>사건</strong> ${item.d.event||''}<br>
         <strong>생각</strong> ${item.d.thought||''}<br>
         <strong>감정</strong> ${item.d.feeling||''}<br>
         <strong>결과</strong> ${item.d.result||''}<br>
         <strong>감사</strong> ${(item.d.gratitude||[]).filter(Boolean).join(', ')}<br>
         <strong>일상</strong> ${item.d.note||''}<br>${tags}</p>`;
    searchResults.appendChild(div);
  });
}
searchBtn.addEventListener('click', doSearch);
searchClear.addEventListener('click', ()=>{ searchInput.value=''; searchResults.innerHTML=''; });

// ---------- settings: backup & share ----------
document.getElementById('exportJSON').addEventListener('click', ()=>{
  const data = loadAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ttc_journal_backup_${ymd(new Date())}.json`; a.click();
  URL.revokeObjectURL(url);
});

async function shareJSONSafely(filename, jsonObj){
  const textPayload = JSON.stringify(jsonObj, null, 2);
  if (navigator.share) {
    try {
      await navigator.share({title: '지니짱 감사일기 백업', text: textPayload});
      alert('공유 완료!'); return;
    } catch(e){ console.warn(e); }
  }
  try {
    await navigator.clipboard.writeText(textPayload);
    alert('공유가 제한되어 JSON 내용을 복사했어요. 카톡에 붙여넣기 하세요!'); return;
  } catch(e){}
  try {
    const blob = new Blob([textPayload], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    alert('파일로 저장했습니다. 파일 앱 → 다운로드에서 확인하세요.');
  } catch(e){
    alert('공유/저장에 실패했습니다. 새로고침 후 다시 시도해 주세요.');
  }
}
document.getElementById('shareJSON').addEventListener('click', ()=>{
  shareJSONSafely(`ttc_journal_backup_${ymd(new Date())}.json`, loadAll());
});

document.getElementById('exportCSV').addEventListener('click', ()=>{
  const data = loadAll();
  const dailyRows = [['date','q','a','event','thought','feeling','result','grat1','grat2','grat3','note','tags']];
  Object.keys(data.daily).sort().forEach(k=>{
    const d = data.daily[k];
    dailyRows.push([k, d.q||'', d.a||'', d.event||'', d.thought||'', d.feeling||'', d.result||'',
      (d.gratitude&&d.gratitude[0])||'', (d.gratitude&&d.gratitude[1])||'', (d.gratitude&&d.gratitude[2])||'',
      d.note||'', (d.tags||[]).join(' ')]);
  });
  const weeklyRows = [['week','missions(json)','healing','transcribe']];
  Object.keys(data.weekly).sort().forEach(k=>{
    const w = data.weekly[k];
    weeklyRows.push([k, JSON.stringify(w.missions||[]), w.healing||'', w.transcribe||'']);
  });
  function toCSV(rows){
    return rows.map(r=>r.map(x=>{
      const s = (x??'').toString().replace(/"/g,'""');
      return `"${s}"`;
    }).join(',')).join('\n');
  }
  const zip = new JSZip();
  zip.file(`daily_${ymd(new Date())}.csv`, toCSV(dailyRows));
  zip.file(`weekly_${ymd(new Date())}.csv`, toCSV(weeklyRows));
  zip.generateAsync({type:"blob"}).then((content)=>{
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url; a.download = `ttc_journal_csv_${ymd(new Date())}.zip`; a.click();
    URL.revokeObjectURL(url);
  });
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
    }catch(err){ alert('가져오기 실패: 올바른 JSON이 아닙니다.'); }
  };
  reader.readAsText(f);
});

document.getElementById('refreshCache').addEventListener('click', async ()=>{
  if('serviceWorker' in navigator){
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r=>r.unregister()));
    location.reload(true);
  } else { location.reload(); }
});
document.getElementById('resetLocal').addEventListener('click', ()=>{
  if(!confirm('로컬 데이터를 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
  localStorage.removeItem(storeKey); alert('삭제되었습니다. 페이지를 새로고침하세요.');
});

// ---------- security (lock) basic off ----------
const lockEnabledChk = document.getElementById('lockEnabled');
const pinCodeInput = document.getElementById('pinCode');
const savePinBtn = document.getElementById('savePin');
const forceUnlockBtn = document.getElementById('forceUnlock');

function sha256(str){
  const enc = new TextEncoder();
  return crypto.subtle.digest('SHA-256', enc.encode(str)).then(buf => {
    const b = Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('');
    return b;
  });
}
async function setPin(pin){
  const s = loadSettings(); s.pinHash = await sha256(pin); saveSettings(s);
}
async function checkPin(pin){
  const s = loadSettings(); if(!s.pinHash) return false;
  const h = await sha256(pin); return h === s.pinHash;
}
function applyLockUI(){
  const s = loadSettings();
  lockEnabledChk.checked = !!s.lockEnabled;
}
lockEnabledChk.addEventListener('change', ()=>{
  const s = loadSettings(); s.lockEnabled = lockEnabledChk.checked; saveSettings(s); applyLockUI();
});
savePinBtn.addEventListener('click', async ()=>{
  const pin = pinCodeInput.value.trim();
  if(!/^\d{6}$/.test(pin)){ alert('6자리 숫자 PIN을 입력하세요.'); return; }
  await setPin(pin); alert('PIN 저장 완료'); pinCodeInput.value='';
});
forceUnlockBtn.addEventListener('click', ()=>{
  const s = loadSettings(); s.lockEnabled = false; saveSettings(s); alert('잠금을 강제로 해제했습니다.');
});
applyLockUI();
