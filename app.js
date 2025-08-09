/* ThanksDiary v2.7.1 pastel */
(function(){
  // Firebase init
  const app = firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db   = firebase.firestore();
  // State
  const S = {
    uid: null,
    profileEmail: null,
    currentDate: new Date(),
    questionsUsed: {}, // by YYYY-MM-DD used index
  };

  const $ = (sel,el=document)=> el.querySelector(sel);
  const $$= (sel,el=document)=> [...el.querySelectorAll(sel)];
  const fmtDate = (d)=> d.toISOString().slice(0,10);
  const weekLabel = (d)=>{
    const yy = d.getFullYear();
    const mm = d.getMonth()+1;
    const dd = d.getDate();
    // week number within month (Mon-start)
    const first = new Date(yy, mm-1, 1);
    const dayIdx = (first.getDay()+6)%7; // make Mon=0
    const wk = Math.floor((dayIdx + dd -1)/7)+1;
    return `${yy}년 ${mm}월 ${wk}주`;
  };
  const dateDisp = (d)=> `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`;

  // questions pool (no duplicates day)
  const QUESTIONS = [
    "사람들에게 어떤 사람으로 기억되고 싶나요?",
    "요즘 나를 가장 설레게 하는 것은 무엇인가요?",
    "오늘 나를 웃게 만든 순간은 무엇이었나요?",
    "힘들 때 내가 나에게 해주고 싶은 말은 무엇인가요?",
    "최근에 놓아준 것과 얻은 것이 있다면 무엇인가요?",
    "내가 존경하는 사람의 한 가지 습관을 오늘 따라해본다면?",
    "마음이 가벼워졌던 순간은 언제였나요?",
    "오늘 배운 것 중 내일의 나를 바꿀 작은 한 가지는?",
    "요즘 내가 가장 소중히 여기는 가치는 무엇인가요?",
    "나의 강점 하나를 생활에서 어떻게 더 쓰고 싶나요?",
    "오늘 나를 도운 사람에게 고마움을 어떻게 전할까요?",
    "내가 안전하다고 느끼는 공간은 어디인가요?",
    "최근에 내 선택으로 자랑스러웠던 건 무엇인가요?",
    "내가 더 알고 싶은 나의 모습은 어떤 모습인가요?",
    "지금의 나에게 필요한 한 마디를 쓴다면?"
  ];

  // local store helpers
  const LS = {
    get(k,def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def }catch(e){ return def}},
    set(k,v){ localStorage.setItem(k, JSON.stringify(v))}
  };

  // Router
  function router(){
    const hash = location.hash || "#/daily";
    if (hash.startsWith("#/weekly")) renderWeekly();
    else if (hash.startsWith("#/search")) renderSearch();
    else if (hash.startsWith("#/settings")) renderSettings();
    else renderDaily();
    // set tab active style if needed later
  }
  window.addEventListener("hashchange", router);

  // UI building blocks
  function dateNav(){
    const wrap = document.createElement('div');
    wrap.className = "date-bar";
    const prev = btnRound("<");
    const next = btnRound(">");
    const today = chip("오늘");
    const dateChip = document.createElement('div');
    dateChip.className = "date-chip";
    dateChip.textContent = dateDisp(S.currentDate);

    prev.addEventListener('click', ()=>{ S.currentDate.setDate(S.currentDate.getDate()-1); refreshDate();});
    next.addEventListener('click', ()=>{ S.currentDate.setDate(S.currentDate.getDate()+1); refreshDate();});
    today.addEventListener('click', ()=>{ S.currentDate = new Date(); refreshDate();});

    function refreshDate(){
      dateChip.textContent = dateDisp(S.currentDate);
      // refresh views that use date
      if (location.hash.startsWith("#/weekly")) renderWeekly();
      else renderDaily();
    }
    wrap.append(prev, dateChip, next, today, chipBlue(dateDisp(S.currentDate)));
    return wrap;
  }
  function chip(txt){ const b=document.createElement('button'); b.className="badge"; b.textContent=txt; return b;}
  function chipBlue(txt){ const s=document.createElement('span'); s.className="badge"; s.style.color='#1c62d3'; s.textContent=txt; return s;}
  function btnRound(txt){ const b=document.createElement('button'); b.className='round'; b.textContent=txt; return b;}
  function section(title, icon){
    const div=document.createElement('section'); div.className='section';
    const h=document.createElement('h2'); const img=document.createElement('img'); img.alt=''; img.style.width='26px'; img.style.height='26px'; img.src=icon; h.append(img, document.createTextNode(title));
    div.append(h);
    return {root:div, head:h};
  }
  function field(label, type="textarea", placeholder=""){
    const wrap=document.createElement('div');
    const lab=document.createElement('label'); lab.textContent=label; wrap.append(lab);
    const el = document.createElement(type==="textarea"?"textarea":"input");
    if (type!=="textarea") el.type=type;
    el.placeholder=placeholder;
    wrap.append(el);
    return {wrap, el};
  }
  function saveNotice(){ alert("저장됨!"); }

  // DAILY
  async function renderDaily(){
    const v=$("#view"); v.innerHTML="";
    v.append(dateNav());

    // 오늘의 질문
    const S1 = section("오늘의 질문","images/mirror.svg"); // mirror-like icon
    const qArea = document.createElement('textarea'); qArea.placeholder="질문이 준비되는 중입니다..."; qArea.readOnly = true;
    const ans = field("답변","textarea","질문에 대한 나의 답을 적어보세요.");
    const otherBtn = document.createElement('button'); otherBtn.className="btn line"; otherBtn.textContent="다른 질문";
    S1.root.append(qArea, otherBtn, ans.wrap);
    v.append(S1.root);
    // pick question without duplicate for the day
    const key = "usedQ:"+fmtDate(S.currentDate);
    let used = LS.get(key,[]);
    let idx = -1, tries=0;
    do{ idx=Math.floor(Math.random()*QUESTIONS.length); tries++; } while(used.includes(idx) && tries<30);
    used.push(idx); LS.set(key, used);
    qArea.value = QUESTIONS[idx];

    // 일상일기
    const S2 = section("일상일기","images/folder.svg");
    const d1 = field("","textarea","오늘의 일상을 자유롭게 남겨보세요.");
    const save1 = document.createElement('button'); save1.className="btn primary"; save1.textContent="저장";
    S2.root.append(d1.wrap, save1);
    v.append(S2.root);

    // 태그 달기
    const S3 = section("태그 달기","images/tag.svg");
    const tag = field("","#text","예) #가족, #산책 처럼 쉼표로 구분"); tag.el.type="text";
    const saveTag = document.createElement('button'); saveTag.className="btn primary"; saveTag.textContent="저장";
    S3.root.append(tag.wrap, saveTag);
    v.append(S3.root);

    // 감정일기
    const S4 = section("감정일기","images/brain.svg");
    const fEvent = field("사건","textarea","오늘 무슨 일이 있었나요?");
    const fThink = field("생각","textarea","그때 어떤 생각이 들었나요?");
    const fFeel  = field("감정","textarea","감정의 강도/이유를 함께 적어보세요.");
    const fRes   = field("결과","textarea","그래서 나는 무엇을 배웠나요?");
    const saveDaily = document.createElement('button'); saveDaily.className="btn primary"; saveDaily.textContent="저장";
    S4.root.append($('<p class="sec-desc">사건을 사실대로 적고, 그때의 생각과 감정을 구분해 본 뒤 결과를 간단히 남겨보세요.</p>'), fEvent.wrap, fThink.wrap, fFeel.wrap, fRes.wrap, saveDaily);
    v.append(S4.root);

    // Load & Save (local + cloud)
    const path = (col)=> db.collection('users').doc(S.uid||'local').collection(col).doc(fmtDate(S.currentDate));
    const load = async()=>{
      const p1 = LS.get("daily:"+fmtDate(S.currentDate), {});
      // try cloud overwrite if logged-in
      if (S.uid){
        const snap = await path('daily').get();
        if (snap.exists){ Object.assign(p1, snap.data()); }
      }
      d1.el.value = p1.journal || "";
      tag.el.value = p1.tags || "";
      fEvent.el.value = p1.event || "";
      fThink.el.value = p1.think || "";
      fFeel.el.value  = p1.feel || "";
      fRes.el.value   = p1.result || "";
    };
    const saveAll = async()=>{
      const data = {
        journal: d1.el.value, tags: tag.el.value,
        event: fEvent.el.value, think: fThink.el.value, feel: fFeel.el.value, result: fRes.el.value,
        updatedAt: Date.now()
      };
      LS.set("daily:"+fmtDate(S.currentDate), data);
      if (S.uid){ await path('daily').set(data, {merge:true}); }
      saveNotice();
    };
    save1.addEventListener('click', saveAll);
    saveTag.addEventListener('click', saveAll);
    saveDaily.addEventListener('click', saveAll);
    otherBtn.addEventListener('click', ()=>{ location.reload(); }); // simple rotate for now
    load();
  }

  // WEEKLY
  async function renderWeekly(){
    const v=$("#view"); v.innerHTML="";
    v.append(dateNav());
    // Header chips (week only once)
    const row=document.createElement('div'); row.className='row'; row.style.justifyContent='flex-end'; row.style.marginTop='-6px';
    row.append(chipBlue( weekLabel(S.currentDate) ));
    v.append(row);

    const S1=section("미션 (체크박스)","images/check.svg");
    const listWrap=document.createElement('div'); listWrap.className='row';
    const addBtn = document.createElement('button'); addBtn.className='btn line'; addBtn.textContent="+ 추가";
    const saveBtn = document.createElement('button'); saveBtn.className='btn primary'; saveBtn.textContent="저장";
    S1.root.append(listWrap, addBtn, saveBtn);
    v.append(S1.root);

    const docRef = db.collection('users').doc(S.uid||'local').collection('weekly').doc(weekLabel(S.currentDate));
    const renderList = (arr=[])=>{
      listWrap.innerHTML="";
      arr.forEach((t,i)=>{
        const item=document.createElement('div'); item.className='row';
        const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!t.done;
        const ip=document.createElement('input'); ip.type='text'; ip.value=t.text||""; ip.placeholder="미션 추가";
        const del=document.createElement('button'); del.className='btn line'; del.textContent="삭제";
        item.style.alignItems='center'; item.style.gap='10px';
        item.append(cb, ip, del);
        del.addEventListener('click',()=>{ arr.splice(i,1); renderList(arr); });
        cb.addEventListener('change',()=>{ arr[i].done=cb.checked; });
        ip.addEventListener('input',()=>{ arr[i].text=ip.value; });
        listWrap.append(item);
      });
    };
    let data=LS.get("weekly:"+weekLabel(S.currentDate), {items:[]});
    if (S.uid){ const snap = await docRef.get(); if (snap.exists) data=snap.data(); }
    renderList(data.items||[]);
    addBtn.addEventListener('click',()=>{ data.items.push({text:"",done:false}); renderList(data.items);});
    saveBtn.addEventListener('click',async()=>{
      LS.set("weekly:"+weekLabel(S.currentDate), data);
      if (S.uid){ await docRef.set(data, {merge:true}); }
      saveNotice();
    });
  }

  // SEARCH
  function renderSearch(){
    const v=$("#view"); v.innerHTML="";
    const S1 = section("검색","images/search.svg");
    const k = field("키워드","text","예) #가족 / 산책 / 감정");
    const result = document.createElement('div'); result.className='mt12';
    const go = document.createElement('button'); go.className='btn primary'; go.textContent="검색";
    S1.root.append(k.wrap, go, result);
    v.append(S1.root);
    go.addEventListener('click', ()=>{
      const key=k.el.value.trim();
      if (!key) return;
      // search local only (fast); could extend to cloud if needed
      const out=[];
      for (let i=0;i<365;i++){
        const d=new Date(); d.setDate(d.getDate()-i);
        const data = LS.get("daily:"+fmtDate(d));
        if (!data) continue;
        const hay = JSON.stringify(data);
        if (hay.includes(key)){
          out.push(`<div class="section"><div class="kicker">${fmtDate(d)}</div><div>${(data.journal||"").slice(0,120)}...</div></div>`);
        }
      }
      result.innerHTML = out.join("") || "<p class='kicker'>검색 결과 없음</p>";
    });
  }

  // SETTINGS / BACKUP
  function renderSettings(){
    const v=$("#view"); v.innerHTML="";
    const S1=section("로그인","images/lock.svg");
    const row=document.createElement('div'); row.className='row';
    const b1=document.createElement('button'); b1.className='btn line'; b1.textContent='로그인';
    const b2=document.createElement('button'); b2.className='btn line'; b2.textContent='로그아웃';
    row.append(b1,b2); S1.root.append(row, $('<p class="sec-desc">같은 계정으로 로그인하면 다른 기기에서도 데이터가 동기화됩니다.</p>'));
    v.append(S1.root);
    b1.addEventListener('click', openLoginModal);
    b2.addEventListener('click', ()=> auth.signOut());

    const S2=section("백업/복원","images/box.svg");
    const exp=document.createElement('button'); exp.className='btn primary'; exp.textContent='JSON 파일로 저장';
    const imp=document.createElement('button'); imp.className='btn line'; imp.textContent='JSON 가져오기';
    const share=document.createElement('button'); share.className='btn line'; share.textContent='JSON 공유(카톡 등)';
    const file=document.createElement('input'); file.type='file'; file.accept='application/json'; file.style.display='none';
    S2.root.append(exp, imp, share, file);
    v.append(S2.root);

    exp.addEventListener('click', ()=>{
      const dump={};
      for (let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if (k.startsWith("daily:") || k.startsWith("weekly:")) dump[k]=localStorage.getItem(k);
      }
      const blob=new Blob([JSON.stringify(dump,null,2)],{type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='thanksdiary-backup.json'; a.click();
    });
    imp.addEventListener('click', ()=> file.click());
    file.addEventListener('change', async (e)=>{
      const f=e.target.files[0]; if(!f) return;
      const txt=await f.text(); const json=JSON.parse(txt);
      Object.entries(json).forEach(([k,v])=> localStorage.setItem(k,v));
      alert("복원 완료! 새로고침 후 반영됩니다.");
    });
    share.addEventListener('click', async ()=>{
      try{
        const dump={};
        for (let i=0;i<localStorage.length;i++){
          const k=localStorage.key(i);
          if (k.startsWith("daily:") || k.startsWith("weekly:")) dump[k]=localStorage.getItem(k);
        }
        const blob=new Blob([JSON.stringify(dump)],{type:'application/json'});
        const file = new File([blob],'thanksdiary.json',{type:'application/json'});
        if (navigator.share){
          await navigator.share({ title:'지니짱 감사일기 백업', files:[file] });
        }else{
          alert("이 브라우저는 공유를 지원하지 않아요. 'JSON 파일로 저장'을 사용해주세요.");
        }
      }catch(e){ alert("공유 실패/취소"); }
    });
  }

  // AUTH UI
  function openLoginModal(){
    $("#loginModal").classList.add('show');
    $("#loginModal").setAttribute('aria-hidden','false');
  }
  $("#openLogin").addEventListener('click', openLoginModal);
  $("#closeLogin").addEventListener('click', ()=>{
    $("#loginModal").classList.remove('show');
    $("#loginModal").setAttribute('aria-hidden','true');
  });
  $$(".modal [data-close]").forEach(el=> el.addEventListener('click', ()=> $("#closeLogin").click() ));
  $("#doSignup").addEventListener('click', async ()=>{
    try{
      const email = $("#loginEmail").value.trim();
      const pass  = $("#loginPass").value.trim();
      await auth.createUserWithEmailAndPassword(email,pass);
    }catch(e){ alert(e.message); }
  });
  $("#doLogin").addEventListener('click', async ()=>{
    try{
      const email = $("#loginEmail").value.trim();
      const pass  = $("#loginPass").value.trim();
      await auth.signInWithEmailAndPassword(email,pass);
    }catch(e){ alert(e.message); }
  });

  auth.onAuthStateChanged((user)=>{
    if (user){ 
      S.uid=user.uid; S.profileEmail=user.email;
      $("#authStatus").textContent = user.email + " 로그인됨";
      $("#loginModal").classList.remove('show'); $("#loginModal").setAttribute('aria-hidden','true');
    }else{
      S.uid=null; S.profileEmail=null;
      $("#authStatus").textContent="로그아웃 상태";
    }
  });

  // Boot
  router();
})();