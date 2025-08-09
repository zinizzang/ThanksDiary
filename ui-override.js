// 라우팅 (해시 없이 단순 표시 전환)
const pages = {
  daily: document.getElementById('page-daily'),
  weekly: document.getElementById('page-weekly'),
  search: document.getElementById('page-search'),
  settings: document.getElementById('page-settings'),
};
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const route = btn.dataset.route;
    Object.values(pages).forEach(p=>p.classList.remove('visible'));
    pages[route].classList.add('visible');
    window.scrollTo({top:0,behavior:'smooth'});
  });
});

// 미션 체크박스 UI (로컬만 — 기존 app.js 와 충돌없게 별도 key)
const listEl = document.getElementById('missionList');
const key = 'ui_patch_missions';
function loadMissions(){
  const arr = JSON.parse(localStorage.getItem(key)||'[]');
  listEl.innerHTML='';
  arr.forEach((m,i)=>{
    const div=document.createElement('div');
    div.className='check-item';
    div.innerHTML = \`
      <input type="checkbox" \${m.done?'checked':''}>
      <span>\${m.text}</span>
      <button class="btn small rm">삭제</button>\`;
    div.querySelector('input').addEventListener('change',e=>{
      arr[i].done=e.target.checked; saveMissions(arr);
    });
    div.querySelector('.rm').addEventListener('click',()=>{
      arr.splice(i,1); saveMissions(arr);
    });
    listEl.appendChild(div);
  });
}
function saveMissions(arr){ localStorage.setItem(key, JSON.stringify(arr)); loadMissions(); }
document.getElementById('addMission').addEventListener('click',()=>{
  const v = document.getElementById('newMission').value.trim();
  if(!v) return; const arr = JSON.parse(localStorage.getItem(key)||'[]');
  arr.push({text:v,done:false}); document.getElementById('newMission').value=''; saveMissions(arr);
});
document.getElementById('saveMission').addEventListener('click',()=>{
  alert('저장 완료! (체크박스 UI)');
});
loadMissions();

// 로그인 모달 열기/닫기 + 버튼 간격
const loginModal = document.getElementById('loginModal');
document.getElementById('btnSign').onclick=()=>loginModal.classList.remove('hidden');
document.getElementById('closeLogin').onclick=()=>loginModal.classList.add('hidden');
document.getElementById('doLogin').onclick=()=>alert('로그인은 앱의 기존 Firebase 로직을 유지하세요.');
document.getElementById('doSignup').onclick=()=>alert('회원가입은 Firebase Authentication을 사용하세요.');

// 날짜/주차 표기 (프런트 표시용)
const d = new Date();
document.getElementById('dateText').textContent = fmtDate(d);
document.getElementById('weekText').textContent = calcWeekLabel(d);
document.getElementById('weekDateText').textContent = weekNumberLabel(d);
document.getElementById('weekDateText2').textContent = calcWeekLabel(d);

function fmtDate(dt){
  return dt.getFullYear()+'. '+(dt.getMonth()+1)+'. '+dt.getDate()+'.';
}
function calcWeekLabel(dt){
  const first = new Date(dt.getFullYear(),0,1);
  const passed = Math.floor((dt - first)/86400000) + first.getDay();
  const week = Math.floor(passed/7)+1;
  // 한국식 "n월 m주" 근사
  const wInMonth = Math.ceil((dt.getDate()+ (new Date(dt.getFullYear(), dt.getMonth(),1).getDay()))/7);
  return dt.getFullYear()+'년 '+(dt.getMonth()+1)+'월 '+wInMonth+'주';
}
function weekNumberLabel(dt){
  const first = new Date(dt.getFullYear(),0,1);
  const week = Math.ceil((((dt - first) / 86400000) + first.getDay()+1)/7);
  return dt.getFullYear()+' '+week+'번째 주';
}
