/* ===== Config ===== */
// Firebase 설정을 사용하려면 아래 값을 채우고 USE_FIREBASE=true 로.
const USE_FIREBASE = false;
const FB_CONFIG = {
  // apiKey: "",
  // authDomain: "",
  // projectId: "",
  // storageBucket: "",
  // messagingSenderId: "",
  // appId: ""
};

/* ===== Utilities ===== */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1500);
};

function formatDateInput(d=new Date()){
  // yyyy-mm-dd
  const pad = n => (n<10?"0":"")+n;
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function getWeekNumber(d=new Date()){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart)/86400000)+1)/7);
  const w = weekNo.toString().padStart(2,"0");
  return `${date.getUTCFullYear()}-W${w}`;
}

/* ===== State ===== */
let curDate = new Date();
let curWeek = getWeekNumber(curDate);
let user = null; // firebase user or null

/* ===== Storage keys ===== */
function kDaily(dateStr){ return `daily:${dateStr}`; }
function kWeekly(weekStr){ return `weekly:${weekStr}`; }

/* ===== Tabs ===== */
function showTab(tab){
  $$(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
  $$(".panel").forEach(p=>p.classList.toggle("active", p.id===tab));
  if(tab==="weekly") renderWeekly();
}

$$(".tab").forEach(btn=>btn.addEventListener("click",()=>showTab(btn.dataset.tab)));

/* ===== Init Date & Week ===== */
const dateInput = $("#dailyDate");
const weekBadge = $("#weekBadge");
const weeklyBadge = $("#weeklyBadge");
function updateDateUI(){
  dateInput.value = formatDateInput(curDate);
  curWeek = getWeekNumber(curDate);
  weekBadge.textContent = curWeek;
  weeklyBadge.textContent = curWeek;
}
$("#btnToday").addEventListener("click",()=>{curDate=new Date(); updateDateUI(); loadDaily();});
dateInput.addEventListener("change", ()=>{ curDate = new Date(dateInput.value); updateDateUI(); loadDaily();});
updateDateUI();

/* ===== Daily: load/save ===== */
function dailyObject(){
  return {
    qText: $("#qText").value,
    qAnswer: $("#qAnswer").value,
    ev: $("#ev").value, th: $("#th").value, em: $("#em").value, rs: $("#rs").value,
    g1: $("#g1").value, g2: $("#g2").value, g3: $("#g3").value,
    dailyNote: $("#dailyNote").value,
    tags: $("#tags").value
  };
}
function setDaily(obj={}){
  $("#qText").value = obj.qText||"";
  $("#qAnswer").value = obj.qAnswer||"";
  $("#ev").value = obj.ev||""; $("#th").value=obj.th||""; $("#em").value=obj.em||""; $("#rs").value=obj.rs||"";
  $("#g1").value=obj.g1||""; $("#g2").value=obj.g2||""; $("#g3").value=obj.g3||"";
  $("#dailyNote").value=obj.dailyNote||"";
  $("#tags").value=obj.tags||"";
}
function loadDaily(){
  const key = kDaily(formatDateInput(curDate));
  const raw = localStorage.getItem(key);
  setDaily(raw? JSON.parse(raw): {});
}
function saveDaily(part){
  const key = kDaily(formatDateInput(curDate));
  const cur = localStorage.getItem(key);
  const base = cur? JSON.parse(cur): {};
  const data = {...base, ...dailyObject()};
  localStorage.setItem(key, JSON.stringify(data));
  syncDailyToCloud(key, data);
  toast("저장 완료!");
}
$("#btnQSave").addEventListener("click",()=>saveDaily());
$("#btnQClear").addEventListener("click",()=>{ $("#qText").value=""; $("#qAnswer").value=""; saveDaily(); });
$("#btnEmoSave").addEventListener("click",()=>saveDaily());
$("#btnEmoClear").addEventListener("click",()=>{ $("#ev").value=$("#th").value=$("#em").value=$("#rs").value=""; saveDaily(); });
$("#btnThanksSave").addEventListener("click",()=>saveDaily());
$("#btnThanksClear").addEventListener("click",()=>{ $("#g1").value=$("#g2").value=$("#g3").value=""; saveDaily(); });
$("#btnNoteSave").addEventListener("click",()=>saveDaily());
$("#btnNoteClear").addEventListener("click",()=>{ $("#dailyNote").value=""; saveDaily(); });
$("#btnTagSave").addEventListener("click",()=>saveDaily());
$("#btnTagClear").addEventListener("click",()=>{ $("#tags").value=""; saveDaily(); });
loadDaily();

/* ===== Weekly ===== */
let missions = [];
function renderWeekly(){
  const box = $("#missionList");
  box.innerHTML = "";
  missions.forEach((m, idx)=>{
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `<input type="checkbox" ${m.done?"checked":""} data-i="${idx}" class="mchk">
      <input type="text" value="${m.text||""}" data-i="${idx}" class="input"> 
      <button data-i="${idx}" class="btn danger mdel">삭제</button>`;
    box.appendChild(row);
  });
  box.querySelectorAll(".mchk").forEach(el=>el.addEventListener("change", e=>{
    missions[Number(e.target.dataset.i)].done = e.target.checked; saveWeekly();
  }));
  box.querySelectorAll(".mdel").forEach(el=>el.addEventListener("click", e=>{
    missions.splice(Number(e.target.dataset.i),1); renderWeekly(); saveWeekly();
  }));
  box.querySelectorAll("input[type='text']").forEach(el=>el.addEventListener("input", e=>{
    missions[Number(e.target.dataset.i)].text = e.target.value;
  }));
}
function loadWeekly(){
  const key = kWeekly(curWeek);
  const raw = localStorage.getItem(key);
  const obj = raw? JSON.parse(raw): { missions:[], healing:"", copy:"" };
  missions = obj.missions||[];
  $("#healing").value = obj.healing||"";
  $("#copybox").value = obj.copy||"";
  renderWeekly();
}
function saveWeekly(){
  const key = kWeekly(curWeek);
  const obj = { missions, healing: $("#healing").value, copy: $("#copybox").value };
  localStorage.setItem(key, JSON.stringify(obj));
  syncWeeklyToCloud(key, obj);
  toast("저장 완료!");
}
$("#btnAddMission").addEventListener("click",()=>{
  const t = $("#newMissionText").value.trim();
  if(!t) return;
  missions.push({done:false, text:t});
  $("#newMissionText").value = "";
  renderWeekly();
  saveWeekly();
});
$("#btnMissionSave").addEventListener("click", saveWeekly);
$("#btnMissionClear").addEventListener("click", ()=>{ missions=[]; renderWeekly(); saveWeekly(); });
$("#btnHealSave").addEventListener("click", saveWeekly);
$("#btnHealClear").addEventListener("click", ()=>{ $("#healing").value=""; $("#copybox").value=""; saveWeekly(); });
loadWeekly();

/* ===== Search ===== */
$("#btnSearch").addEventListener("click", ()=>{
  const kw = ($("#searchKeyword").value||"").trim();
  const out = $("#searchResults"); out.innerHTML="";
  if(!kw) return;
  // scan localStorage
  Object.keys(localStorage).sort().forEach(k=>{
    if(!k.startsWith("daily:") && !k.startsWith("weekly:")) return;
    try{
      const obj = JSON.parse(localStorage.getItem(k)||"{}");
      const hay = JSON.stringify(obj);
      if(hay.includes(kw)){
        const el = document.createElement("div");
        el.className="result";
        el.innerHTML = `<b>${k}</b><div>${hay.replaceAll(kw, `<mark>${kw}</mark>`)}</div>`;
        out.appendChild(el);
      }
    }catch(e){}
  });
});

/* ===== Backup / Cache / Reset ===== */
$("#btnExport").addEventListener("click", ()=>{
  const data = {};
  Object.keys(localStorage).forEach(k=>{ if(k.startsWith("daily:")||k.startsWith("weekly:")) data[k]=localStorage.getItem(k); });
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "thanks-diary-backup.json";
  a.click();
});
$("#btnImport").addEventListener("click", async ()=>{
  const f = $("#importFile").files[0]; if(!f) return;
  const text = await f.text();
  const obj = JSON.parse(text||"{}");
  Object.entries(obj).forEach(([k,v])=> localStorage.setItem(k, v));
  toast("가져오기 완료");
});
$("#btnCache").addEventListener("click", ()=>{ caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).finally(()=>location.reload()); });
$("#btnReset").addEventListener("click", ()=>{ if(confirm("로컬 데이터를 모두 삭제할까요?")){ Object.keys(localStorage).forEach(k=>{if(k.startsWith("daily:")||k.startsWith("weekly:")) localStorage.removeItem(k)}); toast("초기화 완료"); }});

