import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// --- Firebase (user-provided config) ---
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
const db   = getFirestore(app);

// --- UI helpers ---
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1500); }

// --- Tabs ---
$$('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const id = btn.dataset.tab;
  $$('.tab').forEach(sec=>sec.classList.remove('active'));
  $("#"+id).classList.add('active');
}));

// --- Date helpers ---
function toDateStr(d){ return d.toISOString().slice(0,10); }
function getWeekStr(d){
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7; // ISO week
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((dt - yearStart) / 86400000) + 1)/7);
  return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}

const dateInput = $("#dateInput");
const today = new Date();
dateInput.value = toDateStr(today);
$("#todayBtn").onclick = ()=>{ dateInput.value = toDateStr(new Date()); loadForDate(); };
$("#weekBadge").textContent = getWeekStr(new Date(dateInput.value));
dateInput.addEventListener('change',()=>{
  $("#weekBadge").textContent = getWeekStr(new Date(dateInput.value));
  loadForDate();
});
$("#weekLabel").textContent = getWeekStr(new Date());

// --- Questions (simple unique rotation) ---
const QUESTIONS = [
  "지금의 나에게 꼭 필요한 한 마디는?","오늘 나를 미소 짓게 한 순간은?","요즘 가장 에너지를 주는 일은 무엇?",
  "올해 꼭 해보고 싶은 작은 도전은?","요즘 내가 배우고 있는 것은?","지금 감사한 사람 한 명은 누구?",
  "내가 진짜 원하는 삶의 분위기는?","오늘 배운 교훈 한 가지는?","내가 지키고 싶은 나만의 규칙은?",
  "요즘 나를 힘나게 하는 음악/문장은?","오늘 내 마음이 말하는 필요는?","미루고 있는 일, 왜 미루고 있을까?",
  "오늘의 나에게 칭찬 한 마디를 한다면?","나를 설명하는 단어 세 가지는?","최근의 작은 성장 하나는?"
];
function pickQuestion(dateStr){
  // Pick deterministically by date index to avoid duplicates day-to-day scrolling
  const idx = (new Date(dateStr).getTime()/86400000)|0;
  return QUESTIONS[idx % QUESTIONS.length];
}

// --- Auth ---
const loginBtn = $("#loginBtn");
const logoutBtn = $("#logoutBtn");
const doLogin = $("#doLogin");
const doSignup = $("#doSignup");
const doLogout = $("#doLogout");

doLogin.onclick = async ()=>{
  try{
    const email = $("#email").value.trim();
    const pass  = $("#password").value.trim();
    await signInWithEmailAndPassword(auth,email,pass);
    toast("로그인 성공");
  }catch(e){ toast("로그인 실패: "+e.message); }
};
doSignup.onclick = async ()=>{
  try{
    const email = $("#email").value.trim();
    const pass  = $("#password").value.trim();
    await createUserWithEmailAndPassword(auth,email,pass);
    toast("회원가입 완료, 로그인됨");
  }catch(e){ toast("회원가입 실패: "+e.message); }
};
doLogout.onclick = async ()=>{ await signOut(auth); toast("로그아웃"); };

onAuthStateChanged(auth,(user)=>{
  if(user){ $("#logoutBtn").style.display="inline-block"; $("#loginBtn").style.display="none"; $("#weekLabel").textContent=getWeekStr(new Date()); loadForDate(); }
  else { $("#logoutBtn").style.display="none"; $("#loginBtn").style.display="inline-block"; }
});

// --- Firestore paths ---
function userPath(){ return auth.currentUser ? `users/${auth.currentUser.uid}` : null; }

async function loadForDate(){
  const d = dateInput.value;
  $("#qText").value = pickQuestion(d);
  $("#qAnswer").value = "";
  $("#evt").value = $("#thought").value = $("#feel").value = $("#result").value = "";
  $("#g1").value = $("#g2").value = $("#g3").value = "";
  $("#dailyNote").value = ""; $("#tags").value = "";
  const base = userPath();
  if(!base) return; // local-only view reset
  const snap = await getDoc(doc(db, `${base}/daily/${d}`));
  if(snap.exists()){
    const v = snap.data();
    $("#qText").value = v.qText || $("#qText").value;
    $("#qAnswer").value = v.qAnswer || "";
    $("#evt").value = v.evt||""; $("#thought").value=v.thought||""; $("#feel").value=v.feel||""; $("#result").value=v.result||"";
    $("#g1").value=v.g1||""; $("#g2").value=v.g2||""; $("#g3").value=v.g3||"";
    $("#dailyNote").value=v.dailyNote||""; $("#tags").value=v.tags||"";
  }
}

