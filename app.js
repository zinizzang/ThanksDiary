
// ===== Firebase (사용자 제공 구성) =====
const firebaseConfig = {
  apiKey: "AIzaSyAOqrdA0aHL5lMXOOmdtj8mnLi6zgSXoiM",
  authDomain: "thanksdiary-dca35.firebaseapp.com",
  projectId: "thanksdiary-dca35",
  storageBucket: "thanksdiary-dca35.firebasestorage.app",
  messagingSenderId: "250477396044",
  appId: "1:250477396044:web:aa1cf155f01263e08834e9",
  measurementId: "G-J0Z03LHYYC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
let db = null;
try {
  db = firebase.firestore();
} catch(e){ db = null; }

// ===== 유틸 =====
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.style.display = "block";
  setTimeout(()=> t.style.display="none", 1800);
}
function fmtDate(d){ return d.toISOString().slice(0,10); }
function weekOf(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(),0,4));
  const week = 1 + Math.round(((date - firstThursday)/86400000 - 3 + ((firstThursday.getUTCDay()+6)%7))/7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2,"0")}`;
}

// ===== 탭 =====
$$(".tab").forEach(btn=>btn.addEventListener("click", e=>{
  $$(".tab").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  const target = btn.dataset.target;
  $$(".page").forEach(p=>p.classList.remove("visible"));
  $('#'+target).classList.add("visible");
}));

// ===== 날짜/주차 =====
const dateInput = $("#dateInput");
function setToday(){
  const now = new Date();
  dateInput.value = fmtDate(now);
  $("#weekLabel").textContent = weekOf(now);
  $("#weekLabelWeekly").textContent = weekOf(now);
  loadDaily();
}
$("#btnToday").addEventListener("click", setToday);
dateInput.addEventListener("change", ()=>{
  const d = new Date(dateInput.value);
  $("#weekLabel").textContent = weekOf(d);
  loadDaily();
});
setToday();

// ===== 오늘의 질문 (중복 없이 날짜 기반) =====
function setQuestionByDate(){
  const d = new Date(dateInput.value || new Date());
  const start = new Date(d.getFullYear(),0,1);
  const dayIndex = Math.floor((d - start)/86400000);
  const qs = window.TTC_QUESTIONS || [];
  const q = qs.length ? qs[dayIndex % qs.length] : "오늘의 질문을 준비중입니다.";
  $("#qText").value = q;
}
setQuestionByDate();
$("#btnNewQ").addEventListener("click", ()=>{
  // 날짜 기반 + 버튼 누를 때는 다음 질문 미리보기
  const now = new Date(dateInput.value);
  now.setDate(now.getDate()+1);
  dateInput.value = fmtDate(now);
  setQuestionByDate();
  toast("내일의 질문으로 미리보기!");
});

// ===== 로그인/회원가입/로그아웃 =====
function updateAuthUI(user){
  const signedIn = !!user;
  $("#btnLogout").style.display = signedIn ? "inline-block":"none";
  $("#btnLogout2").style.display = signedIn ? "inline-block":"none";
  $("#btnOpenLogin").style.display = signedIn ? "none":"inline-block";
}

auth.onAuthStateChanged(user => {
  updateAuthUI(user);
  if(user){ toast("로그인됨"); loadDaily(); loadWeekly(); }
});

$("#btnLogin").addEventListener("click", async ()=>{
  const email = $("#email").value.trim();
  const pw = $("#password").value.trim();
  if(!email || !pw){ toast("이메일/비밀번호 입력"); return; }
  try{
    await auth.signInWithEmailAndPassword(email,pw);
    toast("로그인 완료");
  }catch(err){
    toast("로그인 실패: " + err.message);
  }
});

$("#btnSignup").addEventListener("click", async ()=>{
  const email = $("#email").value.trim();
  const pw = $("#password").value.trim();
  if(!email || !pw){ toast("이메일/비밀번호 입력"); return; }
  try{
    await auth.createUserWithEmailAndPassword(email,pw);
    toast("회원가입 완료");
  }catch(err){
    toast("회원가입 실패: " + err.message);
  }
});

function doLogout(){ auth.signOut().then(()=>toast("로그아웃 완료")); }
$("#btnLogout").addEventListener("click", doLogout);
$("#btnLogout2").addEventListener("click", doLogout);

// 상단 로그인 버튼은 설정 탭으로 이동
$("#btnOpenLogin").addEventListener("click", ()=>{
  $$(".tab").forEach(b=>b.classList.remove("active"));
  document.querySelector('.tab[data-target="settings"]').classList.add("active");
  $$(".page").forEach(p=>p.classList.remove("visible"));
  $('#settings').classList.add("visible");
});

// ===== 저장/불러오기 (Firestore가 없으면 localStorage 사용) =====
function uid(){ return auth.currentUser ? auth.currentUser.uid : null; }
function pathDaily(d){ return `users/${uid()}/daily/${d}`; }
function pathWeekly(w){ return `users/${uid()}/weekly/${w}`; }

async function saveDaily(){
  const d = dateInput.value;
  const data = {
    q: $("#qText").value,
    a: $("#qAnswer").value,
    evt: $("#evt").value,
    tht: $("#tht").value,
    feel: $("#feel").value,
    res: $("#res").value,
    g: [$("#g1").value, $("#g2").value, $("#g3").value],
    note: $("#dailyNote").value,
    tags: $("#tags").value,
    ts: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
  };
  if(db && uid()){
    await db.doc(pathDaily(d)).set(data, {merge:true});
    toast("저장 완료 (클라우드)");
  }else{
    localStorage.setItem("daily:"+d, JSON.stringify(data));
    toast("저장 완료 (로컬)");
  }
}

async function loadDaily(){
  setQuestionByDate();
  const d = dateInput.value;
  let data = null;
  if(db && uid()){
    const snap = await db.doc(pathDaily(d)).get();
    data = snap.exists ? snap.data() : null;
  }else{
    const raw = localStorage.getItem("daily:"+d);
    data = raw ? JSON.parse(raw) : null;
  }
  $("#qAnswer").value = data?.a || "";
  $("#evt").value = data?.evt || "";
  $("#tht").value = data?.tht || "";
  $("#feel").value = data?.feel || "";
  $("#res").value = data?.res || "";
  $("#g1").value = data?.g?.[0] || "";
  $("#g2").value = data?.g?.[1] || "";
  $("#g3").value = data?.g?.[2] || "";
  $("#dailyNote").value = data?.note || "";
  $("#tags").value = data?.tags || "";
}

$("#btnSaveDaily").addEventListener("click", saveDaily);
$("#btnClearDaily").addEventListener("click", ()=>{
  $("#qAnswer").value = $("#evt").value = $("#tht").value = $("#feel").value = $("#res").value = "";
  $("#g1").value = $("#g2").value = $("#g3").value = "";
  $("#dailyNote").value = $("#tags").value = "";
});

// ===== 위클리 저장/불러오기 =====
function renderMissions(arr){
  const box = $("#missionList"); box.innerHTML = "";
  (arr || []).forEach((m,i)=>{
    const row = document.createElement("div");
    row.className = "mission";
    const cb = document.createElement("input"); cb.type="checkbox"; cb.checked = !!m.done;
    const txt = document.createElement("input"); txt.className="input"; txt.value = m.text || "";
    cb.addEventListener("change", ()=> txt.dataset.dirty = "1");
    txt.addEventListener("input", ()=> txt.dataset.dirty = "1");
    row.appendChild(cb); row.appendChild(txt);
    box.appendChild(row);
  });
}
$("#btnAddMission").addEventListener("click", ()=>{
  const t = $("#missionInput").value.trim();
  if(!t) return;
  const list = $("#missionList");
  const row = document.createElement("div"); row.className="mission";
  const cb = document.createElement("input"); cb.type="checkbox";
  const txt = document.createElement("input"); txt.className="input"; txt.value = t;
  row.appendChild(cb); row.appendChild(txt);
  list.appendChild(row);
  $("#missionInput").value = "";
});

async function saveWeekly(){
  const w = $("#weekLabelWeekly").textContent;
  const missions = Array.from($("#missionList").children).map(row=>{
    const [cb, input] = row.querySelectorAll("input");
    return {done: cb.checked, text: input.value};
  });
  const data = { missions, healing: $("#healingInput").value, copy: $("#copyInput").value };
  if(db && uid()){
    await db.doc(pathWeekly(w)).set(data,{merge:true});
    toast("주간 저장 완료 (클라우드)");
  }else{
    localStorage.setItem("weekly:"+w, JSON.stringify(data));
    toast("주간 저장 완료 (로컬)");
  }
}

async function loadWeekly(){
  const now = new Date(dateInput.value);
  const w = weekOf(now);
  $("#weekLabelWeekly").textContent = w;
  let data=null;
  if(db && uid()){
    const snap = await db.doc(pathWeekly(w)).get();
    data = snap.exists ? snap.data() : null;
  }else{
    const raw = localStorage.getItem("weekly:"+w);
    data = raw ? JSON.parse(raw) : null;
  }
  renderMissions(data?.missions || []);
  $("#healingInput").value = data?.healing || "";
  $("#copyInput").value = data?.copy || "";
}
$("#btnSaveWeekly").addEventListener("click", saveWeekly);

// ===== 검색 =====
$("#btnSearch").addEventListener("click", async ()=>{
  const q = $("#searchQuery").value.trim();
  if(!q){ $("#searchResults").textContent=""; return; }
  let out = [];
  if(db && uid()){
    const ds = await db.collection(`users/${uid()}/daily`).get();
    ds.forEach(doc=>{
      const d = doc.data();
      const blob = JSON.stringify(d, null, 2);
      if(blob.includes(q)) out.push(`🗓 ${doc.id}\n${blob}`);
    });
    const ws = await db.collection(`users/${uid()}/weekly`).get();
    ws.forEach(doc=>{
      const d = doc.data(); const blob = JSON.stringify(d,null,2);
      if(blob.includes(q)) out.push(`📅 ${doc.id}\n${blob}`);
    });
  }else{
    // 로컬에서 훑기
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(!k.startsWith("daily:") && !k.startsWith("weekly:")) continue;
      const blob = localStorage.getItem(k);
      if(blob.includes(q)) out.push(`${k}\n${blob}`);
    }
  }
  $("#searchResults").textContent = out.join("\n\n") || "검색 결과가 없습니다.";
});

// ===== 백업/복원 =====
$("#btnExport").addEventListener("click", ()=>{
  const dump = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith("daily:") || k.startsWith("weekly:")) dump[k]=JSON.parse(localStorage.getItem(k));
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(dump,null,2)],{type:"application/json"}));
  a.download = "thanks-diary-backup.json";
  a.click();
});

$("#fileImport").addEventListener("change", async (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const text = await file.text();
  const obj = JSON.parse(text);
  Object.entries(obj).forEach(([k,v])=> localStorage.setItem(k, JSON.stringify(v)));
  toast("복원 완료");
});

$("#btnResetLocal").addEventListener("click", ()=>{
  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith("daily:") || k.startsWith("weekly:")) localStorage.removeItem(k);
  });
  toast("로컬 데이터 초기화");
});

$("#btnRefreshCache").addEventListener("click", ()=> location.reload(true));
