// ===== Firebase =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// >>> 여기에 본인 프로젝트 값으로 바꾸기 <<<
const firebaseConfig = {
  apiKey: "AIzaSyAOqrdA0aHL5lMXOOmdtj8mnLi6zgSXoiM",
  authDomain: "thanksdiary-dca35.firebaseapp.com",
  projectId: "thanksdiary-dca35",
  storageBucket: "thanksdiary-dca35.firebasestorage.app",
  messagingSenderId: "250477396044",
  appId: "1:250477396044:web:aa1cf155f01263e08834e9",
  measurementId: "G-J0Z03LHYYC"
};
// ---------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(()=>{}); // 오프라인 쓰기/읽기

// ====== 전역 ======
const $ = sel => document.querySelector(sel);
const view = $("#view");
const toast = document.createElement('div'); toast.className='toast'; document.body.appendChild(toast);
const routes = ["daily","weekly","search","settings"];
let currentRoute = "daily";
let user = null;

// ====== 질문 50 ======
const QUESTIONS = [
 "오늘 하루 중 가장 감사했던 순간은 무엇인가요?",
 "오늘 나를 웃게 만든 일은 무엇인가요?",
 "오늘의 기분을 한 단어로 표현한다면?",
 "내가 오늘 배운 새로운 것은 무엇인가요?",
 "오늘의 나에게 가장 자랑스러운 점은?",
 "오늘 내가 다른 사람에게 준 긍정적인 영향은?",
 "오늘 하루 중 가장 평온했던 시간은 언제인가요?",
 "오늘 나를 힘들게 했지만 극복한 일은?",
 "오늘의 나를 1~10으로 점수 매긴다면? 이유는?",
 "오늘 내가 가장 집중했던 일은 무엇인가요?",
 "오늘을 떠올리면 가장 먼저 생각나는 장면은?",
 "오늘 나를 성장시킨 경험은 무엇인가요?",
 "오늘 느낀 감정 중 가장 강렬했던 것은?",
 "오늘 내가 놓친 기회는 무엇이었나요?",
 "오늘의 내가 어제보다 나아진 점은?",
 "오늘 내가 다른 사람에게 한 친절은?",
 "오늘 내 마음이 따뜻해진 순간은?",
 "오늘 내가 한 선택 중 가장 잘한 것은?",
 "오늘 내가 미루지 않고 끝낸 일은?",
 "오늘 나를 도와준 사람과 그 이유는?",
 "오늘 내가 스스로를 돌본 방법은?",
 "오늘 가장 용기 냈던 순간은?",
 "오늘 내가 배운 교훈은?",
 "오늘의 감사 세 가지는?",
 "오늘 내가 놓친 감사는 무엇일까요?",
 "오늘 누군가에게 전하고 싶은 말은?",
 "오늘을 더 행복하게 만들 수 있었던 방법은?",
 "오늘 의도적으로 멈춘 순간은?",
 "오늘 불편했지만 성장시킨 일은?",
 "오늘 조금 더 친절할 수 있었던 순간은?",
 "오늘 실천한 자기계발 행동은?",
 "오늘 주변에서 발견한 작은 아름다움은?",
 "오늘 내가 웃었던 이유는?",
 "오늘 놓친 작은 기쁨은?",
 "오늘 나를 놀라게 한 일은?",
 "오늘 집중해서 들었던 말/대화는?",
 "오늘 더 잘할 수 있었던 일은?",
 "오늘 나를 안정시킨 루틴은?",
 "오늘 새로운 시각으로 본 것은?",
 "오늘 나를 지치게 한 일은?",
 "오늘 ‘잘했다’고 느낀 순간은?",
 "오늘 의도적으로 멀리한 일/사람은?",
 "오늘 내 마음을 울린 장면은?",
 "오늘 잠시 멈춰 생각하게 된 이유는?",
 "오늘 다른 사람에게 배운 점은?",
 "오늘 스스로에게 준 선물은?",
 "오늘 마음속으로 ‘고마워’라 한 대상은?",
 "오늘 계획 없던데 하게 된 일은?",
 "오늘 나를 더 이해하게 된 계기는?",
 "오늘 하루를 한 문장으로 정리한다면?"
];

// ====== 유틸 ======
const fmtDate = (d=new Date()) => `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}.`;
const weekInfo = (d=new Date())=>{
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const jan1 = new Date(Date.UTC(target.getUTCFullYear(),0,1));
  const diff = Math.floor((target-jan1)/86400000);
  const week = Math.floor((diff + jan1.getUTCDay()+6)/7)+1; // ISO-ish
  return {year:d.getFullYear(), month:d.getMonth()+1, week};
};
const showToast = (msg)=>{ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1500); }

