// ===== Firebase (module) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// --- 프로젝트 설정 (진희 값) ---
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

// ===== helpers =====
const $ = (s,r=document)=>r.querySelector(s);
const $$= (s,r=document)=>Array.from(r.querySelectorAll(s));
const view = $("#view");
const toastEl = $("#toast");
let user = null;
let route = "daily";

function toast(msg){ toastEl.textContent = msg; toastEl.classList.remove("hidden"); toastEl.classList.add("show"); setTimeout(()=>{toastEl.classList.remove("show"); toastEl.classList.add("hidden");},1500); }

// ===== 질문 50개 (자기 성찰) =====
const QUESTIONS = [
"오늘 하루 중 가장 감사했던 순간은 무엇인가요?","오늘 나를 웃게 만든 일은 무엇인가요?","오늘의 기분을 한 단어로 표현한다면?","내가 오늘 배운 새로운 것은 무엇인가요?","오늘의 나에게 가장 자랑스러운 점은?","오늘 내가 다른 사람에게 준 긍정적인 영향은?","오늘 하루 중 가장 평온했던 시간은 언제인가요?","오늘 나를 힘들게 했지만 극복한 일은?","오늘의 나를 1~10으로 점수 매긴다면? 이유는?","오늘 내가 가장 집중했던 일은 무엇인가요?","오늘을 떠올리면 가장 먼저 생각나는 장면은?","오늘 나를 성장시킨 경험은 무엇인가요?","오늘 느낀 감정 중 가장 강렬했던 것은?","오늘 내가 놓친 기회는 무엇이었나요?","오늘의 내가 어제보다 나아진 점은?","오늘 내가 다른 사람에게 한 친절은?","오늘 내 마음이 따뜻해진 순간은?","오늘 내가 한 선택 중 가장 잘한 것은?","오늘 내가 미루지 않고 끝낸 일은?","오늘 나를 도와준 사람과 그 이유는?","오늘 내가 스스로를 돌본 방법은?","오늘 가장 용기 냈던 순간은?","오늘 내가 배운 교훈은?","오늘의 감사 세 가지는?","오늘 내가 놓친 감사는 무엇일까요?","오늘 누군가에게 전하고 싶은 말은?","오늘을 더 행복하게 만들 수 있었던 방법은?","오늘 의도적으로 멈춘 순간은?","오늘 불편했지만 성장시킨 일은?","오늘 조금 더 친절할 수 있었던 순간은?","오늘 실천한 자기계발 행동은?","오늘 주변에서 발견한 작은 아름다움은?","오늘 내가 웃었던 이유는?","오늘 놓친 작은 기쁨은?","오늘 나를 놀라게 한 일은?","오늘 집중해서 들었던 말/대화는?","오늘 더 잘할 수 있었던 일은?","오늘 나를 안정시킨 루틴은?","오늘 새로운 시각으로 본 것은?","오늘 나를 지치게 한 일은?","오늘 ‘잘했다’고 느낀 순간은?","오늘 의도적으로 멀리한 일/사람은?","오늘 내 마음을 울린 장면은?","오늘 잠시 멈춰 생각하게 된 이유는?","오늘 다른 사람에게 배운 점은?","오늘 스스로에게 준 선물은?","오늘 마음속으로 ‘고마워’라 한 대상은?","오늘 계획 없던데 하게 된 일은?","오늘 나를 더 이해하게 된 계기는?","오늘 하루를 한 문장으로 정리한다면?"
];

