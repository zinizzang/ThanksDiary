
const storeKey='jj-gratitude-v1-2'; const settingsKey='jj-settings-v1-2';
function loadAll(){try{return JSON.parse(localStorage.getItem(storeKey))||{daily:{},weekly:{}};}catch(e){return{daily:{},weekly:{}};}}
function saveAll(d){localStorage.setItem(storeKey,JSON.stringify(d));}
function loadSettings(){try{return JSON.parse(localStorage.getItem(settingsKey))||{};}catch(e){return{};}}
function saveSettings(s){localStorage.setItem(settingsKey,JSON.stringify(s));}
function ymd(date){const d=new Date(date);const tz=d.getTimezoneOffset()*60000;const local=new Date(d.getTime()-tz);return local.toISOString().slice(0,10);}
function weekId(date){const d=new Date(date);const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-n+3);const f=new Date(Date.UTC(t.getUTCFullYear(),0,4));const w=1+Math.round(((t-f)/86400000-3+((f.getUTCDay()+6)%7))/7);const y=t.getUTCFullYear();return `${y}-W${String(w).padStart(2,'0')}`;}
function parseTags(s){if(!s)return[];return s.split(',').map(t=>t.trim()).filter(Boolean).map(t=>t.startsWith('#')?t:'#'+t);}
function normalizeText(s){return(s||'').toLowerCase();}

// theme
const darkToggle=document.getElementById('darkToggle'); const darkModeChk=document.getElementById('darkMode');
function applyTheme(){const s=loadSettings();const prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;const useDark=(s.darkMode==='dark')||(s.darkMode==='system'&&prefersDark);document.documentElement.classList.toggle('dark',useDark);if(darkModeChk) darkModeChk.checked=(s.darkMode==='dark');}
if(darkToggle){darkToggle.addEventListener('click',()=>{const isDark=document.documentElement.classList.contains('dark');const s=loadSettings();s.darkMode=isDark?'light':'dark';saveSettings(s);applyTheme();});}
if(darkModeChk){darkModeChk.addEventListener('change',()=>{const s=loadSettings();s.darkMode=darkModeChk.checked?'dark':'light';saveSettings(s);applyTheme();});}
applyTheme();

