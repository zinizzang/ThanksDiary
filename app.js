// Simple tab switching + today date init + toast on save
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const version = 'v2.7.2-final-ui232r4';

window.addEventListener('DOMContentLoaded', () => {
  // set footer version (already in HTML but keep parity)
  document.querySelector('.site-footer').textContent = version;

  // date default today
  const dateInput = $('#dateInput');
  if (dateInput) {
    const tzOffset = new Date().getTimezoneOffset()*60000;
    dateInput.value = new Date(Date.now()-tzOffset).toISOString().slice(0,10);
    $('#btnToday').addEventListener('click', ()=>{
      dateInput.value = new Date(Date.now()-tzOffset).toISOString().slice(0,10);
    });
  }

  // tabs
  $$('.nav-btn').forEach(btn=>{
    btn.addEventListener('click', () => {
      // nav state
      $$('.nav-btn').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      // page state
      const target = btn.getAttribute('data-target');
      $$('.page').forEach(p=>p.classList.remove('is-active'));
      $(target).classList.add('is-active');
      window.scrollTo({top:0, behavior:'instant'});
    });
  });

  // save buttons -> toast
  $$('.btn.primary').forEach(b=>{
    b.addEventListener('click', ()=> toast('저장 완료!'));
  });
});

function toast(msg){
  let t = $('#toast');
  if(!t){
    t = document.createElement('div');
    t.id='toast';
    Object.assign(t.style, {
      position:'fixed',left:'50%',bottom:'90px',transform:'translateX(-50%)',
      background:'#333',color:'#fff',padding:'10px 14px',borderRadius:'12px',
      fontWeight:'700',boxShadow:'0 6px 18px rgba(0,0,0,.2)',zIndex:9999,opacity:'0',transition:'opacity .18s'
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(()=> t.style.opacity='0', 1200);
}