// ====== 질문 배정(중복방지+클라우드) ======
async function getOrAssignQuestion(dateKey){
  if(!user) return QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)]; // 비로그인: 로컬 랜덤

  const stateRef = doc(db, "users", user.uid);
  const snap = await getDoc(stateRef);
  let state = snap.exists() ? snap.data() : { usedIndexes: [], daily: {} };

  // 이미 배정된 질문?
  if(state.daily && state.daily[dateKey] != null){
    return QUESTIONS[state.daily[dateKey]];
  }
  // 사용하지 않은 인덱스 풀에서 하나
  let pool = [...Array(QUESTIONS.length).keys()].filter(i=>!state.usedIndexes?.includes(i));
  if(pool.length===0){ state.usedIndexes=[]; pool=[...Array(QUESTIONS.length).keys()]; }
  const pick = pool[Math.floor(Math.random()*pool.length)];

  state.usedIndexes.push(pick);
  state.daily = {...(state.daily||{}), [dateKey]: pick};
  if(snap.exists()) await updateDoc(stateRef, state);
  else await setDoc(stateRef, state);

  return QUESTIONS[pick];
}

// ====== 라우팅 ======
function setActiveTab(route){
  currentRoute = route;
  document.querySelectorAll('.tab-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.route===route);
  });
  render();
}

document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> setActiveTab(btn.dataset.route));
});

// ====== 화면들 ======
async function render(){
  if(currentRoute==="daily") await renderDaily();
  if(currentRoute==="weekly") renderWeekly();
  if(currentRoute==="search") renderSearch();
  if(currentRoute==="settings") renderSettings();
}

async function renderDaily(){
  const dateKey = new Date().toISOString().slice(0,10); // yyyy-mm-dd
  const q = await getOrAssignQuestion(dateKey);

  view.innerHTML = `
    <section class="card">
      <div class="spread">
        <div class="h2">오늘의 질문</div>
        <div class="row">
          <span class="kbd">${fmtDate()}</span>
        </div>
      </div>
      <p id="todayQ" class="hint" style="font-size:1.05rem">${q}</p>
      <label class="mt12">답변
        <textarea id="answer" rows="5" placeholder="질문에 대한 나의 답을 적어보세요."></textarea>
      </label>
      <div class="row mt12">
        <button id="btnDailySave" class="btn primary">저장</button>
        <button id="btnDailyClear" class="btn danger">지우기</button>
      </div>
    </section>

    <section class="card">
      <div class="h2">감정일기</div>
      <label>사건<input id="ev" class="input" placeholder="오늘 무슨 일이 있었나요?"></label>
      <label class="mt8">생각<input id="th" class="input" placeholder="그때 어떤 생각이 들었나요?"></label>
      <label class="mt8">감정<input id="fe" class="input" placeholder="어떤 감정이 올라왔나요?"></label>
      <label class="mt8">결과<input id="rs" class="input" placeholder="그 결과는 어땠나요?"></label>
      <div class="row mt12">
        <button id="btnEmoSave" class="btn primary">저장</button>
        <button id="btnEmoClear" class="btn danger">지우기</button>
      </div>
    </section>

    <section class="card">
      <div class="h2">감사일기 (3개)</div>
      <label><input id="g1" class="input" placeholder="감사 한 가지"/></label>
      <label class="mt8"><input id="g2" class="input" placeholder="감사 한 가지"/></label>
      <label class="mt8"><input id="g3" class="input" placeholder="감사 한 가지"/></label>
      <div class="row mt12">
        <button id="btnThanksSave" class="btn primary">저장</button>
      </div>
    </section>
  `;

  // 저장 핸들러 (로그인 시 Firestore 동기화)
  $("#btnDailySave").onclick = async ()=>{
    const payload = { date: dateKey, question: $("#todayQ").textContent, answer: $("#answer").value, ts: Date.now() };
    localStorage.setItem(`daily:${dateKey}`, JSON.stringify(payload));
    if(user){
      await setDoc(doc(db, "users", user.uid, "daily", dateKey), payload, { merge:true });
    }
    showToast("저장 완료!");
  };
  $("#btnDailyClear").onclick = ()=>{ $("#answer").value=""; };

  $("#btnEmoSave").onclick = async ()=>{
    const payload = { date: dateKey, ev:$("#ev").value, th:$("#th").value, fe:$("#fe").value, rs:$("#rs").value, ts:Date.now() };
    localStorage.setItem(`emo:${dateKey}`, JSON.stringify(payload));
    if(user) await setDoc(doc(db,"users",user.uid,"emotion",dateKey), payload, {merge:true});
    showToast("감정일기 저장 완료!");
  };
  $("#btnEmoClear").onclick = ()=>["#ev","#th","#fe","#rs"].forEach(s=>$(s).value="");

  $("#btnThanksSave").onclick = async ()=>{
    const payload = { date: dateKey, list:[ $("#g1").value, $("#g2").value, $("#g3").value ], ts:Date.now() };
    localStorage.setItem(`thanks:${dateKey}`, JSON.stringify(payload));
    if(user) await setDoc(doc(db,"users",user.uid,"thanks",dateKey), payload, {merge:true});
    showToast("감사일기 저장 완료!");
  };
}

