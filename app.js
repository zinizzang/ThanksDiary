
const storeKey = 'ttc-journal-v1-3-8';
const settingsKey = 'ttc-settings-v1-3-8';

const QUESTION_BANK = ["오늘 나를 웃게 만든 순간은 무엇이었나요?", "사람들에게 어떤 사람으로 기억되고 싶나요?", "지금의 나에게 가장 고마운 것은 무엇인가요?", "오늘 배운 가장 작은 깨달음은 무엇이었나요?", "요즘 나를 지탱해 주는 습관은 무엇인가요?", "최근에 내려온 결정 중 잘한 선택은 무엇인가요?", "오늘 비워도 되는 걱정 한 가지는 무엇인가요?", "내가 지키고 싶은 경계는 어디까지인가요?", "오늘 나에게 다정했던 말이나 행동은 무엇이었나요?", "지금 손에 쥐고 있는 걸 내려놓으면 생길 여유는 무엇인가요?", "오늘의 나를 한 단어로 표현한다면?", "내일 아침의 나에게 남기고 싶은 메모는 무엇인가요?", "최근에 미루고 있는 일, 첫 한 걸음은 무엇일까요?", "오늘 내가 보인 용기는 무엇이었나요?", "지금 감사 인사를 전하고 싶은 사람은 누구인가요?", "최근 나를 설레게 한 작은 일은 무엇인가요?", "내가 더 듣고 싶은 말은 무엇인가요?", "요즘 내 마음이 원하는 휴식은 어떤 모습인가요?", "오늘 놓치고 싶지 않은 장면은 무엇이었나요?", "완벽 대신 진전을 선택한다면, 나는 무엇을 하게 될까요?", "최근 나를 힘들게 하는 생각을 다른 시각으로 본다면?", "오늘 칭찬하고 싶은 나의 태도는 무엇인가요?", "나를 안전하게 만드는 장소는 어디인가요?", "오늘 가장 잘한 멈춤은 무엇이었나요?", "나는 어떤 사람과 있을 때 빛이 나나요?", "요즘 나에게 필요한 한마디를 적어보세요.", "지금의 나에게 내려주고 싶은 허락은 무엇인가요?", "오늘 덜 하기로 결정해도 좋은 것은 무엇일까요?", "최근에 배운 ‘안 해도 되는 일’은 무엇인가요?", "나를 지키는 말 습관 하나를 적어보세요.", "오늘의 실수를 배움으로 바꾸려면?", "감정의 파도가 잦아들 때 나는 무엇을 느끼나요?", "오늘 가장 고요했던 순간은 언제였나요?", "나는 어떤 상황에서 내 편이 되어주나요?", "요즘 나의 기준 한 가지를 적어보세요.", "작은 친절이 나를 바꿨던 순간은?", "오늘 만난 우연에서 배운 점은 무엇인가요?", "지금의 나에게 필요 없는 비교는 무엇인가요?", "내가 해낼 수 있다고 믿는 이유는 무엇인가요?", "오늘 놓아주고 싶은 집착은 무엇인가요?", "나에게 휴일 같은 사람은 누구인가요?", "지금 돌봄이 필요한 내 마음의 부위는 어디인가요?", "오늘 마음이 가벼워진 이유는 무엇인가요?", "요즘 자주 떠오르는 소망은 무엇인가요?", "오늘 가장 고마웠던 도움은 무엇이었나요?", "나는 어떤 순간에 나를 신뢰하나요?", "오늘의 내가 어제의 나에게 해주고 싶은 말은?", "내가 나답다고 느낀 장면은 무엇인가요?"];
const HEALING_BANK = ["부러움 대신 배움을 고르면 마음은 가벼워진다", "오늘의 나를 어제의 나와만 비교하면 삶이 단단해진다", "완벽보다 꾸준함이 더 조용히 이긴다", "친절은 돌아오지 않아도 흔적을 남긴다", "해야 할 일 앞에서 숨고 싶을 땐 아주 작은 시작부터", "내 속도가 느려 보여도 멈추지 않으면 결국 닿는다", "받아들임은 끝이 아니라 출발선이다", "한 번의 깊은 호흡은 마음의 재부팅이다", "불안은 계획을 좋아한다 작은 계획 하나면 충분하다", "사랑받는 것보다 믿을 만한 사람이 되는 길을 고른다", "상처를 말로 꺼내면 무게가 나눠진다", "오늘의 수고를 내일의 나에게 친절로 남긴다", "비슷해 보여도 어제와 오늘의 나는 다르다", "마음이 복잡하면 기준을 하나만 남긴다", "뒤돌아보면 대부분의 두려움은 실제보다 작았다", "결정은 미루는 것이 아니라 선택하는 일이다", "내가 가진 것에 이름을 붙이면 고마움이 선명해진다", "쉬어가는 것도 전진이다", "사람을 바꾸기보다 기대를 조절하면 평화가 온다", "작은 규칙 하나가 하루를 구한다", "나에게 엄격할수록 타인에게도 엄격해진다 나에게 친절하자", "목표는 멀고 습관은 가깝다", "돌봄은 먼저 나로부터 시작된다", "멀리 가고 싶다면 가볍게 가자", "말을 삼키는 용기보다 꺼내는 용기가 더 필요할 때가 있다", "진심은 결국 제자리를 찾는다", "좋아하는 것을 꾸준히 하면 실력이 따라온다", "비교를 멈추면 속도가 보인다", "외로움은 연결이 아닌 관심의 결핍일 때가 많다", "오늘의 선택이 내일의 풍경을 만든다", "익숙함을 의심하면 성장의 문이 열린다", "사과는 지는 것이 아니라 관계를 지키는 일이다", "내가 쥔 것을 내려놓아야 새것을 잡을 수 있다", "의심은 근거로 달래고 불안은 행동으로 달랜다", "마음의 온도는 말의 온도에서 드러난다", "결핍을 탓하기보다 가능성을 적어 본다", "기다림도 돌봄의 한 형태다", "작은 기쁨을 발견하는 기술은 행복의 근육이다", "나를 설명하기보다 이해해 보려는 태도를 택한다", "투덜거림 대신 감사 목록을 적는다", "견디는 동안에도 조금씩 자란다", "오늘의 평화는 내 선택으로 온다", "실수는 실패가 아니라 시도한 증거다", "빨리보다 바르게를 고르면 후회가 줄어든다", "마음이 시끄러울수록 천천히 말한다", "좋은 질문이 좋은 하루를 만든다", "내 편이 되어 줄 말을 스스로 건넨다", "필요 없는 경쟁에서 한 걸음 물러난다", "작은 정리 하나가 큰 여유를 만든다", "나는 오늘도 충분히 해냈다"];