// tabs
document.querySelectorAll('.tab-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.getElementById(btn.dataset.tab).classList.add('active');});});

// daily
const dailyDate=document.getElementById('dailyDate');const prevDay=document.getElementById('prevDay');const nextDay=document.getElementById('nextDay');const todayBtn=document.getElementById('todayBtn');
const eventField=document.getElementById('eventField');const thoughtField=document.getElementById('thoughtField');const feelingField=document.getElementById('feelingField');const resultField=document.getElementById('resultField');
const grat1=document.getElementById('grat1');const grat2=document.getElementById('grat2');const grat3=document.getElementById('grat3');const dailyNote=document.getElementById('dailyNote');const tagsField=document.getElementById('tagsField');
const saveDaily=document.getElementById('saveDaily');const clearDaily=document.getElementById('clearDaily');
function setDailyDate(d){dailyDate.value=ymd(d);loadDaily();}
function shiftDaily(n){const cur=new Date(dailyDate.value||new Date());cur.setDate(cur.getDate()+n);setDailyDate(cur);}
prevDay.addEventListener('click',()=>shiftDaily(-1)); nextDay.addEventListener('click',()=>shiftDaily(1)); todayBtn.addEventListener('click',()=>setDailyDate(new Date())); dailyDate.addEventListener('change',loadDaily);
function loadDaily(){const data=loadAll();const key=dailyDate.value||ymd(new Date());const d=data.daily[key]||{};eventField.value=d.event||'';thoughtField.value=d.thought||'';feelingField.value=d.feeling||'';resultField.value=d.result||'';grat1.value=(d.gratitude&&d.gratitude[0])||'';grat2.value=(d.gratitude&&d.gratitude[1])||'';grat3.value=(d.gratitude&&d.gratitude[2])||'';dailyNote.value=d.note||'';tagsField.value=(d.tags||[]).join(', ');}
saveDaily.addEventListener('click',()=>{const data=loadAll();const key=dailyDate.value||ymd(new Date());data.daily[key]={event:eventField.value.trim(),thought:thoughtField.value.trim(),feeling:feelingField.value.trim(),result:resultField.value.trim(),gratitude:[grat1.value.trim(),grat2.value.trim(),grat3.value.trim()],note:dailyNote.value.trim(),tags:parseTags(tagsField.value),updatedAt:new Date().toISOString()};saveAll(data);alert('저장되었습니다.');});
clearDaily.addEventListener('click',()=>{if(!confirm('이 날짜의 데이터를 모두 지울까요?')) return;const data=loadAll();const key=dailyDate.value||ymd(new Date());delete data.daily[key];saveAll(data);loadDaily();alert('삭제되었습니다.');});

// weekly
const weekPicker=document.getElementById('weekPicker');const prevWeek=document.getElementById('prevWeek');const nextWeek=document.getElementById('nextWeek');const thisWeekBtn=document.getElementById('thisWeekBtn');
const missionList=document.getElementById('missionList');const newMission=document.getElementById('newMission');const addMission=document.getElementById('addMission');
const healingText=document.getElementById('healingText');const saveWeekly=document.getElementById('saveWeekly');const clearWeekly=document.getElementById('clearWeekly');const randomHealing=document.getElementById('randomHealing');
const copyPad=document.getElementById('copyPad');const fillCopy=document.getElementById('fillCopy');const clearCopy=document.getElementById('clearCopy');
function setWeekInputByDate(date){const d=new Date(date);weekPicker.value=weekId(d);loadWeekly();}
function shiftWeek(delta){const val=weekPicker.value;if(!val){setWeekInputByDate(new Date());return;}const [y,w]=val.split('-W');const simple=new Date(Date.UTC(parseInt(y),0,1+(parseInt(w)-1)*7));const dow=simple.getUTCDay();const start=simple;if(dow<=4) start.setUTCDate(simple.getUTCDate()-simple.getUTCDay()+1); else start.setUTCDate(simple.getUTCDate()+8-simple.getUTCDay());start.setUTCDate(start.getUTCDate()+delta*7);setWeekInputByDate(new Date(start));}
prevWeek.addEventListener('click',()=>shiftWeek(-1)); nextWeek.addEventListener('click',()=>shiftWeek(1)); thisWeekBtn.addEventListener('click',()=>setWeekInputByDate(new Date())); weekPicker.addEventListener('change',loadWeekly);
function renderMissions(items){missionList.innerHTML='';items.forEach((m,idx)=>{const row=document.createElement('div');row.className='mission-item';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!m.done;cb.addEventListener('change',()=>{m.done=cb.checked;saveWeeklyData();});const txt=document.createElement('input');txt.type='text';txt.value=m.text||'';txt.placeholder='미션 내용';txt.addEventListener('input',()=>{m.text=txt.value;saveWeeklyData();});const del=document.createElement('button');del.className='btn danger';del.textContent='삭제';del.addEventListener('click',()=>{if(!confirm('이 미션을 삭제할까요?')) return;items.splice(idx,1);renderMissions(items);saveWeeklyData();});row.appendChild(cb);row.appendChild(txt);row.appendChild(del);missionList.appendChild(row);});}
function currentWeekKey(){return weekPicker.value||weekId(new Date());}
function loadWeekly(){const data=loadAll();const key=currentWeekKey();const w=data.weekly[key]||{missions:[],healing:''};renderMissions(w.missions);healingText.value=w.healing||weeklyHealingSuggestion();}
function saveWeeklyData(){const data=loadAll();const key=currentWeekKey();const items=Array.from(missionList.querySelectorAll('.mission-item')).map(row=>{const cb=row.querySelector('input[type=\"checkbox\"]');const txt=row.querySelector('input[type=\"text\"]');return {text:txt.value.trim(),done:cb.checked};}).filter(it=>it.text.length>0);data.weekly[key]={missions:items,healing:healingText.value.trim(),updatedAt:new Date().toISOString()};saveAll(data);}
addMission.addEventListener('click',()=>{const txt=newMission.value.trim();if(!txt) return;const data=loadAll();const key=currentWeekKey();const w=data.weekly[key]||{missions:[],healing:''};w.missions.push({text:txt,done:false});data.weekly[key]=w;saveAll(data);newMission.value='';renderMissions(w.missions);});
saveWeekly.addEventListener('click',()=>{saveWeeklyData();alert('주간 데이터가 저장되었습니다.');});
clearWeekly.addEventListener('click',()=>{if(!confirm('이 주차의 주간 데이터를 모두 지울까요?')) return;const data=loadAll();const key=currentWeekKey();delete data.weekly[key];saveAll(data);loadWeekly();alert('삭제되었습니다.');});
const healingBank=['오늘의 나를 있는 그대로 사랑합니다.','완벽하지 않아도 괜찮아, 나는 충분해.','호흡을 고르고, 천천히 나아가자.','작은 친절 하나가 나를 살린다.','나는 나에게 가장 든든한 편이 된다.','지금 할 수 있는 한 걸음만 내딛자.','흐르는 것은 흘려보내고, 머무를 것을 품자.','어제의 나보다 1% 더 따뜻하게.','마음이 시끄러우면, 눈을 감고 손을 꼭 쥔다.','괜찮아, 천천히, 하지만 멈추지 말자.'];
function weeklyHealingSuggestion(){const id=currentWeekKey();const n=parseInt(id.replace(/\\D/g,''))||0;return healingBank[n%healingBank.length];}
randomHealing.addEventListener('click',()=>{healingText.value=healingBank[Math.floor(Math.random()*healingBank.length)];});
fillCopy.addEventListener('click',()=>{copyPad.value=healingText.value;});
clearCopy.addEventListener('click',()=>{copyPad.value='';});

// search
const searchInput=document.getElementById('searchInput'); const searchBtn=document.getElementById('searchBtn'); const searchClear=document.getElementById('searchClear'); const searchResults=document.getElementById('searchResults');
function doSearch(){const q=searchInput.value.trim();const data=loadAll();const results=[];const isTag=q.startsWith('#');const qn=normalizeText(q.replace(/^#/,''));Object.keys(data.daily).forEach(date=>{const d=data.daily[date];const hay=[d.event,d.thought,d.feeling,d.result,...(d.gratitude||[]),d.note].join(' ').toLowerCase();const tags=(d.tags||[]).map(t=>t.replace(/^#/, '').toLowerCase());let match=false;if(isTag) match=tags.includes(qn); else match=hay.includes(qn);if(match) results.push({date,d});});results.sort((a,b)=>a.date.localeCompare(b.date));renderResults(results);}
function renderResults(list){searchResults.innerHTML='';if(list.length===0){searchResults.innerHTML='<p class=\"muted\">결과가 없습니다.</p>';return;}list.forEach(item=>{const div=document.createElement('div');div.className='res';const h4=document.createElement('h4');h4.textContent=`${item.date}`;const tags=(item.d.tags||[]).map(t=>`<span class=\"badge\">${t}</span>`).join(' ');const p=document.createElement('p');p.innerHTML=`<strong>사건</strong>: ${item.d.event||''}<br><strong>생각</strong>: ${item.d.thought||''}<br><strong>감정</strong>: ${item.d.feeling||''}<br><strong>결과</strong>: ${item.d.result||''}<br><strong>감사</strong>: ${(item.d.gratitude||[]).filter(Boolean).join(', ')}<br><strong>일상</strong>: ${item.d.note||''}<br>${tags}`;div.appendChild(h4);div.appendChild(p);searchResults.appendChild(div);});}
searchBtn.addEventListener('click',doSearch); searchClear.addEventListener('click',()=>{searchInput.value='';searchResults.innerHTML='';});

// security (off by default)
const lockEnabledChk=document.getElementById('lockEnabled'); const pinCodeInput=document.getElementById('pinCode'); const savePinBtn=document.getElementById('savePin');
function sha256(str){const enc=new TextEncoder();return crypto.subtle.digest('SHA-256',enc.encode(str)).then(buf=>Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join(''));}
async function setPin(pin){const s=loadSettings();s.pinHash=await sha256(pin);saveSettings(s);}
savePinBtn.addEventListener('click',async()=>{const pin=pinCodeInput.value.trim();if(!/^\\d{6}$/.test(pin)){alert('6자리 숫자 PIN을 입력하세요.');return;}await setPin(pin);alert('PIN 저장 완료');pinCodeInput.value='';});
function applyLockUI(){const s=loadSettings();if(s.lockEnabled===undefined){s.lockEnabled=false;saveSettings(s);}lockEnabledChk.checked=!!s.lockEnabled;}
lockEnabledChk.addEventListener('change',()=>{const s=loadSettings();s.lockEnabled=lockEnabledChk.checked;saveSettings(s);});
applyLockUI();

// init
setDailyDate(new Date()); setWeekInputByDate(new Date());
