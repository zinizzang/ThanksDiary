
// Basic state + helpers
const $ = (s, el=document)=>el.querySelector(s);
const $$ = (s, el=document)=>[...el.querySelectorAll(s)];
const toast = (msg)=>{ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1400); };

// Tabs
$$('.tab').forEach(b=>b.addEventListener('click', e=>{
  $$('.tab').forEach(x=>x.classList.remove('active'));
  e.currentTarget.classList.add('active');
  const name = e.currentTarget.dataset.tab;
  $$('.tabpage').forEach(p=>p.classList.remove('active'));
  $('#tab-'+name).classList.add('active');
}));

// Date + week
const dateInput = $('#dateInput');
const weekBadge = $('#weekBadge');
function toDateStr(d){ return d.toISOString().slice(0,10); }
function calcWeek(d){
  // ISO week
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (tmp.getUTCDay() || 7);
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1)/7);
  return `${tmp.getUTCFullYear()} ${weekNo}주`;
}
function setToday(){
  const now = new Date();
  dateInput.value = toDateStr(now);
  weekBadge.textContent = calcWeek(now);
}
$('#btnToday').addEventListener('click', setToday);
dateInput.addEventListener('change', e=>{
  const d = new Date(e.target.value); weekBadge.textContent = calcWeek(d);
});
setToday();

// Random questions (sample)
const questions = [
  "지금의 나에게 꼭 필요한 한 마디는?",
  "오늘 나를 미소짓게 한 순간은?",
  "사람들에게 어떤 사람으로 기억되고 싶나요?",
  "올해 꼭 해보고 싶은 작은 도전은?"
];
function pickQuestion(){
  $('#qText').value = questions[Math.floor(Math.random()*questions.length)];
}
$('#btnNewQ').addEventListener('click', pickQuestion);
pickQuestion();

// Local save key helpers
function kDaily(date){ return `td:${date}` }
function kWeekly(week){ return `tw:${week}` }

// Save actions
function saveDaily(part){
  const key = kDaily(dateInput.value);
  const cur = JSON.parse(localStorage.getItem(key) || '{}');
  if(part==='question'){
    cur.question = { q: $('#qText').value, a: $('#qAnswer').value };
  }else if(part==='ttc'){
    cur.ttc = {
      event: $('#ttcEvent').value,
      thought: $('#ttcThought').value,
      feeling: $('#ttcFeeling').value,
      result: $('#ttcResult').value
    };
  }else if(part==='thanks'){
    cur.thanks = [$('#g1').value, $('#g2').value, $('#g3').value];
  }else if(part==='note'){
    cur.note = $('#dailyNote').value;
  }else if(part==='tags'){
    cur.tags = $('#tags').value;
  }
  localStorage.setItem(key, JSON.stringify(cur));
  toast('저장 완료!');
}
function clearDaily(part){
  const key = kDaily(dateInput.value);
  const cur = JSON.parse(localStorage.getItem(key) || '{}');
  if(part==='ttc'){ delete cur.ttc; $('#ttcEvent').value=$('#ttcThought').value=$('#ttcFeeling').value=$('#ttcResult').value=''; }
  if(part==='thanks'){ $('#g1').value=$('#g2').value=$('#g3').value=''; delete cur.thanks; }
  if(part==='note'){ $('#dailyNote').value=''; delete cur.note; }
  if(part==='tags'){ $('#tags').value=''; delete cur.tags; }
  localStorage.setItem(key, JSON.stringify(cur));
  toast('지웠어요');
}
$$('[data-save="question"]').forEach(b=>b.addEventListener('click',()=>saveDaily('question')));
$$('[data-save="ttc"]').forEach(b=>b.addEventListener('click',()=>saveDaily('ttc')));
$$('[data-save="thanks"]').forEach(b=>b.addEventListener('click',()=>saveDaily('thanks')));
$$('[data-save="note"]').forEach(b=>b.addEventListener('click',()=>saveDaily('note')));
$$('[data-save="tags"]').forEach(b=>b.addEventListener('click',()=>saveDaily('tags')));
$$('[data-clear="ttc"]').forEach(b=>b.addEventListener('click',()=>clearDaily('ttc')));
$$('[data-clear="thanks"]').forEach(b=>b.addEventListener('click',()=>clearDaily('thanks')));
$$('[data-clear="note"]').forEach(b=>b.addEventListener('click',()=>clearDaily('note')));
$$('[data-clear="tags"]').forEach(b=>b.addEventListener('click',()=>clearDaily('tags')));