// simple persistent sets to avoid repetition
function pickNonRepeating(key, arr) {
  const seenKey = key + '-seen';
  let seen = new Set(JSON.parse(localStorage.getItem(seenKey) || '[]'));
  // reset if all used
  if (seen.size >= arr.length) seen = new Set();
  // pick first not seen from shuffled
  const order = arr.map((v,i)=>i).sort(()=>Math.random()-0.5);
  let picked = order.find(i => !seen.has(i));
  if (picked == null) picked = order[0];
  seen.add(picked);
  localStorage.setItem(seenKey, JSON.stringify(Array.from(seen)));
  return arr[picked];
}

function loadAll(){
  try{ return JSON.parse(localStorage.getItem(storeKey)) || {daily:{}, weekly:{}}; }
  catch(e){ return {daily:{}, weekly:{}}; }
}
function saveAll(data){ localStorage.setItem(storeKey, JSON.stringify(data)); }
function loadSettings(){ try{ return JSON.parse(localStorage.getItem(settingsKey)) || {}; }catch(e){ return {}; } }
function saveSettings(s){ localStorage.setItem(settingsKey, JSON.stringify(s)); }

function ymd(date){
  const d = new Date(date);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0,10);
}

function route(){
  const hash = location.hash || '#/daily';
  document.querySelectorAll('.tab-btn').forEach(a=>a.classList.toggle('active', a.getAttribute('href')===hash));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const id = hash.replace('#/','');
  const el = document.getElementById('page-' + id);
  if (el) el.classList.add('active');
}
window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// auto-resize textareas
function autoResize(el){
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight+2) + 'px';
}
document.addEventListener('input', (e)=>{
  if(e.target.matches('textarea.auto')) autoResize(e.target);
});

