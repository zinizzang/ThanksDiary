import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ===== Firebase (user provided) =====
const firebaseConfig = {
  apiKey: "AIzaSyAOqrdA0aHL5lMXOOmdtj8mnLi6zgSXoiM",
  authDomain: "thanksdiary-dca35.firebaseapp.com",
  projectId: "thanksdiary-dca35",
  storageBucket: "thanksdiary-dca35.firebasestorage.app",
  messagingSenderId: "250477396044",
  appId: "1:250477396044:web:aa1cf155f01263e08834e9",
  measurementId: "G-J0Z03LHYYC"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== Helpers =====
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const toast = (msg)=>{ const t=$("#toast"); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1400); }
const ymd = (d)=> d.toISOString().slice(0,10);
const weekKey = (d)=> {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7; 
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((dt - yearStart) / 86400000) + 1)/7);
  return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
};
const QUESTIONS = [
  "오늘 나를 웃게 한 작은 순간은?","지금의 나에게 꼭 필요한 한 마디는?","요즘 내가 지키고 싶은 경계는?",
  "내가 진짜 원하는 삶의 분위기는?","최근에 감사했던 사람은 누구? 이유는?","오늘 배운 한 가지는?",
  "요즘 나를 괴롭히는 생각을 이름붙이면?","몸이 좋아했던 작은 선택은?","이번주 놓치고 싶지 않은 감정은?","미래의 나에게 부탁하고 싶은 것?"
];
const HEALINGS = [
  "오늘의 나는 어제의 나를 이긴다.","천천히 가도 내 길로 간다.","꾸준함이 재능을 이긴다.","작은 승리를 기록하자.",
  "내 페이스를 믿는다.","좋아하는 마음이 길을 만든다."
];

// ===== Tabs =====
$$('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  const id = btn.dataset.tab; $$('.panel').forEach(p=>p.classList.remove('active')); $('#'+id).classList.add('active');
}));

// ===== Auth UI =====
const emailEl = $("#email"), pwEl = $("#password");
$("#btnLogin").onclick = async ()=>{
  try { await signInWithEmailAndPassword(auth, emailEl.value, pwEl.value); }
  catch(e){ if(e.code==='auth/user-not-found'){ await createUserWithEmailAndPassword(auth,emailEl.value,pwEl.value); } else { alert(e.message); } }
};
$("#btnSignup").onclick = async ()=>{
  try { await createUserWithEmailAndPassword(auth,emailEl.value,pwEl.value); toast('회원가입 완료'); }
  catch(e){ alert(e.message); }
};
$("#btnLogout").onclick = ()=> signOut(auth);

onAuthStateChanged(auth, (u)=>{
  if(u){ toast('로그인됨'); } else { toast('로그아웃됨'); }
});

// ===== Daily =====
const dailyDate = $("#dailyDate");
const today = new Date();
dailyDate.value = ymd(today);
$("#btnToday").onclick = ()=> dailyDate.value = ymd(new Date());
const updateWeekBadge = ()=>{ const d = new Date(dailyDate.value); $("#weekBadge").textContent = weekKey(d); $("#weekBadge2").textContent = weekKey(new Date($("#weekDate").value||dailyDate.value)); };
dailyDate.addEventListener('change', updateWeekBadge);
updateWeekBadge();

const fillDaily = (data={})=>{
  $("#qTitle").value = data.qTitle||"";
  $("#qAnswer").value = data.qAnswer||"";
  $("#evt").value = data.evt||"";
  $("#thought").value = data.thought||"";
  $("#feeling").value = data.feeling||"";
  $("#result").value = data.result||"";
  $("#g1").value = data.g1||""; $("#g2").value=data.g2||""; $("#g3").value=data.g3||"";
  $("#dailyNote").value = data.note||"";
  $("#tags").value = data.tags||"";
};
const getDailyDocRef = (uid, dateStr)=> doc(db, 'users', uid, 'daily', dateStr);

async function loadDaily(){
  const dateStr = dailyDate.value;
  const uid = auth.currentUser?.uid;
  if(uid){
    const snap = await getDoc(getDailyDocRef(uid, dateStr));
    if(snap.exists()) fillDaily(snap.data()); else fillDaily({});
  }else{
    const json = localStorage.getItem('daily:'+dateStr); fillDaily(json?JSON.parse(json):{});
  }
}
dailyDate.addEventListener('change', loadDaily); loadDaily();

$("#btnNewQ").onclick = ()=>{
  const usedKey = 'usedQuestions';
  const used = JSON.parse(localStorage.getItem(usedKey)||'[]');
  const remain = QUESTIONS.filter(q=>!used.includes(q));
  const pick = (remain.length?remain:QUESTIONS)[Math.floor(Math.random()*(remain.length?remain.length:QUESTIONS.length))];
  $("#qTitle").value = pick;
  const nextUsed = (remain.length?used.concat(pick):[pick]);
  localStorage.setItem(usedKey, JSON.stringify(nextUsed.length>QUESTIONS.length?[]:nextUsed));
};

