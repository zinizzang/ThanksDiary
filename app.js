
// v1.3: robust tab router, working buttons, autosave status
(function(){
  const $ = (sel)=>document.querySelector(sel);
  const $$ = (sel)=>Array.from(document.querySelectorAll(sel));

  const storeKey = 'jj-journal-v1-3';
  const settingsKey = 'jj-settings-v1-3';

  function loadAll(){ try{return JSON.parse(localStorage.getItem(storeKey))||{daily:{},weekly:{}};}catch(e){return {daily:{},weekly:{}};} }
  function saveAll(d){ localStorage.setItem(storeKey, JSON.stringify(d)); }
  function loadSettings(){ try{return JSON.parse(localStorage.getItem(settingsKey))||{};}catch(e){return {};} }
  function saveSettings(s){ localStorage.setItem(settingsKey, JSON.stringify(s)); }

  function ymd(date){ const d=new Date(date); const tz=d.getTimezoneOffset()*60000; return new Date(d.getTime()-tz).toISOString().slice(0,10); }
  function parseTags(s){ if(!s) return []; return s.split(',').map(t=>t.trim()).filter(Boolean).map(t=>t.startsWith('#')?t:'#'+t); }
  function weekId(date){
    const d=new Date(date); const target=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    const dayNr=(target.getUTCDay()+6)%7; target.setUTCDate(target.getUTCDate()-dayNr+3);
    const firstThursday=new Date(Date.UTC(target.getUTCFullYear(),0,4));
    const weekNo=1+Math.round(((target-firstThursday)/86400000-3+((firstThursday.getUTCDay()+6)%7))/7);
    const year=target.getUTCFullYear(); return `${year}-W${String(weekNo).padStart(2,'0')}`;
  }

  // Theme toggle
  function applyTheme(){ const s=loadSettings(); const prefers=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; const use=(s.darkMode==='dark')||(s.darkMode==='system'&&prefers); document.documentElement.classList.toggle('dark', use); }
  $('#darkToggle').addEventListener('click', ()=>{ const s=loadSettings(); s.darkMode=document.documentElement.classList.contains('dark')?'light':'dark'; saveSettings(s); applyTheme(); });
  const darkChk = $('#darkMode'); if(darkChk){ darkChk.addEventListener('change', ()=>{ const s=loadSettings(); s.darkMode=darkChk.checked?'dark':'light'; saveSettings(s); applyTheme(); }); }
  applyTheme();

  // Tabs router
  function showTab(name){
    $$('.tab').forEach(el=>el.classList.remove('active'));
    $$('.tab-btn').forEach(b=>b.classList.remove('active'));
    const sec = $('#'+name);
    const btn = $(`.tab-btn[data-tab="${name}"]`);
    if(sec) sec.classList.add('active');
    if(btn) btn.classList.add('active');
    history.replaceState(null,'',`#${name}`);
  }
  $$('.tab-btn').forEach(btn=>btn.addEventListener('click', ()=>showTab(btn.dataset.tab)));
  window.addEventListener('hashchange', ()=>{ const t=location.hash.replace('#','')||'daily'; showTab(t); });
  showTab(location.hash.replace('#','')||'daily');

  // Daily refs
  const dailyDate = $('#dailyDate'), prevDay=$('#prevDay'), nextDay=$('#nextDay'), todayBtn=$('#todayBtn');
  const eventField=$('#eventField'), thoughtField=$('#thoughtField'), feelingField=$('#feelingField'), resultField=$('#resultField');
  const grat1=$('#grat1'), grat2=$('#grat2'), grat3=$('#grat3'), dailyNote=$('#dailyNote'), tagsField=$('#tagsField');
  const saveDaily=$('#saveDaily'), clearDaily=$('#clearDaily'), saveStatus=$('#saveStatus');

  function setDailyDate(d){ dailyDate.value = ymd(d); loadDaily(); }
  function shiftDaily(n){ const cur=new Date(dailyDate.value||new Date()); cur.setDate(cur.getDate()+n); setDailyDate(cur); }
  prevDay.addEventListener('click', ()=>shiftDaily(-1));
  nextDay.addEventListener('click', ()=>shiftDaily(1));
  todayBtn.addEventListener('click', ()=>setDailyDate(new Date()));
  dailyDate.addEventListener('change', loadDaily);

  function loadDaily(){
    const data=loadAll(); const key=dailyDate.value||ymd(new Date()); const d=data.daily[key]||{};
    eventField.value=d.event||''; thoughtField.value=d.thought||''; feelingField.value=d.feeling||''; resultField.value=d.result||'';
    grat1.value=(d.gratitude&&d.gratitude[0])||''; grat2.value=(d.gratitude&&d.gratitude[1])||''; grat3.value=(d.gratitude&&d.gratitude[2])||'';
    dailyNote.value=d.note||''; tagsField.value=(d.tags||[]).join(', '); saveStatus.textContent='';
  }
  function doSaveDaily(){
    const data=loadAll(); const key=dailyDate.value||ymd(new Date());
    data.daily[key]={ event:eventField.value.trim(), thought:thoughtField.value.trim(), feeling:feelingField.value.trim(), result:resultField.value.trim(),
      gratitude:[grat1.value.trim(),grat2.value.trim(),grat3.value.trim()], note:dailyNote.value.trim(), tags:parseTags(tagsField.value), updatedAt:new Date().toISOString() };
    saveAll(data); saveStatus.textContent='저장됨';
    setTimeout(()=>saveStatus.textContent='', 2000);
  }
  saveDaily.addEventListener('click', doSaveDaily);
  clearDaily.addEventListener('click', ()=>{ if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return; const data=loadAll(); const key=dailyDate.value||ymd(new Date()); delete data.daily[key]; saveAll(data); loadDaily(); });

  // Weekly
  const weekPicker=$('#weekPicker'), prevWeek=$('#prevWeek'), nextWeek=$('#nextWeek'), thisWeekBtn=$('#thisWeekBtn');
  const missionList=$('#missionList'), newMission=$('#newMission'), addMission=$('#addMission');
  const healingText=$('#healingText'), randomHealing=$('#randomHealing'), clearHealing=$('#clearHealing'), copyHealing=$('#copyHealing'), copyPadWrap=$('#copyPadWrap'), copyPad=$('#copyPad');
  function currentWeekKey(){ return weekPicker.value || weekId(new Date()); }
  function setWeekByDate(d){ weekPicker.value = weekId(d); loadWeekly(); }
  prevWeek.addEventListener('click', ()=>{ // -1 week
    const val=currentWeekKey(); const [y,w]=val.split('-W'); const monday=new Date(Date.UTC(parseInt(y),0,1+(parseInt(w)-1)*7)); loadWeeklyShift(monday,-7);
  });
  nextWeek.addEventListener('click', ()=>{
    const val=currentWeekKey(); const [y,w]=val.split('-W'); const monday=new Date(Date.UTC(parseInt(y),0,1+(parseInt(w)-1)*7)); loadWeeklyShift(monday,7);
  });
  function loadWeeklyShift(monday,delta){ monday.setUTCDate(monday.getUTCDate()+delta); setWeekByDate(new Date(monday)); }
  thisWeekBtn.addEventListener('click', ()=>setWeekByDate(new Date()));
  weekPicker.addEventListener('change', loadWeekly);

  function renderMissions(items){
    missionList.innerHTML='';
    items.forEach((m,idx)=>{
      const row=document.createElement('div'); row.className='mission-item';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!m.done; cb.addEventListener('change', ()=>{ m.done=cb.checked; saveWeeklyData(items); });
      const txt=document.createElement('input'); txt.type='text'; txt.value=m.text||''; txt.placeholder='미션 내용'; txt.addEventListener('input', ()=>{ m.text=txt.value; saveWeeklyData(items); });
      const del=document.createElement('button'); del.className='btn danger'; del.textContent='삭제'; del.addEventListener('click', ()=>{ items.splice(idx,1); renderMissions(items); saveWeeklyData(items); });
      row.appendChild(cb); row.appendChild(txt); row.appendChild(del); missionList.appendChild(row);
    });
  }
  function loadWeekly(){
    const data=loadAll(); const key=currentWeekKey(); const w=data.weekly[key]||{missions:[],healing:'',copy:''};
    renderMissions(w.missions); healingText.value=w.healing||''; copyPadWrap.classList.toggle('hidden', !w.copy); copyPad.value=w.copy||'';
  }
  function saveWeeklyData(items){
    const data=loadAll(); const key=currentWeekKey();
    const list = items || Array.from(missionList.querySelectorAll('.mission-item')).map(row=>{
      const cb=row.querySelector('input[type="checkbox"]'); const txt=row.querySelector('input[type="text"]'); return {text:txt.value.trim(), done:cb.checked};
    }).filter(it=>it.text.length>0);
    data.weekly[key]={ missions:list, healing:healingText.value.trim(), copy:copyPad.value, updatedAt:new Date().toISOString() };
    saveAll(data);
  }
  addMission.addEventListener('click', ()=>{
    const t=newMission.value.trim(); if(!t) return; const data=loadAll(); const key=currentWeekKey(); const w=data.weekly[key]||{missions:[],healing:'',copy:''};
    w.missions.push({text:t,done:false}); data.weekly[key]=w; saveAll(data); newMission.value=''; renderMissions(w.missions);
  });
  randomHealing.addEventListener('click', ()=>{
    const bank=['숨 고르고, 오늘의 나에게 미소.','완벽 말고, 따뜻함 한 스푼.','천천히, 그러나 멈추지 말자.','내 마음은 내가 돌본다.','고마움은 마음의 햇살.'];
    const pick=bank[Math.floor(Math.random()*bank.length)]; healingText.value=pick; saveWeeklyData();
  });
  clearHealing.addEventListener('click', ()=>{ healingText.value=''; copyPad.value=''; copyPadWrap.classList.add('hidden'); saveWeeklyData(); });
  copyHealing.addEventListener('click', ()=>{ copyPadWrap.classList.remove('hidden'); copyPad.focus(); });

  $('#saveWeekly')?.addEventListener('click', ()=>saveWeeklyData());

  // Search
  const searchInput=$('#searchInput'), searchBtn=$('#searchBtn'), searchClear=$('#searchClear'), searchResults=$('#searchResults');
  function doSearch(){
    const q=searchInput.value.trim(); const data=loadAll(); const isTag=q.startsWith('#'); const qn=q.replace(/^#/,'').toLowerCase(); const res=[];
    Object.keys(data.daily).forEach(date=>{
      const d=data.daily[date]; const hay=[d.event,d.thought,d.feeling,d.result,...(d.gratitude||[]),d.note].join(' ').toLowerCase();
      const tags=(d.tags||[]).map(t=>t.replace(/^#/,'').toLowerCase());
      const ok=isTag ? tags.includes(qn) : hay.includes(qn);
      if(ok) res.push({date, d});
    });
    res.sort((a,b)=>a.date.localeCompare(b.date)); renderResults(res);
  }
  function renderResults(list){
    searchResults.innerHTML=''; if(list.length===0){ searchResults.innerHTML='<p class="muted">결과가 없습니다.</p>'; return; }
    list.forEach(item=>{
      const div=document.createElement('div'); div.className='res';
      const h4=document.createElement('h4'); h4.textContent=item.date;
      const p=document.createElement('p'); const tags=(item.d.tags||[]).map(t=>`<span class="badge">${t}</span>`).join(' ');
      p.innerHTML=`<strong>사건</strong>: ${item.d.event||''}<br><strong>생각</strong>: ${item.d.thought||''}<br><strong>감정</strong>: ${item.d.feeling||''}<br><strong>결과</strong>: ${item.d.result||''}<br><strong>감사</strong>: ${(item.d.gratitude||[]).filter(Boolean).join(', ')}<br><strong>일상</strong>: ${item.d.note||''}<br>${tags}`;
      div.appendChild(h4); div.appendChild(p); searchResults.appendChild(div);
    });
  }
  searchBtn.addEventListener('click', doSearch);
  searchClear.addEventListener('click', ()=>{ searchInput.value=''; searchResults.innerHTML=''; });

  // Export / Import
  $('#exportJSON').addEventListener('click', ()=>{ const data=loadAll(); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`jinijjang_backup_${ymd(new Date())}.json`; a.click(); URL.revokeObjectURL(url); });
  $('#exportCSV').addEventListener('click', ()=>{
    const data=loadAll(); const dailyRows=[['date','event','thought','feeling','result','grat1','grat2','grat3','note','tags']];
    Object.keys(data.daily).sort().forEach(k=>{ const d=data.daily[k]; dailyRows.push([k,d.event||'',d.thought||'',d.feeling||'',d.result||'',(d.gratitude&&d.gratitude[0])||'',(d.gratitude&&d.gratitude[1])||'',(d.gratitude&&d.gratitude[2])||'',d.note||'',(d.tags||[]).join(' ')]); });
    const weeklyRows=[['week','missions(json)','healing','copy']];
    Object.keys(data.weekly).sort().forEach(k=>{ const w=data.weekly[k]; weeklyRows.push([k,JSON.stringify(w.missions||[]),w.healing||'',w.copy||'']); });
    function toCSV(rows){ return rows.map(r=>r.map(x=>`"${(x??'').toString().replace(/"/g,'""')}"`).join(',')).join('\\n'); }
    const zipName=`jinijjang_csv_${ymd(new Date())}.zip`;
    function pack(JSZip){ const zip=new JSZip(); zip.file(`daily.csv`, toCSV(dailyRows)); zip.file(`weekly.csv`, toCSV(weeklyRows)); zip.generateAsync({type:'blob'}).then(b=>{ const url=URL.createObjectURL(b); const a=document.createElement('a'); a.href=url; a.download=zipName; a.click(); URL.revokeObjectURL(url); }); }
    if(window.JSZip) pack(JSZip); else { const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload=()=>pack(JSZip); document.head.appendChild(s); }
  });
  $('#importJSON').addEventListener('click', ()=>{
    const f=$('#importFile').files[0]; if(!f){ alert('JSON 파일을 선택하세요.'); return; }
    const reader=new FileReader(); reader.onload=(e)=>{ try{ const incoming=JSON.parse(e.target.result); const current=loadAll(); current.daily={...current.daily,...(incoming.daily||{})}; current.weekly={...current.weekly,...(incoming.weekly||{})}; saveAll(current); alert('가져오기 완료'); loadDaily(); loadWeekly(); }catch(err){ alert('가져오기 실패'); } }; reader.readAsText(f);
  });

  // Lock (Face ID/PIN) — same as before, but default off
  const lockScreen=$('#lockScreen'), unlockBtn=$('#unlockBtn'), lockBypass=$('#lockBypass'), pinArea=$('#pinArea'), pinInput=$('#pinInput'), pinSubmit=$('#pinSubmit'), lockEnabledChk=$('#lockEnabled'), pinCodeInput=$('#pinCode'), savePinBtn=$('#savePin');
  function sha256(str){ const enc=new TextEncoder(); return crypto.subtle.digest('SHA-256', enc.encode(str)).then(buf=>Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('')); }
  async function setPin(pin){ const s=loadSettings(); s.pinHash=await sha256(pin); saveSettings(s); }
  async function checkPin(pin){ const s=loadSettings(); if(!s.pinHash) return false; const h=await sha256(pin); return h===s.pinHash; }
  savePinBtn.addEventListener('click', async ()=>{ const pin=pinCodeInput.value.trim(); if(!/^\\d{6}$/.test(pin)){ alert('6자리 숫자 PIN'); return; } await setPin(pin); alert('PIN 저장'); pinCodeInput.value=''; });
  lockBypass.addEventListener('click', ()=>{ pinArea.classList.remove('hidden'); pinInput.focus(); });
  pinSubmit.addEventListener('click', async ()=>{ const ok=await checkPin(pinInput.value.trim()); if(ok){ lockScreen.classList.add('hidden'); pinInput.value=''; } else alert('PIN 오류'); });
  if(unlockBtn) unlockBtn.addEventListener('click', async ()=>{
    try{
      const s=loadSettings();
      if(!window.PublicKeyCredential) throw new Error('WebAuthn 미지원');
      if(!s.credId){
        const challenge=crypto.getRandomValues(new Uint8Array(32));
        const cred=await navigator.credentials.create({ publicKey:{ challenge, rp:{name:'JiniJournal', id:location.hostname}, user:{id:new TextEncoder().encode('local-user'), name:'local-user', displayName:'Local'}, pubKeyCredParams:[{type:'public-key', alg:-7}], authenticatorSelection:{authenticatorAttachment:'platform', userVerification:'required'}, timeout:60000, attestation:'none' } });
        s.credId=btoa(String.fromCharCode(...new Uint8Array(cred.rawId))); saveSettings(s);
      }
      const challenge=crypto.getRandomValues(new Uint8Array(32)); const idBytes=Uint8Array.from(atob(loadSettings().credId), c=>c.charCodeAt(0));
      await navigator.credentials.get({ publicKey:{ challenge, allowCredentials:[{id:idBytes, type:'public-key', transports:['internal']}], userVerification:'required', timeout:60000 } });
      lockScreen.classList.add('hidden');
    }catch(e){ alert('인증 실패/취소'); }
  });
  function applyLock(){ const s=loadSettings(); lockEnabledChk.checked=!!s.lockEnabled; lockScreen.classList.toggle('hidden', !s.lockEnabled); }
  if(lockEnabledChk) lockEnabledChk.addEventListener('change', ()=>{ const s=loadSettings(); s.lockEnabled=lockEnabledChk.checked; saveSettings(s); applyLock(); });

  // init
  setDailyDate(new Date()); setWeekByDate(new Date()); applyLock();
})();
