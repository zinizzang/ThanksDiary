// Simple state by date/week in localStorage
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const todayStr = () => new Date().toISOString().slice(0,10);
const weekOf = (d)=>{
  const dt = new Date(d);
  const first = new Date(dt.getFullYear(),0,1);
  const day = Math.round(((dt - first)/86400000 + first.getDay()+6)/7);
  return `${dt.getFullYear()}-W${String(day).padStart(2,'0')}`;
};
const key = (scope, id) => `td:${scope}:${id}`;

const toast = (msg='저장 완료!') => {
  const t = $("#toast"); t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1300);
};

// Tabs
$$('.tab').forEach(btn=>btn.addEventListener('click', e=>{
  $$('.tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const id = btn.dataset.tab;
  $$('.view').forEach(v=>v.classList.remove('active'));
  $(`#view-${id}`).classList.add('active');
}));

// Date
const dateInput = $('#dateInput');
dateInput.value = todayStr();
$('#btnToday').onclick = () => { dateInput.value = todayStr(); renderDaily(); };

function renderDaily(){
  const d = dateInput.value;
  $('#weekLabel').textContent = weekOf(d);
  // load daily data
  const q = JSON.parse(localStorage.getItem(key('q', d)) || '{}');
  $('#qText').value = q.text || '';
  $('#qAnswer').value = q.answer || '';

  const e = JSON.parse(localStorage.getItem(key('e', d)) || '{}');
  $('#eEvent').value = e.ev || ''; $('#eThought').value = e.th || '';
  $('#eFeeling').value = e.fe || ''; $('#eResult').value = e.re || '';

  const g = JSON.parse(localStorage.getItem(key('g', d)) || '{}');
  $('#g1').value = g.g1 || ''; $('#g2').value = g.g2 || ''; $('#g3').value = g.g3 || '';

  $('#dailyNote').value = localStorage.getItem(key('note', d)) || '';
  $('#tags').value = localStorage.getItem(key('tags', d)) || '';
}
renderDaily();

// Daily saves
$('#btnSaveQ').onclick = () => {
  const d = dateInput.value;
  localStorage.setItem(key('q', d), JSON.stringify({text:$('#qText').value, answer:$('#qAnswer').value}));
  toast();
};
$('#btnClearQ').onclick = () => { $('#qText').value=''; $('#qAnswer').value=''; };
const QUESTIONS = [
  '오늘의 나는 어제의 나와 무엇이 달랐나요?',
  '사람들에게 어떤 사람으로 기억되고 싶나요?',
  '지금의 나에게 꼭 필요한 한 마디는?',
  '오늘 가장 고마웠던 순간은 언제였나요?'
];
$('#btnRandomQ').onclick = () => {
  const q = QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];
  $('#qText').value = q;
};

$('#btnSaveEmotion').onclick = () => {
  const d = dateInput.value;
  localStorage.setItem(key('e', d), JSON.stringify({
    ev:$('#eEvent').value, th:$('#eThought').value, fe:$('#eFeeling').value, re:$('#eResult').value
  }));
  toast();
};
$('#btnClearEmotion').onclick = () => { ['#eEvent','#eThought','#eFeeling','#eResult'].forEach(s=>$(s).value=''); };

$('#btnSaveThanks').onclick = () => {
  const d = dateInput.value;
  localStorage.setItem(key('g', d), JSON.stringify({g1:$('#g1').value,g2:$('#g2').value,g3:$('#g3').value}));
  toast();
};
$('#btnClearThanks').onclick = () => { ['#g1','#g2','#g3'].forEach(s=>$(s).value=''); };

$('#btnSaveDaily').onclick = () => { localStorage.setItem(key('note', dateInput.value), $('#dailyNote').value); toast(); };
$('#btnSaveTags').onclick = () => { localStorage.setItem(key('tags', dateInput.value), $('#tags').value); toast(); };

// Weekly
function renderWeekly(){
  const w = weekOf(dateInput.value);
  const ms = JSON.parse(localStorage.getItem(key('missions', w)) || '[]');
  const wrap = $('#missionList'); wrap.innerHTML='';
  ms.forEach((m,i)=>{
    const line = document.createElement('label');
    line.className = 'row';
    line.innerHTML = `<input type="checkbox" data-idx="${i}" ${m.done?'checked':''}> <span class="input" contenteditable="true">${m.text}</span>`;
    wrap.appendChild(line);
  });
}
renderWeekly();

$('#btnAddMission').onclick = () => {
  const txt = $('#newMission').value.trim();
  if(!txt) return;
  const w = weekOf(dateInput.value);
  const ms = JSON.parse(localStorage.getItem(key('missions', w)) || '[]');
  ms.push({text:txt, done:false});
  localStorage.setItem(key('missions', w), JSON.stringify(ms));
  $('#newMission').value=''; renderWeekly(); toast('추가되었습니다!');
};

$('#btnSaveMissions').onclick = () => {
  const w = weekOf(dateInput.value);
  const lines = Array.from(document.querySelectorAll('#missionList label'));
  const ms = lines.map((l,i)=>({text:l.querySelector('span').textContent.trim(), done:l.querySelector('input').checked}));
  localStorage.setItem(key('missions', w), JSON.stringify(ms)); toast();
};
$('#btnClearMissions').onclick = () => {
  const w = weekOf(dateInput.value); localStorage.removeItem(key('missions', w)); renderWeekly();
};

$('#btnSaveHealing').onclick = () => {
  const w = weekOf(dateInput.value);
  localStorage.setItem(key('healing', w), $('#healing').value);
  localStorage.setItem(key('copy', w), $('#copy').value);
  toast();
};

// Search
$('#searchInput').addEventListener('input', e=>{
  const q = e.target.value.trim(); const box = $('#searchResults'); box.innerHTML='';
  if(!q) return;
  // simple scan over localStorage
  Object.keys(localStorage).filter(k=>k.startsWith('td:')).forEach(k=>{
    const v = localStorage.getItem(k);
    if(v && v.toLowerCase().includes(q.toLowerCase())){
      const card = document.createElement('div'); card.className = 'result';
      card.innerHTML = `<div class="ttl">${k.replace('td:','')}</div><div>${v.replace(/</g,'&lt;')}</div>`;
      box.appendChild(card);
    }
  });
});

// Settings: fake login modal
const modal = $('#loginModal');
$('#openLogin').onclick = ()=> modal.classList.remove('hidden');
$('#loginCancel').onclick = ()=> modal.classList.add('hidden');
$('#loginOk').onclick = ()=> { modal.classList.add('hidden'); toast('로그인 성공(데모)'); };

// When date changes, rerender both
dateInput.addEventListener('change', ()=>{ renderDaily(); renderWeekly(); });
