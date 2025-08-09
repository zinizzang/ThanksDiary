
/* ThanksDiary integrated app.js (2.7.2 features + 2.3.2 design) */

// ---------- helpers
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const toast = (msg) => {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> t.classList.remove('show'), 1800);
};
const fmtDate = (d) => d.toISOString().slice(0,10);
const ymd = (d=new Date()) => fmtDate(d);
const weekInfo = (d=new Date()) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  const month = d.getMonth()+1;
  // 2.3.2 표현: 2025년 8월 2주
  const inMonthWeek = Math.ceil(d.getDate()/7);
  return { year: d.getFullYear(), week: weekNo, label:`${d.getFullYear()}년 ${month}월 ${inMonthWeek}주` };
};

// ---------- Firebase (compat)
firebase.initializeApp({
  apiKey: "AIzaSyAOqrdA0aHL5lMXOOmdtj8mnLi6zgSXoiM",
  authDomain: "thanksdiary-dca35.firebaseapp.com",
  projectId: "thanksdiary-dca35",
  storageBucket: "thanksdiary-dca35.firebasestorage.app",
  messagingSenderId: "250477396044",
  appId: "1:250477396044:web:aa1cf155f01263e08834e9",
  measurementId: "G-J0Z03LHYYC"
});
const auth = firebase.auth();
const db = firebase.firestore();
firebase.firestore().enablePersistence({synchronizeTabs:true}).catch(()=>{});

// ---------- state
const state = {
  user:null,
  today: ymd(),
};
const QUESTIONS = [
  "오늘 나를 미소 짓게 만든 작은 순간은?",
  "사람들에게 어떤 사람으로 기억되고 싶나요?",
  "오늘 스스로 칭찬하고 싶은 점은?",
  "요즘 내가 가장 고마운 사람은? 이유는?",
  "이번 주에 나를 성장시킨 한 가지는?",
  "지금 내 몸과 마음이 바라는 건 무엇일까?",
  "과거의 나에게 해주고 싶은 말은?",
  "오늘 배운 것 하나를 기록해보세요.",
  "내가 원하는 나다운 삶은 어떤 모습인가요?"
];

// ---------- Router
const routes = {
  '#/daily': renderDaily,
  '#/weekly': renderWeekly,
  '#/search': renderSearch,
  '#/settings': renderSettings,
};
function mount() {
  const hash = location.hash || '#/daily';
  (routes[hash] || renderDaily)();
  $$('.tab-btn').forEach(b=> b.classList.toggle('active', b.dataset.route===hash));
}
window.addEventListener('hashchange', mount);
$$('.tab-btn').forEach(el=> el.addEventListener('click', ()=> { location.hash = el.dataset.route; }));

// ---------- Auth UI
$('#btnLoginOpen').addEventListener('click', ()=> $('#loginModal').showModal());
$('#btnCloseLogin').addEventListener('click', ()=> $('#loginModal').close());
$('#btnLogin').addEventListener('click', async (e)=>{
  e.preventDefault();
  const email = $('#email').value.trim();
  const pw = $('#password').value.trim();
  try{
    await auth.signInWithEmailAndPassword(email,pw);
    toast('로그인 성공!');
    $('#loginModal').close();
  }catch(err){
    toast(err.message);
  }
});
$('#btnSignup').addEventListener('click', async (e)=>{
  e.preventDefault();
  const email = $('#email').value.trim();
  const pw = $('#password').value.trim();
  try{
    await auth.createUserWithEmailAndPassword(email,pw);
    toast('가입 완료! 자동 로그인되었습니다.');
    $('#loginModal').close();
  }catch(err){
    toast(err.message);
  }
});
$('#btnLogout').addEventListener('click', ()=> auth.signOut());

auth.onAuthStateChanged(async (user)=>{
  state.user = user;
  $('#authEmail').textContent = user ? (user.email||'') : '';
  $('#btnLoginOpen').classList.toggle('hide', !!user);
  $('#btnLogout').classList.toggle('hide', !user);
  mount();
});

