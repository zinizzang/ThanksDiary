// app.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const $ = (s,r=document)=>r.querySelector(s);
const $$= (s,r=document)=>Array.from(r.querySelectorAll(s));
const view = $("#view");
let user=null, currentTab="daily";

const questions = [
  "사람들에게 어떤 사람으로 기억되고 싶나요?","오늘 나를 웃게 만든 순간은 무엇이었나요?","최근에 배운 것 중 가장 마음에 남는 건?","지금 나에게 필요한 한 가지는?","오늘 스스로에게 고마운 점은?","내가 소중히 여기는 가치는?","요즘 가장 집중하고 싶은 건?","오늘 나를 어렵게 한 감정은 무엇이었고, 이유는?","내가 편안함을 느끼는 장소는 어디인가요?","최근에 나를 성장시킨 작은 용기는?","‘이건 나답다’고 느낀 순간은?","감사함을 더 자주 느끼기 위해 바꾸고 싶은 습관은?","나를 응원해주는 문장은 무엇인가요?","오늘 놓아주고 싶은 걱정은?","내가 사랑을 표현하는 방식은?","과거의 나에게 해주고 싶은 말은?","오늘의 나에게 칭찬 한마디를 한다면?","아침에 눈 떴을 때 가장 먼저 떠오른 생각은?","요즘 내 마음을 가볍게 해주는 행동은?","이번 주 나의 핵심 한 가지는?"
];
const healingQuotes=["부러움 대신 배움을 고르면 마음이 한결 가벼워진다.","천천히 가도 멈추지 않으면 도착한다.","작은 친절이 하루의 온도를 바꾼다.","어제의 나보다 한 걸음만 앞으로.","완벽보다 지속이 더 멀리 간다.","마음이 머무는 곳이 나의 집이다.","기대 대신 관찰을, 판단 대신 이해를.","나를 돌보는 일은 주변을 돌보는 일의 시작이다."];

