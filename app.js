
function select(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="'+tab+'"]').classList.add('active');
  document.getElementById(tab).classList.add('active');
  location.hash = tab;
}
document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',()=>select(b.dataset.tab)));
window.addEventListener('hashchange', ()=>{
  const h=location.hash.replace('#/','').replace('#','');
  if(['daily','weekly','search','settings'].includes(h)) select(h);
});
if(location.hash){ const h=location.hash.replace('#/','').replace('#',''); if(['daily','weekly','search','settings'].includes(h)) select(h); }

// auto-resize textareas
function autoresize(el){ el.style.height='auto'; el.style.height = (el.scrollHeight)+'px'; }
document.querySelectorAll('textarea.auto').forEach(t=>{
  autoresize(t);
  t.addEventListener('input', ()=>autoresize(t), {passive:true});
});
// question system
const questions = [
  '사람들에게 어떤 사람으로 기억되고 싶나요?',
  '오늘 나를 가장 미소 짓게 한 순간은 무엇이었나요?',
  '지금의 나에게 필요한 한 마디는 무엇인가요?',
  '오늘 배우거나 깨달은 작은 사실은 무엇인가요?',
  '지금 고마운 사람에게 한 문장으로 뭐라고 말하겠나요?',
  '내가 피하고 있는 일은 무엇이고, 아주 작은 첫걸음은 뭘까요?'
];
const qEl = document.getElementById('questionText');
const qaEl = document.getElementById('questionAnswer');
function setQuestion(i){
  qEl.value = questions[i % questions.length];
  autoresize(qEl);
}
let qi = Math.floor(Math.random()*questions.length);
setQuestion(qi);
document.getElementById('nextQuestion').addEventListener('click', ()=>{ qi=(qi+1)%questions.length; setQuestion(qi); });
