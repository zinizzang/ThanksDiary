
(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyAOqrdA0aHL5lMXOOmdtj8mnLi6zgSXoiM",
    authDomain: "thanksdiary-dca35.firebaseapp.com",
    projectId: "thanksdiary-dca35",
    storageBucket: "thanksdiary-dca35.appspot.com",
    messagingSenderId: "250477396044",
    appId: "1:250477396044:web:aa1cf155f01263e08834e9",
  };
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const $ = s=>document.querySelector(s);
  const pages = { daily:$('#page-daily'), weekly:$('#page-weekly'), search:$('#page-search'), settings:$('#page-settings') };
  const tabs = { daily:$('#tab-daily'), weekly:$('#tab-weekly'), search:$('#tab-search'), settings:$('#tab-settings') };

  function showPage(name){
    Object.values(pages).forEach(p=>p.classList.remove('active'));
    Object.values(tabs).forEach(t=>t.classList.remove('active'));
    (pages[name]||pages.daily).classList.add('active');
    (tabs[name]||tabs.daily).classList.add('active');
    if(name==='daily') loadDaily();
    if(name==='weekly') loadWeekly();
  }
  function handleHash(){ const h=(location.hash.replace(/^#\\/?/,'')||'daily'); showPage(h); }
  window.addEventListener('hashchange', handleHash);

  function ymd(date){ const d=new Date(date); const tz=d.getTimezoneOffset()*60000; return new Date(d.getTime()-tz).toISOString().slice(0,10); }
  function formatDatePretty(dateStr){ const d=new Date(dateStr); return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`; }
  function getWeekId(date){ const d=new Date(date); const t=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-n+3); const ft=new Date(Date.UTC(t.getUTCFullYear(),0,4)); const w=1+Math.round(((t-ft)/86400000-3+((ft.getUTCDay()+6)%7))/7); const y=t.getUTCFullYear(); return `${y}-W${String(w).padStart(2,'0')}`;}
  function weekPretty(weekId){ const [y,w]=weekId.split('-W'); return `${y} ${parseInt(w)}번째 주`; }
  function parseTags(s){ if(!s) return []; return s.split(',').map(t=>t.trim()).filter(Boolean).map(t=>t.startsWith('#')?t:'#'+t); }
  function autoResize(el){ el.style.height='auto'; el.style.height=(el.scrollHeight+2)+'px'; }
  function bindAuto(el){ if(!el) return; autoResize(el); el.addEventListener('input', ()=>autoResize(el)); }

  const storeKey='td-v234-data', settingsKey='td-v234-settings';
  const loadAll=()=>{ try{ return JSON.parse(localStorage.getItem(storeKey)) || {daily:{},weekly:{}} }catch{ return {daily:{},weekly:{}}; };
  const saveAll=(d)=>localStorage.setItem(storeKey, JSON.stringify(d));
  const loadSettings=()=>{ try{ return JSON.parse(localStorage.getItem(settingsKey)) || {} }catch{ return {}; } };
  const saveSettings=(s)=>localStorage.setItem(settingsKey, JSON.stringify(s));

  const questionPool=['오늘 나는 무엇을 잘했나요?','사람들에게 어떤 사람으로 기억되고 싶나요?','오늘 나를 웃게 만든 순간은 무엇이었나요?','요즘 나를 설레게 하는 작은 일은?','지금의 나에게 필요한 한 문장은?','오늘 배운 것 하나는 무엇인가요?','나는 무엇을 포기하지 않았나요?','최근 나를 힘들게 한 일, 거기서 배운 점은?','오늘 나에게 가장 고마운 사람은 누구였나요?','앞으로의 나에게 전하고 싶은 말은?','나의 강점 한 가지를 적어보세요.','오늘 놓치지 않은 작은 친절은?','오늘 내 마음의 날씨는 어땠나요?'];
  const healingPool=['부러움 대신 배움을 고르면 마음은 가벼워진다','완벽보다 꾸준함이 조용히 이긴다','오늘의 나를 어제의 나와만 비교하면 삶이 단단해진다','불안은 계획을 좋아한다 작은 계획 하나면 충분하다','한 번의 깊은 호흡이 마음의 재부팅이다','사랑받는 것보다 믿을 만한 사람이 되는 게 오래간다','상처를 말로 꺼내면 무게가 나눠진다','작은 친절은 돌아오지 않아도 흔적을 남긴다','내 속도가 느려 보여도 멈추지 않으면 결국 닿는다','인정은 포기가 아니다 받아들임은 시작이다','해야 할 일 앞에서 숨고 싶을 땐 아주 작은 시작부터','오늘의 수고를 내일의 나에게 친절로 남긴다'];
  function nextFromPool(key, pool){
    const s=loadSettings(); if(!s._cursor) s._cursor={}; if(!s._order) s._order={};
    if(!s._order[key] || s._order[key].length!==pool.length){ s._order[key]=pool.map((_,i)=>i).sort(()=>Math.random()-0.5); s._cursor[key]=0; }
    const idx=s._order[key][s._cursor[key]%pool.length]; s._cursor[key]=(s._cursor[key]+1)%pool.length; saveSettings(s); return pool[idx];
  }

  const dailyDate=$('#dailyDate'), dailyDateText=$('#dailyDateText');
  const questionText=$('#questionText'), answerText=$('#answerText'), btnAnotherQ=$('#btnAnotherQ');
  const eventField=$('#eventField'), thoughtField=$('#thoughtField'), feelingField=$('#feelingField'), resultField=$('#resultField');
  const grat1=$('#grat1'), grat2=$('#grat2'), grat3=$('#grat3'), dailyNote=$('#dailyNote'), tagsField=$('#tagsField');
  const statusDaily=$('#statusDaily');
  [questionText,answerText,eventField,thoughtField,feelingField,resultField,dailyNote].forEach(bindAuto);

  function setDailyDate(d){ dailyDate.value=ymd(d); dailyDateText.textContent=formatDatePretty(dailyDate.value); loadDaily(); }
  function shiftDaily(n){ const cur=new Date(dailyDate.value||new Date()); cur.setDate(cur.getDate()+n); setDailyDate(cur); }

  document.addEventListener('click', (e)=>{
    const id=e.target && e.target.id;
    if(id==='prevDay') shiftDaily(-1);
    if(id==='nextDay') shiftDaily(1);
    if(id==='todayBtn') setDailyDate(new Date());
    if(id==='btnAnotherQ'){ questionText.value=nextFromPool('q',questionPool); autoResize(questionText); }

    if(id==='addMission'){ const txt=$('#newMission')?.value?.trim(); if(!txt) return; const data=loadAll(); const key=currentWeekKey(); const w=data.weekly[key]||{missions:[],healing:''}; w.missions.push({text:txt,done:false}); data.weekly[key]=w; saveAll(data); $('#newMission').value=''; renderMissions(w.missions); saveWeeklyData(); }
    if(id==='saveWeekly'){ saveWeeklyData(); alert('주간 데이터 저장 완료'); }
    if(id==='clearWeekly'){ if(!confirm('이 주차의 주간 데이터를 모두 지울까요?')) return; const data=loadAll(); const key=currentWeekKey(); delete data.weekly[key]; saveAll(data); const user=auth.currentUser; if(user){ db.collection('users').doc(user.uid).collection('weekly').doc(key).delete().catch(()=>{}); } loadWeekly(); }
    if(id==='randomHealing'){ $('#healingText').value=nextFromPool('h',healingPool); autoResize($('#healingText')); }
    if(id==='startCopy'){ const c=$('#copyArea'); c.classList.toggle('hidden'); if(!c.classList.contains('hidden')){ c.value=$('#healingText').value; autoResize(c); } }

    if(id==='saveDaily') saveDailyNow();
    if(id==='clearDaily') clearDailyNow();

    if(id==='searchBtn') doSearch();
    if(id==='searchClear'){ $('#searchInput').value=''; $('#searchResults').innerHTML=''; }

    if(id==='exportJSON') exportJSON();
    if(id==='shareJSON') shareJSON();
    if(id==='importJSON') importJSON();
    if(id==='refreshCache'){ alert('서비스워커 없이 동작합니다. 새로고침하면 최신 적용됩니다.'); }
    if(id==='resetLocal'){ if(!confirm('로컬 데이터를 모두 삭제할까요?')) return; localStorage.removeItem(storeKey); alert('로컬 데이터 삭제 완료'); }

    if(id==='openLogin' || id==='authMiniLogin') openModal();
    if(id==='authMiniLogout' || id==='btnSignOut') auth.signOut();
    if(id==='modalClose') closeModal();
    if(id==='modalSignIn') signIn();
    if(id==='modalSignUp') signUp();
  });

  dailyDate.addEventListener('change', ()=>{ dailyDateText.textContent=formatDatePretty(dailyDate.value); loadDaily(); });
  $('#importFile')?.addEventListener('change', (e)=>{ const f=e.target.files[0]; $('#fileName').textContent = f? `선택한 파일: ${f.name}` : ''; });

  async function loadDaily(){
    const key=dailyDate.value||ymd(new Date()); let d=null;
    const user=auth.currentUser;
    if(user){ const ref=db.collection('users').doc(user.uid).collection('daily').doc(key); const snap=await ref.get(); d=snap.exists? snap.data(): null; }
    if(!d){ const loc=loadAll(); d=loc.daily[key]||{}; }
    if(!d.question) d.question=nextFromPool('q',questionPool);
    questionText.value=d.question||''; answerText.value=d.answer||''; eventField.value=d.event||''; thoughtField.value=d.thought||''; feelingField.value=d.feeling||''; resultField.value=d.result||'';
    grat1.value=(d.gratitude&&d.gratitude[0])||''; grat2.value=(d.gratitude&&d.gratitude[1])||''; grat3.value=(d.gratitude&&d.gratitude[2])||'';
    dailyNote.value=d.note||''; tagsField.value=(d.tags||[]).join(', '); statusDaily.textContent='불러옴';
  }
  async function saveDailyNow(){
    const data=loadAll(); const key=dailyDate.value||ymd(new Date());
    data.daily[key]={ question:questionText.value, answer:answerText.value.trim(), event:eventField.value.trim(), thought:thoughtField.value.trim(), feeling:feelingField.value.trim(), result:resultField.value.trim(), gratitude:[grat1.value.trim(),grat2.value.trim(),grat3.value.trim()], note:dailyNote.value.trim(), tags:parseTags(tagsField.value), updatedAt:new Date().toISOString() };
    saveAll(data);
    const user=auth.currentUser;
    if(user){ await db.collection('users').doc(user.uid).collection('daily').doc(key).set(data.daily[key], {merge:true}); statusDaily.textContent='저장됨(클라우드)'; }
    else{ statusDaily.textContent='저장됨(로컬)'; }
  }
  async function clearDailyNow(){
    if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
    const data=loadAll(); const key=dailyDate.value||ymd(new Date()); delete data.daily[key]; saveAll(data);
    const user=auth.currentUser; if(user){ await db.collection('users').doc(user.uid).collection('daily').doc(key).delete().catch(()=>{}); }
    loadDaily(); statusDaily.textContent='삭제됨';
  }

  const weekPicker=$('#weekPicker'), weekText=$('#weekText');
  function setWeekByDate(dt){ const id=getWeekId(dt); weekPicker.value=id; weekText.textContent=weekPretty(id); loadWeekly(); }
  function shiftWeek(n){ const val=weekPicker.value||getWeekId(new Date()); const [y,w]=val.split('-W'); const base=new Date(Date.UTC(parseInt(y),0,1+(parseInt(w)-1)*7)); base.setUTCDate(base.getUTCDate()+n*7); setWeekByDate(new Date(base)); }
  weekPicker.addEventListener('change', ()=>{ weekText.textContent=weekPretty(weekPicker.value); loadWeekly(); });

  function renderMissions(items){
    const missionList=$('#missionList'); missionList.innerHTML='';
    items.forEach((m,idx)=>{
      const row=document.createElement('div'); row.className='mission-item';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!m.done; cb.addEventListener('change',()=>{m.done=cb.checked; saveWeeklyData();});
      const txt=document.createElement('input'); txt.type='text'; txt.value=m.text||''; txt.placeholder='미션 내용'; txt.addEventListener('input',()=>{m.text=txt.value; saveWeeklyData();});
      const del=document.createElement('button'); del.className='btn danger'; del.textContent='삭제'; del.addEventListener('click',()=>{ if(!confirm('이 미션을 삭제할까요?')) return; items.splice(idx,1); renderMissions(items); saveWeeklyData(); });
      row.appendChild(cb); row.appendChild(txt); row.appendChild(del); missionList.appendChild(row);
    });
  }
  function currentWeekKey(){ return weekPicker.value || getWeekId(new Date()); }
  async function loadWeekly(){
    const key=currentWeekKey(); let w=null;
    const user=auth.currentUser; if(user){ const ref=db.collection('users').doc(user.uid).collection('weekly').doc(key); const snap=await ref.get(); w=snap.exists? snap.data(): null; }
    if(!w){ const data=loadAll(); w=data.weekly[key]||{missions:[],healing:''}; }
    renderMissions(w.missions||[]); $('#healingText').value=w.healing||''; bindAuto($('#healingText'));
  }
  function collectMissions(){ return Array.from(document.querySelectorAll('#missionList .mission-item')).map(r=>{ const cb=r.querySelector('input[type="checkbox"]'); const txt=r.querySelector('input[type="text"]'); return {text:txt.value.trim(), done:cb.checked}; }).filter(x=>x.text.length>0); }
  async function saveWeeklyData(){
    const key=currentWeekKey(); const data=loadAll(); data.weekly[key]={missions:collectMissions(),healing:$('#healingText').value.trim(),updatedAt:new Date().toISOString()}; saveAll(data);
    const user=auth.currentUser; if(user){ await db.collection('users').doc(user.uid).collection('weekly').doc(key).set(data.weekly[key], {merge:true}); }
  }

  async function exportJSON(){ const data=loadAll(); const a=document.createElement('a'); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); a.href=URL.createObjectURL(blob); a.download=`thanksdiary_backup_${ymd(new Date())}.json`; a.click(); }
  async function shareJSON(){
    const data=loadAll(); const textPayload=JSON.stringify(data,null,2);
    if(navigator.share){ try{ await navigator.share({title:'지니짱 감사일기 백업', text:textPayload}); alert('공유 완료!'); return; }catch(e){} }
    try{ await navigator.clipboard.writeText(textPayload); alert('클립보드에 복사했어요. 카톡에 붙여넣기 하세요!'); return; }catch(e){}
    await exportJSON();
  }
  function importJSON(){
    const f=$('#importFile').files[0]; if(!f){ alert('JSON 파일을 선택하세요.'); return; }
    const reader=new FileReader(); reader.onload=e=>{ try{ const incoming=JSON.parse(e.target.result); const cur=loadAll(); cur.daily={...cur.daily, ...(incoming.daily||{})}; cur.weekly={...cur.weekly, ...(incoming.weekly||{})}; saveAll(cur); alert('가져오기 완료'); if(pages.daily.classList.contains('active')) loadDaily(); if(pages.weekly.classList.contains('active')) loadWeekly(); }catch(err){ alert('가져오기 실패: 올바른 JSON이 아닙니다.'); } }; reader.readAsText(f);
  }

  const lm=$('#loginModal'), loginEmail=$('#loginEmail'), loginPwd=$('#loginPwd'), loginMsg=$('#loginMsg');
  function openModal(){ lm.classList.add('open'); loginMsg.textContent=''; }
  function closeModal(){ lm.classList.remove('open'); }
  async function signIn(){ try{ await auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPwd.value); closeModal(); }catch(e){ const m='로그인 실패: '+(e.message||e); loginMsg.textContent=m; alert(m);} }
  async function signUp(){ try{ await auth.createUserWithEmailAndPassword(loginEmail.value.trim(), loginPwd.value); closeModal(); }catch(e){ const m='회원가입 실패: '+(e.message||e); loginMsg.textContent=m; alert(m);} }

  auth.onAuthStateChanged((user)=>{
    const logged=!!user;
    const miniState=$('#authMiniState'), miniLogin=$('#authMiniLogin'), miniLogout=$('#authMiniLogout');
    if(miniState) miniState.textContent = logged ? '로그인됨' : '로그아웃 상태';
    miniLogin?.classList.toggle('hidden', logged);
    miniLogout?.classList.toggle('hidden', !logged);
    const node=$('#authState'); if(node) node.textContent = logged ? `로그인됨: ${user.email||user.uid}` : '로그아웃 상태';
  });

  function init(){
    document.querySelectorAll('textarea.auto').forEach(bindAuto);
    if(!location.hash) location.hash = '#/daily';
    setDailyDate(new Date()); setWeekByDate(new Date());
    handleHash();
  }
  init();
})();