function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.remove("hidden"); t.classList.add("show"); setTimeout(()=>{t.classList.remove("show"); t.classList.add("hidden");},1600); }
function fmtDate(d){ return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`; }
function dateKey(d){ return d.toISOString().slice(0,10); }
function weekInfo(d){ const tmp=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=(tmp.getUTCDay()+6)%7;tmp.setUTCDate(tmp.getUTCDate()-day+3);const firstThu=new Date(Date.UTC(tmp.getUTCFullYear(),0,4));const w=1+Math.round(((tmp-firstThu)/86400000-3+((firstThu.getUTCDay()+6)%7))/7);return {y:tmp.getUTCFullYear(),w}; }
function weekLabel(d){ const month=d.getMonth()+1; const wkInMonth=Math.ceil(d.getDate()/7); const wi=weekInfo(d); return {a:`${wi.y} ${wi.w}번째 주`, b:`${d.getFullYear()}년 ${month}월 ${wkInMonth}주`}; }

function tplDaily(dateStr, weekStr){
  return `<section class="card">
    <div class="date-wrap">
      <button class="btn pill" id="prevDay">&lt;</button>
      <div class="pill mono" id="dateLabel">${dateStr}</div>
      <button class="btn pill" id="todayBtn">오늘</button>
      <div class="pill blue mono" id="weekLabel">${weekStr}</div>
    </div>
    <div class="card">
      <div class="section-title"><span class="ico">🪞</span>오늘의 질문</div>
      <div id="questionBox" class="card" style="background:#fffaf7">질문이 준비되는 중입니다...</div>
      <div class="actions"><button class="btn" id="btnNewQ">다른 질문</button></div>
      <label>답변</label><textarea id="answer" placeholder="질문에 대한 나의 답을 적어보세요."></textarea>
    </div>
    <div class="card">
      <div class="section-title"><span class="ico">🧠</span>감정일기</div>
      <label>사건</label><input id="ev"><label>생각</label><input id="th"><label>감정</label><input id="fe"><label>결과</label><input id="rs">
    </div>
    <div class="card">
      <div class="section-title"><span class="ico">🙏</span>감사일기</div>
      <div class="grid4"><input id="g1" placeholder="감사 1"><input id="g2" placeholder="감사 2"><input id="g3" placeholder="감사 3"><div></div></div>
    </div>
    <div class="actions"><button class="btn primary" id="btnSaveDaily">저장</button><button class="btn" id="btnClearDaily">지우기</button></div>
    <p class="muted">저장 시 로그인 상태면 클라우드에도 동기화됩니다.</p>
  </section>`;
}
function tplWeekly(weekStr){
  return `<section class="card">
    <div class="date-wrap">
      <button class="btn pill" id="prevWeek">&lt;</button>
      <div class="pill mono" id="weekNow">${weekStr}</div>
      <button class="btn pill" id="thisWeek">이번 주</button>
    </div>
    <div class="card">
      <div class="section-title"><span class="ico">✅</span>미션 (체크박스)</div>
      <div id="missions"></div><div class="actions"><button class="btn" id="addMission">+ 추가</button></div>
    </div>
    <div class="card">
      <div class="section-title"><span class="ico">💛</span>오늘의 문구</div>
      <textarea id="healing" placeholder="오늘의 문구"></textarea>
      <div class="actions"><button class="btn" id="randQuote">랜덤</button><button class="btn primary" id="saveWeekly">저장</button></div>
    </div>
  </section>`;
}
function tplSearch(){ return `<section class="card"><div class="section-title"><span class="ico">🔎</span>검색</div><input id="keyword" placeholder="#태그, 키워드"><div class="actions"><button class="btn">검색</button></div></section>`; }
function tplSettings(){ return `<section class="card"><div class="section-title"><span class="ico">🔐</span>로그인</div><div class="actions"><button class="btn" id="openLogin2">로그인</button><button class="btn" id="btnLogout">로그아웃</button></div></section><section class="card"><div class="section-title"><span class="ico">📦</span>백업/복원</div><div class="actions"><button class="btn" id="exportJson">JSON 파일로 저장</button><input type="file" id="importFile" accept="application/json" style="display:none"><button class="btn" id="importJson">JSON 가져오기</button><button class="btn danger" id="clearLocal">로컬 데이터 초기화</button></div></section>`; }

async function loadDailyFromCloud(key){ if(!user) return null; const s=await getDoc(doc(db,"users",user.uid,"daily",key)); return s.exists()?s.data():null; }
async function loadEmotionFromCloud(key){ if(!user) return null; const s=await getDoc(doc(db,"users",user.uid,"emotion",key)); return s.exists()?s.data():null; }
async function loadThanksFromCloud(key){ if(!user) return null; const s=await getDoc(doc(db,"users",user.uid,"thanks",key)); return s.exists()?s.data():null; }

async function saveDailyAll(d){
  if(!user){ toast("로그인 후 클라우드 동기화됩니다."); return; }
  const key=dateKey(d);
  await setDoc(doc(db,"users",user.uid,"daily",key), { question: $("#questionBox").textContent.trim(), answer: $("#answer").value||"" }, {merge:true});
  await setDoc(doc(db,"users",user.uid,"emotion",key), { ev:$("#ev").value||"", th:$("#th").value||"", fe:$("#fe").value||"", rs:$("#rs").value||"" }, {merge:true});
  await setDoc(doc(db,"users",user.uid,"thanks",key), { list: [$("#g1").value||"", $("#g2").value||"", $("#g3").value||""] }, {merge:true});
  toast("저장 완료!");
}

async function getOrAssignQuestion(key){
  if(!user){ const idx=Math.floor(Math.random()*questions.length); $("#questionBox").textContent=questions[idx]; return; }
  const uref=doc(db,"users",user.uid); const usnap=await getDoc(uref);
  let daily=usnap.exists()&&usnap.data().daily?usnap.data().daily:{};
  let used=usnap.exists()&&Array.isArray(usnap.data().usedIndexes)?usnap.data().usedIndexes:[];
  if(daily[key]?.qIdx!=null){ $("#questionBox").textContent=questions[daily[key].qIdx]; return; }
  const remain=questions.map((_,i)=>i).filter(i=>!used.includes(i));
  const idx = remain.length? remain[Math.floor(Math.random()*remain.length)] : Math.floor(Math.random()*questions.length);
  daily[key]={qIdx:idx}; used.push(idx); if(used.length>questions.length) used=used.slice(-questions.length);
  await setDoc(uref, { daily, usedIndexes:used }, {merge:true});
  $("#questionBox").textContent=questions[idx];
}

async function render(){ if(currentTab==="daily") await renderDaily(); else if(currentTab==="weekly") await renderWeekly(); else if(currentTab==="search") view.innerHTML=tplSearch(); else if(currentTab==="settings"){ view.innerHTML=tplSettings(); bindSettings(); } }
function weekLbl(d){ const wl=weekLabel(d); return wl.a; }

async function renderDaily(base){
  const d=base||new Date(); const key=dateKey(d); const wL=weekLbl(d);
  view.innerHTML = tplDaily(fmtDate(d), wL);
  await getOrAssignQuestion(key);
  if(user){ const daily=await loadDailyFromCloud(key); const emo=await loadEmotionFromCloud(key); const tk=await loadThanksFromCloud(key);
    if(daily?.answer) $("#answer").value=daily.answer; if(emo){ $("#ev").value=emo.ev||""; $("#th").value=emo.th||""; $("#fe").value=emo.fe||""; $("#rs").value=emo.rs||""; } if(tk?.list){ $("#g1").value=tk.list[0]||""; $("#g2").value=tk.list[1]||""; $("#g3").value=tk.list[2]||""; }
  }
  $("#prevDay").onclick = ()=>{ const nd=new Date(d); nd.setDate(nd.getDate()-1); renderDaily(nd); };
  $("#todayBtn").onclick= ()=> renderDaily(new Date());
  $("#btnNewQ").onclick = ()=> getOrAssignQuestion(key);
  $("#btnSaveDaily").onclick = ()=> saveDailyAll(d);
  $("#btnClearDaily").onclick= ()=>{["answer","ev","th","fe","rs","g1","g2","g3"].forEach(id=>$("#"+id).value=""); toast("비움");};
}

async function renderWeekly(base){
  const d=base||new Date(); const labels=weekLabel(d);
  view.innerHTML = tplWeekly(labels.a);
  const wrap=$("#missions");
  const add=(t="")=>{ const line=document.createElement("div"); line.className="grid2"; line.innerHTML=`<input class="ms" value="${t}"><button class="btn">삭제</button>`; line.querySelector("button").onclick=()=>line.remove(); wrap.appendChild(line); };
  $("#addMission").onclick=()=>add("");
  $("#randQuote").onclick=()=>{ $("#healing").value = healingQuotes[Math.floor(Math.random()*healingQuotes.length)]; };
  $("#saveWeekly").onclick=async()=>{ if(!user){ toast("로그인 후 저장됩니다."); return; } const inf=weekInfo(d); const list=$$(".ms").map(i=>i.value).filter(v=>v.trim()!==""); await setDoc(doc(db,"users",user.uid,"weekly",`${inf.y}-${inf.w}`),{missions:list,healing:$("#healing").value||""},{merge:true}); toast("주간 저장 완료!"); };
  $("#prevWeek").onclick=()=>{ const nd=new Date(d); nd.setDate(nd.getDate()-7); renderWeekly(nd); };
  $("#thisWeek").onclick=()=>renderWeekly(new Date());
}

function bindSettings(){
  $("#openLogin2").onclick=()=>openLogin();
  $("#btnLogout").onclick =()=>signOut(auth);
  $("#exportJson").onclick=async()=>{
    if(!user){ toast("로그인 후 가능합니다."); return; }
    const out={}; for(const s of ["daily","emotion","thanks","weekly"]){ out[s]={}; const qs=await getDocs(collection(db,"users",user.uid,s)); qs.forEach(d=>out[s][d.id]=d.data()); }
    const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="thanksdiary-backup.json"; a.click(); toast("JSON 내보내기 완료");
  };
  $("#importJson").onclick=()=>$("#importFile").click();
  $("#importFile").onchange=async(e)=>{ const f=e.target.files[0]; if(!f||!user) return; const data=JSON.parse(await f.text()); for(const [k,docs] of Object.entries(data)){ for(const [id,val] of Object.entries(docs)){ await setDoc(doc(db,"users",user.uid,k,id),val,{merge:true}); } } toast("가져오기 완료"); };
  $("#clearLocal").onclick=()=>{ localStorage.clear(); toast("로컬 데이터 삭제"); };
}

function openLogin(){ $("#loginModal").classList.remove("hidden"); }
function closeLogin(){ $("#loginModal").classList.add("hidden"); }
$("#openLogin").onclick=openLogin; $("#btnCloseLogin").onclick=closeLogin;
$("#btnSignIn").onclick=async()=>{ try{ await signInWithEmailAndPassword(auth,$("#loginEmail").value.trim(),$("#loginPw").value); $("#loginMsg").textContent="로그인 성공!"; setTimeout(closeLogin,600);}catch(e){ $("#loginMsg").textContent="실패: "+e.message; }};
$("#btnSignUp").onclick=async()=>{ try{ await createUserWithEmailAndPassword(auth,$("#loginEmail").value.trim(),$("#loginPw").value); $("#loginMsg").textContent="회원가입 성공!"; setTimeout(closeLogin,800);}catch(e){ $("#loginMsg").textContent="실패: "+e.message; }};

$$(".tab-btn").forEach(b=> b.onclick=()=>{ currentTab=b.dataset.tab; render(); window.scrollTo(0,0); });

import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // (not used but keeps module split simple)

onAuthStateChanged(auth, async(u)=>{ user=u||null; $("#authState").textContent=user?`${user.email} 로그인됨`:"로그아웃 상태"; await render(); });
render();
