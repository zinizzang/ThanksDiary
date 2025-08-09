
// v2.3.6 – compat SDK + defensive event wiring + alerts + week nice text
(function(){
  var firebaseConfig = {
    apiKey: "AIzaSyAOqrdA0aHL5lMXOOmdtj8mnLi6zgSXoiM",
    authDomain: "thanksdiary-dca35.firebaseapp.com",
    projectId: "thanksdiary-dca35",
    storageBucket: "thanksdiary-dca35.appspot.com",
    messagingSenderId: "250477396044",
    appId: "1:250477396044:web:aa1cf155f01263e08834e9"
  };
  try{ if (!firebase.apps.length) firebase.initializeApp(firebaseConfig); }catch(e){ console.log('Firebase init error', e); }
  var auth=null, db=null; try{ auth=firebase.auth(); db=firebase.firestore(); }catch(e){ console.log('Firebase libs not ready', e); }

  function $(s){ return document.querySelector(s); }
  function ymd(date){ var d=new Date(date); var tz=d.getTimezoneOffset()*60000; return new Date(d.getTime()-tz).toISOString().slice(0,10); }
  function formatDatePretty(dateStr){ var d=new Date(dateStr); return d.getFullYear()+'. '+(d.getMonth()+1)+'. '+d.getDate()+'.'; }
  function getWeekId(date){
    var d=new Date(date); var t=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var n=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-n+3);
    var ft=new Date(Date.UTC(t.getUTCFullYear(),0,4));
    var w=1+Math.round(((t-ft)/86400000-3+((ft.getUTCDay()+6)%7))/7); var y=t.getUTCFullYear();
    return y+'-W'+(''+w).padStart(2,'0');
  }
  function weekPretty(weekId){ var sp=weekId.split('-W'); return sp[0]+' '+parseInt(sp[1],10)+'번째 주'; }
  function weekOfMonthStr(date){
    var d=new Date(date); var first=new Date(d.getFullYear(), d.getMonth(), 1);
    var fd=first.getDay(); if(fd===0) fd=7; var w=Math.floor((fd-1 + d.getDate() + 6)/7); if(w<1) w=1;
    return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+w+'주';
  }
  function parseTags(s){ if(!s) return []; return s.split(',').map(function(t){t=t.trim(); return t? (t[0]==='#'?t:'#'+t):null}).filter(Boolean); }
  function autoResize(el){ if(!el) return; el.style.height='auto'; el.style.height=(el.scrollHeight+2)+'px'; }
  function bindAuto(el){ if(!el) return; autoResize(el); el.addEventListener('input', function(){ autoResize(el); }); }

  var questionPool=['오늘 나는 무엇을 잘했나요?','사람들에게 어떤 사람으로 기억되고 싶나요?','오늘 나를 웃게 만든 순간은 무엇이었나요?','요즘 나를 설레게 하는 작은 일은?','지금의 나에게 필요한 한 문장은?','오늘 배운 것 하나는 무엇인가요?','나는 무엇을 포기하지 않았나요?','최근 나를 힘들게 한 일, 거기서 배운 점은?','오늘 나에게 가장 고마운 사람은 누구였나요?','앞으로의 나에게 전하고 싶은 말은?','나의 강점 한 가지를 적어보세요.','오늘 놓치지 않은 작은 친절은?','오늘 내 마음의 날씨는 어땠나요?'];
  var healingPool=['부러움 대신 배움을 고르면 마음은 가벼워진다','완벽보다 꾸준함이 조용히 이긴다','오늘의 나를 어제의 나와만 비교하면 삶이 단단해진다','불안은 계획을 좋아한다 작은 계획 하나면 충분하다','한 번의 깊은 호흡이 마음의 재부팅이다','사랑받는 것보다 믿을 만한 사람이 되는 게 오래간다','상처를 말로 꺼내면 무게가 나눠진다','작은 친절은 돌아오지 않아도 흔적을 남긴다','내 속도가 느려 보여도 멈추지 않으면 결국 닿는다','인정은 포기가 아니다 받아들임은 시작이다','해야 할 일 앞에서 숨고 싶을 땐 아주 작은 시작부터','오늘의 수고를 내일의 나에게 친절로 남긴다'];
  var settingsKey='td-v236-settings';
  function loadSettings(){ try{ return JSON.parse(localStorage.getItem(settingsKey)) || {}; }catch(e){ return {}; } }
  function saveSettings(s){ localStorage.setItem(settingsKey, JSON.stringify(s)); }
  function nextFromPool(key, pool){
    var s=loadSettings(); if(!s._cursor) s._cursor={}; if(!s._order) s._order={};
    if(!s._order[key] || s._order[key].length!==pool.length){
      s._order[key]=[]; for(var i=0;i<pool.length;i++) s._order[key].push(i);
      s._order[key].sort(function(){ return Math.random()-0.5; }); s._cursor[key]=0;
    }
    var idx=s._order[key][s._cursor[key]%pool.length]; s._cursor[key]=(s._cursor[key]+1)%pool.length;
    saveSettings(s); return pool[idx];
  }

  var dailyDate=$('#dailyDate'), dailyDateText=$('#dailyDateText');
  var questionText=$('#questionText'), answerText=$('#answerText'), btnAnotherQ=$('#btnAnotherQ');
  var eventField=$('#eventField'), thoughtField=$('#thoughtField'), feelingField=$('#feelingField'), resultField=$('#resultField');
  var grat1=$('#grat1'), grat2=$('#grat2'), grat3=$('#grat3'), dailyNote=$('#dailyNote'), tagsField=$('#tagsField');
  var statusDaily=$('#statusDaily');
  [questionText,answerText,eventField,thoughtField,feelingField,resultField,dailyNote].forEach(bindAuto);

  var storeKey='td-v236-data';
  function loadAll(){ try{ return JSON.parse(localStorage.getItem(storeKey)) || {daily:{},weekly:{}}; }catch(e){ return {daily:{},weekly:{}}; }
  function saveAll(d){ localStorage.setItem(storeKey, JSON.stringify(d)); }

  function setDailyDate(d){ dailyDate.value=ymd(d); dailyDateText.textContent=formatDatePretty(dailyDate.value); loadDaily(); }
  function shiftDaily(n){ var cur=new Date(dailyDate.value||new Date()); cur.setDate(cur.getDate()+n); setDailyDate(cur); }

  document.addEventListener('click', function(e){
    var id=e && e.target && e.target.id;
    if(id==='prevDay') shiftDaily(-1);
    if(id==='nextDay') shiftDaily(1);
    if(id==='todayBtn') setDailyDate(new Date());
    if(id==='btnAnotherQ'){ questionText.value=nextFromPool('q',questionPool); autoResize(questionText); }

    if(id==='addMission'){
      var nv=$('#newMission') && $('#newMission').value ? $('#newMission').value.trim() : '';
      if(!nv) return;
      var all=loadAll(); var key=currentWeekKey(); var w=all.weekly[key]||{missions:[],healing:''};
      w.missions.push({text=nv,done:false}); all.weekly[key]=w; saveAll(all);
      $('#newMission').value=''; renderMissions(w.missions); saveWeeklyData();
    }
    if(id==='saveWeekly'){ saveWeeklyData(); alert('주간 데이터 저장 완료'); }
    if(id==='clearWeekly'){
      if(!confirm('이 주차의 주간 데이터를 모두 지울까요?')) return;
      var all=loadAll(); var k=currentWeekKey(); delete all.weekly[k]; saveAll(all);
      var user=auth && auth.currentUser; if(user && db){ db.collection('users').doc(user.uid).collection('weekly').doc(k).delete().catch(function(){}); }
      loadWeekly();
    }
    if(id==='randomHealing'){ var ht=$('#healingText'); if(ht){ ht.value=nextFromPool('h',healingPool); autoResize(ht); } }
    if(id==='startCopy'){ var c=$('#copyArea'); if(!c) return; if(c.classList.contains('hidden')){ c.classList.remove('hidden'); c.value=$('#healingText').value; autoResize(c);} else { c.classList.add('hidden'); } }

    if(id==='saveDaily'){ saveDailyNow(); }
    if(id==='clearDaily'){ clearDailyNow(); }

    if(id==='searchBtn') doSearch();
    if(id==='searchClear'){ var si=$('#searchInput'); if(si) si.value=''; var sr=$('#searchResults'); if(sr) sr.innerHTML=''; }

    if(id==='exportJSON') exportJSON();
    if(id==='shareJSON') shareJSON();
    if(id==='importJSON') importJSON();
    if(id==='refreshCache'){ alert('서비스워커 없이 동작합니다. 새로고침하면 최신 적용됩니다.'); }
    if(id==='resetLocal'){ if(!confirm('로컬 데이터를 모두 삭제할까요?')) return; localStorage.removeItem(storeKey); alert('로컬 데이터 삭제 완료'); }

    if(id==='authMiniLogout' || id==='btnSignOut'){ if(auth) auth.signOut(); }
  });

  if(dailyDate) dailyDate.addEventListener('change', function(){ dailyDateText.textContent=formatDatePretty(dailyDate.value); loadDaily(); });
  var importFile=$('#importFile'); if(importFile) importFile.addEventListener('change', function(e){ var f=e.target.files[0]; var fn=$('#fileName'); if(fn) fn.textContent = f? ('선택한 파일: '+f.name) : ''; });

  function loadDaily(){
    var key=dailyDate.value||ymd(new Date()); var d=null;
    var user=auth && auth.currentUser;
    function fill(d){
      if(!d) d={};
      if(!d.question) d.question=nextFromPool('q',questionPool);
      questionText.value=d.question||'';
      answerText.value=d.answer||'';
      eventField.value=d.event||'';
      thoughtField.value=d.thought||'';
      feelingField.value=d.feeling||'';
      resultField.value=d.result||'';
      grat1.value=(d.gratitude&&d.gratitude[0])||'';
      grat2.value=(d.gratitude&&d.gratitude[1])||'';
      grat3.value=(d.gratitude&&d.gratitude[2])||'';
      dailyNote.value=d.note||'';
      tagsField.value=(d.tags||[]).join(', ');
      statusDaily.textContent='불러옴';
      [questionText,answerText,eventField,thoughtField,feelingField,resultField,dailyNote].forEach(autoResize);
    }
    if(user && db){
      db.collection('users').doc(user.uid).collection('daily').doc(key).get().then(function(snap){
        d=snap.exists ? snap.data() : null; if(!d){ var loc=loadAll(); d=loc.daily[key]||null; } fill(d);
      }).catch(function(){ var loc=loadAll(); d=loc.daily[key]||null; fill(d); });
    }else{
      var loc=loadAll(); d=loc.daily[key]||null; fill(d);
    }
  }
  function saveDailyNow(){
    var all=loadAll(); var key=dailyDate.value||ymd(new Date());
    all.daily[key]={
      question:questionText.value,
      answer:answerText.value.trim(),
      event:eventField.value.trim(),
      thought:thoughtField.value.trim(),
      feeling:feelingField.value.trim(),
      result:resultField.value.trim(),
      gratitude:[grat1.value.trim(),grat2.value.trim(),grat3.value.trim()],
      note:dailyNote.value.trim(),
      tags:parseTags(tagsField.value),
      updatedAt:new Date().toISOString()
    };
    saveAll(all);
    var user=auth && auth.currentUser;
    if(user && db){
      db.collection('users').doc(user.uid).collection('daily').doc(key).set(all.daily[key], {merge:true}).then(function(){
        statusDaily.textContent='저장됨(클라우드)'; alert('저장 완료! (클라우드)');
      }).catch(function(err){ statusDaily.textContent='오류'; alert('저장 실패: '+err); });
    }else{
      statusDaily.textContent='저장됨(로컬)'; alert('저장 완료!');
    }
  }
  function clearDailyNow(){
    if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
    var all=loadAll(); var key=dailyDate.value||ymd(new Date()); delete all.daily[key]; saveAll(all);
    var user=auth && auth.currentUser; if(user && db){ db.collection('users').doc(user.uid).collection('daily').doc(key).delete().catch(function(){}); }
    loadDaily(); statusDaily.textContent='삭제됨';
  }

  var weekPicker=$('#weekPicker'), weekText=$('#weekText'), weekTextNice=$('#weekTextNice');
  function setWeekByDate(dt){
    var id=getWeekId(dt); if(weekPicker) weekPicker.value=id;
    if(weekText) weekText.textContent=weekPretty(id);
    if(weekTextNice) weekTextNice.textContent=weekOfMonthStr(dt);
    loadWeekly();
  }
  function shiftWeek(n){
    var val=weekPicker && weekPicker.value ? weekPicker.value : getWeekId(new Date());
    var sp=val.split('-W'); var y=parseInt(sp[0],10); var w=parseInt(sp[1],10);
    var base=new Date(Date.UTC(y,0,1+(w-1)*7)); base.setUTCDate(base.getUTCDate()+n*7);
    setWeekByDate(new Date(base));
  }
  if(weekPicker) weekPicker.addEventListener('change', function(){
    if(weekText) weekText.textContent=weekPretty(weekPicker.value);
    var y=parseInt(weekPicker.value.split('-W')[0],10), w=parseInt(weekPicker.value.split('-W')[1],10);
    var base=new Date(Date.UTC(y,0,1+(w-1)*7));
    if(weekTextNice) weekTextNice.textContent=weekOfMonthStr(base);
    loadWeekly();
  });
  document.addEventListener('click', function(e){
    var id=e && e.target && e.target.id;
    if(id==='prevWeek') shiftWeek(-1);
    if(id==='nextWeek') shiftWeek(1);
    if(id==='thisWeekBtn') setWeekByDate(new Date());
  });

  function renderMissions(items){
    var missionList=$('#missionList'); if(!missionList) return; missionList.innerHTML='';
    for(var i=0;i<items.length;i++){
      (function(idx){
        var m=items[idx];
        var row=document.createElement('div'); row.className='mission-item';
        var cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!m.done;
        cb.addEventListener('change', function(){ m.done=cb.checked; saveWeeklyData(); });
        var txt=document.createElement('input'); txt.type='text'; txt.value=m.text||''; txt.placeholder='미션 내용';
        txt.addEventListener('input', function(){ m.text=txt.value; });
        var del=document.createElement('button'); del.className='btn danger'; del.textContent='삭제';
        del.addEventListener('click', function(){ if(!confirm('이 미션을 삭제할까요?')) return; items.splice(idx,1); renderMissions(items); saveWeeklyData(); });
        row.appendChild(cb); row.appendChild(txt); row.appendChild(del); missionList.appendChild(row);
      })(i);
    }
  }
  function currentWeekKey(){ return weekPicker && weekPicker.value ? weekPicker.value : getWeekId(new Date()); }
  function loadWeekly(){
    var key=currentWeekKey(); var w=null;
    var user=auth && auth.currentUser;
    function fill(w){
      if(!w) w={missions:[],healing:''};
      renderMissions(w.missions||[]);
      var ht=$('#healingText'); if(ht){ ht.value=w.healing||''; bindAuto(ht); }
    }
    if(user && db){
      db.collection('users').doc(user.uid).collection('weekly').doc(key).get().then(function(snap){
        w=snap.exists ? snap.data() : null;
        if(!w){ var data=loadAll(); w=data.weekly[key]||null; } fill(w);
      }).catch(function(){ var data=loadAll(); w=data.weekly[key]||null; fill(w); });
    }else{
      var data=loadAll(); w=data.weekly[key]||null; fill(w);
    }
  }
  function collectMissions(){
    var rows=document.querySelectorAll('#missionList .mission-item'); var out=[];
    for(var i=0;i<rows.length;i++){
      var r=rows[i]; var cb=r.querySelector('input[type="checkbox"]'); var txt=r.querySelector('input[type="text"]');
      var t=(txt && txt.value) ? txt.value.trim() : ''; if(!t) continue; out.push({text:t,done:cb && cb.checked});
    }
    return out;
  }
  function saveWeeklyData(){
    var key=currentWeekKey(); var all=loadAll();
    var ht=$('#healingText'); var heal=ht ? ht.value.trim() : '';
    all.weekly[key]={ missions:collectMissions(), healing:heal, updatedAt:new Date().toISOString() };
    saveAll(all);
    var user=auth && auth.currentUser;
    if(user && db){ db.collection('users').doc(user.uid).collection('weekly').doc(key).set(all.weekly[key], {merge:true}); }
  }

  function doSearch(){
    var q=$('#searchInput').value.trim().toLowerCase();
    var res=$('#searchResults'); if(!res) return; res.innerHTML='';
    if(!q){ res.textContent='검색어를 입력하세요.'; return; }
    var all=loadAll(); var out=[];
    function pushIf(k, d){
      var text=[d.question,d.answer,d.event,d.thought,d.feeling,d.result,d.note,(d.tags||[]).join(' ')].join(' ').toLowerCase();
      if(text.indexOf(q)>=0) out.push({when:k, data:d});
    }
    for(var k in all.daily){ if(all.daily.hasOwnProperty(k)) pushIf(k, all.daily[k]); }
    res.innerHTML = out.length ? out.map(function(x){ return '<div class=\"search-item\"><b>'+x.when+'</b> — '+(x.data.note||x.data.answer||'')+'</div>'; }).join('') : '결과 없음';
  }

  var lm=$('#loginModal'), loginEmail=$('#loginEmail'), loginPwd=$('#loginPwd'), loginMsg=$('#loginMsg');
  function openModal(){ if(lm){ lm.classList.add('open'); loginMsg.textContent=''; } }
  function closeModal(){ if(lm){ lm.classList.remove('open'); } }
  function signIn(){
    if(!auth){ alert('Firebase 초기화 실패'); return; }
    var email=(loginEmail && loginEmail.value)||''; var pwd=(loginPwd && loginPwd.value)||'';
    auth.signInWithEmailAndPassword(email.trim(), pwd).then(function(){ closeModal(); })
      .catch(function(e){ var m='로그인 실패: '+(e && e.message ? e.message : e); loginMsg.textContent=m; alert(m); });
  }
  function signUp(){
    if(!auth){ alert('Firebase 초기화 실패'); return; }
    var email=(loginEmail && loginEmail.value)||''; var pwd=(loginPwd && loginPwd.value)||'';
    auth.createUserWithEmailAndPassword(email.trim(), pwd).then(function(){ closeModal(); })
      .catch(function(e){ var m='회원가입 실패: '+(e && e.message ? e.message : e); loginMsg.textContent=m; alert(m); });
  }
  window.TD_openLogin=openModal; window.TD_closeLogin=closeModal; window.TD_signIn=signIn; window.TD_signUp=signUp;

  if(auth){
    auth.onAuthStateChanged(function(user){
      var logged=!!user;
      var miniState=$('#authMiniState'), miniLogin=$('#authMiniLogin'), miniLogout=$('#authMiniLogout');
      if(miniState) miniState.textContent = logged ? '로그인됨' : '로그아웃 상태';
      if(miniLogin) miniLogin.classList.toggle('hidden', logged);
      if(miniLogout) miniLogout.classList.toggle('hidden', !logged);
      var node=$('#authState'); if(node) node.textContent = logged ? ('로그인됨: '+(user.email||user.uid)) : '로그아웃 상태';
    });
  }

  function init(){
    var d=new Date(); setDailyDate(d); setWeekByDate(d);
    if(!location.hash) location.hash='#/daily';
    var h=(location.hash.replace(/^#\\/?/,'')||'daily');
    if(h==='weekly' && !(weekPicker && weekPicker.value)) setWeekByDate(new Date());
    loadDaily();
  }
  init();

  function exportJSON(){ var data=loadAll(); var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='thanks-diary-backup.json'; a.click(); }
  function importJSON(){ var f=$('#importFile'); if(!f || !f.files || !f.files[0]){ alert('가져올 JSON 파일을 선택해 주세요.'); return; }
    var reader=new FileReader(); reader.onload=function(){ try{ var obj=JSON.parse(reader.result); if(!obj || !obj.daily || !obj.weekly) throw '형식 오류';
      saveAll(obj); alert('가져오기 완료'); }catch(e){ alert('가져오기 실패: '+e); } }; reader.readAsText(f.files[0]); }
  async function shareJSON(){ try{ var data=loadAll(); var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var file=new File([blob],'thanks-diary-backup.json',{type:'application/json'});
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file], title:'지니짱 감사일기 백업', text:'백업 파일입니다.'});
    }else{ exportJSON(); alert('공유 API를 지원하지 않아 파일 다운로드로 대체합니다.'); }
  }catch(e){ alert('공유 실패/취소: '+e); } }
})();