// DAILY
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
const saveState = document.getElementById('saveState');

const qText = document.getElementById('todayQuestion');
const qNext = document.getElementById('nextQuestion');
const qAns = document.getElementById('questionAnswer');

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
  qText.value = d.qText || pickNonRepeating('question', QUESTION_BANK);
  qAns.value = d.qAns || '';
  eventField.value = d.event || '';
  thoughtField.value = d.thought || '';
  feelingField.value = d.feeling || '';
  resultField.value = d.result || '';
  grat1.value = (d.gratitude && d.gratitude[0]) || '';
  grat2.value = (d.gratitude && d.gratitude[1]) || '';
  grat3.value = (d.gratitude && d.gratitude[2]) || '';
  dailyNote.value = d.note || '';
  tagsField.value = (d.tags || []).join(', ');
  [qText,qAns,eventField,thoughtField,feelingField,resultField,dailyNote].forEach(autoResize);
  saveState.textContent = '불러옴';
}
qNext.addEventListener('click', ()=>{
  qText.value = pickNonRepeating('question', QUESTION_BANK);
  autoResize(qText);
});

saveDaily.addEventListener('click', ()=>{
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  data.daily[key] = {
    qText: qText.value.trim(),
    qAns: qAns.value.trim(),
    event: eventField.value.trim(),
    thought: thoughtField.value.trim(),
    feeling: feelingField.value.trim(),
    result: resultField.value.trim(),
    gratitude: [grat1.value.trim(), grat2.value.trim(), grat3.value.trim()],
    note: dailyNote.value.trim(),
    tags: (tagsField.value||'').split(',').map(t=>t.trim()).filter(Boolean),
    updatedAt: new Date().toISOString()
  };
  saveAll(data);
  saveState.textContent = '저장됨';
});
clearDaily.addEventListener('click', ()=>{
  if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
  const data = loadAll();
  const key = dailyDate.value || ymd(new Date());
  delete data.daily[key];
  saveAll(data);
  loadDaily();
  saveState.textContent = '삭제됨';
});

// WEEKLY
const weekPicker = document.getElementById('weekPicker');
const prevWeek = document.getElementById('prevWeek');
const nextWeek = document.getElementById('nextWeek');
const thisWeekBtn = document.getElementById('thisWeekBtn');
const missionList = document.getElementById('missionList');
const newMission = document.getElementById('newMission');
const addMission = document.getElementById('addMission');
const healingText = document.getElementById('healingText');
const randomHealing = document.getElementById('randomHealing');
const saveWeekly = document.getElementById('saveWeekly');
const clearWeekly = document.getElementById('clearWeekly');
const startScribe = document.getElementById('startScribe');
const scribeArea = document.getElementById('scribeArea');

