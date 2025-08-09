
const storeKey = 'ttc-journal-v1-1';
const settingsKey = 'ttc-settings-v1-1'; // {darkMode, lockEnabled, pinHash, credId}

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

// Dark mode
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
    const s = loadSettings();
    s.darkMode = isDark ? 'light':'dark';
    saveSettings(s); applyTheme();
  });
}
if(darkModeChk){
  darkModeChk.addEventListener('change', ()=>{
    const s = loadSettings();
    s.darkMode = darkModeChk.checked ? 'dark':'light';
    saveSettings(s); applyTheme();
  });
}
applyTheme();

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(el=>el.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
  });
});

// Daily
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
  eventField.value = d.event || '';
  thoughtField.value = d.thought || '';
  feelingField.value = d.feeling || '';
  resultField.value = d.result || '';
  grat1.value = (d.gratitude && d.gratitude[0]) || '';
  grat2.value = (d.gratitude && d.gratitude[1]) || '';
  grat3.value = (d.gratitude && d.gratitude[2]) || '';
  dailyNote.value = d.note || '';
  tagsField.value = (d.tags || []).join(', ');
}

saveDaily.addEventListener('click', ()=>{
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  data.daily[key] = {
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
  alert('저장되었습니다.');
});

clearDaily.addEventListener('click', ()=>{
  if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  delete data.daily[key];
  saveAll(data);
  loadDaily();
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

function setWeekInputByDate(date){
  const d = new Date(date);
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(),0,4));
  const weekNo = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay()+6)%7)) / 7);
  const year = target.getUTCFullYear();
  const wId = `${year}-W${String(weekNo).padStart(2,'0')}`;
  weekPicker.value = wId;
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
    row.className = 'mission-item';
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
function currentWeekKey(){ return weekPicker.value || (function(){ const d=new Date(); const t=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-n+3); const ft=new Date(Date.UTC(t.getUTCFullYear(),0,4)); const w=1+Math.round(((t-ft)/86400000-3+((ft.getUTCDay()+6)%7))/7); const y=t.getUTCFullYear(); return `${y}-W${String(w).padStart(2,'0')}`; })(); }
function loadWeekly(){
  const data = loadAll();
  const key = currentWeekKey();
  const w = data.weekly[key] || {missions:[], healing:''};
  renderMissions(w.missions);
  healingText.value = w.healing || '';
}
function saveWeeklyData(){
  const data = loadAll();
  const key = currentWeekKey();
  const items = Array.from(missionList.querySelectorAll('.mission-item')).map(row=>{
    const cb = row.querySelector('input[type="checkbox"]');
    const txt = row.querySelector('input[type="text"]');
    return {text: txt.value.trim(), done: cb.checked};
  }).filter(it=>it.text.length>0);
  data.weekly[key] = { missions: items, healing: healingText.value.trim(), updatedAt: new Date().toISOString() };
  saveAll(data);
}
addMission.addEventListener('click', ()=>{
  const txt = newMission.value.trim(); if(!txt) return;
  const data = loadAll();
  const key = currentWeekKey();
  const w = data.weekly[key] || {missions:[], healing:''};
  w.missions.push({text: txt, done: false});
  data.weekly[key] = w; saveAll(data);
  newMission.value=''; renderMissions(w.missions);
});
saveWeekly.addEventListener('click', ()=>{ saveWeeklyData(); alert('주간 데이터가 저장되었습니다.'); });
clearWeekly.addEventListener('click', ()=>{
  if(!confirm('이 주차의 주간 데이터를 모두 지울까요?')) return;
  const data = loadAll(); const key = currentWeekKey();
  delete data.weekly[key]; saveAll(data); loadWeekly(); alert('삭제되었습니다.');
});
const healingBank = ['나는 오늘도 충분히 해냈다.','완벽보다 진전. 한 걸음이면 충분하다.','숨을 깊게 들이쉬고, 나를 믿자.','지금 이 순간, 나는 안전하다.','작은 친절이 오늘을 바꾼다.'];
randomHealing.addEventListener('click', ()=>{ const pick = healingBank[Math.floor(Math.random()*healingBank.length)]; healingText.value = pick; });