$("#btnSaveDaily").onclick = async ()=>{
  const data = {
    qTitle:$("#qTitle").value, qAnswer:$("#qAnswer").value,
    evt:$("#evt").value, thought:$("#thought").value, feeling:$("#feeling").value, result:$("#result").value,
    g1:$("#g1").value, g2:$("#g2").value, g3:$("#g3").value,
    note:$("#dailyNote").value, tags:$("#tags").value,
    savedAt: new Date().toISOString()
  };
  const key = dailyDate.value;
  const uid = auth.currentUser?.uid;
  if(uid){ await setDoc(getDailyDocRef(uid,key), data, {merge:true}); toast('데일리 저장 완료'); }
  else{ localStorage.setItem('daily:'+key, JSON.stringify(data)); toast('데일리 저장(로컬)'); }
};

$("#btnClearDaily").onclick = ()=>{ fillDaily({}); toast('지움'); };

// ===== Weekly =====
const weekDate = $("#weekDate"); weekDate.value = ymd(today);
function renderMissions(list=[]){
  const wrap = $("#missions"); wrap.innerHTML='';
  list.forEach((m,i)=>{
    const line = document.createElement('div'); line.className='row';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=!!m.done;
    const ip = document.createElement('input'); ip.value=m.text||'';
    cb.onchange=()=>{ m.done=cb.checked; };
    ip.oninput=()=>{ m.text=ip.value; };
    line.appendChild(cb); line.appendChild(ip); wrap.appendChild(line);
  });
}
let weeklyState = { missions:[{text:'',done:false}], healing:'', copy:'' };

function weekRef(uid, wk){ return doc(db,'users',uid,'weekly',wk); }

async function loadWeekly(){
  const wk = weekKey(new Date(weekDate.value));
  $("#weekBadge2").textContent = wk;
  const uid = auth.currentUser?.uid;
  if(uid){
    const snap = await getDoc(weekRef(uid,wk));
    if(snap.exists()){ weeklyState = snap.data(); } else { weeklyState = {missions:[{text:'',done:false}],healing:HEALINGS[0],copy:''}; }
  } else {
    weeklyState = JSON.parse(localStorage.getItem('weekly:'+wk)||'{"missions":[{"text":"","done":false}],"healing":"'+HEALINGS[0]+'","copy":""}');
  }
  renderMissions(weeklyState.missions||[]);
  $("#healing").value = weeklyState.healing||'';
  $("#copyText").value = weeklyState.copy||'';
}
weekDate.addEventListener('change', loadWeekly); loadWeekly();

$("#btnAddMission").onclick = ()=>{ weeklyState.missions.push({text:$("#newMission").value,done:false}); $("#newMission").value=''; renderMissions(weeklyState.missions); };

$("#btnWeeklySave").onclick = async ()=>{
  weeklyState.healing = $("#healing").value;
  weeklyState.copy = $("#copyText").value;
  const wk = weekKey(new Date(weekDate.value));
  const uid = auth.currentUser?.uid;
  if(uid){ await setDoc(weekRef(uid,wk), weeklyState, {merge:true}); toast('위클리 저장 완료'); }
  else{ localStorage.setItem('weekly:'+wk, JSON.stringify(weeklyState)); toast('위클리 저장(로컬)'); }
};

// ===== Search =====
$("#btnSearch").onclick = async ()=>{
  const k = $("#searchInput").value.trim(); if(!k) return;
  let out='';
  const uid = auth.currentUser?.uid;
  if(uid){
    // Simple fetch: today based range demo (for real app, add indexes/queries)
    const dt = new Date(); const dstr = ymd(dt);
    const snap = await getDoc(getDailyDocRef(uid,dstr));
    if(snap.exists()) out = JSON.stringify(snap.data(),null,2); else out='(오늘 데이터 없음)';
  } else {
    out = '(로그인 필요 / 로컬 검색 미니 버전)
';
  }
  $("#searchResult").textContent = out;
};

// ===== Export / Import / Misc =====
$("#btnExport").onclick = ()=>{
  const blob = new Blob([JSON.stringify(localStorage,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='thanks-diary-backup.json'; a.click();
};
$("#btnImport").onclick = ()=>{
  const f = $("#fileImport").files?.[0]; if(!f) return;
  const r = new FileReader(); r.onload = ()=>{ try{ const map = JSON.parse(r.result); Object.keys(map).forEach(k=>localStorage.setItem(k,map[k])); toast('불러오기 완료'); }catch(e){alert('불러오기 실패');} }; r.readAsText(f);
};
$("#btnClearLocal").onclick = ()=>{ if(confirm('로컬 데이터 모두 삭제?')){ localStorage.clear(); toast('초기화 완료'); } };
$("#btnReload").onclick = ()=> location.reload(true);
