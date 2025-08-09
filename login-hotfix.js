
// ThanksDiary login/tabs hotfix — non-destructive
(function(){
  function qs(s,el=document){ return el.querySelector(s); }
  function on(el, ev, fn){ if(el) el.addEventListener(ev, fn, {passive:false}); }

  function openModal(){
    var dlg = document.getElementById('loginModal') || document.getElementById('loginDialog');
    if(!dlg) return;
    // HTMLDialogElement 지원/비지원 모두 처리
    if(typeof dlg.showModal === 'function'){ try{ dlg.showModal(); }catch(e){ dlg.setAttribute('open',''); } }
    else { dlg.classList.remove('hidden'); dlg.style.display = 'flex'; dlg.setAttribute('data-open','1'); }
  }
  function closeModal(){
    var dlg = document.getElementById('loginModal') || document.getElementById('loginDialog');
    if(!dlg) return;
    if(typeof dlg.close === 'function'){ try{ dlg.close(); }catch(e){ dlg.removeAttribute('open'); } }
    dlg.classList.add('hidden'); dlg.style.display = 'none'; dlg.removeAttribute('data-open');
  }

  function wireAuth(){
    var openBtn = document.getElementById('openLogin') || qs('[data-open-login]');
    if(openBtn){
      openBtn.setAttribute('type','button');
      openBtn.style.pointerEvents = 'auto';
      openBtn.onclick = function(e){
        e.preventDefault(); e.stopPropagation();
        var u = (window.firebase && firebase.auth && firebase.auth().currentUser) ? firebase.auth().currentUser : null;
        if(u){
          // if already logged in, treat as logout toggle
          try { firebase.auth().signOut(); } catch(_){}
        }else{
          openModal();
        }
      };
    }

    var email = document.getElementById('loginEmail');
    var pass  = document.getElementById('loginPass');
    var msg   = document.getElementById('loginMsg');
    function setMsg(t){ if(msg){ msg.textContent = t; } }

    var doLogin = document.getElementById('doLogin');
    on(doLogin, 'click', function(e){
      e.preventDefault();
      if(!(window.firebase && firebase.auth)){ setMsg('Firebase가 로드되지 않았습니다.'); return; }
      var em = (email && email.value || '').trim();
      var pw = (pass && pass.value || '');
      if(!em || !pw){ setMsg('이메일/비밀번호를 입력하세요.'); return; }
      firebase.auth().signInWithEmailAndPassword(em, pw)
        .then(function(){ setMsg('로그인 성공'); setTimeout(closeModal, 300); })
        .catch(function(err){ setMsg(err.message||'로그인 실패'); });
    });

    var doSignup = document.getElementById('doSignup');
    on(doSignup, 'click', function(e){
      e.preventDefault();
      if(!(window.firebase && firebase.auth)){ setMsg('Firebase가 로드되지 않았습니다.'); return; }
      var em = (email && email.value || '').trim();
      var pw = (pass && pass.value || '');
      if(!em || !pw){ setMsg('이메일/비밀번호를 입력하세요.'); return; }
      firebase.auth().createUserWithEmailAndPassword(em, pw)
        .then(function(){ setMsg('가입/로그인 성공'); setTimeout(closeModal, 300); })
        .catch(function(err){ setMsg(err.message||'회원가입 실패'); });
    });

    var closeBtn = document.getElementById('closeLogin');
    on(closeBtn, 'click', function(e){ e.preventDefault(); closeModal(); });

    // 상태표시 보강
    if(window.firebase && firebase.auth){
      firebase.auth().onAuthStateChanged(function(user){
        var s = document.getElementById('authState') || document.getElementById('authEmail');
        if(s) s.textContent = user ? (user.email + ' 로그인됨') : '로그아웃 상태';
        if(openBtn){
          openBtn.textContent = user ? '로그아웃' : '로그인';
        }
      });
    }
  }

  function wireTabs(){
    var tabs = document.querySelectorAll('.tab-btn');
    if(!tabs || !tabs.length) return;
    tabs.forEach(function(t){
      t.style.pointerEvents = 'auto';
      t.addEventListener('click', function(ev){
        // SPA 라우팅 보강: 해시 이동만 보장
        var href = t.getAttribute('href') || t.getAttribute('data-href');
        if(href && href.startsWith('#/')){
          ev.preventDefault();
          if(location.hash !== href) location.hash = href;
          // 해시가 같아도 렌더 트리거
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }, {passive:false});
    });
  }

  function ensureZ(){
    var dlg = document.getElementById('loginModal') || document.getElementById('loginDialog');
    if(dlg){
      dlg.style.zIndex = 9999;
    }
    // 가끔 상단 오버레이가 클릭을 가로채는 경우 방지
    var blockers = document.querySelectorAll('[data-blocker], .overlay, .app-header:after');
    blockers.forEach(function(el){ el.style.pointerEvents = 'none'; });
  }

  document.addEventListener('DOMContentLoaded', function(){
    // 한 번만 와이어링
    setTimeout(function(){
      wireAuth();
      wireTabs();
      ensureZ();
    }, 0);
  });
})();