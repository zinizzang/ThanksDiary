// ======= Firebase bootstrap (optional, with graceful fallback) =======
let app, auth, db;
(function initFirebase(){
  if (window.firebaseConfig && window.firebase && window.firebase.initializeApp){
    app = firebase.initializeApp(window.firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
  }else{
    console.warn('Firebase config not found. Local-only mode.');
  }
})();

// ======= State =======
let currentDate = new Date();

// ======= DOM Utils =======
function $(id){return document.getElementById(id);}
function fmtDate(d){ return d.toISOString().slice(0,10); } // YYYY-MM-DD

function getISODate(d){
  if(typeof d === 'string') return d;
  return fmtDate(d);
}

// Week label (YYYY-Www)
function getWeekLabel(dateStr){
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(),0,1);
  const days = Math.floor((d - onejan) / 86400000);
  const week = Math.ceil((days + onejan.getDay()+1)/7);
  return `${d.getFullYear()}년 ${week}주`;
}

// Toast
function toast(msg="저장 완료!"){
  const t = $('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1300);
}

// Section routing
function showSection(key){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  $(`page-${key}`).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  $(`tab${key[0].toUpperCase()+key.slice(1)}`).classList.add('active');
}

$('tabDaily')?.addEventListener('click', ()=>showSection('daily'));
$('tabWeekly')?.addEventListener('click', ()=>showSection('weekly'));
$('tabSearch')?.addEventListener('click', ()=>showSection('search'));
$('tabSettings')?.addEventListener('click', ()=>showSection('settings'));

// ======= Date controls =======
function setDateToInput(d){
  $('dateInput').value = fmtDate(d);
  $('weekLabel').textContent = getWeekLabel(fmtDate(d));
}
$('dateInput')?.addEventListener('change', e=>{
  currentDate = new Date(e.target.value);
  loadDaily();
  loadWeekly();
});
$('todayBtn')?.addEventListener('click', ()=>{
  currentDate = new Date();
  setDateToInput(currentDate);
  loadDaily();
  loadWeekly();
});

// ======= Questions (simple pool) =======
const QUESTIONS = [
  "지금의 나에게 꼭 필요한 한 마디는?",
  "사람들에게 어떤 사람으로 기억되고 싶나요?",
  "오늘 나를 미소 짓게 한 순간은?",
  "내가 더 알고 싶은 나의 모습은 어떤 모습인가요?"
];
function randomQuestion(){
  const used = JSON.parse(localStorage.getItem('usedQuestions')||'[]');
  const pool = QUESTIONS.filter(q=>!used.includes(q));
  const q = (pool.length? pool:QUESTIONS)[Math.floor(Math.random()* (pool.length? pool.length:QUESTIONS.length))];
  $('question').value = q;
  if(!used.includes(q)){ used.push(q); localStorage.setItem('usedQuestions', JSON.stringify(used));}
}
$('qRandom')?.addEventListener('click', randomQuestion);
$('qClear')?.addEventListener('click', ()=>{$('answer').value='';});

$('qSave')?.addEventListener('click', async ()=>{
  const d = getISODate(currentDate);
  const data = {
    date: d,
    question: $('question').value.trim(),
    answer: $('answer').value.trim()
  };
  saveLocal(`daily:${d}:qna`, data);
  if(auth && auth.currentUser && db){
    const ref = db.collection('users').doc(auth.currentUser.uid).collection('emotion').doc(d);
    await ref.set({ qna:data }, { merge:true });
  }
  toast('저장 완료!');
});

// ======= Local storage helpers =======
function saveLocal(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function getLocal(key){ try{ return JSON.parse(localStorage.getItem(key)||'null'); }catch(e){ return null; }}

// ======= Daily save/load =======
function collectDaily(){
  return {
    date: getISODate(currentDate),
    ttc: {
      event: $('ttcEvent').value.trim(),
      thought: $('ttcThought').value.trim(),
      emotion: $('ttcEmotion').value.trim(),
      result: $('ttcResult').value.trim(),
    },
    thanks: [ $('thanks1').value.trim(), $('thanks2').value.trim(), $('thanks3').value.trim() ],
    daily: $('dailyNote').value.trim(),
    tags: $('tagInput').value.trim()
  };
}
async function saveDaily(){
  const data = collectDaily();
  const key = `daily:${data.date}`;
  saveLocal(key, data);
  if(auth && auth.currentUser && db){
    const ref = db.collection('users').doc(auth.currentUser.uid).collection('emotion').doc(data.date);
    await ref.set(data, { merge:true });
  }
  toast('저장 완료!');
}
function clearDaily(){
  ['ttcEvent','ttcThought','ttcEmotion','ttcResult','thanks1','thanks2','thanks3','dailyNote','tagInput']
    .forEach(id=>{ const el=$(id); if(el) el.value=''; });
  toast('비움!');
}
async function loadDaily(){
  const d = getISODate(currentDate);
  setDateToInput(currentDate);
  let data = getLocal(`daily:${d}`);
  if (!data && auth && auth.currentUser && db){
    const snap = await db.collection('users').doc(auth.currentUser.uid).collection('emotion').doc(d).get();
    data = snap.exists ? snap.data() : null;
  }
  $('ttcEvent').value = data?.ttc?.event || '';
  $('ttcThought').value = data?.ttc?.thought || '';
  $('ttcEmotion').value = data?.ttc?.emotion || '';
  $('ttcResult').value = data?.ttc?.result || '';
  $('thanks1').value = data?.thanks?.[0] || '';
  $('thanks2').value = data?.thanks?.[1] || '';
  $('thanks3').value = data?.thanks?.[2] || '';
  $('dailyNote').value = data?.daily || '';
  $('tagInput').value = data?.tags || '';
  // QnA
  const q = getLocal(`daily:${d}:qna`);
  $('question').value = q?.question || $('question').value || QUESTIONS[0];
  $('answer').value = q?.answer || '';
}

$('dailySaveBtn')?.addEventListener('click', saveDaily);
$('dailyClearBtn')?.addEventListener('click', clearDaily);

// ======= Weekly save/load =======
function getWeekKey(dateStr){
  // YYYY-Www
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(),0,1);
  const days = Math.floor((d - onejan) / 86400000);
  const week = Math.ceil((days + onejan.getDay()+1)/7);
  const wk = `W${String(week).padStart(2,'0')}`;
  return `${d.getFullYear()}-${wk}`;
}
function renderMissions(items=[]){
  const ul = $('missionList');
  ul.innerHTML='';
  items.forEach((m,idx)=>{
    const li = document.createElement('li');
    li.className='mission-item';
    li.innerHTML = `<input type="checkbox" ${m.done?'checked':''} data-idx="${idx}">
      <input class="input" value="${m.text||''}" data-idx="${idx}" style="flex:1">`;
    ul.appendChild(li);
  });
}
$('addMission')?.addEventListener('click', ()=>{
  const txt = $('newMission').value.trim();
  if(!txt) return;
  missions.push({done:false, text:txt});
  $('newMission').value='';
  renderMissions(missions);
});

let missions = [];
async function loadWeekly(){
  const d = getISODate(currentDate);
  const wk = getWeekKey(d);
  let data = getLocal(`weekly:${wk}`);
  if(!data && auth && auth.currentUser && db){
    const ref = db.collection('users').doc(auth.currentUser.uid).collection('weekly').doc(wk);
    const snap = await ref.get();
    data = snap.exists ? snap.data() : null;
  }
  missions = data?.missions || [];
  $('healing').value = data?.healing || '';
  $('copy').value = data?.copy || '';
  renderMissions(missions);
  $('weekLabel').textContent = getWeekLabel(d);
}
$('missionList')?.addEventListener('input', (e)=>{
  const idx = +e.target.dataset.idx;
  if(e.target.type==='checkbox'){ missions[idx].done = e.target.checked; }
  else { missions[idx].text = e.target.value; }
});
$('weeklySaveBtn')?.addEventListener('click', async ()=>{
  const d = getISODate(currentDate);
  const wk = getWeekKey(d);
  const data = { missions, healing:$('healing').value.trim(), copy:$('copy').value.trim(), week:wk };
  saveLocal(`weekly:${wk}`, data);
  if(auth && auth.currentUser && db){
    const ref = db.collection('users').doc(auth.currentUser.uid).collection('weekly').doc(wk);
    await ref.set(data, { merge:true });
  }
  toast('저장 완료!');
});

// ======= Search =======
function escapeHtml(s=''){return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]));}
async function fetchSearchResults(keyword){
  keyword = keyword.toLowerCase();
  const results = [];
  // search local daily
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith('daily:') && !k.includes(':qna')){
      const d = JSON.parse(localStorage.getItem(k));
      const hay = JSON.stringify(d).toLowerCase();
      if(hay.includes(keyword)){
        results.push({
          date:d.date, week:getWeekKey(d.date),
          ttc:d.ttc, thanks:d.thanks, daily:d.daily, tags:d.tags
        });
      }
    }
  }
  // weekly
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith('weekly:')){
      const w = JSON.parse(localStorage.getItem(k));
      const hay = JSON.stringify(w).toLowerCase();
      if(hay.includes(keyword)){
        results.push({ date:w.week, week:w.week, healing:w.healing, copy:w.copy, missions:w.missions });
      }
    }
  }
  return results;
}
async function searchAll(keyword){
  const q = keyword.trim();
  const box = $('searchResults');
  box.innerHTML = '';
  if(!q) return;
  const results = await fetchSearchResults(q);
  if(results.length===0){
    box.innerHTML = `<div class="result-card"><div>검색 결과가 없어요.</div></div>`;
    return;
  }
  results.forEach(r=>{
    const tagsHtml = (r.tags||'').split(',').filter(Boolean).map(t=>`<span class="tag">${escapeHtml(t.trim())}</span>`).join('');
    const thanksHtml = (r.thanks||[]).filter(Boolean).map(t=>`<div class="line">• ${escapeHtml(t)}</div>`).join('');
    const ttcHtml = r.ttc ? `
      <div class="line"><b>사건</b> ${escapeHtml(r.ttc.event||'')}</div>
      <div class="line"><b>생각</b> ${escapeHtml(r.ttc.thought||'')}</div>
      <div class="line"><b>감정</b> ${escapeHtml(r.ttc.emotion||'')}</div>
      <div class="line"><b>결과</b> ${escapeHtml(r.ttc.result||'')}</div>` : '';
    const heal = r.healing? `<div class="line"><b>힐링</b> ${escapeHtml(r.healing)}</div>`:'';
    const copy = r.copy? `<div class="line"><b>필사</b> ${escapeHtml(r.copy)}</div>`:'';
    const missions = r.missions? r.missions.map(m=>`<div class="line">- [${m.done?'x':' '}] ${escapeHtml(m.text||'')}</div>`).join(''):'';

    const html = `<div class="result-card">
      <div class="meta">${escapeHtml(r.date)} · ${escapeHtml(r.week||'')}</div>
      ${ttcHtml}${thanksHtml}${r.daily?`<div class="line"><b>일상</b> ${escapeHtml(r.daily)}</div>`:''}
      ${tagsHtml?`<div class="line">${tagsHtml}</div>`:''}
      ${heal}${copy}${missions}
    </div>`;
    box.insertAdjacentHTML('beforeend', html);
  });
}
$('searchInput')?.addEventListener('input', (e)=>searchAll(e.target.value));