function isoWeekId(date){
  const d = new Date(date);
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(),0,4));
  const weekNo = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay()+6)%7)) / 7);
  const year = target.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2,'0')}`;
}

function setWeekInputByDate(date){
  const wId = isoWeekId(date);
  weekPicker.value = wId;
  loadWeekly();
}
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
  setWeekInputByDate(new Date(start));
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
    cb.addEventListener('change', ()=>{ m.done=cb.checked; saveWeeklyData(); });
    const txt = document.createElement('input');
    txt.type='text'; txt.value=m.text||''; txt.placeholder='미션 내용';
    txt.addEventListener('input', ()=>{ m.text=txt.value; saveWeeklyData(); });
    const del = document.createElement('button');
    del.className='btn danger'; del.textContent='삭제';
    del.addEventListener('click', ()=>{ if(!confirm('이 미션을 삭제할까요?')) return;
      items.splice(idx,1); renderMissions(items); saveWeeklyData(); });
    row.appendChild(cb); row.appendChild(txt); row.appendChild(del);
    missionList.appendChild(row);
  });
}

function currentWeekKey(){ return weekPicker.value || isoWeekId(new Date()); }
function loadWeekly(){
  const data = loadAll();
  const key = currentWeekKey();
  const w = data.weekly[key] || {missions:[], healing:''};
  renderMissions(w.missions);
  healingText.value = w.healing || pickNonRepeating('healing', HEALING_BANK);
  [healingText].forEach(autoResize);
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
  const data = loadAll(); const key=currentWeekKey();
  const w = data.weekly[key] || {missions:[], healing:''};
  w.missions.push({text:txt, done:false});
  data.weekly[key]=w; saveAll(data); newMission.value=''; renderMissions(w.missions);
});
saveWeekly.addEventListener('click', ()=>{ saveWeeklyData(); alert('주간 데이터가 저장되었습니다.'); });
clearWeekly.addEventListener('click', ()=>{
  if(!confirm('이 주차의 주간 데이터를 모두 지울까요?')) return;
  const data = loadAll(); const key=currentWeekKey();
  delete data.weekly[key]; saveAll(data); loadWeekly(); alert('삭제되었습니다.');
});
randomHealing.addEventListener('click', ()=>{
  healingText.value = pickNonRepeating('healing', HEALING_BANK);
  autoResize(healingText);
});
startScribe.addEventListener('click', ()=>{
  scribeArea.classList.toggle('hidden');
  if(!scribeArea.classList.contains('hidden')){ scribeArea.value=''; autoResize(scribeArea); scribeArea.focus(); }
});

// Search
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchClear = document.getElementById('searchClear');
const searchResults = document.getElementById('searchResults');
function doSearch(){
  const q = searchInput.value.trim(); const data = loadAll(); const results = [];
  const isTag = q.startsWith('#'); const qn = q.replace(/^#/, '').toLowerCase();
  Object.keys(data.daily).forEach(date=>{
    const d = data.daily[date];
    const hay = [d.qText,d.qAns,d.event,d.thought,d.feeling,d.result,...(d.gratitude||[]),d.note].join(' ').toLowerCase();
    const tags = (d.tags||[]).map(t=>t.replace(/^#/,'').toLowerCase());
    const match = isTag ? tags.includes(qn) : hay.includes(qn);
    if(match) results.push({date, d});
  });
  results.sort((a,b)=>a.date.localeCompare(b.date));
  renderResults(results);
}
function renderResults(list){
  searchResults.innerHTML='';
  if(list.length===0){ searchResults.innerHTML='<p class="muted">결과가 없습니다.</p>'; return; }
  list.forEach(item=>{
    const div = document.createElement('div'); div.className='res'; div.style.borderTop='1px dashed var(--line)'; div.style.padding='.6rem 0';
    const h4 = document.createElement('h4'); h4.textContent=item.date; div.appendChild(h4);
    const p = document.createElement('p'); p.innerHTML =
      `<strong>질문</strong>: ${item.d.qText||''}<br>`+
      `<strong>답</strong>: ${item.d.qAns||''}<br>`+
      `<strong>사건</strong>: ${item.d.event||''}<br>`+
      `<strong>생각</strong>: ${item.d.thought||''}<br>`+
      `<strong>감정</strong>: ${item.d.feeling||''}<br>`+
      `<strong>결과</strong>: ${item.d.result||''}<br>`+
      `<strong>감사</strong>: ${(item.d.gratitude||[]).filter(Boolean).join(', ')}<br>`+
      `<strong>일상</strong>: ${item.d.note||''}`;
    div.appendChild(p); searchResults.appendChild(div);
  });
}
searchBtn.addEventListener('click', doSearch);
searchClear.addEventListener('click', ()=>{ searchInput.value=''; searchResults.innerHTML=''; });

// Settings: theme
const darkModeChk = document.getElementById('darkMode');
function applyTheme(){
  const s = loadSettings();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = (s.darkMode === 'dark') || (s.darkMode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', useDark);
  if(darkModeChk) darkModeChk.checked = (s.darkMode === 'dark');
}
applyTheme();
darkModeChk.addEventListener('change', ()=>{ const s=loadSettings(); s.darkMode=darkModeChk.checked?'dark':'light'; saveSettings(s); applyTheme(); });

// Settings: backup
async function shareJSONSafely(filename, jsonObj){
  const textPayload = JSON.stringify(jsonObj, null, 2);
  if(navigator.share) {
    try{ await navigator.share({title:'지니짱 감사일기 백업', text: textPayload}); alert('공유 완료!'); return; }catch(e){}
  }
  try{ await navigator.clipboard.writeText(textPayload); alert('공유가 제한되어 JSON을 클립보드에 복사했어요. 카톡에 붙여넣기 하세요!'); return; }
  catch(e){}
  const blob = new Blob([textPayload], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
document.getElementById('exportJSON').addEventListener('click', ()=>{ const data=loadAll(); const fn=`ttc_journal_backup_${ymd(new Date())}.json`; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=fn; a.click(); URL.revokeObjectURL(url); });
document.getElementById('shareJSON').addEventListener('click', ()=>{ shareJSONSafely(`ttc_journal_backup_${ymd(new Date())}.json`, loadAll()); });
document.getElementById('exportCSV').addEventListener('click', ()=>{ 
  const data = loadAll();
  function toCSV(rows){ return rows.map(r=>r.map(x=>`"${(x??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n'); }
  const dailyRows = [['date','question','answer','event','thought','feeling','result','grat1','grat2','grat3','note','tags']];
  Object.keys(data.daily).sort().forEach(k=>{
    const d=data.daily[k];
    dailyRows.push([k,d.qText||'',d.qAns||'',d.event||'',d.thought||'',d.feeling||'',d.result||'',(d.gratitude&&d.gratitude[0])||'',(d.gratitude&&d.gratitude[1])||'',(d.gratitude&&d.gratitude[2])||'',d.note||'',(d.tags||[]).join(' ')]);
  });
  const weeklyRows = [['week','missions(json)','healing']];
  Object.keys(data.weekly).sort().forEach(k=>{ const w=data.weekly[k]; weeklyRows.push([k, JSON.stringify(w.missions||[]), w.healing||'']); });
  const zipScript = document.createElement('script'); zipScript.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  zipScript.onload = ()=>{ const zip = new JSZip(); zip.file(`daily_${ymd(new Date())}.csv`, toCSV(dailyRows)); zip.file(`weekly_${ymd(new Date())}.csv`, toCSV(weeklyRows)); zip.generateAsync({type:'blob'}).then(b=>{ const url=URL.createObjectURL(b); const a=document.createElement('a'); a.href=url; a.download=`ttc_journal_csv_${ymd(new Date())}.zip`; a.click(); URL.revokeObjectURL(url); }); };
  document.head.appendChild(zipScript);
});
document.getElementById('importJSON').addEventListener('click', ()=>{ const f=document.getElementById('importFile').files[0]; if(!f){alert('JSON 파일을 선택하세요.');return;} const reader=new FileReader(); reader.onload=(e)=>{ try{ const incoming=JSON.parse(e.target.result); const current=loadAll(); current.daily={...current.daily, ...(incoming.daily||{})}; current.weekly={...current.weekly, ...(incoming.weekly||{})}; saveAll(current); alert('가져오기 완료'); }catch(err){ alert('가져오기 실패'); } }; reader.readAsText(f); });
document.getElementById('refreshCache').addEventListener('click', async ()=>{ if('serviceWorker' in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); location.reload(true); } else location.reload(true); });
document.getElementById('resetLocal').addEventListener('click', ()=>{ if(confirm('로컬 데이터를 모두 삭제할까요?')){ localStorage.removeItem(storeKey); alert('삭제되었습니다. 페이지를 새로고침하세요.'); } });

// Security (Face ID toggle only UI placeholder — left off by default)
const lockEnabledChk = document.getElementById('lockEnabled');
lockEnabledChk.addEventListener('change', ()=>{ const s=loadSettings(); s.lockEnabled=lockEnabledChk.checked; saveSettings(s); alert('잠금 설정은 추후 동기화 버전에서 활성화합니다.'); });

// init
setDailyDate(new Date());
setWeekInputByDate(new Date());
