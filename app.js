
/* === Firebase (사용자 config로 교체) === */
const firebaseConfig = window.FB_CONFIG || {
  apiKey: "AIzaSyAOqrdA0aHL5lMXOOmdtj8mnLi6zgSXoiM",
  authDomain: "thanksdiary-dca35.firebaseapp.com",
  projectId: "thanksdiary-dca35",
  storageBucket: "thanksdiary-dca35.firebasestorage.app",
  messagingSenderId: "250477396044",
  appId: "1:250477396044:web:aa1cf155f01263e08834e9"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* === 라우터 === */
const view = document.getElementById('view');
const routes = {
  '#/daily': renderDaily,
  '#/weekly': renderWeekly,
  '#/search': renderSearch,
  '#/settings': renderSettings,
};
window.addEventListener('hashchange', render);
window.addEventListener('load', ()=>{
  if(!location.hash) location.hash = '#/daily';
  render();
});
function render(){
  const r = routes[location.hash] || renderDaily;
  r();
  updateAuthStrip();
}

/* === 유틸 === */
const fmt = {
  ymd: (d)=> d.toISOString().slice(0,10),
  ko: (d)=> `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`,
  weekLabel: (d)=> {
    // ISO week
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(),0,4));
    const weekNum = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay()+6)%7)) / 7);
    return `\u00A0${d.getFullYear()}년 ${weekNum}번째 주`;
  },
  monthWeekLabel: (d)=>{
    // 월 기준 몇번째 주
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const nth = Math.ceil((d.getDate() + first.getDay())/7);
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${nth}주`;
  }
};

function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') n.className = v;
    else if(k==='html') n.innerHTML = v;
    else n.setAttribute(k,v);
  });
  for(const c of children) n.append(c);
  return n;
}
async function saveToast(msg='저장 완료!'){
  alert(msg);
}

/* === 로그인 모달 === */
const loginModal = document.getElementById('loginModal');
document.getElementById('btnLogin').onclick = ()=> loginModal.showModal();
document.getElementById('closeLogin').onclick = ()=> loginModal.close();
document.getElementById('doSignup').onclick = async (e)=>{
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  try{
    await auth.createUserWithEmailAndPassword(email,pass);
    document.getElementById('loginMsg').textContent = '가입 성공!';
  }catch(err){
    document.getElementById('loginMsg').textContent = err.message;
  }
}
document.getElementById('doLogin').onclick = async (e)=>{
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  try{
    await auth.signInWithEmailAndPassword(email,pass);
    document.getElementById('loginMsg').textContent = '로그인 성공!';
    setTimeout(()=>loginModal.close(), 400);
    updateAuthStrip();
  }catch(err){
    document.getElementById('loginMsg').textContent = err.message;
  }
}
auth.onAuthStateChanged(()=> updateAuthStrip());
function updateAuthStrip(){
  const u = auth.currentUser;
  document.getElementById('authState').textContent = u? (u.email+' 로그인됨') : '로그아웃 상태';
}

/* === Firestore helpers === */
function colUser(path){ // users/{uid}/{path}
  const u = auth.currentUser;
  if(!u) return null;
  return db.collection('users').doc(u.uid).collection(path);
}
async function getDocById(path, id){
  const c = colUser(path); if(!c) return null;
  const ref = c.doc(id);
  const s = await ref.get();
  return s.exists ? s.data() : null;
}
async function setDocById(path, id, data){
  const c = colUser(path); if(!c) throw new Error('로그인이 필요합니다');
  await c.doc(id).set(data, {merge:true});
}

/* === 오늘의 질문 풀 === */
const questions = [
  "사람들에게 어떤 사람으로 기억되고 싶나요?",
  "오늘 나를 웃게 만든 작은 순간은 무엇이었나요?",
  "최근 배운 것 중 곧바로 써먹을 수 있는 건?",
  "지금의 나에게 가장 고마운 사람은 누구인가요?",
  "이번 주에 꼭 지키고 싶은 약속은 무엇인가요?",
  "요즘 나를 설레게 하는 건 무엇인가요?",
  "내가 잘하고 있는 한 가지를 적어보세요.",
  "오늘 놓아도 되는 걱정은 무엇일까요?",
  "올해의 나에게 해주고 싶은 말은?",
  "지금 여기에서 감사할 세 가지는?"
];
function pickQuestion(key){
  // key(YYYY-MM-DD) 기준으로 안정적인 선택
  const idx = (Array.from(key).reduce((a,ch)=>a+ch.charCodeAt(0),0)) % questions.length;
  return questions[idx];
}

/* === DAILY === */
async function renderDaily(){
  const today = new Date();
  const ymd = fmt.ymd(today);

  const wrap = el('div');
  // 날짜/오늘버튼
  const bar = el('div',{class:'weekbar'},
    el('button',{class:'btn sm','id':'prevDay'},'<'),
    el('button',{class:'btn sm','id':'nextDay'},'>'),
    el('span',{class:'badge datepill',id:'datePill'}, fmt.ko(today))
  );
  wrap.append(el('div',{class:'section'}, el('div',{class:'row'}, bar)));

  // 오늘의 질문
  const question = pickQuestion(ymd);
  const secQ = el('section',{class:'section'},
    el('h3',{}, '🪞 오늘의 질문'),
    el('div',{class:'card small'}, question),
    el('label',{}, '답변', el('textarea',{id:'qAnswer',rows:'5',placeholder:'질문에 대한 나의 답을 적어보세요.'})),
    el('div',{class:'btn-row'},
      el('button',{class:'btn',id:'btnSaveQ'},'저장'),
      el('button',{class:'btn ghost',id:'btnOtherQ'},'다른 질문')
    )
  );
  wrap.append(secQ);

  // 감정일기
  const secE = el('section',{class:'section'},
    el('h3',{}, '🧠 감정일기'),
    el('p',{class:'small'}, '사건을 사실대로 적고, 그때의 생각과 감정을 나눠 적어보세요.'),
    el('label',{}, '사건', el('input',{type:'text',id:'eEvent',class:'input',placeholder:'오늘 무슨 일이 있었나요?'})),
    el('label',{}, '생각', el('textarea',{id:'eThought',rows:'3'})),
    el('label',{}, '감정', el('textarea',{id:'eFeeling',rows:'3'})),
    el('label',{}, '결과', el('textarea',{id:'eResult',rows:'3'})),
    el('div',{class:'btn-row'}, el('button',{class:'btn',id:'btnSaveE'},'저장'))
  );
  wrap.append(secE);

  // 감사일기 (3개)
  const secG = el('section',{class:'section'},
    el('h3',{}, '💛 감사일기'),
    el('div',{}, el('input',{id:'g1',class:'input',placeholder:'감사한 일 1'})),
    el('div',{}, el('input',{id:'g2',class:'input',placeholder:'감사한 일 2'})),
    el('div',{}, el('input',{id:'g3',class:'input',placeholder:'감사한 일 3'})),
    el('div',{class:'btn-row'}, el('button',{class:'btn',id:'btnSaveG'},'저장'))
  );
  wrap.append(secG);

  // 일상일기
  const secD = el('section',{class:'section'},
    el('h3',{}, '📔 일상일기'),
    el('textarea',{id:'dailyNote',rows:'5',placeholder:'오늘의 일상을 자유롭게 남겨보세요.'}),
    el('div',{class:'btn-row'}, el('button',{class:'btn',id:'btnSaveD'},'저장'))
  );
  wrap.append(secD);

  // 태그
  const secT = el('section',{class:'section'},
    el('h3',{}, '🏷️ 태그 달기'),
    el('input',{id:'tags',class:'input',placeholder:'#가족, #산책 처럼 쉼표로 구분'}),
    el('div',{class:'btn-row'}, el('button',{class:'btn',id:'btnSaveT'},'저장'))
  );
  wrap.append(secT);

  view.replaceChildren(wrap);

  // 데이터 로드
  auth.onAuthStateChanged(async (u)=>{
    if(!u) return;
    const data = await getDocById('daily', ymd) || {};
    document.getElementById('qAnswer').value = data.qAnswer||'';
    document.getElementById('eEvent').value = data.eEvent||'';
    document.getElementById('eThought').value = data.eThought||'';
    document.getElementById('eFeeling').value = data.eFeeling||'';
    document.getElementById('eResult').value = data.eResult||'';
    document.getElementById('g1').value = (data.gratitude||[])[0]||'';
    document.getElementById('g2').value = (data.gratitude||[])[1]||'';
    document.getElementById('g3').value = (data.gratitude||[])[2]||'';
    document.getElementById('dailyNote').value = data.dailyNote||'';
    document.getElementById('tags').value = (data.tags||[]).join(', ');
  });

  // 저장 핸들러
  document.getElementById('btnSaveQ').onclick = async ()=>{
    await setDocById('daily', ymd, {qAnswer: document.getElementById('qAnswer').value, question});
    saveToast('질문/답변 저장 완료!');
  };
  document.getElementById('btnOtherQ').onclick = ()=>{
    // 다음 질문 (랜덤). 중복 최소화
    const i = Math.floor(Math.random()*questions.length);
    const q = questions[i];
    secQ.querySelector('.card').textContent = q;
  };
  document.getElementById('btnSaveE').onclick = async ()=>{
    await setDocById('daily', ymd, {
      eEvent: eEvent.value, eThought: eThought.value, eFeeling: eFeeling.value, eResult: eResult.value
    });
    saveToast();
  };
  document.getElementById('btnSaveG').onclick = async ()=>{
    await setDocById('daily', ymd, {gratitude:[g1.value,g2.value,g3.value]});
    saveToast();
  };
  document.getElementById('btnSaveD').onclick = async ()=>{
    await setDocById('daily', ymd, {dailyNote: dailyNote.value});
    saveToast();
  };
  document.getElementById('btnSaveT').onclick = async ()=>{
    const tags = document.getElementById('tags').value.split(',').map(s=>s.trim()).filter(Boolean);
    await setDocById('daily', ymd, {tags});
    saveToast('태그 저장 완료!');
  };
}

/* === WEEKLY === */
async function renderWeekly(){
  const d = new Date();
  const wrap = el('div');
  const weekRow = el('div',{class:'weekbar'},
    el('button',{class:'btn sm','id':'wPrev'},'<'),
    el('button',{class:'btn sm','id':'wNext'},'>'),
    el('span',{class:'badge datepill',id:'wWeek'}, fmt.weekLabel(d)),
    el('span',{class:'badge',id:'wMonthWeek'}, fmt.monthWeekLabel(d))
  );
  wrap.append(el('section',{class:'section'}, el('h3',{},'📅 주차'), weekRow));

  // 미션
  const missionsBox = el('section',{class:'section'},
    el('h3',{},'✅ 미션 (체크박스)'),
    el('div',{class:'mission-line'},
      el('input',{id:'newMission',class:'input',placeholder:'미션 추가'}),
      el('button',{id:'addMission',class:'btn mission-add'},'+ 추가')
    ),
    el('div',{id:'missionList',class:'vstack',style:'margin-top:8px;display:grid;gap:8px;'})
  );
  wrap.append(missionsBox);

  // 힐링문구 + 필사
  const heal = el('section',{class:'section'},
    el('h3',{},'🫶 오늘의 문구'),
    el('textarea',{id:'healText',rows:'3',placeholder:'오늘의 문구'}),
    el('div',{class:'btn-row'},
      el('button',{class:'btn',id:'healRandom'},'랜덤'),
      el('button',{class:'btn',id:'healSave'},'저장'),
      el('button',{class:'btn',id:'healCopy'},'필사 시작')
    ),
  );
  wrap.append(heal);

  view.replaceChildren(wrap);

  const heals = [
    "부러움 대신 배움을 고르면 마음이 한결 가벼워진다.",
    "어제의 나보다 한 걸음만 더 가보자.",
    "작은 친절이 큰 하루를 만든다.",
    "멈춰 서는 것도 전진을 위한 준비다.",
    "나에게도 충분히 따뜻해지자."
  ];
  healRandom.onclick = ()=>{
    healText.value = heals[Math.floor(Math.random()*heals.length)];
  };
  healCopy.onclick = ()=>{
    healText.select(); document.execCommand('copy');
    alert('문구를 복사했어요. 메모앱에서 필사해보세요!');
  };
  healSave.onclick = async ()=>{
    const id = fmt.ymd(new Date());
    await setDocById('weekly', id, {heal: healText.value});
    saveToast('힐링문구 저장!');
  };

  // 미션 동작
  function addMissionItem(text, done=false){
    const row = el('div',{class:'row card',style:'padding:10px;align-items:center;gap:10px;'},
      el('input',{type:'checkbox',class:'ck'}),
      el('input',{type:'text',class:'input mtext'}),
      el('button',{class:'btn ghost del'},'삭제')
    );
    row.querySelector('.ck').checked = done;
    row.querySelector('.mtext').value = text||'';
    row.querySelector('.del').onclick = ()=>{
      row.remove(); persist();
    };
    row.querySelector('.ck').onchange = persist;
    row.querySelector('.mtext').onchange = persist;
    missionList.append(row);
  }
  async function persist(){
    const all = Array.from(document.querySelectorAll('#missionList .card')).map(r=>({
      text: r.querySelector('.mtext').value.trim(),
      done: r.querySelector('.ck').checked
    }));
    const id = fmt.ymd(new Date());
    await setDocById('weekly', id, {missions: all});
  }
  addMission.onclick = ()=>{
    addMissionItem(''); persist();
  };

  // 로드
  auth.onAuthStateChanged(async (u)=>{
    if(!u) return;
    const id = fmt.ymd(new Date());
    const data = await getDocById('weekly', id) || {};
    (data.missions||[]).forEach(m=> addMissionItem(m.text, m.done));
    if(data.heal) healText.value = data.heal;
  });
}

/* === SEARCH === */
async function renderSearch(){
  const wrap = el('div');
  const q = el('input',{id:'q',class:'input',placeholder:'키워드/태그로 검색'});
  const btn = el('button',{class:'btn'},'검색');
  const list = el('div',{style:'display:grid;gap:8px;margin-top:10px;'});
  wrap.append(el('section',{class:'section'},
    el('h3',{},'🔎 검색'),
    el('div',{class:'row'}, q, btn),
    list
  ));
  view.replaceChildren(wrap);
  btn.onclick = async ()=>{
    const u = auth.currentUser; if(!u) return alert('로그인 필요');
    const term = q.value.trim();
    if(!term) return;
    list.replaceChildren();
    // 간단: 최근 60일 daily 스캔
    const coll = colUser('daily');
    const snap = await coll.orderBy(firebase.firestore.FieldPath.documentId(),"desc").limit(120).get();
    snap.forEach(doc=>{
      const data = doc.data();
      const hay = [data.qAnswer, data.dailyNote, ...(data.gratitude||[]), data.eEvent, data.eThought, data.eFeeling, data.eResult, ...(data.tags||[])].join(' ');
      if(hay.includes(term)){
        list.append(el('div',{class:'card'}, el('div',{class:'small'},doc.id), el('div',{}, hay.slice(0,140)+'…')));
      }
    });
  };
}

/* === SETTINGS === */
async function renderSettings(){
  const wrap = el('div');
  const shareBtn = el('button',{class:'btn'},'카톡/공유로 내보내기');
  const importBtn = el('button',{class:'btn'},'JSON 가져오기(파일)');
  const kakaoBtn = el('button',{class:'btn'},'카톡 불러오기(붙여넣기)');
  wrap.append(el('section',{class:'section'},
    el('h3',{},'백업/복원'),
    el('div',{class:'btn-row'}, shareBtn, importBtn, kakaoBtn),
    el('p',{class:'small'}, 'iOS Safari는 Web Share 지원. 파일 복원은 JSON 선택.')
  ));
  view.replaceChildren(wrap);

  // Export
  shareBtn.onclick = async ()=>{
    const u = auth.currentUser; if(!u) return alert('로그인 필요');
    // export last 120 days daily + weekly
    const dailySnap = await colUser('daily').limit(500).get();
    const weeklySnap = await colUser('weekly').limit(500).get();
    const data = {daily:{}, weekly:{}};
    dailySnap.forEach(d=> data.daily[d.id]=d.data());
    weeklySnap.forEach(d=> data.weekly[d.id]=d.data());
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const file = new File([blob],'thanks-diary-backup.json',{type:'application/json'});
    if(navigator.share){
      navigator.share({title:'지니짱 감사일기 백업', files:[file]}).catch(()=>{});
    }else{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');a.href=url;a.download=file.name;a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Import file
  importBtn.onclick = ()=>{
    const inp = document.createElement('input'); inp.type='file'; inp.accept='application/json';
    inp.onchange = async ()=>{
      const file = inp.files[0]; if(!file) return;
      const txt = await file.text();
      const data = JSON.parse(txt);
      const batch = db.batch();
      const u = auth.currentUser; if(!u) return alert('로그인 필요');
      for(const [id, val] of Object.entries(data.daily||{})){
        batch.set(db.collection('users').doc(u.uid).collection('daily').doc(id), val, {merge:true});
      }
      for(const [id, val] of Object.entries(data.weekly||{})){
        batch.set(db.collection('users').doc(u.uid).collection('weekly').doc(id), val, {merge:true});
      }
      await batch.commit();
      alert('복원 완료!');
    };
    inp.click();
  };

  kakaoBtn.onclick = ()=>{
    document.getElementById('kakaoModal').showModal();
  };
  document.getElementById('kakaoImport').onclick = async (e)=>{
    e.preventDefault();
    const txt = document.getElementById('kakaoPaste').value.trim();
    if(!txt) return;
    const id = fmt.ymd(new Date());
    await setDocById('weekly', id, {heal: txt});
    document.getElementById('kakaoModal').close();
    alert('붙여넣은 문구를 저장했어요.');
  };
}