// --- Save handlers (Daily) ---
$("#newQBtn").onclick = ()=>{ $("#qText").value = pickQuestion(dateInput.value + Math.random()); };
$("#clearQBtn").onclick = ()=>{ $("#qAnswer").value=""; };
$("#saveQBtn").onclick = async ()=>{ await saveDaily({ qText:$("#qText").value, qAnswer:$("#qAnswer").value }); };

$("#saveEmotionBtn").onclick = async ()=>{ await saveDaily({ evt:$("#evt").value, thought:$("#thought").value, feel:$("#feel").value, result:$("#result").value }); };
$("#clearEmotionBtn").onclick = ()=>{ $("#evt").value=$("#thought").value=$("#feel").value=$("#result").value=""; };

$("#saveThanksBtn").onclick = async ()=>{ await saveDaily({ g1:$("#g1").value,g2:$("#g2").value,g3:$("#g3").value }); };
$("#clearThanksBtn").onclick = ()=>{ $("#g1").value=$("#g2").value=$("#g3").value=""; };

$("#saveDailyBtn").onclick = async ()=>{ await saveDaily({ dailyNote:$("#dailyNote").value, tags:$("#tags").value }); };
$("#clearDailyBtn").onclick = ()=>{ $("#dailyNote").value=""; $("#tags").value=""; };

async function saveDaily(patch){
  const base=userPath();
  if(!base){ toast("로그인 필요 (로컬 미제공)"); return; }
  const d=dateInput.value;
  const ref=doc(db, `${base}/daily/${d}`);
  const snap=await getDoc(ref);
  if(snap.exists()) await updateDoc(ref, patch);
  else await setDoc(ref, {date:d, ...patch});
  toast("저장 완료");
}

// --- Weekly ---
const missionList = $("#missionList");
$("#addMissionBtn").onclick = ()=>{
  const id = crypto.randomUUID();
  const li = document.createElement('li');
  li.innerHTML = \`<input type="checkbox" id="\${id}"><input class="input" placeholder="미션 내용">\`;
  missionList.prepend(li);
};

$("#saveWeeklyBtn").onclick = async ()=>{
  const base=userPath(); if(!base){ toast("로그인 필요"); return; }
  const week = getWeekStr(new Date(dateInput.value));
  const items=[...missionList.querySelectorAll('li')].map(li=>({done:li.querySelector('input[type=checkbox]').checked,text:li.querySelector('.input').value}));
  const data={ missions:items, healing:$("#healingText").value, copy:$("#healingCopy").value };
  await setDoc(doc(db, `${base}/weekly/${week}`), data, {merge:true});
  toast("주간 저장 완료");
  $("#weekLabel").textContent = week;
};
$("#clearWeeklyBtn").onclick = ()=>{ missionList.innerHTML=""; $("#healingText").value=$("#healingCopy").value=""; };

async function loadWeekly(){
  const base=userPath(); if(!base) return;
  const week = getWeekStr(new Date(dateInput.value));
  const snap = await getDoc(doc(db, `${base}/weekly/${week}`));
  missionList.innerHTML="";
  if(snap.exists()){
    const v=snap.data();
    for(const m of (v.missions||[])){
      const id=crypto.randomUUID();
      const li=document.createElement('li');
      li.innerHTML=\`<input type="checkbox" \${m.done?'checked':''}><input class="input" value="\${m.text||''}">\`;
      missionList.appendChild(li);
    }
    $("#healingText").value=v.healing||""; $("#healingCopy").value=v.copy||"";
  }
  $("#weekLabel").textContent = week;
}
dateInput.addEventListener('change',loadWeekly);

// --- Search ---
$("#searchBtn").onclick = async ()=>{
  const base=userPath(); if(!base){ toast("로그인 필요"); return; }
  const k = $("#searchInput").value.trim(); if(!k) return;
  const results = $("#searchResults"); results.innerHTML="";
  // Pull daily docs and weekly docs; basic contains search
  const dCol = collection(db, `${base}/daily`);
  const wCol = collection(db, `${base}/weekly`);
  const dSnap = await getDocs(dCol);
  const wSnap = await getDocs(wCol);
  const arr=[];
  dSnap.forEach(docu=>{ const v=docu.data(); const text=JSON.stringify(v); if(text.includes(k)) arr.push({title:docu.id, text}); });
  wSnap.forEach(docu=>{ const v=docu.data(); const text=JSON.stringify(v); if(text.includes(k)) arr.push({title:docu.id, text}); });
  if(!arr.length){ results.textContent="검색 결과 없음"; return; }
  for(const r of arr){
    const div=document.createElement('div'); div.className='result';
    div.innerHTML = \`<b>\${r.title}</b><pre style="white-space:pre-wrap">\${r.text}</pre>\`;
    results.appendChild(div);
  }
};

// initial
loadForDate();
loadWeekly();