// ---------- Page: Daily
async function renderDaily(){
  const root = $('#view');
  const d = new Date();
  const dateStr = ymd(d);
  const qIdx = Number(new Date(dateStr).getDate()) % QUESTIONS.length;
  const q = QUESTIONS[qIdx];

  root.innerHTML = `
    <section class="card">
      <h3>오늘의 질문</h3>
      <p class="hint">${dateStr}</p>
      <div class="card" style="margin:10px 0 14px">
        ${q}
      </div>

      <label for="answer">답변</label>
      <textarea id="answer" placeholder="질문에 대한 나의 답을 적어보세요."></textarea>

      <div class="row right">
        <button id="btnSaveDaily" class="btn primary">저장</button>
        <button id="btnClearDaily" class="btn light">지우기</button>
      </div>
    </section>

    <section class="card">
      <h3>일상일기</h3>
      <p class="hint">오늘의 일상을 자유롭게 남겨보세요.</p>
      <textarea id="dailyFree" placeholder="하루를 가볍게 기록해요."></textarea>
      <div class="row right">
        <button id="btnSaveFree" class="btn">저장</button>
      </div>
    </section>

    <section class="card">
      <h3>태그 달기</h3>
      <p class="hint">#가족, #산책 처럼 쉼표로 구분</p>
      <input id="tags" type="text" placeholder="#감사, #배움, #행복">
      <div class="row right"><button id="btnSaveTags" class="btn">저장</button></div>
    </section>
  `;

  // load existing if user
  if(state.user){
    const ref = db.collection('users').doc(state.user.uid).collection('daily').doc(dateStr);
    const snap = await ref.get();
    if(snap.exists){
      const v = snap.data();
      $('#answer').value = v.answer||'';
      $('#dailyFree').value = v.free||'';
      $('#tags').value = (v.tags||[]).join(', ');
    }
    $('#btnSaveDaily').onclick = async ()=>{
      await ref.set({date:dateStr, question:q, answer:$('#answer').value.trim(), ts:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      toast('저장 완료');
    };
    $('#btnSaveFree').onclick = async ()=>{
      await ref.set({free:$('#dailyFree').value.trim(), ts:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      toast('저장 완료');
    };
    $('#btnSaveTags').onclick = async ()=>{
      const arr = $('#tags').value.split(/[#,\s]+/).map(s=>s.trim()).filter(Boolean);
      await ref.set({tags:arr, ts:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      toast('저장 완료');
    };
  }else{
    $('#btnSaveDaily').onclick = ()=> toast('로그인 후 저장돼요');
    $('#btnSaveFree').onclick = ()=> toast('로그인 후 저장돼요');
    $('#btnSaveTags').onclick = ()=> toast('로그인 후 저장돼요');
  }
}

// ---------- Page: Weekly
async function renderWeekly(){
  const root = $('#view');
  const now = new Date();
  const wk = weekInfo(now);
  root.innerHTML = `
    <section class="card">
      <h3>미션 (체크박스)</h3>
      <p class="hint">${wk.label}</p>
      <div id="missionList" class="list"></div>
      <div class="row">
        <input id="newMission" type="text" placeholder="미션 추가">
        <button id="btnAddMission" class="btn">+ 추가</button>
        <span class="badge" id="weekLabel">${wk.label}</span>
      </div>
      <div class="row right">
        <button id="btnSaveMissions" class="btn primary">저장</button>
      </div>
    </section>

    <section class="card">
      <h3>오늘의 문구</h3>
      <p class="hint">마음을 가볍게 하는 한 줄을 골라 필사해요.</p>
      <div class="row">
        <textarea id="quoteCopy" placeholder="문장을 따라 적어보세요."></textarea>
      </div>
      <div class="row right"><button id="btnSaveQuote" class="btn">저장</button></div>
    </section>
  `;
  const listEl = $('#missionList');
  const addItem = (text='', done=false)=>{
    const div = document.createElement('div');
    div.className = 'check-item';
    div.innerHTML = `<input type="checkbox" ${done?'checked':''}><input class="mission-text" type="text" value="${text}">`;
    listEl.appendChild(div);
  };
  // existing
  if(state.user){
    const docRef = db.collection('users').doc(state.user.uid).collection('weekly').doc(`${wk.year}-${wk.week}`);
    const snap = await docRef.get();
    if(snap.exists){
      const v = snap.data();
      (v.items||[]).forEach(it=> addItem(it.text, it.done));
      $('#quoteCopy').value = v.copy||'';
    }else{
      // default 3 missions
      ['물을 충분히 마시기','10분 스트레칭','감사 3가지 적기'].forEach(m=> addItem(m,false));
    }
    $('#btnAddMission').onclick = ()=> addItem('', false);
    $('#btnSaveMissions').onclick = async ()=>{
      const items = $$('.check-item', listEl).map(div=>({done: $('input[type="checkbox"]',div).checked, text:$('input.mission-text',div).value}));
      await docRef.set({week:wk.week, year:wk.year, label:wk.label, items}, {merge:true});
      toast('미션 저장 완료');
    };
    $('#btnSaveQuote').onclick = async ()=>{
      await docRef.set({copy:$('#quoteCopy').value.trim()},{merge:true});
      toast('저장 완료');
    };
  }else{
    $('#btnAddMission').onclick = ()=> toast('로그인 후 사용 가능합니다');
    $('#btnSaveMissions').onclick = ()=> toast('로그인 후 사용 가능합니다');
    $('#btnSaveQuote').onclick = ()=> toast('로그인 후 사용 가능합니다');
  }
}

// ---------- Page: Search (간단히 태그/문구/답변 검색)
function renderSearch(){
  const root = $('#view');
  root.innerHTML = `
    <section class="card">
      <h3>검색</h3>
      <input id="q" type="text" placeholder="키워드로 검색 (답변/일상/태그)">
      <div id="results" class="list"></div>
    </section>
  `;
  if(!state.user){
    $('#q').disabled = true;
    $('#q').placeholder = '로그인 후 검색할 수 있어요';
    return;
  }
  $('#q').addEventListener('input', async (e)=>{
    const term = e.target.value.trim();
    const out = $('#results');
    out.innerHTML = '';
    if(!term){ return; }
    const snap = await db.collection('users').doc(state.user.uid).collection('daily').get();
    const hits = [];
    snap.forEach(doc=>{
      const v=doc.data();
      const text = [v.answer, v.free, (v.tags||[]).join(' ')].join(' ');
      if((text||'').includes(term)) hits.push(v);
    });
    if(!hits.length){ out.innerHTML = '<div class="muted">결과 없음</div>'; return; }
    hits.sort((a,b)=> (a.date||'').localeCompare(b.date||''));
    hits.forEach(v=>{
      const li = document.createElement('div');
      li.className='card';
      li.innerHTML = `<strong>${v.date}</strong><div>${(v.answer||'').slice(0,160)}</div>`;
      out.appendChild(li);
    });
  });
}

// ---------- Page: Settings / Backup
function renderSettings(){
  const root = $('#view');
  root.innerHTML = `
    <section class="card">
      <h3>로그인</h3>
      <div class="row">
        <button id="openLogin" class="btn">로그인</button>
        <button id="doLogout" class="btn light">로그아웃</button>
      </div>
      <p class="hint">현재: ${state.user? state.user.email : '로그아웃 상태'}</p>
    </section>

    <section class="card">
      <h3>백업/복원</h3>
      <div class="row">
        <button id="btnExport" class="btn icon"><span>JSON 파일로 저장</span></button>
        <label class="btn">
          JSON 가져오기<input id="importFile" type="file" accept="application/json" hidden>
        </label>
      </div>
      <p class="hint">동기화는 자동이지만, 파일로도 보관할 수 있어요.</p>
    </section>
  `;
  $('#openLogin').onclick = ()=> $('#loginModal').showModal();
  $('#doLogout').onclick = ()=> auth.signOut();

  if(state.user){
    $('#btnExport').onclick = async ()=>{
      const all = {daily:[], weekly:[]};
      const d = await db.collection('users').doc(state.user.uid).collection('daily').get();
      d.forEach(x=> all.daily.push(x.data()));
      const w = await db.collection('users').doc(state.user.uid).collection('weekly').get();
      w.forEach(x=> all.weekly.push(x.data()));
      const blob = new Blob([JSON.stringify(all,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='thanksdiary-backup.json'; a.click();
      URL.revokeObjectURL(url);
      toast('내보내기 완료');
    };
    $('#importFile').addEventListener('change', async (e)=>{
      const file = e.target.files[0]; if(!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      const batch = db.batch();
      const uref = db.collection('users').doc(state.user.uid);
      (data.daily||[]).forEach(v=> batch.set(uref.collection('daily').doc(v.date||fmtDate(new Date())), v, {merge:true}));
      (data.weekly||[]).forEach(v=> batch.set(uref.collection('weekly').doc(`${v.year}-${v.week}`), v, {merge:true}));
      await batch.commit();
      toast('가져오기 완료');
    });
  }else{
    $('#btnExport').onclick = ()=> toast('로그인 후 이용 가능합니다');
  }
}

// initial render
mount();