function renderWeekly(){
  const {year,month,week} = weekInfo();
  view.innerHTML = `
    <section class="card">
      <div class="h2">이번 주</div>
      <div class="row">
        <div class="week-line">${year}년 ${week}번째 주</div>
        <div class="week-sub">(${year}년 ${month}월)</div>
      </div>
      <div class="row inline-end mt12">
        <input id="newMission" class="input" placeholder="미션 추가" />
        <button id="btnAddMission" class="btn primary">+ 추가</button>
      </div>
      <ul id="missionList" class="mt12"></ul>
    </section>

    <section class="card">
      <div class="h2">힐링문구</div>
      <p class="hint">부러움 대신 배움을 고르면 마음은 가벼워진다</p>
      <button class="btn">필사 시작</button>
    </section>
  `;
  $("#btnAddMission").onclick = ()=>{
    const v = $("#newMission").value.trim();
    if(!v) return;
    const li = document.createElement('li');
    li.textContent = v;
    $("#missionList").appendChild(li);
    $("#newMission").value="";
  };
}

function renderSearch(){
  view.innerHTML = `
    <section class="card">
      <div class="h2">검색</div>
      <input id="kw" class="input" placeholder="키워드를 입력하세요"/>
      <div class="mt12" id="result" class="hint"></div>
    </section>
  `;
}

function renderSettings(){
  view.innerHTML = `
    <section class="card">
      <div class="h2">백업/복원</div>
      <div class="row">
        <button id="btnExport" class="btn">JSON 파일로 저장</button>
        <input id="imp" type="file" accept="application/json" />
      </div>
      <p class="hint mt8">로그인 상태라면 클라우드에도 자동 동기화됩니다.</p>
    </section>
  `;
  $("#btnExport").onclick = ()=>{
    const dump = JSON.stringify(localStorage);
    const blob = new Blob([dump],{type:"application/json"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = "thanks-diary-backup.json"; a.click();
  };
  $("#imp").onchange = e=>{
    const file = e.target.files?.[0]; if(!file) return;
    const fr = new FileReader();
    fr.onload = ()=>{ try{
      const data = JSON.parse(fr.result);
      Object.entries(data).forEach(([k,v])=> localStorage.setItem(k,v));
      showToast("가져오기 완료!");
    }catch{ showToast("JSON 형식 오류"); } };
    fr.readAsText(file);
  };
}

// ====== 로그인 모달 ======
const dlg = $("#loginModal");
$("#btnOpenLogin").onclick = ()=> dlg.showModal();
$("#btnCloseLogin").onclick = ()=> dlg.close();

$("#btnDoLogin").onclick = async (e)=>{
  e.preventDefault();
  try{
    const email = $("#loginEmail").value.trim();
    const pass = $("#loginPass").value;
    await signInWithEmailAndPassword(auth,email,pass);
    $("#loginMsg").textContent = "로그인 성공!";
    setTimeout(()=>dlg.close(), 300);
  }catch(err){
    $("#loginMsg").textContent = "로그인 실패: " + (err.code||"");
  }
};
$("#btnDoSignup").onclick = async (e)=>{
  e.preventDefault();
  try{
    const email = $("#loginEmail").value.trim();
    const pass = $("#loginPass").value;
    await createUserWithEmailAndPassword(auth,email,pass);
    $("#loginMsg").textContent = "회원가입/로그인 완료!";
    setTimeout(()=>dlg.close(), 300);
  }catch(err){
    $("#loginMsg").textContent = "회원가입 실패: " + (err.code||"");
  }
};

// ====== Auth 상태 ======
onAuthStateChanged(auth, async (u)=>{
  user = u||null;
  $("#authState").textContent = user ? `${user.email} 로그인됨` : "로그아웃 상태";
});

// 초기 라우트
setActiveTab("daily");
