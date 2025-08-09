// ThanksDiary v2.7.2 (cache-safe)
// Optional Firebase lazy import
let fb = {app:null, auth:null, db:null};
async function initFirebaseIfPresent(){
  try{
    if(typeof firebaseConfig === 'undefined') return false;
    const [{ initializeApp }, { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut },
      { getFirestore, doc, getDoc, setDoc }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
      ]);
    fb.app = initializeApp(firebaseConfig);
    fb.auth = getAuth();
    fb.db = getFirestore();
    window._fb = { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, doc, getDoc, setDoc };
    // auth state
    _fb.onAuthStateChanged(fb.auth, async (user)=>{
      const s = document.getElementById('loginState');
      const openBtn = document.getElementById('openLogin');
      if(user){
        s.textContent = user.email + ' 로그인됨';
        openBtn.textContent = '로그인';
        // cloud -> local sync (one-way on login)
        await cloudPull();
      }else{
        s.textContent = '로그아웃 상태';
        openBtn.textContent = '로그인';
      }
    });
    return true;
  }catch(e){ console.warn('Firebase init skipped', e); return false; }
}

// Local storage helpers
const LS_KEY = 'thanksDiary.v2.data';
const state = {
  daily: {}, // by ISO date
  weekly: {}, // by ISO week
  tags: {}, // by date
  questions: { used: [] },
  quoteUsedIdx: {},
  user: null
};
function loadLocal(){
  try{ Object.assign(state, JSON.parse(localStorage.getItem(LS_KEY) || '{}')); }catch{}
}
function saveLocal(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); toast('저장 완료!'); }

// Cloud helpers
async function cloudPull(){
  if(!fb.db || !fb.auth?.currentUser) return;
  const uid = fb.auth.currentUser.uid;
  const ref = _fb.doc(fb.db, 'users', uid);
  const snap = await _fb.getDoc(ref);
  if(snap.exists()){
    const cloud = snap.data();
    // merge (cloud supersedes)
    Object.assign(state, cloud);
    saveLocal(); // persists merge
    render(location.hash);
  }
}
async function cloudPush(){
  if(!fb.db || !fb.auth?.currentUser) return;
  const uid = fb.auth.currentUser.uid;
  const ref = _fb.doc(fb.db, 'users', uid);
  await _fb.setDoc(ref, state, { merge: true });
}

// Router
const view = document.getElementById('view');
const routes = { '#/daily': renderDaily, '#/weekly': renderWeekly, '#/search': renderSearch, '#/settings': renderSettings };
window.addEventListener('hashchange', ()=>render(location.hash));
function render(hash){ (routes[hash] || routes['#/daily'])(); }
document.addEventListener('DOMContentLoaded', async ()=>{
  loadLocal();
  await initFirebaseIfPresent();
  // open login
  document.getElementById('openLogin').addEventListener('click', ()=>document.getElementById('loginModal').showModal());
  // login actions
  const dlg = document.getElementById('loginModal');
  document.getElementById('closeLogin').addEventListener('click', ()=>dlg.close());
  document.getElementById('doLogin').addEventListener('click', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPw').value;
    const msg = document.getElementById('loginMsg');
    try{
      if(!fb.auth){ msg.textContent='로그인은 나중에 연결할게요! (지금은 로컬 저장만 지원)'; return; }
      await _fb.signInWithEmailAndPassword(fb.auth, email, pw);
      msg.textContent='로그인 성공!';
      dlg.close(); render(location.hash);
    }catch(err){ msg.textContent='오류: ' + err.message; }
  });
  document.getElementById('doSignup').addEventListener('click', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPw').value;
    const msg = document.getElementById('loginMsg');
    try{
      if(!fb.auth){ msg.textContent='회원가입은 나중에 연결할게요!'; return; }
      await _fb.createUserWithEmailAndPassword(fb.auth, email, pw);
      msg.textContent='가입/로그인 성공!';
      dlg.close(); render(location.hash);
    }catch(err){ msg.textContent='오류: ' + err.message; }
  });
  if(!location.hash) location.hash = '#/daily';
  render(location.hash);
});

