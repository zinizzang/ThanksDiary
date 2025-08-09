
// State keys
const storeKey = 'ttc-journal-v139';
// Routing
const routes = {
  '#/daily': renderDaily,
  '#/weekly': renderWeekly,
  '#/search': renderSearch,
  '#/settings': renderSettings
};
function setActiveTab(){
  document.querySelectorAll('.tab-btn').forEach(a=>a.classList.toggle('active', a.getAttribute('href')===location.hash));
}
window.addEventListener('hashchange', ()=>{ route(); });
function route(){
  const h = location.hash || '#/daily';
  const fn = routes[h] || renderDaily;
  fn();
  setActiveTab();
}
document.addEventListener('DOMContentLoaded', ()=>{
  if(!location.hash) location.hash = '#/daily';
  route();
});

// Storage helpers
function loadAll(){
  try{ return JSON.parse(localStorage.getItem(storeKey)) || {daily:{},weekly:{}}; }catch{ return {daily:{},weekly:{}}; }
}
function saveAll(d){ localStorage.setItem(storeKey, JSON.stringify(d)); }
function ymd(d){
  const t = new Date(d); const tz = t.getTimezoneOffset()*60000;
  return new Date(t - tz).toISOString().slice(0,10);
}
function weekId(date){
  const d = new Date(date);
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay()+6)%7;
  target.setUTCDate(target.getUTCDate()-dayNr+3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(),0,4));
  const weekNo = 1 + Math.round(((target-firstThursday)/86400000 - 3 + ((firstThursday.getUTCDay()+6)%7))/7);
  const year = target.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2,'0')}`;
}
function parseTags(s){ if(!s) return []; return s.split(',').map(t=>t.trim()).filter(Boolean).map(t=>t[0]==='#'?t:'#'+t); }

// Components
function autoResize(el){
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
function renderDaily(){
  const v = document.getElementById('view');
  const today = ymd(new Date());
  const data = loadAll();
  const d = data.daily[today] || {};
  v.innerHTML = `
    <section class="page" id="daily">
      <div class="date-row">
        <input type="date" id="dailyDate" value="${today}">
        <button id="todayBtn" class="btn soft small">오늘</button>
      </div>

      <div class="card">
        <h2>🔎 오늘의 질문</h2>
        <div class="btn-row">
          <textarea id="qText" class="auto" placeholder="오늘의 질문이 여기에 표시됩니다."></textarea>
          <button id="newQ" class="btn small">다른 질문</button>
        </div>
        <textarea id="qAnswer" class="auto section-gap" placeholder="질문에 대한 나의 답을 적어보세요."></textarea>
      </div>

      <div class="card">
        <h2>🧠 감정일기</h2>
        <p class="muted">사건을 사실대로 적고, 그때의 생각과 감정을 구분해 본 뒤 결과를 간단히 남겨보세요.</p>
        <label class="lbl">사건</label>
        <textarea id="eventField" class="auto" placeholder="오늘 무슨 일이 있었나요?"></textarea>
        <label class="lbl">생각</label>
        <textarea id="thoughtField" class="auto" placeholder="그때 어떤 생각이 들었나요?"></textarea>
        <label class="lbl">감정</label>
        <textarea id="feelingField" class="auto" placeholder="감정의 강도/이유를 함께 적어보세요."></textarea>
        <label class="lbl">결과</label>
        <textarea id="resultField" class="auto" placeholder="그 결과 나는 어떻게 행동했나요?"></textarea>
      </div>

      <div class="card">
        <h2>🌼 감사일기 (3개)</h2>
        <div class="gratitude-list">
          <input type="text" id="grat1" placeholder="작은 것도 좋아요."><br class="section-gap">
          <input type="text" id="grat2" placeholder="사람/행동/행운 등 무엇이든."><br class="section-gap">
          <input type="text" id="grat3" placeholder="오늘을 좋게 만든 것.">
        </div>
      </div>

      <div class="card">
        <h2>📔 일상일기</h2>
        <textarea id="dailyNote" class="auto" placeholder="짧게 요약하거나, 길게 자유롭게 적어도 좋아요."></textarea>
      </div>

      <div class="card">
        <h2>🏷️ 태그</h2>
        <input type="text" id="tagsField" placeholder="#가족, #업무 처럼 쉼표로 구분">
      </div>

      <div class="savebar">
        <button id="saveDaily" class="btn primary">저장</button>
        <button id="clearDaily" class="btn danger">지우기</button>
        <span id="statusDaily" class="muted">불러옴</span>
      </div>
    </section>`;

  // load (for today only UI; navigation minimal)
  document.querySelectorAll('textarea.auto').forEach(el=>{
    el.addEventListener('input', ()=>autoResize(el));
    autoResize(el);
  });
  // fill values
  document.getElementById('qText').value = d.q || randomQuestion();
  document.getElementById('qAnswer').value = d.qa || '';
  autoResize(document.getElementById('qText'));
  autoResize(document.getElementById('qAnswer'));
  document.getElementById('eventField').value = d.event || '';
  document.getElementById('thoughtField').value = d.thought || '';
  document.getElementById('feelingField').value = d.feeling || '';
  document.getElementById('resultField').value = d.result || '';
  document.getElementById('grat1').value = (d.gratitude&&d.gratitude[0])||'';
  document.getElementById('grat2').value = (d.gratitude&&d.gratitude[1])||'';
  document.getElementById('grat3').value = (d.gratitude&&d.gratitude[2])||'';
  document.getElementById('dailyNote').value = d.note || '';
  document.getElementById('tagsField').value = (d.tags||[]).join(', ');

  document.getElementById('newQ').addEventListener('click', ()=>{
    const qt = document.getElementById('qText');
    qt.value = randomQuestion(true);
    autoResize(qt);
  });
  document.getElementById('todayBtn').addEventListener('click', ()=>{
    document.getElementById('dailyDate').value = ymd(new Date());
  });

  document.getElementById('saveDaily').addEventListener('click', ()=>{
    const data = loadAll(); const key = document.getElementById('dailyDate').value || today;
    data.daily[key] = {
      q: document.getElementById('qText').value.trim(),
      qa: document.getElementById('qAnswer').value.trim(),
      event: document.getElementById('eventField').value.trim(),
      thought: document.getElementById('thoughtField').value.trim(),
      feeling: document.getElementById('feelingField').value.trim(),
      result: document.getElementById('resultField').value.trim(),
      gratitude: [
        document.getElementById('grat1').value.trim(),
        document.getElementById('grat2').value.trim(),
        document.getElementById('grat3').value.trim()
      ],
      note: document.getElementById('dailyNote').value.trim(),
      tags: parseTags(document.getElementById('tagsField').value),
      updatedAt: new Date().toISOString()
    };
    saveAll(data);
    document.getElementById('statusDaily').textContent = '저장됨';
  });
  document.getElementById('clearDaily').addEventListener('click', ()=>{
    if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;
    const data = loadAll(); const key = document.getElementById('dailyDate').value || today;
    delete data.daily[key]; saveAll(data);
    renderDaily();
  });
}

function renderWeekly(){
  const v = document.getElementById('view');
  const wk = weekId(new Date());
  const data = loadAll();
  const w = data.weekly[wk] || {missions:[], healing:''};
  v.innerHTML = `
  <section id="weekly">
    <div class="date-row">
      <input type="week" id="weekPicker" value="${wk}">
      <button id="thisWeekBtn" class="btn soft small">이번 주</button>
    </div>

    <div class="card">
      <h2>✅ 미션 (체크박스)</h2>
      <div id="missionList"></div>
      <div class="actions-spaced">
        <input type="text" id="newMission" placeholder="미션 추가" style="flex:1">
        <button id="addMission" class="btn">+ 추가</button>
      </div>
    </div>

    <div class="card">
      <h2>🫶 오늘의 문구</h2>
      <textarea id="healingText" class="auto" placeholder="오늘의 문구"></textarea>
      <div class="actions-spaced">
        <button id="randomHealing" class="btn">랜덤</button>
        <button id="saveWeekly" class="btn primary">저장</button>
        <button id="clearWeekly" class="btn danger">지우기</button>
      </div>
      <div class="actions-spaced">
        <button id="copyWrite" class="btn small">✍️ 필사 시작</button>
      </div>
    </div>
  </section>`;

  function renderMissions(items){
    const list = document.getElementById('missionList'); list.innerHTML='';
    items.forEach((m,idx)=>{
      const row = document.createElement('div');
      row.className = 'actions-spaced';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked=!!m.done;
      cb.addEventListener('change', ()=>{ m.done=cb.checked; saveWeeklyData(); });
      const txt = document.createElement('input'); txt.type='text'; txt.value=m.text||''; txt.placeholder='미션';
      txt.style.flex='1'; txt.addEventListener('input', ()=>{ m.text = txt.value; saveWeeklyData(); });
      const del = document.createElement('button'); del.className='btn danger'; del.textContent='삭제';
      del.addEventListener('click', ()=>{ if(confirm('삭제할까요?')){ items.splice(idx,1); renderMissions(items); saveWeeklyData(); }});
      row.appendChild(cb); row.appendChild(txt); row.appendChild(del);
      list.appendChild(row);
    });
  }
  function saveWeeklyData(){
    const data = loadAll(); const key = document.getElementById('weekPicker').value || wk;
    const items = Array.from(document.querySelectorAll('#missionList .actions-spaced')).map(r=>{
      const cb = r.querySelector('input[type="checkbox"]');
      const txt = r.querySelector('input[type="text"]');
      return {text: txt.value.trim(), done: cb.checked};
    }).filter(m=>m.text.length>0);
    data.weekly[key] = {missions: items, healing: document.getElementById('healingText').value.trim(), updatedAt:new Date().toISOString()};
    saveAll(data);
  }
  renderMissions(w.missions);
  document.getElementById('healingText').value = w.healing || randomHealing(true);
  document.querySelectorAll('textarea.auto').forEach(el=>{ el.addEventListener('input',()=>autoResize(el)); autoResize(el); });
  document.getElementById('addMission').addEventListener('click', ()=>{
    const txt = document.getElementById('newMission').value.trim(); if(!txt) return;
    w.missions.push({text:txt,done:false}); document.getElementById('newMission').value=''; renderMissions(w.missions); saveWeeklyData();
  });
  document.getElementById('saveWeekly').addEventListener('click', ()=>{ saveWeeklyData(); alert('저장됨'); });
  document.getElementById('clearWeekly').addEventListener('click', ()=>{
    if(!confirm('이 주차의 데이터를 모두 지울까요?')) return;
    const data = loadAll(); const key = document.getElementById('weekPicker').value || wk;
    delete data.weekly[key]; saveAll(data); renderWeekly();
  });
  document.getElementById('randomHealing').addEventListener('click', ()=>{
    document.getElementById('healingText').value = randomHealing();
    autoResize(document.getElementById('healingText'));
  });
}

function renderSearch(){
  const v = document.getElementById('view');
  v.innerHTML = `<section id="search"><div class="card">
    <h2>🔎 검색</h2>
    <input type="text" id="searchInput" placeholder="키워드 또는 #태그">
    <div class="btn-row"><button id="searchBtn" class="btn">검색</button><button id="clearBtn" class="btn">지우기</button></div>
  </div><div class="card"><div id="results"></div></div></section>`;
  document.getElementById('searchBtn').addEventListener('click', ()=>{
    const q = (document.getElementById('searchInput').value||'').trim().toLowerCase();
    const data = loadAll(); const out = [];
    const isTag = q.startsWith('#'); const qn = q.replace(/^#/,'');
    Object.keys(data.daily).forEach(k=>{
      const d = data.daily[k]; const hay = [d.q,d.qa,d.event,d.thought,d.feeling,d.result,...(d.gratitude||[]),d.note].join(' ').toLowerCase();
      const tags = (d.tags||[]).map(t=>t.replace(/^#/,'').toLowerCase());
      const match = isTag? tags.includes(qn) : hay.includes(qn);
      if(match) out.push({date:k, d});
    });
    const el = document.getElementById('results'); el.innerHTML = out.length? '' : '<p class="muted">결과가 없습니다.</p>';
    out.sort((a,b)=>a.date.localeCompare(b.date)).forEach(it=>{
      const div = document.createElement('div'); div.className='card';
      div.innerHTML = `<h3>${it.date}</h3><p><strong>사건</strong>: ${it.d.event||''}<br><strong>감정</strong>: ${it.d.feeling||''}<br><strong>감사</strong>: ${(it.d.gratitude||[]).filter(Boolean).join(', ')}</p>`;
      el.appendChild(div);
    });
  });
  document.getElementById('clearBtn').addEventListener('click', ()=>{ document.getElementById('results').innerHTML=''; document.getElementById('searchInput').value=''; });
}

function renderSettings(){
  const v = document.getElementById('view');
  v.innerHTML = `<section id="settings">
    <div class="card">
      <h2>🔐 보안</h2>
      <label class="row"><input type="checkbox" id="lockEnabled"> Face ID 잠금 사용</label>
      <div class="btn-row"><button id="panic" class="btn danger small">비상 해제</button></div>
    </div>
    <div class="card">
      <h2>🎨 테마</h2>
      <label class="row"><input type="checkbox" id="darkMode"> 다크모드 사용</label>
    </div>
    <div class="card">
      <h2>📦 백업</h2>
      <div class="btn-row">
        <button id="exportJSON" class="btn">JSON 파일로 저장</button>
        <button id="shareJSON" class="btn">JSON 공유(카톡 등)</button>
        <button id="exportCSV" class="btn">CSV ZIP 내보내기</button>
        <input type="file" id="importFile" accept=".json">
        <button id="importJSON" class="btn">JSON 가져오기</button>
      </div>
      <div class="btn-row">
        <button id="refreshSW" class="btn soft">캐시 새로고침(업데이트)</button>
        <button id="resetLocal" class="btn danger">로컬 데이터 초기화</button>
      </div>
    </div>
  </section>`;

  // Backup actions
  document.getElementById('exportJSON').addEventListener('click', ()=>{
    const data = loadAll(); const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url; a.download=`ttc_journal_backup_${ymd(new Date())}.json`; a.click(); URL.revokeObjectURL(url);
  });
  async function shareJSONSafely(filename, obj){
    const textPayload = JSON.stringify(obj, null, 2);
    if(navigator.share){
      try{ await navigator.share({title:'지니짱 감사일기 백업', text:textPayload}); alert('공유 완료!'); return; }catch(e){}
    }
    try{ await navigator.clipboard.writeText(textPayload); alert('클립보드에 복사했어요. 카톡에 붙여넣기!'); return; }catch(e){}
    const blob = new Blob([textPayload], {type:'application/json'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  }
  document.getElementById('shareJSON').addEventListener('click', ()=>shareJSONSafely(`ttc_journal_backup_${ymd(new Date())}.json`, loadAll()));
  document.getElementById('importJSON').addEventListener('click', ()=>{
    const f = document.getElementById('importFile').files[0]; if(!f) return alert('JSON 파일 선택');
    const r = new FileReader(); r.onload = e=>{
      try{ const incoming = JSON.parse(e.target.result); const cur = loadAll();
        cur.daily = {...cur.daily, ...(incoming.daily||{})}; cur.weekly = {...cur.weekly, ...(incoming.weekly||{})};
        saveAll(cur); alert('가져오기 완료'); }catch{ alert('JSON 형식이 아닙니다'); }
    }; r.readAsText(f);
  });
  document.getElementById('refreshSW').addEventListener('click', async ()=>{
    if('serviceWorker' in navigator){ const regs = await navigator.serviceWorker.getRegistrations(); for(const r of regs){ await r.unregister(); } location.reload(); }
  });
  document.getElementById('resetLocal').addEventListener('click', ()=>{ if(confirm('모든 로컬 데이터를 삭제할까요?')){ localStorage.removeItem(storeKey); alert('삭제됨'); } });
}

// Question / quotes pool with no-repeat until exhausted
const qPool = [
 '오늘 나를 웃게 만든 순간은 무엇이었나요?','사람들에게 어떤 사람으로 기억되고 싶나요?','오늘 내가 배운 가장 작은 교훈은?',
 '감사 인사를 전하고 싶은 사람은 누구인가요? 이유는?','지금 나를 힘나게 하는 문장은 무엇인가요?','오늘 놓치고 싶지 않은 감정은?',
 '오늘 나를 가장 성장시킨 사건은?','어떤 선택이 나를 더 평온하게 할까요?','나에게 친절했던 순간은?','오늘의 실패에서 얻은 배움은?',
 '내일의 나에게 남기고 싶은 한 문장?','오늘 가장 고마웠던 우연은?','오늘의 나를 한 단어로 표현한다면?','내가 지켜낸 작은 규칙 하나는?',
 '오늘 나를 도운 환경/사람은?','불안이 올라올 때 내가 할 수 있는 한 가지는?','내가 선택한 쉬어가기의 형태는?','오늘 내려놓아도 되는 걱정은?'
];
let qBag = [];
function randomQuestion(resetIfEmpty=false){
  if(qBag.length===0){ qBag = [...qPool]; }
  const i = Math.floor(Math.random()*qBag.length);
  const pick = qBag.splice(i,1)[0];
  if(resetIfEmpty && qBag.length===0) qBag = [...qPool];
  return pick;
}
const healPool = [
 '부러움 대신 배움을 고르면 마음은 가벼워진다','오늘의 나를 어제의 나와만 비교하면 삶이 단단해진다','완벽보다 꾸준함이 더 조용히 이긴다',
 '친절은 돌아오지 않아도 흔적을 남긴다','해야 할 일 앞에서 숨고 싶을 땐 아주 작은 시작부터',
 '내 속도가 느려 보여도 멈추지 않으면 결국 닿는다','받아들임은 포기가 아니라 시작이다','한 번의 깊은 호흡이 마음의 재부팅이다',
 '불안은 계획을 좋아한다 작은 계획 하나면 충분하다','사랑받는 것보다 믿을 만한 사람이 되는 게 오래간다','상처를 말로 꺼내면 무게가 나눠진다',
 '오늘의 수고를 내일의 나에게 친절로 남긴다','작은 친절이 오늘을 바꾼다','지금 이 순간 나는 안전하다'
];
let healBag = [];
function randomHealing(init=false){
  if(healBag.length===0){ healBag = [...healPool]; }
  const i = Math.floor(Math.random()*healBag.length);
  const pick = healBag.splice(i,1)[0];
  if(init && healBag.length===0) healBag = [...healPool];
  return pick;
}