// ======= Settings: login/export/import =======
function updateLoginUI(){
  const user = auth && auth.currentUser;
  $('authState').textContent = user? (user.email || '로그인됨') : '로그아웃 상태';
  $('loginOpen')?.classList.toggle('hidden', !!user);
  $('logoutBtn')?.classList.toggle('hidden', !user);
}
$('loginBtn')?.addEventListener('click', async ()=>{
  if(!(auth && db)){ alert('로그인 구성 없음(로컬 모드)'); return; }
  const email = $('email').value.trim();
  const pw = $('password').value;
  try{
    await auth.signInWithEmailAndPassword(email, pw);
    updateLoginUI();
    alert('로그인 성공!');
  }catch(e){
    alert('로그인 실패: '+ e.message);
  }
});
$('signupBtn')?.addEventListener('click', async ()=>{
  if(!(auth && db)){ alert('구성 없음'); return; }
  const email = $('email').value.trim();
  const pw = $('password').value;
  try{
    await auth.createUserWithEmailAndPassword(email, pw);
    updateLoginUI();
    alert('회원가입 완료!');
  }catch(e){ alert('실패: '+e.message); }
});
$('logoutBtn')?.addEventListener('click', ()=>auth?.signOut().then(updateLoginUI));
$('logoutBtn2')?.addEventListener('click', ()=>auth?.signOut().then(updateLoginUI));
if(auth){ auth.onAuthStateChanged(updateLoginUI); }

$('exportBtn')?.addEventListener('click', ()=>{
  const dump = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith('daily:') || k.startsWith('weekly:')){
      dump[k] = JSON.parse(localStorage.getItem(k));
    }
  }
  const blob = new Blob([JSON.stringify(dump,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `thanks-diary-backup-${Date.now()}.json`;
  a.click();
});
$('importFile')?.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const fr = new FileReader();
  fr.onload = ()=>{
    try{
      const obj = JSON.parse(fr.result);
      Object.keys(obj).forEach(k=>localStorage.setItem(k, JSON.stringify(obj[k])));
      alert('복원 완료!');
      loadDaily(); loadWeekly();
    }catch(_){ alert('JSON 파일이 아니에요');}
  };
  fr.readAsText(f);
});

// ======= Init =======
function init(){
  setDateToInput(currentDate);
  randomQuestion();
  loadDaily();
  loadWeekly();
  showSection('daily');
}
document.addEventListener('DOMContentLoaded', init);