/* ===== Auth (Firebase optional) ===== */
let fb = null, auth=null, db=null;
async function initFirebase(){
  if(!USE_FIREBASE) return;
  if(!FB_CONFIG || !FB_CONFIG.apiKey){ console.warn("Firebase config empty"); return; }
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js');
  const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js');
  const { getFirestore, doc, setDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js');
  fb = initializeApp(FB_CONFIG);
  auth = getAuth(fb);
  db = getFirestore(fb);
  onAuthStateChanged(auth, (u)=>{ user=u; toast(u? "로그인됨":"로그아웃"); });
  // expose helpers
  window._fb = {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getFirestore, doc, setDoc, getDoc};
}
initFirebase();

$("#btnDoLogin").addEventListener("click", async ()=>{
  if(!USE_FIREBASE){ toast("지금은 로컬 저장만 사용합니다."); return; }
  const email = $("#email").value.trim(), pw = $("#password").value;
  const { signInWithEmailAndPassword } = window._fb;
  try{
    await signInWithEmailAndPassword(auth, email, pw);
    toast("로그인 성공!");
  }catch(e){ toast("로그인 실패: "+e.code); }
});
$("#btnSignup").addEventListener("click", async ()=>{
  if(!USE_FIREBASE){ toast("로컬 모드입니다."); return; }
  const email = $("#email").value.trim(), pw = $("#password").value;
  const { createUserWithEmailAndPassword } = window._fb;
  try{ await createUserWithEmailAndPassword(auth, email, pw); toast("회원가입 완료"); }
  catch(e){ toast("실패: "+e.code); }
});
$("#btnDoLogout").addEventListener("click", async ()=>{
  if(!USE_FIREBASE){ toast("로컬 모드입니다."); return; }
  const { signOut } = window._fb;
  await signOut(auth); toast("로그아웃");
});

/* ===== Cloud Sync (if Firebase) ===== */
async function syncDailyToCloud(key, data){
  if(!USE_FIREBASE || !user) return;
  const { doc, setDoc } = window._fb;
  const id = key.split(":")[1];
  await setDoc(doc(db, "users", user.uid, "daily", id), data, {merge:true});
}
async function syncWeeklyToCloud(key, data){
  if(!USE_FIREBASE || !user) return;
  const { doc, setDoc } = window._fb;
  const id = key.split(":")[1];
  await setDoc(doc(db, "users", user.uid, "weekly", id), data, {merge:true});
}

/* ===== Service Worker ===== */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js');
  });
}
