// Firebase config from user
const firebaseConfig = {
  apiKey: "AIzaSyAOqrdA0aHL5lMXOOmdtj8mnLi6zgSXoiM",
  authDomain: "thanksdiary-dca35.firebaseapp.com",
  projectId: "thanksdiary-dca35",
  storageBucket: "thanksdiary-dca35.firebasestorage.app",
  messagingSenderId: "250477396044",
  appId: "1:250477396044:web:aa1cf155f01263e08834e9",
  measurementId: "G-J0Z03LHYYC"
};

let app=null, auth=null, db=null, currentUser=null;

// safe init
try{
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db   = firebase.firestore();
}catch(e){
  console.warn('Firebase init issue -> local only mode', e);
}

// Toast helper
const toast = (msg)=>{
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 1600);
};

// Navigation
const pages = ['daily','weekly','search','settings'];
document.querySelectorAll('.nav-buttons .menu').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const pg = btn.dataset.page;
    document.querySelectorAll('.nav-buttons .menu').forEach(b=>b.classList.toggle('active', b===btn));
    pages.forEach(p=>document.getElementById('page-'+p).classList.toggle('visible', p===pg));
    if(pg==='weekly'){ updateWeekBadge(); }
  });
});

// Dates
const dailyDate = document.getElementById('dailyDate');
const today = new Date();
dailyDate.valueAsDate = today;
document.getElementById('btnToday').addEventListener('click', ()=>{
  dailyDate.valueAsDate = new Date();
  updateDailyWeek();
  loadDaily();
});
function yyyy_mm_dd(d){
  const z = (n)=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());
}
function getISOWeek(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  return date.getUTCFullYear() + '-W' + String(weekNo).padStart(2,'0');
}
function updateDailyWeek(){
  const span = document.getElementById('dailyWeek');
  const d = dailyDate.valueAsDate || new Date();
  span.textContent = getISOWeek(d);
}
updateDailyWeek();

// Weekly picker default to current week
const weekPicker = document.getElementById('weekPicker');
weekPicker.value = getISOWeek(new Date());
function updateWeekBadge(){
  document.getElementById('weeklyWeek').textContent = weekPicker.value;
}
updateWeekBadge();

// Daily Questions (non-repeating)
const dailyQuestions = [
  "지금의 나에게 꼭 필요한 한 마디는?", "오늘 나를 미소 짓게 한 순간은?",
  "내가 지키고 싶은 작은 약속 하나는?", "요즘 내가 배우는 가장 큰 교훈은?",
  "오늘 스스로에게 칭찬해주고 싶은 점은?", "최근 보였던 용기는 무엇이었나?",
  "내가 진짜 원하는 삶의 분위기는?", "오늘의 작은 성취는 무엇이었나?",
  "내 마음이 편안했던 순간은 언제였나?", "이번 주에 줄이고 싶은 습관은?"
];
function pickDailyQuestion(){
  const key='lastQuestionIndex';
  const used = Number(localStorage.getItem(key) || '-1');
  const next = (used + 1) % dailyQuestions.length;
  localStorage.setItem(key, String(next));
  return dailyQuestions[next];
}
const qInput = document.getElementById('dailyQuestion');
qInput.value = pickDailyQuestion();
document.getElementById('btnNewQ').addEventListener('click', ()=> qInput.value = pickDailyQuestion());

// Auth buttons on header & settings
const loginHeader  = document.getElementById('btnLogin');
const logoutHeader = document.getElementById('btnLogout');
const doLogin = document.getElementById('doLogin');
const doLogout = document.getElementById('doLogout');
const doSignup = document.getElementById('doSignup');

function uiAuthUpdate(user){
  currentUser = user || null;
  if(currentUser){ toast('로그인됨'); }
  else { toast('로그아웃됨'); }
}

if(auth){
  auth.onAuthStateChanged(uiAuthUpdate);
  const emailEl = document.getElementById('email');
  const pwEl = document.getElementById('password');
  const tryLogin = ()=>{
    const email=emailEl.value.trim(), pw=pwEl.value;
    auth.signInWithEmailAndPassword(email,pw).catch(err=>toast(err.message));
  };
  const trySignup = ()=>{
    const email=emailEl.value.trim(), pw=pwEl.value;
    auth.createUserWithEmailAndPassword(email,pw).catch(err=>toast(err.message));
  };
  (doLogin||{}).onclick = tryLogin;
  (doSignup||{}).onclick = trySignup;
  (doLogout||{}).onclick = ()=>auth.signOut();
  (loginHeader||{}).onclick = ()=>document.querySelector('[data-page="settings"]').click();
  (logoutHeader||{}).onclick = ()=>auth.signOut();
}