// Search
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
    const hay = [d.event, d.thought, d.feeling, d.result, ...(d.gratitude||[]), d.note].join(' ').toLowerCase();
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
    const div = document.createElement('div'); div.className='res';
    const h4 = document.createElement('h4'); h4.textContent = `${item.date}`;
    const tags = (item.d.tags||[]).map(t=>`<span class="badge">${t}</span>`).join(' ');
    const p = document.createElement('p');
    p.innerHTML = `<strong>사건</strong>: ${item.d.event||''}<br>
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

// Export / Import
document.getElementById('exportJSON').addEventListener('click', ()=>{
  const data = loadAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ttc_journal_backup_${ymd(new Date())}.json`; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('exportCSV').addEventListener('click', ()=>{
  const data = loadAll();
  const dailyRows = [['date','event','thought','feeling','result','grat1','grat2','grat3','note','tags']];
  Object.keys(data.daily).sort().forEach(k=>{
    const d = data.daily[k];
    dailyRows.push([k, d.event||'', d.thought||'', d.feeling||'', d.result||'',
      (d.gratitude&&d.gratitude[0])||'', (d.gratitude&&d.gratitude[1])||'', (d.gratitude&&d.gratitude[2])||'', d.note||'', (d.tags||[]).join(' ')]);
  });
  const weeklyRows = [['week','missions(json)','healing']];
  Object.keys(data.weekly).sort().forEach(k=>{
    const w = data.weekly[k];
    weeklyRows.push([k, JSON.stringify(w.missions||[]), w.healing||'']);
  });
  function toCSV(rows){
    return rows.map(r=>r.map(x=>{
      const s = (x??'').toString().replace(/"/g,'""');
      return `"${s}"`;
    }).join(',')).join('\n');
  }
  function downloadZip(JSZip){
    const zip = new JSZip();
    zip.file(`daily_${ymd(new Date())}.csv`, toCSV(dailyRows));
    zip.file(`weekly_${ymd(new Date())}.csv`, toCSV(weeklyRows));
    zip.generateAsync({type:"blob"}).then((content)=>{
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url; a.download = `ttc_journal_csv_${ymd(new Date())}.zip`; a.click();
      URL.revokeObjectURL(url);
    });
  }
  if(window.JSZip){ downloadZip(JSZip); }
  else{
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    s.onload = ()=>downloadZip(JSZip);
    document.head.appendChild(s);
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

// Face ID lock (WebAuthn-lite)
const lockScreen = document.getElementById('lockScreen');
const unlockBtn = document.getElementById('unlockBtn');
const lockBypass = document.getElementById('lockBypass');
const pinArea = document.getElementById('pinArea');
const pinInput = document.getElementById('pinInput');
const pinSubmit = document.getElementById('pinSubmit');
const lockEnabledChk = document.getElementById('lockEnabled');
const pinCodeInput = document.getElementById('pinCode');
const savePinBtn = document.getElementById('savePin');

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
savePinBtn.addEventListener('click', async ()=>{
  const pin = pinCodeInput.value.trim();
  if(!/^\d{6}$/.test(pin)){ alert('6자리 숫자 PIN을 입력하세요.'); return; }
  await setPin(pin); alert('PIN 저장 완료');
  pinCodeInput.value='';
});

lockBypass.addEventListener('click', ()=>{
  pinArea.classList.remove('hidden');
  pinInput.focus();
});
pinSubmit.addEventListener('click', async ()=>{
  const ok = await checkPin(pinInput.value.trim());
  if(ok){ lockScreen.classList.add('hidden'); pinInput.value=''; }
  else{ alert('PIN이 올바르지 않습니다.'); }
});

unlockBtn.addEventListener('click', async ()=>{
  try{
    const s = loadSettings();
    if(!window.PublicKeyCredential){ throw new Error('이 브라우저는 WebAuthn을 지원하지 않습니다.'); }
    if(!s.credId){
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {name: 'TTC Journal', id: location.hostname},
          user: {id: new TextEncoder().encode('local-user'), name: 'local-user', displayName: 'Local User'},
          pubKeyCredParams: [{type: 'public-key', alg: -7}],
          authenticatorSelection: {authenticatorAttachment:'platform', userVerification:'required'},
          timeout: 60000,
          attestation: 'none'
        }
      });
      s.credId = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
      saveSettings(s);
    }
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credIdBytes = Uint8Array.from(atob(loadSettings().credId), c=>c.charCodeAt(0));
    await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{id: credIdBytes, type:'public-key', transports:['internal']}],
        userVerification: 'required',
        timeout: 60000
      }
    });
    lockScreen.classList.add('hidden');
  }catch(e){
    alert('인증 실패/취소: ' + (e.message||e));
  }
});

function applyLockUI(){
  const s = loadSettings();
  lockEnabledChk.checked = !!s.lockEnabled;
  if(s.lockEnabled){ lockScreen.classList.remove('hidden'); }
  else{ lockScreen.classList.add('hidden'); }
}
lockEnabledChk.addEventListener('change', ()=>{
  const s = loadSettings(); s.lockEnabled = lockEnabledChk.checked; saveSettings(s); applyLockUI();
});

// Init
setDailyDate(new Date());
setWeekInputByDate(new Date());
applyLockUI();