// Load daily on date change
function loadDaily(){
  const key = kDaily(dateInput.value);
  const cur = JSON.parse(localStorage.getItem(key) || '{}');
  if(cur.question){ $('#qText').value=cur.question.q || ''; $('#qAnswer').value=cur.question.a || ''; }
  if(cur.ttc){
    $('#ttcEvent').value=cur.ttc.event||'';
    $('#ttcThought').value=cur.ttc.thought||'';
    $('#ttcFeeling').value=cur.ttc.feeling||'';
    $('#ttcResult').value=cur.ttc.result||'';
  } else { $('#ttcEvent').value=$('#ttcThought').value=$('#ttcFeeling').value=$('#ttcResult').value=''; }
  if(cur.thanks){ $('#g1').value=cur.thanks[0]||''; $('#g2').value=cur.thanks[1]||''; $('#g3').value=cur.thanks[2]||''; } else { $('#g1').value=$('#g2').value=$('#g3').value='';}
  $('#dailyNote').value = cur.note || '';
  $('#tags').value = cur.tags || '';
}
dateInput.addEventListener('change', loadDaily);
loadDaily();

// Weekly
const missionInput = $('#missionInput');
const missionList = $('#missionList');
function addMission(text, done=false){
  const li = document.createElement('li');
  li.innerHTML = `<input type="checkbox" class="chk"${done?' checked':''}> <span class="mtext"></span>
                  <button class="btn ghost del">삭제</button>`;
  li.querySelector('.mtext').textContent = text;
  li.querySelector('.del').addEventListener('click', ()=>{ li.remove(); saveWeekly(); });
  missionList.appendChild(li);
}
$('#btnAddMission').addEventListener('click', ()=>{
  const t = missionInput.value.trim(); if(!t) return;
  addMission(t, false); missionInput.value=''; saveWeekly();
});
function getWeekKey(){
  return kWeekly($('#weekBadge').textContent || 'week');
}
function saveWeekly(){
  const key = getWeekKey();
  const payload = {
    missions: [...missionList.querySelectorAll('li')].map(li=>({text: li.querySelector('.mtext').textContent, done: li.querySelector('.chk').checked})),
    healing: $('#healing').value,
    copy: $('#healingCopy').value
  };
  localStorage.setItem(key, JSON.stringify(payload));
}
$$('[data-save="missions"]').forEach(b=>b.addEventListener('click', ()=>{ saveWeekly(); toast('저장 완료!'); }));
$$('[data-save="healing"]').forEach(b=>b.addEventListener('click', ()=>{ saveWeekly(); toast('저장 완료!'); }));

function loadWeekly(){
  const cur = JSON.parse(localStorage.getItem(getWeekKey()) || '{}');
  missionList.innerHTML='';
  (cur.missions||[]).forEach(m=>addMission(m.text, m.done));
  $('#healing').value = cur.healing || '';
  $('#healingCopy').value = cur.copy || '';
}
loadWeekly();

// Search
$('#searchInput').addEventListener('input', e=>{
  const kw = e.target.value.trim(); const box = $('#searchResults'); box.innerHTML='';
  if(!kw) return;
  const cards = [];
  Object.keys(localStorage).forEach(k=>{
    if(!/^t[dw]:/.test(k)) return;
    const v = localStorage.getItem(k);
    if(v && v.includes(kw)){
      const data = JSON.parse(v);
      const el = document.createElement('div'); el.className='result';
      el.innerHTML = `<h4>${k}</h4><pre>${(JSON.stringify(data, null, 2))}</pre>`;
      cards.push(el);
    }
  });
  cards.forEach(c=>box.appendChild(c));
});

// Login modal (no Firebase key by default; modal opens)
const loginModal = $('#loginModal');
$('#btnLogin')?.addEventListener('click', ()=>loginModal.classList.remove('hide'));
$('#btnOpenLogin')?.addEventListener('click', ()=>loginModal.classList.remove('hide'));
$('#btnModalClose').addEventListener('click', ()=>loginModal.classList.add('hide'));

// Fake auth state text for now
$('#btnModalLogin').addEventListener('click', ()=>{ $('#authState').textContent='로그인됨'; loginModal.classList.add('hide'); toast('로그인 성공!'); });
$('#btnModalSignup').addEventListener('click', ()=>{ toast('회원가입 준비중'); });

// Export / Import
$('#btnExport').addEventListener('click', ()=>{
  const all = {};
  Object.keys(localStorage).forEach(k=>{ if(/^t[dw]:/.test(k)) all[k]=JSON.parse(localStorage.getItem(k)); });
  const blob = new Blob([JSON.stringify(all, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'thanks-diary-backup.json'; a.click();
  URL.revokeObjectURL(a.href);
});
$('#btnImport').addEventListener('click', ()=>{
  const f = $('#filePicker').files[0]; if(!f) return;
  const r = new FileReader(); r.onload = ()=>{
    try{
      const data = JSON.parse(r.result);
      Object.entries(data).forEach(([k,v])=>localStorage.setItem(k, JSON.stringify(v)));
      toast('가져오기 완료'); loadDaily(); loadWeekly();
    }catch(e){ toast('가져오기 실패'); }
  };
  r.readAsText(f);
});
