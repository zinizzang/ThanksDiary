
// ThanksDiary 2.7.2-integrated-fix2 — 기능 2.7.2 + 2.3.x UI
(function(){
  'use strict';
  // ===== Firebase =====
  const app = firebase.initializeApp(window.firebaseConfig);
  const auth = firebase.auth();
  const db   = firebase.firestore();

  // ===== Elements =====
  const view = document.getElementById('view');
  const openLogin = document.getElementById('openLogin');
  const authStateEl = document.getElementById('authState');
  const loginModal = document.getElementById('loginModal');
  const loginEmail = document.getElementById('loginEmail');
  const loginPass  = document.getElementById('loginPass');
  const loginMsg   = document.getElementById('loginMsg');

  // ===== Auth UI =====
  openLogin.addEventListener('click', () => {
    const u = auth.currentUser;
    if(u) auth.signOut();
    else  safeOpenDialog(loginModal);
  });
  document.getElementById('closeLogin').addEventListener('click', ()=> safeCloseDialog(loginModal));
  document.getElementById('doLogin').addEventListener('click', async (e)=>{
    e.preventDefault();
    try{
      await auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPass.value);
      loginMsg.textContent='로그인 성공';
      setTimeout(()=>safeCloseDialog(loginModal), 300);
    }catch(err){ loginMsg.textContent=userMsg(err); }
  });
  document.getElementById('doSignup').addEventListener('click', async (e)=>{
    e.preventDefault();
    try{
      await auth.createUserWithEmailAndPassword(loginEmail.value.trim(), loginPass.value);
      loginMsg.textContent='가입 완료';
      setTimeout(()=>safeCloseDialog(loginModal), 300);
    }catch(err){ loginMsg.textContent=userMsg(err); }
  });
  auth.onAuthStateChanged(u=>{
    authStateEl.textContent = u ? (u.email+' 로그인됨') : '로그아웃 상태';
    openLogin.textContent = u? '로그아웃' : '로그인';
  });

  // ===== Router =====
  const routes = { '#/daily': renderDaily, '#/weekly': renderWeekly, '#/search': renderSearch, '#/settings': renderSettings };
  window.addEventListener('hashchange', ()=> render(location.hash));
  window.addEventListener('load', ()=> render(location.hash||'#/daily'));

  // ===== Helpers =====
  const fmtDate=d=> d.getFullYear()+'. '+(d.getMonth()+1)+'. '+d.getDate()+'.';
  const iso=d=> d.toISOString().slice(0,10);
  function weekLabel(d){
    const y=d.getFullYear(); const m=d.getMonth()+1;
    const first=new Date(d.getFullYear(),d.getMonth(),1);
    const w=Math.floor((d.getDate()+first.getDay())/7)+1;
    return `${y}년 ${m}월 ${w}주`;
  }
  function me(){ const u=auth.currentUser; if(!u) throw new Error('로그인 필요'); return u; }
  function userDoc(){ return db.collection('users').doc(me().uid); }
  function toast(t){ const n=document.createElement('div'); n.className='toast'; n.textContent=t; document.body.appendChild(n); setTimeout(()=>n.remove(), 1200); }
  function userMsg(err){ const m=String(err && err.message || err); if(m.includes('invalid-credential')) return '이메일/비밀번호를 확인해 주세요'; if(m.includes('too-many-requests')) return '잠시 후 다시 시도해 주세요'; return m; }
  function safeOpenDialog(d){ try{ d.showModal(); }catch(e){ d.setAttribute('open',''); d.style.display='block'; } }
  function safeCloseDialog(d){ try{ d.close(); }catch(e){ d.removeAttribute('open'); d.style.display='none'; } }

  // ===== Daily =====
  function renderDaily(){
    let cur = new Date();
    view.innerHTML = '';
    const bar = el('div','datebar');
    const prev = btn('<'); const next = btn('>'); const today = badge('오늘');
    const dateChip = el('div','date', fmtDate(cur)); const weekChip = el('div','badge', weekLabel(cur));
    bar.append(prev, dateChip, next, today, weekChip); view.append(bar);

    const qSec = section('오늘의 질문','나를 되돌아보는 한 줄 질문이에요.');
    const qText = el('div','desc', '로딩 중…'); const other = btn('다른 질문'); other.classList.add('small');
    const ansLabel = el('label', null, '답변'); const ansBox = textarea('질문에 대한 나의 답을 적어보세요.');
    const saveRow = el('div','actions'); const saveBtn = primary('저장'); const clrBtn = btn('지우기'); saveRow.append(saveBtn, clrBtn);
    qSec.append(qText, other, ansLabel, ansBox, saveRow); view.append(qSec);

    const tSec = section('감사일기','오늘 고마웠던 순간을 3가지 이상 적어보세요.'); const thanks = textarea('감사한 일 3가지를 적어보세요.'); const tSave=primary('저장'); tSec.append(thanks, el('div','actions').appendChild(tSave).parentNode); view.append(tSec);

    const dSec = section('일상일기','오늘의 일상을 자유롭게 남겨보세요.'); const daily = textarea('하루를 가볍게 기록해요.'); const dSave=primary('저장'); dSec.append(daily, el('div','actions').appendChild(dSave).parentNode); view.append(dSec);

    const tagSec = section('태그 달기','쉼표로 구분해 #태그를 달아보세요.'); const tags=input('예) #가족, #산책'); const tagSave=primary('저장'); tagSec.append(tags, el('div','actions').appendChild(tagSave).parentNode); view.append(tagSec);

    const ref = ()=> userDoc().collection('daily').doc(iso(cur));
    async function load(){
      if(!auth.currentUser){ qText.textContent = pickQuestion(iso(cur)); return; }
      const s=await ref().get(); const v=s.exists?s.data():{};
      qText.textContent = v.question || pickQuestion(iso(cur));
      ansBox.value = v.answer || ''; thanks.value=v.thanks||''; daily.value=v.journal||''; tags.value=v.tags||'';
    }
    async function save(){
      if(!auth.currentUser) return alert('로그인 후 저장됩니다.');
      await ref().set({question:qText.textContent, answer:ansBox.value, thanks:thanks.value, journal:daily.value, tags:tags.value, updatedAt:Date.now()},{merge:true});
      toast('저장 완료!');
    }

    other.onclick = ()=> qText.textContent = pickQuestion(iso(cur), true);
    saveBtn.onclick = save; tSave.onclick = save; dSave.onclick = save; tagSave.onclick = save;
    clrBtn.onclick = async ()=>{ ansBox.value=''; await save(); };

    prev.onclick = ()=>{cur.setDate(cur.getDate()-1); dateChip.textContent=fmtDate(cur); weekChip.textContent=weekLabel(cur); load();};
    next.onclick = ()=>{cur.setDate(cur.getDate()+1); dateChip.textContent=fmtDate(cur); weekChip.textContent=weekLabel(cur); load();};
    today.onclick = ()=>{cur=new Date(); dateChip.textContent=fmtDate(cur); weekChip.textContent=weekLabel(cur); load();};

    load();
  }

  // ===== Weekly =====
  function renderWeekly(){
    let cur = new Date();
    view.innerHTML='';
    const bar = el('div','datebar'); const prev=btn('<'); const next=btn('>'); const wk=el('div','badge', weekLabel(cur)); bar.append(prev,next,wk); view.append(bar);

    const mSec = section('미션 (체크박스)','이번 주 목표를 체크하세요.'); const list = el('div','list'); const add=btn('+ 추가'); add.classList.add('small'); const save=primary('저장'); mSec.append(list, el('div','actions').appendChild(add).parentNode, el('div','actions').appendChild(save).parentNode); view.append(mSec);

    const qSec = section('오늘의 문구','마음을 가볍게 하는 한 줄을 골라 필사해요.'); const quote = el('div','desc','로딩 중…'); const copy = textarea('문장을 따라 적어보세요.'); const qSave=primary('저장'); qSec.append(quote, copy, el('div','actions').appendChild(qSave).parentNode); view.append(qSec);

    const ref = ()=> userDoc().collection('weekly').doc(weekLabel(cur));

    function paint(items){ list.innerHTML=''; (items||[]).forEach(it=>{ const row=el('label','row'); row.classList.add('checkbox'); const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!it.done; const ip=input('미션'); ip.value=it.text||''; row.append(cb, ip); list.append(row); }); }
    async function load(){
      if(!auth.currentUser){ quote.textContent = randomQuote(); return; }
      const s=await ref().get(); const v=s.exists?s.data():{items:[], quote:'', copy:''}; paint(v.items||[]); quote.textContent = v.quote||randomQuote(); copy.value=v.copy||'';
    }
    async function saveAll(){
      if(!auth.currentUser) return alert('로그인 후 저장됩니다.');
      const items = Array.from(list.children).map(row=>({ done: row.querySelector('input[type=checkbox]').checked, text: row.querySelector('input[type=text]').value.trim() })).filter(x=>x.text);
      await ref().set({ items, quote: quote.textContent, copy: copy.value, updatedAt:Date.now() }, {merge:true});
      toast('저장 완료!');
    }

    add.onclick = ()=>{ const row=el('label','row'); row.classList.add('checkbox'); const cb=document.createElement('input'); cb.type='checkbox'; const ip=input('미션'); row.append(cb, ip); list.append(row); };
    save.onclick = saveAll; qSave.onclick = saveAll;
    prev.onclick = ()=>{ cur.setDate(cur.getDate()-7); wk.textContent=weekLabel(cur); load(); };
    next.onclick = ()=>{ cur.setDate(cur.getDate()+7); wk.textContent=weekLabel(cur); load(); };

    load();
  }

  // ===== Search =====
  function renderSearch(){
    view.innerHTML='';
    const s = section('검색','키워드로 일기를 찾아요.');
    const q = input('예) #가족 / 산책 / 감사'); const go = primary('검색'); const out = el('div','section'); out.style.background='#fff';
    go.onclick = async ()=>{
      out.innerHTML='';
      if(!auth.currentUser) return out.innerHTML='<p class="desc">로그인 후 이용하세요.</p>';
      const daily = await userDoc().collection('daily').orderBy('updatedAt','desc').limit(400).get();
      daily.docs.forEach(d=>{ const v=d.data(); const hay=JSON.stringify(v||{}); if(q.value && hay.includes(q.value)) out.append(section(d.id, (v.journal||'').slice(0,120))); });
      const weekly = await userDoc().collection('weekly').get();
      weekly.docs.forEach(d=>{ const v=d.data(); const hay=JSON.stringify(v||{}); if(q.value && hay.includes(q.value)) out.append(section(d.id, (v.copy||'').slice(0,120))); });
    };
    s.append(q, el('div','actions').appendChild(go).parentNode, out);
    view.append(s);
  }

  // ===== Settings =====
  function renderSettings(){
    view.innerHTML='';
    const acc = section('계정','로그인/로그아웃 및 상태');
    const openBtn = primary('로그인/회원가입 열기'); openBtn.onclick = ()=> safeOpenDialog(loginModal);
    const outBtn  = btn('로그아웃'); outBtn.onclick = ()=> auth.signOut();
    acc.append(el('div','actions').appendChild(openBtn).parentNode, el('div','actions').appendChild(outBtn).parentNode);
    view.append(acc);

    const bu = section('백업/복원','JSON 파일로 내보내거나 가져옵니다.');
    const exp = primary('JSON 내보내기'); const imp = btn('JSON 가져오기'); const file=document.createElement('input'); file.type='file'; file.accept='application/json';
    exp.onclick = async ()=>{
      if(!auth.currentUser) return alert('로그인 후 이용하세요');
      const data = {
        daily: (await userDoc().collection('daily').get()).docs.map(d=>({id:d.id,...d.data()})),
        weekly:(await userDoc().collection('weekly').get()).docs.map(d=>({id:d.id,...d.data()}))
      };
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='thanks-diary-backup.json'; a.click();
    };
    imp.onclick = ()=> file.click();
    file.onchange = async ()=>{
      if(!auth.currentUser) return alert('로그인 후 이용하세요');
      const txt = await file.files[0].text(); const data = JSON.parse(txt||'{}');
      const batch = db.batch();
      (data.daily||[]).forEach(x=> batch.set(userDoc().collection('daily').doc(x.id), x, {merge:true}));
      (data.weekly||[]).forEach(x=> batch.set(userDoc().collection('weekly').doc(x.id), x, {merge:true}));
      await batch.commit(); toast('복원 완료');
    };
    bu.append(el('div','actions').appendChild(exp).parentNode, el('div','actions').appendChild(imp).parentNode, file);
    view.append(bu);

    const cache = section('캐시/오프라인','업데이트가 안 보이면 강제 새로고침하세요.');
    const refresh = btn('강제 새로고침'); refresh.onclick = ()=>{ if('caches' in window) caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>location.reload()); else location.reload(); };
    cache.append(el('div','actions').appendChild(refresh).parentNode);
    view.append(cache);
  }

  // ===== Pools =====
  const QUESTIONS = [
    "사람들에게 어떤 사람으로 기억되고 싶나요?","오늘 나를 미소 짓게 한 작은 순간은?","최근 내가 포기하지 않은 일은?",
    "오늘 감사했던 세 가지는?","요즘 가장 나를 설레게 하는 것은?","내가 바라는 내일의 작은 변화는?",
    "최근 배운 소소한 교훈은?","오늘 챙겨준 내 마음은 어디인가요?"
  ];
  function pickQuestion(dayISO, force){
    if(force) return QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];
    const n = parseInt((dayISO||'').replace(/-/g,''))||0; return QUESTIONS[n % QUESTIONS.length];
  }
  const QUOTES = [
    "부러움 대신 배움을 고르면 마음이 한결 가벼워진다.",
    "작은 꾸준함이 큰 변화를 만든다.",
    "오늘의 나는 어제의 나를 이긴다.",
    "마음이 향하는 곳으로 한 걸음."
  ];
  const randomQuote = () => QUOTES[Math.floor(Math.random()*QUOTES.length)];

  // ===== UI helpers =====
  function el(tag, cls, text){ const n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
  function section(title, desc){
    const s = el('section','section');
    if(title) s.append(el('h2',null,title));
    if(desc) s.append(el('p','desc',desc));
    return s;
  }
  const btn=t=>Object.assign(document.createElement('button'),{className:'btn', textContent:t});
  const primary=t=>Object.assign(document.createElement('button'),{className:'btn primary', textContent:t});
  const input=ph=>Object.assign(document.createElement('input'),{placeholder:ph||''});
  const textarea=ph=>Object.assign(document.createElement('textarea'),{placeholder:ph||''});

  function render(hash){ (routes[hash]||routes['#/daily'])(); }
})();