// Firestore helpers
function userPath(){ return `users/${currentUser.uid}`; }
async function saveDaily(){
  const d = dailyDate.valueAsDate || new Date();
  const docId = yyyy_mm_dd(d);
  const data = {
    date: docId,
    question: qInput.value,
    answer: document.getElementById('dailyAnswer').value,
    emotion: {
      event:   document.getElementById('evEvent').value,
      thought: document.getElementById('evThought').value,
      feeling: document.getElementById('evFeeling').value,
      result:  document.getElementById('evResult').value
    },
    thanks: [document.getElementById('th1').value,document.getElementById('th2').value,document.getElementById('th3').value],
    note: document.getElementById('dailyNote').value,
    tags: document.getElementById('tags').value
  };
  if(db && currentUser){
    await db.doc(`${userPath()}/daily/${docId}`).set(data,{merge:true});
    toast('클라우드 저장 완료');
  }else{
    localStorage.setItem('daily:'+docId, JSON.stringify(data));
    toast('로컬 저장 완료');
  }
}

async function loadDaily(){
  const d = dailyDate.valueAsDate || new Date();
  const docId = yyyy_mm_dd(d);
  let data=null;
  if(db && currentUser){
    const snap = await db.doc(`${userPath()}/daily/${docId}`).get();
    data = snap.exists ? snap.data() : null;
  }else{
    const raw = localStorage.getItem('daily:'+docId);
    data = raw ? JSON.parse(raw) : null;
  }
  if(!data){ 
    // clear fields
    document.getElementById('dailyAnswer').value='';
    document.getElementById('evEvent').value='';
    document.getElementById('evThought').value='';
    document.getElementById('evFeeling').value='';
    document.getElementById('evResult').value='';
    document.getElementById('th1').value='';
    document.getElementById('th2').value='';
    document.getElementById('th3').value='';
    document.getElementById('dailyNote').value='';
    document.getElementById('tags').value='';
    return;
  }
  qInput.value = data.question || qInput.value;
  document.getElementById('dailyAnswer').value = data.answer || '';
  document.getElementById('evEvent').value   = data.emotion?.event || '';
  document.getElementById('evThought').value = data.emotion?.thought || '';
  document.getElementById('evFeeling').value = data.emotion?.feeling || '';
  document.getElementById('evResult').value  = data.emotion?.result || '';
  document.getElementById('th1').value = data.thanks?.[0] || '';
  document.getElementById('th2').value = data.thanks?.[1] || '';
  document.getElementById('th3').value = data.thanks?.[2] || '';
  document.getElementById('dailyNote').value = data.note || '';
  document.getElementById('tags').value = data.tags || '';
}
dailyDate.addEventListener('change', ()=>{ updateDailyWeek(); loadDaily(); });
document.getElementById('btnSaveDailyQ').onclick = saveDaily;
document.getElementById('btnClearDailyQ').onclick = ()=>{ document.getElementById('dailyAnswer').value=''; };
document.getElementById('btnSaveDailyAll').onclick = saveDaily;

// Weekly
function missionItem(text, done=false, i=null){
  const div = document.createElement('div');
  div.className='row';
  const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=done; cb.className='mission-cb';
  const inp= document.createElement('input'); inp.value=text||''; inp.className='text-input mission-text';
  if(i!==null){ div.dataset.index=i; }
  div.appendChild(cb); div.appendChild(inp);
  return div;
}
document.getElementById('btnAddMission').onclick = ()=>{
  document.getElementById('missions').appendChild(missionItem('',false));
};
document.getElementById('btnRandomHealing').onclick = ()=>{
  const arr = [
    "작은 실천이 큰 변화를 만든다.", "오늘의 나는 어제의 나를 이긴다.",
    "충분히 잘하고 있어.", "천천히, 그러나 꾸준히."
  ];
  document.getElementById('healing').value = arr[Math.floor(Math.random()*arr.length)];
};
async function saveWeekly(){
  const id = weekPicker.value; // e.g. 2025-W33
  const missionEls = Array.from(document.querySelectorAll('#missions .row'));
  const missions = missionEls.map(row=>({done: row.querySelector('.mission-cb').checked, text: row.querySelector('.mission-text').value}));
  const data = {
    week: id,
    missions,
    healing: document.getElementById('healing').value,
    copy: document.getElementById('copy').value
  };
  if(db && currentUser){
    await db.doc(`${userPath()}/weekly/${id}`).set(data,{merge:true});
    toast('주간 저장 완료');
  }else{
    localStorage.setItem('weekly:'+id, JSON.stringify(data));
    toast('주간 로컬 저장 완료');
  }
}
document.getElementById('btnSaveWeekly').onclick = saveWeekly;