// ===== 날짜/주차 =====
function fmtDate(d){ return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`; }
function dateKey(d){ return d.toISOString().slice(0,10); }
function weekInfo(d){ const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-day+3); const firstThu=new Date(Date.UTC(t.getUTCFullYear(),0,4)); const w=1+Math.round(((t-firstThu)/86400000-3+((firstThu.getUTCDay()+6)%7))/7); return {y:t.getUTCFullYear(), w}; }
function weekLabel(d){ const wi=weekInfo(d); const month=d.getMonth()+1; const wkInMonth=Math.ceil(d.getDate()/7); return { a:`${wi.y} ${wi.w}번째 주`, b:`${d.getFullYear()}년 ${month}월 ${wkInMonth}주` }; }

// ===== Firestore read/write =====
async function cloudGet(path){ if(!user) return null; const snap = await getDoc(doc(db, `users/${user.uid}/${path}`)); return snap.exists()? snap.data(): null; }
async function cloudSave(path, data){ if(!user) return; await setDoc(doc(db, `users/${user.uid}/${path}`), data, { merge:true }); }

// 질문 배정(중복 방지, 사용자별 진행 상태)
async function getOrAssignQuestion(key){
  if(!user){ $("#todayQ").textContent = QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)]; return; }
  const uref = doc(db,"users",user.uid);
  const snap = await getDoc(uref);
  let state = snap.exists()? (snap.data()||{}) : {};
  let used = Array.isArray(state.usedIndexes)? state.usedIndexes : [];
  state.daily = state.daily || {};
  if(state.daily[key]?.qIdx!=null){ $("#todayQ").textContent = QUESTIONS[state.daily[key].qIdx]; return; }
  let pool = QUESTIONS.map((_,i)=>i).filter(i=>!used.includes(i));
  if(pool.length===0){ used=[]; pool = QUESTIONS.map((_,i)=>i); }
  const pick = pool[Math.floor(Math.random()*pool.length)];
  state.daily[key] = { qIdx: pick };
  used.push(pick);
  await setDoc(uref, { daily: state.daily, usedIndexes: used }, { merge:true });
  $("#todayQ").textContent = QUESTIONS[pick];
}

// ===== 템플릿 =====
function dailyTpl(d){
  const wl = weekLabel(d).a; // 한 줄 표기
  return `
  <section class="card">
    <div class="datebar">
      <button class="btn pill" id="prevDay">&lt;</button>
      <div class="pill mono" id="dateLabel">${fmtDate(d)}</div>
      <button class="btn pill" id="todayBtn">오늘</button>
      <div class="pill blue mono" id="weekLabel">${wl}</div>
    </div>

    <div class="card">
      <div class="section-title"><span>🪞</span> 오늘의 질문</div>
      <div id="todayQ" class="card" style="background:#fffbf2">질문이 준비되는 중입니다…</div>
      <div class="actions"><button class="btn" id="newQ">다른 질문</button></div>
      <label>답변</label>
      <textarea id="ans" rows="4" placeholder="질문에 대한 나의 답을 적어보세요."></textarea>
    </div>

    <div class="card">
      <div class="section-title"><span>🧠</span> 감정일기</div>
      <label>사건</label><input id="ev">
      <label>생각</label><input id="th">
      <label>감정</label><input id="fe">
      <label>결과</label><input id="rs">
    </div>

    <div class="card">
      <div class="section-title"><span>✨</span> 감사일기 (3개)</div>
      <div class="grid grid-3">
        <input id="g1" placeholder="감사 1">
        <input id="g2" placeholder="감사 2">
        <input id="g3" placeholder="감사 3">
      </div>
    </div>

    <div class="actions">
      <button class="btn primary" id="saveDaily">저장</button>
      <button class="btn" id="clearDaily">지우기</button>
    </div>
    <p class="muted">저장 시 로그인 상태면 클라우드에도 동기화됩니다.</p>
  </section>`;
}

function weeklyTpl(d){
  const wl = weekLabel(d).a;
  return `
  <section class="card">
    <div class="datebar">
      <button class="btn pill" id="prevWeek">&lt;</button>
      <div class="pill mono" id="weekNow">${wl}</div>
      <button class="btn pill" id="thisWeek">이번 주</button>
    </div>

    <div class="card">
      <div class="section-title"><span>✅</span> 미션 (체크박스)</div>
      <div id="missions"></div>
      <div class="actions"><button class="btn" id="addMission">+ 추가</button></div>
    </div>

    <div class="card">
      <div class="section-title"><span>💛</span> 오늘의 문구</div>
      <textarea id="healing" rows="2" placeholder="감성 에세이 풍의 짧은 문구"></textarea>
      <div class="actions">
        <button class="btn" id="randQuote">랜덤</button>
        <button class="btn primary" id="saveWeekly">저장</button>
      </div>
    </div>
  </section>`;
}

function searchTpl(){
  return `<section class="card">
    <div class="section-title"><span>🔎</span> 검색</div>
    <input id="kw" placeholder="키워드 또는 #태그">
    <div class="actions"><button class="btn" id="doSearch">검색</button></div>
    <div class="muted" id="searchRes">결과 없음</div>
  </section>`;
}

function settingsTpl(){
  return `<section class="card">
    <div class="section-title"><span>🔐</span> 로그인</div>
    <div class="actions">
      <button class="btn" id="openLogin2">로그인/회원가입</button>
      <button class="btn" id="btnLogout">로그아웃</button>
    </div>
  </section>
  <section class="card">
    <div class="section-title"><span>📦</span> 백업/복원</div>
    <div class="actions">
      <button class="btn" id="exportJson">JSON 저장</button>
      <input id="importFile" type="file" accept="application/json" style="display:none">
      <button class="btn" id="importJson">JSON 가져오기</button>
    </div>
  </section>`;
}

// ===== 페이지 렌더러 =====
async function render(){
  if(route==="daily") await renderDaily();
  else if(route==="weekly") await renderWeekly();
  else if(route==="search") renderSearch();
  else if(route==="settings") renderSettings();
  document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('active', b.dataset.route===route));
}

async function renderDaily(baseDate){
  const d = baseDate || new Date();
  const key = dateKey(d);
  view.innerHTML = dailyTpl(d);

  // 질문 배정 + 데이터 하이드레이트
  await getOrAssignQuestion(key);
  if(user){
    const A = await cloudGet(`daily/${key}`);
    const E = await cloudGet(`emotion/${key}`);
    const T = await cloudGet(`thanks/${key}`);
    if(A?.answer) $("#ans").value = A.answer;
    if(E){ $("#ev").value=E.ev||""; $("#th").value=E.th||""; $("#fe").value=E.fe||""; $("#rs").value=E.rs||""; }
    if(T?.list){ $("#g1").value=T.list[0]||""; $("#g2").value=T.list[1]||""; $("#g3").value=T.list[2]||""; }
  }

  $("#prevDay").onclick = ()=>{ const nd=new Date(d); nd.setDate(nd.getDate()-1); renderDaily(nd); };
  $("#todayBtn").onclick= ()=> renderDaily(new Date());
  $("#newQ").onclick    = ()=> getOrAssignQuestion(key);
  $("#saveDaily").onclick = async ()=>{
    await cloudSave(`daily/${key}`, { question: $("#todayQ").textContent.trim(), answer: $("#ans").value||"" });
    await cloudSave(`emotion/${key}`,{ ev:$("#ev").value||"", th:$("#th").value||"", fe:$("#fe").value||"", rs:$("#rs").value||"" });
    await cloudSave(`thanks/${key}`, { list:[ $("#g1").value||"", $("#g2").value||"", $("#g3").value||"" ] });
    toast("저장 완료!");
  };
  $("#clearDaily").onclick= ()=>{ ["ans","ev","th","fe","rs","g1","g2","g3"].forEach(id=> $("#"+id).value=""); };
}

async function renderWeekly(baseDate){
  const d = baseDate || new Date();
  const key = `${weekInfo(d).y}-${weekInfo(d).w}`;
  view.innerHTML = weeklyTpl(d);

  // 불러오기
  if(user){
    const W = await cloudGet(`weekly/${key}`);
    if(W){
      (W.missions||[]).forEach(txt=> addMissionRow(txt));
      if(W.healing) $("#healing").value = W.healing;
    }
  }

  $("#addMission").onclick = ()=> addMissionRow("");
  $("#randQuote").onclick  = ()=> $("#healing").value = QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];
  $("#saveWeekly").onclick = async ()=>{
    if(!user){ toast("로그인 후 저장됩니다."); return; }
    const list = $$(".ms").map(i=>i.value).filter(t=>t.trim()!=="");
    await cloudSave(`weekly/${key}`, { missions:list, healing: $("#healing").value||"" });
    toast("주간 저장 완료!");
  };
  $("#prevWeek").onclick   = ()=>{ const nd=new Date(d); nd.setDate(nd.getDate()-7); renderWeekly(nd); };
  $("#thisWeek").onclick   = ()=> renderWeekly(new Date());
}

function addMissionRow(txt=""){
  const line = document.createElement("div");
  line.className="grid grid-2";
  line.innerHTML = `<input class="ms" value="${txt}"><button class="btn">삭제</button>`;
  line.querySelector("button").onclick = ()=> line.remove();
  $("#missions").appendChild(line);
}

function renderSearch(){
  view.innerHTML = searchTpl();
  $("#doSearch").onclick = ()=>{
    $("#searchRes").textContent = "로컬/클라우드 혼합 검색은 다음 릴리스에서 확장합니다.";
  };
}

function renderSettings(){
  view.innerHTML = settingsTpl();
  $("#openLogin2").onclick = ()=> openLogin();
  $("#btnLogout").onclick  = ()=> signOut(auth);

  $("#exportJson").onclick = async ()=>{
    if(!user){ toast("로그인 후 가능합니다."); return; }
    const out={};
    for(const col of ["daily","emotion","thanks","weekly"]){
      out[col]={};
      const qs = await getDocs(collection(db,"users",user.uid,col));
      qs.forEach(s=> out[col][s.id]=s.data());
    }
    const blob = new Blob([JSON.stringify(out,null,2)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download="thanksdiary-backup.json"; a.click();
  };
  $("#importJson").onclick = ()=> $("#importFile").click();
  $("#importFile").onchange = async (e)=>{
    const f = e.target.files[0]; if(!f||!user) return;
    const obj = JSON.parse(await f.text());
    for(const [col,docs] of Object.entries(obj)){
      for(const [id,val] of Object.entries(docs)){
        await cloudSave(`${col}/${id}`, val);
      }
    }
    toast("가져오기 완료!");
  };
}

// ===== 로그인 모달 =====
function openLogin(){ $("#loginModal").classList.remove("hidden"); }
function closeLogin(){ $("#loginModal").classList.add("hidden"); }
$("#openLogin").onclick = openLogin;
$("#btnCloseLogin").onclick = closeLogin;

$("#btnSignIn").onclick = async ()=>{
  try{
    await signInWithEmailAndPassword(auth, $("#loginEmail").value.trim(), $("#loginPw").value);
    $("#loginMsg").textContent = "로그인 성공!"; setTimeout(closeLogin, 500);
  }catch(e){ $("#loginMsg").textContent = "로그인 실패: "+ (e.code||e.message); }
};
$("#btnSignUp").onclick = async ()=>{
  try{
    await createUserWithEmailAndPassword(auth, $("#loginEmail").value.trim(), $("#loginPw").value);
    $("#loginMsg").textContent = "회원가입/로그인 완료!"; setTimeout(closeLogin, 600);
  }catch(e){ $("#loginMsg").textContent = "회원가입 실패: "+ (e.code||e.message); }
};

// ===== 탭 라우팅 (한 화면만 보이도록 완전 교체) =====
document.querySelectorAll('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=>{ route = b.dataset.route; render(); window.scrollTo({top:0,behavior:'instant'}); });
});

// ===== Auth 상태 =====
onAuthStateChanged(auth, async (u)=>{
  user = u || null;
  $("#authState").textContent = user ? `${user.email} 로그인됨` : "로그아웃 상태";
  await render();
});

// 처음 진입
render();
