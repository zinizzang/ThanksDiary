
// ---- Firebase config (replace with your own; keeps working with existing hosting) ----
window.firebaseConfig = window.firebaseConfig || {
  // example:
  // apiKey: "...",
  // authDomain: "...",
  // projectId: "...",
};
if(firebaseConfig && Object.keys(firebaseConfig).length){
  firebase.initializeApp(firebaseConfig);
}else{
  console.warn('⚠️ Firebase config가 비어 있습니다. app.js 상단 firebaseConfig를 채워주세요.');
}

// ------- Question pool (dedup random) -------
const QUESTIONS = [
  "지금의 나에게 꼭 필요한 한 마디는?",
  "사람들에게 어떤 사람으로 기억되고 싶나요?",
  "오늘 가장 고마운 작은 순간은?",
  "오늘 몸이 보낸 신호는 무엇이었나요?",
  "내가 지키고 싶은 나만의 기준 한 가지는?"
];
let usedQ = [];

function pickQuestion(){
  if(usedQ.length >= QUESTIONS.length) usedQ = [];
  const remain = QUESTIONS.filter(q => !usedQ.includes(q));
  const q = remain[Math.floor(Math.random()*remain.length)];
  usedQ.push(q);
  return q;
}

// ------- Date helpers -------
function toDateKey(dt=new Date()){
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const d = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function weekKey(dt=new Date()){
  const _dt = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  const dayNum = _dt.getUTCDay() || 7;
  _dt.setUTCDate(_dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(_dt.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((_dt - yearStart) / 86400000) + 1)/7);
  return `${_dt.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}

// ------- Toast -------
function toast(msg){
  let el = document.getElementById('td-toast');
  if(!el){
    el = document.createElement('div');
    el.id = 'td-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(()=>el.style.opacity='0', 1300);
}

// ------- View switch -------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function showView(name){
  $$('.view').forEach(v=>v.hidden = v.id !== 'view-'+name);
  $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  location.hash = '#/'+name;
}
document.addEventListener('click', (e)=>{
  const t = e.target.closest('[data-tab]');
  if(t){ e.preventDefault(); showView(t.dataset.tab); }
});

// ------- Login modal -------
const modal = $('#login-modal');
function openLogin(){ modal.removeAttribute('hidden'); modal.style.display='grid'; setTimeout(()=>modal.classList.add('show'),0); }
function closeLogin(){ modal.classList.remove('show'); setTimeout(()=>{modal.style.display='none'; modal.setAttribute('hidden','');},180); }
$('#btn-login')?.addEventListener('click', openLogin);
document.querySelector('[data-action="open-login"]')?.addEventListener('click', openLogin);
$('#login-close')?.addEventListener('click', closeLogin);
modal?.addEventListener('click', e=>{ if(e.target===modal) closeLogin(); });

// Auth
const auth = firebase.auth?.();
auth?.onAuthStateChanged(u=>{
  document.getElementById('btn-login')?.toggleAttribute('hidden', !!u);
  document.getElementById('btn-logout')?.toggleAttribute('hidden', !u);
});

$('#login-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = e.target.email.value.trim();
  const pw = e.target.password.value;
  try{
    await auth.signInWithEmailAndPassword(email,pw);
    toast('로그인 성공!'); closeLogin();
  }catch(err){ toast(err.message || '로그인 실패'); }
});

document.querySelector('[data-action="logout"]')?.addEventListener('click', async ()=>{
  try{ await auth.signOut(); toast('로그아웃 완료'); }catch(e){ toast('로그아웃 실패'); }
});

// ------- Daily init -------
function initDaily(){
  const dk = toDateKey(new Date());
  $('#dateKey').value = dk;
  $('#q-today').value = pickQuestion();
}
initDaily();

// ------- Save wiring -------
function wireSave(formSelector, saveFn){
  $$(formSelector).forEach(form=>{
    form.addEventListener('submit', e=>e.preventDefault());
    form.querySelectorAll('[data-action="save"]').forEach(b=>b.addEventListener('click', async ()=>{
      try{ await saveFn(form); toast('저장 완료!'); }catch(e){ console.error(e); toast('저장 실패'); }
    }));
    form.querySelectorAll('[data-action="add"]').forEach(b=>b.addEventListener('click', ()=>{
      const proto = document.getElementById('thanks-proto');
      if(!proto) return;
      const clone = proto.content.firstElementChild.cloneNode(true);
      document.querySelector('.thanks-list').appendChild(clone);
    }));
  });
}

const db = firebase.firestore?.();

wireSave('.form-daily', async (form)=>{
  const uid = auth?.currentUser?.uid || 'local';
  const dk = form.querySelector('[name="dateKey"]').value;
  const data = {
    emo_event: form.querySelector('[name="emo_event"]')?.value || '',
    emo_thought: form.querySelector('[name="emo_thought"]')?.value || '',
    emo_feel: form.querySelector('[name="emo_feel"]')?.value || '',
    emo_result: form.querySelector('[name="emo_result"]')?.value || '',
    thanks: $$('.thanks-item input').map(i=>i.value).filter(Boolean),
    diary: form.querySelector('[name="diary"]')?.value || '',
    tags: form.querySelector('[name="tags"]')?.value || ''
  };
  if(db && uid!=='local'){
    await db.collection('users').doc(uid).collection('daily').doc(dk).set(data,{merge:true});
  }else{
    localStorage.setItem('daily:'+dk, JSON.stringify(data));
  }
});

wireSave('.form-weekly', async (form)=>{
  const uid = auth?.currentUser?.uid || 'local';
  const wk = weekKey(new Date());
  form.querySelector('[name="weekKey"]').value = wk;
  const data = {
    missions: $$('.mission-item input[type="checkbox"]').map(ch=>({text:ch.dataset.text, done:ch.checked})),
    copyText: form.querySelector('[name="copyText"]')?.value || ''
  };
  if(db && uid!=='local'){
    await db.collection('users').doc(uid).collection('weekly').doc(wk).set(data,{merge:true});
  }else{
    localStorage.setItem('weekly:'+wk, JSON.stringify(data));
  }
});

// Random question button
document.getElementById('btn-random')?.addEventListener('click', ()=>{
  $('#q-today').value = pickQuestion();
});

// Simple search (local only demo)
document.getElementById('btn-search')?.addEventListener('click', ()=>{
  const q = document.getElementById('search-input').value.trim();
  const box = document.getElementById('search-results');
  box.innerHTML = q ? `&ldquo;${q}&rdquo; 로 검색했습니다 (데모).` : '검색어를 입력하세요.';
});