// Load weekly when week changes
async function loadWeekly(){
  const id = weekPicker.value;
  let data=null;
  if(db && currentUser){
    const snap = await db.doc(`${userPath()}/weekly/${id}`).get();
    data = snap.exists ? snap.data() : null;
  }else{
    const raw = localStorage.getItem('weekly:'+id);
    data = raw ? JSON.parse(raw) : null;
  }
  document.getElementById('missions').innerHTML='';
  if(data){
    (data.missions||[]).forEach((m,i)=>{
      document.getElementById('missions').appendChild(missionItem(m.text,m.done,i));
    });
    document.getElementById('healing').value = data.healing||'';
    document.getElementById('copy').value = data.copy||'';
  }
  updateWeekBadge();
}
weekPicker.addEventListener('change', loadWeekly);
loadWeekly();

// Search (simple client filter of recent)
document.getElementById('btnSearch').onclick = async ()=>{
  const kw = (document.getElementById('searchInput').value||'').trim();
  const box = document.getElementById('searchResults'); box.innerHTML='';
  if(!kw){ return; }
  let results=[];
  if(db && currentUser){
    // fetch last 90 days daily
    const ref = db.collection(`${userPath()}/daily`).orderBy('date','desc').limit(200);
    const snaps = await ref.get();
    snaps.forEach(doc=>{
      const v=doc.data(); const blob=JSON.stringify(v);
      if(blob.includes(kw)){
        results.push({id:doc.id,type:'daily',data:v});
      }
    });
    const wref = db.collection(`${userPath()}/weekly`).orderBy('week','desc').limit(60);
    const ws = await wref.get();
    ws.forEach(doc=>{
      const v=doc.data(); const blob=JSON.stringify(v);
      if(blob.includes(kw)) results.push({id:doc.id,type:'weekly',data:v});
    });
  }else{
    // local
    Object.keys(localStorage).forEach(k=>{
      if(k.startsWith('daily:')||k.startsWith('weekly:')){
        const v = JSON.parse(localStorage.getItem(k));
        if(JSON.stringify(v).includes(kw)){
          results.push({id:k,type:k.split(':')[0],data:v});
        }
      }
    });
  }
  if(results.length===0){ box.innerHTML='<div class="muted">검색 결과가 없어요.</div>'; return; }
  results.slice(0,50).forEach(r=>{
    const div=document.createElement('div'); div.className='result-card';
    div.textContent = `[${r.type}] ${r.id} - ` + (r.data.question || r.data.healing || r.data.note || '');
    box.appendChild(div);
  });
};

// Backup/restore
document.getElementById('btnExport').onclick = ()=>{
  const dump = {};
  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith('daily:')||k.startsWith('weekly:')) dump[k]=localStorage.getItem(k);
  });
  const blob = new Blob([JSON.stringify(dump,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='thanks-diary-backup.json'; a.click();
};
document.getElementById('btnImport').onclick = ()=>{
  const f = document.getElementById('importFile').files[0];
  if(!f) return;
  const fr=new FileReader();
  fr.onload=()=>{
    const json = JSON.parse(fr.result);
    Object.entries(json).forEach(([k,v])=>localStorage.setItem(k,v));
    toast('가져오기 완료');
  };
  fr.readAsText(f);
};
document.getElementById('btnClear').onclick = ()=>{
  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith('daily:')||k.startsWith('weekly:')) localStorage.removeItem(k);
  });
  toast('로컬 데이터 삭제');
};
document.getElementById('btnRefresh').onclick = ()=>location.reload(true);

// initial load
loadDaily();
