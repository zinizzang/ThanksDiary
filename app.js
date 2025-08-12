/* v2.7.2-hotfix-modal-font-icons
 * - fixes login modal open/close
 * - restores small icons and spacing
 * - keeps tabs working via hash-router
 * - applies emotional font to all inputs, including placeholders
 * - localStorage fallback; Firebase if available
 */
(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const fmtDate = (d) => d.toISOString().slice(0,10);
  const getWeekId = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const onejan = new Date(d.getFullYear(),0,1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
    return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
  };
  const state = {
    uid: null,
    date: fmtDate(new Date()),
    weekId: getWeekId(fmtDate(new Date())),
    qList: [
      "사람들에게 어떤 사람으로 기억되고 싶나요?",
      "지금의 나에게 꼭 필요한 한 마디는?",
      "오늘 가장 고마웠던 순간은?",
      "오늘 배운 점 하나는?"
    ]
  };

  // Hash router
  function showTab(name){
    $$('.tab').forEach(el=>el.classList.remove('active'));
    $('#tab-'+name).classList.add('active');
    $$('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===name));
    if(name==='weekly'){
      $('#weekLabel').textContent = state.weekId;
    }
    location.hash = '#/'+name;
  }
  function initRouter(){
    const h = location.hash.replace('#/','') || 'daily';
    showTab(h);
    $$('.tab-btn').forEach(btn=>btn.addEventListener('click', ()=>showTab(btn.dataset.tab)));
  }

  // Modal
  const modal = $('#loginModal');
  function openModal(){ modal.classList.add('open'); $('body').style.overflow='hidden'; }
  function closeModal(){ modal.classList.remove('open'); $('body').style.overflow=''; }
  $('#openLogin')?.addEventListener('click', openModal);
  $('#btnLogin')?.addEventListener('click', openModal);
  modal.addEventListener('click', (e)=>{ if(e.target.dataset.close) closeModal(); });
  $$('.modal [data-close]').forEach(b=>b.addEventListener('click', closeModal));
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal.classList.contains('open')) closeModal(); });

  // Date
  const dateInput = $('#dateInput');
  const weekInfo = $('#weekInfo');
  function syncDate(dateStr){
    state.date = dateStr;
    state.weekId = getWeekId(dateStr);
    if(weekInfo) weekInfo.textContent = state.weekId;
    if($('#weekLabel')) $('#weekLabel').textContent = state.weekId;
    loadAll();
  }
  dateInput.value = state.date;
  $('#btnToday').addEventListener('click', ()=>{
    const today = fmtDate(new Date());
    dateInput.value = today;
    syncDate(today);
  });
  dateInput.addEventListener('change', ()=> syncDate(dateInput.value));

  // Random Q
  $('#btnRandomQ').addEventListener('click', ()=>{
    const q = state.qList[Math.floor(Math.random()*state.qList.length)];
    $('#qText').value = q;
  });

  // Storage helpers
  const hasFirebase = !!(window.firebase && firebase.auth && firebase.firestore);
  const db = hasFirebase ? firebase.firestore() : null;
  function userPath(col){
    if(!state.uid || !db) return null;
    return db.collection('users').doc(state.uid).collection(col);
  }
  function localKey(key){ return `td:${state.date}:${key}`; }
  async function saveDoc(col, id, data){
    if(db && state.uid){
      await userPath(col).doc(id).set(data, {merge:true});
    }else{
      localStorage.setItem(`td:${col}:${id}`, JSON.stringify(data));
    }
  }
  async function loadDoc(col, id){
    if(db && state.uid){
      const s = await userPath(col).doc(id).get();
      return s.exists ? s.data() : null;
    }else{
      const raw = localStorage.getItem(`td:${col}:${id}`);
      return raw ? JSON.parse(raw) : null;
    }
  }

  // Auth
  async function setLoggedIn(uid){
    state.uid = uid;
    $('#authStatus').textContent = uid ? '로그인됨' : '';
    closeModal();
    loadAll();
  }
  $('#doLogin').addEventListener('click', async()=>{
    const email = $('#loginEmail').value.trim();
    const pw = $('#loginPassword').value;
    try{
      if(hasFirebase){
        await firebase.auth().signInWithEmailAndPassword(email, pw);
      }else{
        alert('지금은 로컬 저장만 사용돼요 🙂');
        setLoggedIn('local');
      }
    }catch(err){
      alert('로그인 실패: ' + (err && err.message || ''));
    }
  });
  $('#doLogout')?.addEventListener('click', async()=>{
    if(hasFirebase) await firebase.auth().signOut();
    setLoggedIn(null);
  });
  $('#btnLogout')?.addEventListener('click', async()=>{
    if(hasFirebase) await firebase.auth().signOut();
    setLoggedIn(null);
  });
  if(hasFirebase){
    firebase.auth().onAuthStateChanged(u=> setLoggedIn(u?u.uid:null));
  }else{
    setLoggedIn(null);
  }

  // Daily saves
  function toast(msg){ alert(msg); } // simple
  async function saveDaily(){
    const data = {
      question: {text: $('#qText').value, answer: $('#qAnswer').value},
      emotion: {
        event: $('#eEvent').value, thought: $('#eThought').value,
        emotion: $('#eEmotion').value, result: $('#eResult').value
      },
      thanks: [$('#g1').value, $('#g2').value, $('#g3').value],
      note: $('#dailyNote').value,
      tags: $('#tags').value,
      date: state.date,
      week: state.weekId,
      updatedAt: Date.now()
    };
    await saveDoc('emotion', state.date, data);
    toast('저장 완료!');
  }
  async function loadDaily(){
    const data = await loadDoc('emotion', state.date);
    if(!data) return;
    $('#qText').value = data?.question?.text || '';
    $('#qAnswer').value = data?.question?.answer || '';
    $('#eEvent').value = data?.emotion?.event || '';
    $('#eThought').value = data?.emotion?.thought || '';
    $('#eEmotion').value = data?.emotion?.emotion || '';
    $('#eResult').value = data?.emotion?.result || '';
    $('#g1').value = data?.thanks?.[0] || '';
    $('#g2').value = data?.thanks?.[1] || '';
    $('#g3').value = data?.thanks?.[2] || '';
    $('#dailyNote').value = data?.note || '';
    $('#tags').value = data?.tags || '';
  }
  $('#btnQSave').addEventListener('click', saveDaily);
  $('#btnEmotionSave').addEventListener('click', saveDaily);
  $('#btnThanksSave').addEventListener('click', saveDaily);
  $('#btnDailySave').addEventListener('click', saveDaily);
  $('#btnTagsSave').addEventListener('click', saveDaily);
  $('#btnQClear').addEventListener('click', ()=> $('#qAnswer').value='');
  $('#btnEmotionClear').addEventListener('click', ()=>['#eEvent','#eThought','#eEmotion','#eResult'].forEach(s=>$(s).value=''));
  $('#btnThanksClear').addEventListener('click', ()=>['#g1','#g2','#g3'].forEach(s=>$(s).value=''));
  $('#btnDailyClear').addEventListener('click', ()=>$('#dailyNote').value='');
  $('#btnTagsClear').addEventListener('click', ()=>$('#tags').value='');

  // Weekly
  function renderMissions(list){
    const wrap = $('#missionList');
    wrap.innerHTML='';
    list.forEach((m,idx)=>{
      const tpl = $('#missionItemTpl').content.cloneNode(true);
      const label = tpl.querySelector('.mission');
      const chk = tpl.querySelector('.mission-check');
      const txt = tpl.querySelector('.mission-text');
      const del = tpl.querySelector('.mission-del');
      chk.checked = !!m.done;
      txt.value = m.text || '';
      chk.addEventListener('change', saveWeekly);
      txt.addEventListener('input', saveWeekly);
      del.addEventListener('click', ()=>{ list.splice(idx,1); saveWeekly(); });
      wrap.appendChild(tpl);
    });
  }
  async function saveWeekly(){
    const missions = Array.from($('#missionList').querySelectorAll('.mission')).map(el=>({
      done: el.querySelector('.mission-check').checked,
      text: el.querySelector('.mission-text').value.trim()
    }));
    const data = {
      missions,
      healing: $('#healingText').value,
      copy: $('#healingCopy').value,
      week: state.weekId,
      updatedAt: Date.now()
    };
    await saveDoc('weekly', state.weekId, data);
  }
  async function loadWeekly(){
    const data = await loadDoc('weekly', state.weekId) || {missions:[]};
    renderMissions(data.missions || []);
    $('#healingText').value = data.healing || '';
    $('#healingCopy').value = data.copy || '';
  }
  $('#btnAddMission').addEventListener('click', ()=>{
    const t = $('#newMissionText').value.trim();
    if(!t) return;
    const cur = Array.from($('#missionList').querySelectorAll('.mission-text')).map(i=>({text:i.value, done:false}));
    cur.push({text:t, done:false});
    renderMissions(cur);
    $('#newMissionText').value='';
    saveWeekly();
  });
  $('#btnHealingSave').addEventListener('click', saveWeekly);

  // Search
  $('#searchInput').addEventListener('input', async(e)=>{
    const q = e.target.value.trim();
    const out = $('#searchResults');
    out.innerHTML='';
    if(!q) return;
    // Search local cache (simple)
    const keys = Object.keys(localStorage).filter(k=>k.startsWith('td:emotion:'));
    const weeklyKeys = Object.keys(localStorage).filter(k=>k.startsWith('td:weekly:'));
    function matchData(obj){
      const txt = JSON.stringify(obj);
      return txt.includes(q);
    }
    keys.forEach(k=>{
      const data = JSON.parse(localStorage.getItem(k)||'{}');
      if(matchData(data)){
        const el = document.createElement('div');
        el.className='result-card';
        el.innerHTML = `<div class="title">데일리 · ${data.date||k.split(':').pop()}</div>
          <div class="snippet">${(data.note||data.question?.answer||'').slice(0,120)}</div>`;
        out.appendChild(el);
      }
    });
    weeklyKeys.forEach(k=>{
      const data = JSON.parse(localStorage.getItem(k)||'{}');
      if(matchData(data)){
        const el = document.createElement('div');
        el.className='result-card';
        el.innerHTML = `<div class="title">위클리 · ${data.week||k.split(':').pop()}</div>
          <div class="snippet">${(data.healing||'') + ' ' + (data.copy||'')}`.slice(0,140) + `</div>`;
        out.appendChild(el);
      }
    });
  });

  // Backup
  $('#btnExport').addEventListener('click', ()=>{
    const dump = {};
    Object.keys(localStorage).filter(k=>k.startsWith('td:')).forEach(k=> dump[k]=localStorage.getItem(k));
    const blob = new Blob([JSON.stringify(dump,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `thanksdiary-backup-${Date.now()}.json`;
    a.click();
  });
  $('#btnImport').addEventListener('click', ()=>{
    const f = $('#importFile').files[0];
    if(!f) return alert('파일을 선택하세요');
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        Object.entries(data).forEach(([k,v])=> localStorage.setItem(k,v));
        alert('가져오기 완료!');
      }catch(e){ alert('가져오기 실패'); }
    };
    reader.readAsText(f);
  });

  async function loadAll(){ await Promise.all([loadDaily(), loadWeekly()]); }
  initRouter();
  syncDate(state.date);
  loadAll();
})();