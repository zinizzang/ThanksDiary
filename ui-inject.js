/* thanksdiary-ui ui-inject.js  v2.7.1
 * - Insert yellow star in header
 * - Add helper texts
 * - Fix duplicate weekly labels
 * - Space modal buttons
 * - Add logout button in settings/backup (if missing)
 * - Show toast on '저장' click
 * - Keep mission add button on one row
 */
(function(){
  const $ = (sel, ctx=document)=>ctx.querySelector(sel);
  const $$ = (sel, ctx=document)=>Array.from(ctx.querySelectorAll(sel));

  function onceReady(fn){
    if(document.readyState === 'complete' || document.readyState === 'interactive') fn();
    else document.addEventListener('DOMContentLoaded', fn, {once:true});
  }

  onceReady(()=>{
    // 1) Header star
    const logoEl = document.querySelector('.app-header .title-area .logo') || document.querySelector('h1.logo');
    if (logoEl && !logoEl.querySelector('.star-icon')){
      const img = document.createElement('img');
      img.className = 'star-icon';
      img.alt = '★';
      img.src = 'images/star-yellow.svg';
      logoEl.prepend(img);
    }

    // 2) Section helper lines (gentle, only if not present)
    const addHelper = (rootSel, text)=>{
      const root = $(rootSel);
      if(!root) return;
      if(root.querySelector('.helper')) return;
      const p = document.createElement('p');
      p.className='helper';
      p.textContent = text;
      root.insertBefore(p, root.children[1] || null);
    };

    addHelper('#daily-view', '하루를 돌아보고 작은 감사들을 기록해요.');
    addHelper('#weekly-view', '이번 주 미션을 체크하고, 지난 주를 가볍게 정리해요.');
    addHelper('#search-view', '키워드로 내 일기를 찾아볼 수 있어요.');
    addHelper('#settings-view', '백업/복원, 로그인 관리를 한 곳에서!' );

    // 3) Weekly label duplication guard
    const trimWeeklyLabels = ()=>{
      const labels = $$('.week-label');
      if(labels.length>1){
        labels.slice(1).forEach(el=> el.classList.add('week-dup'));
      }
    };
    trimWeeklyLabels();
    // also observe mutations (in case view changes with routing)
    const mo = new MutationObserver(trimWeeklyLabels);
    mo.observe(document.body, {childList:true, subtree:true});

    // 4) Add Logout button into settings if missing
    const ensureLogout = ()=>{
      const set = $('#settings-view');
      if(!set) return;
      const has = set.querySelector('[data-action="logout"], .btn-logout');
      if(!has){
        const wrap = document.createElement('div');
        wrap.style.marginTop='16px';
        const btn = document.createElement('button');
        btn.className='btn btn-logout';
        btn.textContent='로그아웃';
        btn.style.padding='12px 18px';
        btn.style.border='1px solid var(--ui-border)';
        btn.style.background='#fff';
        btn.style.boxShadow='var(--ui-shadow)';
        btn.style.borderRadius='14px';
        btn.addEventListener('click', ()=>{
          // Fire a custom event that app.js can catch
          document.dispatchEvent(new CustomEvent('td:logout-request'));
        });
        wrap.appendChild(btn);
        set.appendChild(wrap);
      }
    };
    ensureLogout();

    // 5) Show toast after clicking any '저장' button
    const showToast = (msg='저장 완료!')=>{
      let t = $('.td-toast');
      if(!t){
        t = document.createElement('div');
        t.className='td-toast';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(()=> t.classList.remove('show'), 1500);
    };
    const hookSaveButtons = ()=>{
      $$('.btn, button').forEach(b=>{
        if(b.dataset._toastHooked) return;
        const text = (b.textContent||'').trim();
        if(text === '저장'){
          b.addEventListener('click', ()=> showToast('저장 완료!'));
          b.dataset._toastHooked = '1';
        }
      });
    };
    hookSaveButtons();
    document.addEventListener('click', hookSaveButtons, true);

    // 6) Mission add row one-line
    $$('.mission-add-row').forEach(r=>{
      const add = r.querySelector('.add-btn');
      if(add) add.style.whiteSpace='nowrap';
    });
  });
})();