// Utils
function todayISO(d=new Date()){ d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function weekKey(d=new Date()){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  const wk = `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  return wk;
}
function weekLabel(d=new Date()){
  const y = d.getFullYear(); const m = d.getMonth()+1;
  // 1주차 계산: 그 달의 1일이 속한 주를 1주로 보고 현재 날짜의 주차(월 기준)
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const n = Math.floor((d.getDate() + first.getDay())/7)+1;
  return `${y}년 ${m}월 ${n}주`;
}
function pill(text, cls='pill'){ return `<span class="${cls}">${text}</span>`}
function icon(text){ return `<span class="icon" aria-hidden="true">${text}</span>`}
function toast(msg){
  const t = document.createElement('div'); t.className='toast'; t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(), 1400);
}

// Questions & Quotes
const QUESTIONS = [
  "사람들에게 어떤 사람으로 기억되고 싶나요?","오늘 나를 미소 짓게 한 작은 순간은?","최근 내가 포기하지 않은 일은?","오늘 감사했던 세 가지는?",
  "내가 더 알고 싶은 나의 모습은 어떤 모습인가요?","오늘 내가 보여준 친절 하나는?","요즘 가장 나를 설레게 하는 것은?","내가 바라는 내일의 작은 변화는?",
  "최근 배운 소소한 교훈은?","오늘 챙겨준 내 마음은 어디인가요?"
];
function getTodaysQuestion(dateISO){
  const d = dateISO || todayISO();
  if(!state.questions.used) state.questions.used = [];
  let idx = state.questions.used.find(i=>i.date === d)?.idx;
  if(idx==null){
    // pick non-repeating
    const pool = [...QUESTIONS.keys()].filter(i=>!state.questions.used.some(u=>u.idx===i));
    if(pool.length===0){ state.questions.used=[]; return getTodaysQuestion(d); }
    idx = pool[Math.floor(Math.random()*pool.length)];
    state.questions.used.push({date:d, idx});
    saveLocal(); cloudPush();
  }
  return QUESTIONS[idx];
}

// Renderers
function renderDaily(){
  const dISO = todayISO();
  const q = getTodaysQuestion(dISO);
  const tagText = state.tags[dISO] || "";
  const dailyText = (state.daily[dISO]?.journal) || "";
  view.innerHTML = `
    <section class="section">
      <h2>오늘의 질문</h2>
      <p class="desc">나를 되돌아보는 한 줄 질문이에요.</p>
      <div class="card">${q}</div>
      <div class="row card-actions">
        <button class="btn" id="newQ">다른 질문</button>
      </div>
      <label>답변</label>
      <textarea id="answerBox" placeholder="질문에 대한 나의 답을 적어보세요.">${state.daily[dISO]?.answer||''}</textarea>
      <div class="footer-actions">
        <button class="btn primary" id="saveDaily">저장</button>
        <button class="btn" id="clearDaily">지우기</button>
      </div>
    </section>
    <section class="section">
      <h2>${icon('📁')} 일상일기</h2>
      <p class="desc">오늘의 일상을 자유롭게 남겨보세요.</p>
      <textarea id="journalBox" placeholder="하루를 가볍게 기록해요.">${dailyText}</textarea>
      <div class="footer-actions">
        <button class="btn primary" id="saveJournal">저장</button>
      </div>
    </section>
    <section class="section">
      <h2>${icon('🏷️')} 태그 달기</h2>
      <p class="desc">#가족, #산책 처럼 심표로 구분해서 태그를 달아요.</p>
      <input type="text" id="tagInput" placeholder="#가족, #산책, #커피" value="${tagText}">
      <div class="footer-actions">
        <button class="btn primary" id="saveTags">저장</button>
      </div>
    </section>
  `;
  document.getElementById('newQ').onclick = ()=>{ state.questions.used = state.questions.used.filter(u=>u.date!==dISO); renderDaily(); };
  document.getElementById('saveDaily').onclick = ()=>{
    state.daily[dISO] = state.daily[dISO] || {};
    state.daily[dISO].answer = document.getElementById('answerBox').value;
    saveLocal(); cloudPush();
  };
  document.getElementById('clearDaily').onclick = ()=>{
    if(state.daily[dISO]) delete state.daily[dISO].answer;
    saveLocal(); renderDaily();
  };
  document.getElementById('saveJournal').onclick = ()=>{
    state.daily[dISO] = state.daily[dISO] || {};
    state.daily[dISO].journal = document.getElementById('journalBox').value;
    saveLocal(); cloudPush();
  };
  document.getElementById('saveTags').onclick = ()=>{
    state.tags[dISO] = document.getElementById('tagInput').value.trim();
    saveLocal(); cloudPush();
  };
}

function renderWeekly(){
  let cur = new Date();
  const wkLabel = ()=> weekLabel(cur);
  const wkKey = ()=> weekKey(cur);
  const used = state.weekly[wkKey()] || { missions:[], quote:'', copy:'' };
  if(!used.quote){
    const quotes = [
      "계획은 작게, 시작은 바로 지금.","천천히 가도 멈추지 않기.","오늘의 나를 칭찬해 주자.","작은 꾸준함이 큰 변화를 만든다.",
      "마음이 향하는 곳을 향해 한 걸음."
    ];
    used.quote = quotes[Math.floor(Math.random()*quotes.length)];
    state.weekly[wkKey()] = used;
    saveLocal();
  }
  view.innerHTML = `
    <section class="section">
      <div class="pills">
        <button class="btn" id="prevW"><span class="kbd"><</span></button>
        ${pill(wkLabel(),'pill small')}
        <button class="btn" id="nextW"><span class="kbd">></span></button>
        <span class="right"></span>
        ${pill(wkLabel(),'pill small')}
      </div>
    </section>
    <section class="section">
      <h2>미션 (체크박스)</h2>
      <div id="missionList" class="row" style="gap:8px; flex-wrap:wrap"></div>
      <div class="card-actions">
        <button class="btn plus-btn" id="addMission">+ 추가</button>
        <button class="btn primary" id="saveMission">저장</button>
      </div>
    </section>
    <section class="section">
      <h2>오늘의 문장</h2>
      <p class="desc">한 줄을 골라 가볍게 필사해요.</p>
      <div class="row card-actions">
        <div class="pill small">${used.quote}</div>
        <button class="btn" id="newQuote">랜덤</button>
        <button class="btn primary" id="saveQuote">저장</button>
        <button class="btn" id="clearQuote">지우기</button>
      </div>
      <label>필사</label>
      <textarea id="copyBox" placeholder="문장을 따라 적어보세요.">${used.copy||''}</textarea>
    </section>
  `;
  function paintMissions(){
    const wrap = document.getElementById('missionList');
    wrap.innerHTML = '';
    (used.missions||[]).forEach((m,i)=>{
      const b = document.createElement('button');
      b.className = 'btn'; b.textContent = m.checked ? '✅ '+m.text : m.text;
      b.onclick = ()=>{ m.checked = !m.checked; paintMissions(); };
      wrap.appendChild(b);
    });
  }
  paintMissions();
  document.getElementById('addMission').onclick = ()=>{
    const text = prompt('미션 내용?');
    if(text){ used.missions.push({text, checked:false}); paintMissions(); }
  };
  document.getElementById('saveMission').onclick = ()=>{ state.weekly[wkKey()] = used; saveLocal(); cloudPush(); };
  document.getElementById('prevW').onclick = ()=>{ cur.setDate(cur.getDate()-7); renderWeekly(); };
  document.getElementById('nextW').onclick = ()=>{ cur.setDate(cur.getDate()+7); renderWeekly(); };
  document.getElementById('newQuote').onclick = ()=>{ used.quote=''; state.weekly[wkKey()]=used; renderWeekly(); };
  document.getElementById('saveQuote').onclick = ()=>{ used.copy = document.getElementById('copyBox').value; state.weekly[wkKey()]=used; saveLocal(); cloudPush(); };
  document.getElementById('clearQuote').onclick = ()=>{ used.copy=''; state.weekly[wkKey()]=used; saveLocal(); renderWeekly(); };
}

function renderSearch(){
  view.innerHTML = `
    <section class="section">
      <h2>검색</h2>
      <p class="desc">키워드로 데일리/위클리 기록을 찾아요.</p>
      <input id="q" placeholder="검색어를 입력하세요">
      <div id="res" class="section" style="background:#fff; margin-top:12px"></div>
    </section>
  `;
  const res = document.getElementById('res');
  const q = document.getElementById('q');
  q.oninput = ()=>{
    const s = q.value.trim(); if(!s){ res.innerHTML=''; return; }
    const hit = [];
    for(const [d, obj] of Object.entries(state.daily)){
      if((obj.answer||'').includes(s) || (obj.journal||'').includes(s)) hit.push({k:d, t:'데일리', v:obj});
    }
    for(const [w, obj] of Object.entries(state.weekly)){
      const m = (obj.missions||[]).some(x=>x.text.includes(s));
      if(m || (obj.copy||'').includes(s) || (obj.quote||'').includes(s)) hit.push({k:w, t:'위클리', v:obj});
    }
    res.innerHTML = hit.map(h=>`<div class="section"><b>[${h.t}] ${h.k}</b><pre>${escapeHtml(JSON.stringify(h.v,null,2))}</pre></div>`).join('') || '결과 없음';
  };
}
function escapeHtml(s){return s.replace(/[&<>]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}

function renderSettings(){
  view.innerHTML = `
  <section class="section">
    <h2>로그인</h2>
    <div class="row">
      <button class="btn primary" id="openLogin2">로그인</button>
      <button class="btn" id="logoutBtn">로그아웃</button>
    </div>
  </section>
  <section class="section">
    <h2>백업/복원</h2>
    <div class="row">
      <button class="btn" id="saveJson">JSON 파일로 저장</button>
      <input type="file" id="filePick" accept="application/json">
      <button class="btn" id="loadJson">JSON 가져오기</button>
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn" id="resetLocal">로컬 데이터 초기화</button>
      <button class="btn" id="refreshCache">캐시 새로고침</button>
    </div>
  </section>`;
  document.getElementById('openLogin2').onclick = ()=> document.getElementById('openLogin').click();
  document.getElementById('logoutBtn').onclick = async ()=>{
    if(fb.auth?.currentUser){ await _fb.signOut(fb.auth); toast('로그아웃'); }
  };
  document.getElementById('saveJson').onclick = ()=>{
    const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'thanks-diary-backup.json'; a.click();
  };
  document.getElementById('loadJson').onclick = ()=>{
    const f = document.getElementById('filePick').files[0];
    if(!f){ toast('파일을 선택해주세요'); return; }
    const r = new FileReader(); r.onload = ()=>{ try{ Object.assign(state, JSON.parse(r.result)); saveLocal(); render('#/daily'); }catch{ toast('불러오기 실패'); } }; r.readAsText(f);
  };
  document.getElementById('resetLocal').onclick = ()=>{ if(confirm('로컬 데이터를 모두 지울까요?')){ localStorage.removeItem(LS_KEY); location.reload(); } };
  document.getElementById('refreshCache').onclick = ()=>{ if('serviceWorker' in navigator){ caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>location.reload()); } };
}
