
(function(){'use strict';
  const app = firebase.initializeApp(window.firebaseConfig);
  const auth = firebase.auth();
  const db   = firebase.firestore();
  firebase.firestore().enablePersistence({synchronizeTabs:true}).catch(()=>{});

  const tabs = document.querySelectorAll('.tab-btn');
  const views= document.querySelectorAll('.view');
  tabs.forEach(b=> b.addEventListener('click', ()=> show(b.dataset.view)));
  function show(name){ views.forEach(v=> v.classList.toggle('active', v.id==='view-'+name)); tabs.forEach(t=> t.setAttribute('aria-selected', t.dataset.view===name)); if(name==='daily') loadDaily(); if(name==='weekly') loadWeekly(); }

  const toastEl = document.getElementById('toast');
  const toast = (t)=>{ toastEl.textContent=t; toastEl.classList.add('show'); clearTimeout(toastEl._t); toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),1300); };

  const pad=n=>('0'+n).slice(-2);
  const todayISO = ()=>{ const d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
  const weekLabel=(d)=>{ const y=d.getFullYear(), m=d.getMonth()+1; const first=new Date(d.getFullYear(),d.getMonth(),1); const w=Math.floor((d.getDate()+ first.getDay())/7)+1; return y+'년 '+m+'월 '+w+'주'; };
  const QUESTIONS=[
    "사람들에게 어떤 사람으로 기억되고 싶나요?","오늘 나를 미소 짓게 한 작은 순간은?","최근 내가 포기하지 않은 일은?",
    "오늘 감사했던 세 가지는?","요즘 가장 나를 설레게 하는 것은?","내가 바라는 내일의 작은 변화는?",
    "최근 배운 소소한 교훈은?","오늘 챙겨준 내 마음은 어디인가요?","지금 내게 가장 필요한 쉼은 무엇일까?"
  ];
  const pickQuestion=(iso,spin)=> spin? QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)] : QUESTIONS[(parseInt(iso.replace(/-/g,''))||0)%QUESTIONS.length];
  const HEALING=["부러움 대신 배움을 고르면 마음이 한결 가벼워진다.","작은 꾸준함이 큰 변화를 만든다.","마음은 돌보는 만큼 단단해진다.","느리게 가도, 멈추지만 않기."];
  const msg=(e)=>{ const m=String(e&&e.message||e); if(m.includes('invalid-credential')) return '이메일/비밀번호를 확인해 주세요'; return m; };
  const me=()=>{ const u=auth.currentUser; if(!u) throw new Error('로그인 필요'); return u; };
  const userDoc=()=> db.collection('users').doc(me().uid);

  // Auth
  const emailEl=document.getElementById('email'), passEl=document.getElementById('password'), authState=document.getElementById('authState');
  document.getElementById('btnLogin').onclick=async()=>{try{await auth.signInWithEmailAndPassword(emailEl.value.trim(),passEl.value);toast('로그인 성공');}catch(e){toast(msg(e));}};
  document.getElementById('btnSignup').onclick=async()=>{try{await auth.createUserWithEmailAndPassword(emailEl.value.trim(),passEl.value);toast('가입 완료');}catch(e){toast(msg(e));}};
  document.getElementById('btnLogout').onclick=async()=>{await auth.signOut();toast('로그아웃');};
  auth.onAuthStateChanged(u=>{authState.textContent=u?(u.email+' 로그인됨'):'로그아웃 상태';});

  // Daily
  const dailyDate=document.getElementById('dailyDate'); const btnToday=document.getElementById('btnToday');
  const qBox=document.getElementById('questionText'); const ans=document.getElementById('answer');
  const evEvent=document.getElementById('ev-event'); const evThought=document.getElementById('ev-thought'); const evEmotion=document.getElementById('ev-emotion'); const evResult=document.getElementById('ev-result');
  const thx1=document.getElementById('thx1'), thx2=document.getElementById('thx2'), thx3=document.getElementById('thx3');
  const dailyNote=document.getElementById('dailyNote'); const tags=document.getElementById('tags');
  document.getElementById('btnRandQ').onclick=()=> qBox.textContent=pickQuestion(dailyDate.value||todayISO(),true);
  ['btnSaveQA','btnSaveEmotion','btnSaveThanks','btnSaveNote','btnSaveTags'].forEach(id=> document.getElementById(id).onclick=saveDaily);
  dailyDate.addEventListener('change', loadDaily);
  btnToday.addEventListener('click', ()=>{ dailyDate.value=todayISO(); loadDaily(); });
  function dailyRef(){ return userDoc().collection('daily').doc(dailyDate.value||todayISO()); }
  async function loadDaily(){
    const iso=dailyDate.value || todayISO(); dailyDate.value=iso; qBox.textContent=pickQuestion(iso);
    if(!auth.currentUser) return;
    const s=await dailyRef().get(); const v=s.exists?s.data():{};
    qBox.textContent=v.question||qBox.textContent; ans.value=v.answer||'';
    evEvent.value=v.evEvent||''; evThought.value=v.evThought||''; evEmotion.value=v.evEmotion||''; evResult.value=v.evResult||'';
    thx1.value=v.thx1||''; thx2.value=v.thx2||''; thx3.value=v.thx3||''; dailyNote.value=v.dailyNote||''; tags.value=(v.tags||[]).join(', ');
  }
  async function saveDaily(){
    if(!auth.currentUser) return toast('로그인 후 저장됩니다.');
    const patch={question:qBox.textContent,answer:ans.value,evEvent:evEvent.value,evThought:evThought.value,evEmotion:evEmotion.value,evResult:evResult.value,thx1:thx1.value,thx2:thx2.value,thx3:thx3.value,dailyNote:dailyNote.value,tags:tags.value.split(/[#,\s]+/).map(s=>s.trim()).filter(Boolean),updatedAt:Date.now()};
    await dailyRef().set(patch,{merge:true}); toast('저장 완료');
  }

  // Weekly
  const weekLabelEl=document.getElementById('weekLabel'); let weekBase=new Date();
  document.getElementById('btnWeekPrev').onclick=()=>{ weekBase.setDate(weekBase.getDate()-7); loadWeekly(); };
  document.getElementById('btnWeekNext').onclick=()=>{ weekBase.setDate(weekBase.getDate()+7); loadWeekly(); };
  document.getElementById('btnAddMission').onclick=()=> addMission();
  document.getElementById('btnSaveMissions').onclick=()=> saveWeek();
  document.getElementById('btnNextHealing').onclick=()=> setHealing(true);
  document.getElementById('btnSaveHealing').onclick=()=> saveWeek();
  function weekRef(){ return userDoc().collection('weekly').doc(weekLabel(weekBase)); }
  function addMission(text='',done=false){ const list=document.getElementById('missionList'); const row=document.createElement('div'); row.className='mission-item'; const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!done; const ip=document.createElement('input'); ip.type='text'; ip.value=text; ip.placeholder='미션'; const del=document.createElement('button'); del.className='btn ghost'; del.textContent='삭제'; del.onclick=()=>row.remove(); row.append(cb,ip,del); list.append(row); }
  function setHealing(next){ const el=document.getElementById('healingText'); if(next) el.textContent=HEALING[Math.floor(Math.random()*HEALING.length)]; if(!el.textContent) el.textContent=HEALING[Date.now()%HEALING.length]; }
  async function loadWeekly(){ weekLabelEl.textContent=weekLabel(weekBase); setHealing(false); const list=document.getElementById('missionList'); list.innerHTML=''; if(!auth.currentUser) return; const s=await weekRef().get(); const v=s.exists?s.data():{items:[],copy:''}; (v.items||[]).forEach(it=> addMission(it.text,it.done)); document.getElementById('healingCopy').value=v.copy||''; }
  async function saveWeek(){ if(!auth.currentUser) return toast('로그인 후 저장됩니다.'); const items=Array.from(document.querySelectorAll('#missionList .mission-item')).map(x=>({done:x.querySelector('input[type=checkbox]').checked,text:x.querySelector('input[type=text]').value.trim()})).filter(x=>x.text); await weekRef().set({items,quote:document.getElementById('healingText').textContent,copy:document.getElementById('healingCopy').value,updatedAt:Date.now()},{merge:true}); toast('저장 완료'); }

  // Search
  document.getElementById('btnSearch').onclick=async()=>{ const term=(document.getElementById('searchInput').value||'').trim(); const out=document.getElementById('searchResults'); out.innerHTML=''; if(!term) return; if(!auth.currentUser) return out.innerHTML='<li class="hint">로그인 후 검색 가능합니다.</li>'; const daily=(await userDoc().collection('daily').orderBy('updatedAt','desc').limit(500).get()).docs; let hits=0; daily.forEach(d=>{ const v=d.data(); const hay=(v.answer||'')+' '+(v.dailyNote||'')+' '+(v.evEvent||'')+' '+(v.evThought||'')+' '+(v.evEmotion||'')+' '+(v.evResult||'')+' '+(v.tags||[]).join(' '); if(hay.includes(term)){ const li=document.createElement('li'); li.innerHTML='<strong>'+(v.date||d.id)+'</strong><div>'+((v.dailyNote||v.answer||'').slice(0,120))+'</div>'; out.append(li); hits++; } }); if(!hits) out.innerHTML='<li class="hint">결과 없음</li>'; };

  // Backup/Restore/Share
  document.getElementById('btnExport').onclick=async()=>{ if(!auth.currentUser) return toast('로그인 후 이용하세요'); const data={ daily:(await userDoc().collection('daily').get()).docs.map(d=>{const v=d.data(); v.id=d.id; return v;}), weekly:(await userDoc().collection('weekly').get()).docs.map(d=>{const v=d.data(); v.id=d.id; return v;}) }; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='thanks-diary-backup.json'; a.click(); };
  document.getElementById('fileImport').addEventListener('change', async (e)=>{ if(!auth.currentUser) return toast('로그인 후 이용하세요'); const file=e.target.files[0]; if(!file) return; const txt=await file.text(); const data=JSON.parse(txt||'{}'); const batch=db.batch(); (data.daily||[]).forEach(x=> batch.set(userDoc().collection('daily').doc(x.id||x.date||'unknown'), x, {merge:true})); (data.weekly||[]).forEach(x=> batch.set(userDoc().collection('weekly').doc(x.id||'unknown'), x, {merge:true})); await batch.commit(); toast('복원 완료'); });
  document.getElementById('btnShare').onclick=async()=>{ try{ if(navigator.share){ await navigator.share({title:'지니짱 감사일기', text:'나의 감사일기 백업 파일', url: location.href}); } else toast('이 브라우저는 공유 기능을 지원하지 않아요'); }catch(e){ toast('공유 취소'); } };
  document.getElementById('btnClearLocal').onclick=async()=>{ try{ if('caches' in window){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } localStorage.clear(); }catch(e){} location.reload(); };

  document.getElementById('dailyDate').value=todayISO(); show('daily');
})();