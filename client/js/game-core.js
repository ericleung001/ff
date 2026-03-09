// ════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════
let state = {
  char: null,
  mapCells: [],
  currentCell: 12,
  combat: { active:false, enemies:[], party:[], myTurn:false, currentEnemy:0 },
  socket: null,
  roomCode: null,
  roomId: null,
  isLeader: false,
  selectedJob: null,
  gather: { active:false, type:null, interval:null, ticks:0 },
  houses: {},
};

// ════════════════════════════════════════════
//  SCREEN NAV
// ════════════════════════════════════════════
function goScreen(id) {
  document.querySelectorAll('.screen,.screen-full').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById('s-'+id);
  if(el) el.classList.add('active');
  if(id==='chars') loadChars();
  if(id==='skills' && state.char) renderSkillTree();
  if(id==='lobby') loadLobby();
  if(id==='bag' && state.char) loadBag();
  if(id==='game' && state.char) {
    refreshSidebar();
    updateGatherBonusLabels();
    updateHousePanelStatus();
    initCombatPanel();
  }
}

// ════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════
function notify(msg, type='info') {
  const n = document.createElement('div');
  n.className = `notif ${type}`;
  n.textContent = msg;
  document.getElementById('notify').appendChild(n);
  setTimeout(()=>n.remove(), 3200);
}

// ════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════
function switchAuthTab(tab) {
  document.getElementById('auth-login').classList.toggle('hide', tab!=='login');
  document.getElementById('auth-reg').classList.toggle('hide',  tab!=='reg');
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-reg').classList.toggle('active',  tab==='reg');
}

async function doLogin() {
  try {
    await AC_API.login(document.getElementById('l-user').value, document.getElementById('l-pass').value);
    goScreen('chars');
  } catch(e) { notify(e.message,'err'); }
}

async function doRegister() {
  try {
    await AC_API.register(document.getElementById('r-user').value, document.getElementById('r-email').value, document.getElementById('r-pass').value);
    notify('帳號已成功建立！','ok');
    goScreen('chars');
  } catch(e) { notify(e.message,'err'); }
}

function logoutAndTitle() {
  AC_API.logout();
  state.char = null;
  localStorage.removeItem('ac_last_char');
  goScreen('title');
}

// ════════════════════════════════════════════
//  CHARACTERS
// ════════════════════════════════════════════
async function loadChars() {
  try {
    const chars = await AC_API.getChars();
    const grid = document.getElementById('char-cards');
    grid.innerHTML = '';
    chars.forEach(c => {
      const d = document.createElement('div');
      d.className = 'char-card';
      d.innerHTML = `<span class="char-card-icon">${JOB_ICONS[c.job]||'⚔️'}</span>
        <span class="char-card-name">${c.name}</span>
        <span class="char-card-sub">${JOB_NAMES[c.job]} · Lv.${c.level}</span>
        <span class="char-card-sub" style="margin-top:4px">HP ${c.hp}/${c.maxHp}</span>`;
      d.onclick = ()=>selectChar(c.id);
      grid.appendChild(d);
    });
    if(chars.length < 3) {
      const d = document.createElement('div');
      d.className = 'char-card char-card-new';
      d.innerHTML = `<span style="font-size:2.5rem">＋</span><span class="char-card-sub" style="margin-top:8px">創建新角色</span>`;
      d.onclick = ()=>goScreen('create');
      grid.appendChild(d);
    }
  } catch(e) { notify(e.message,'err'); }
}

async function selectChar(id) {
  try {
    state.char = await AC_API.getChar(id);
    localStorage.setItem('ac_last_char', id);
    connectGameSocket();
    goScreen('game');
    refreshSidebar();
  } catch(e) { notify(e.message,'err'); }
}

let selectedJobVal = null;
function selJob(el) {
  document.querySelectorAll('.job-card').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  selectedJobVal = el.dataset.job;
}

async function doCreateChar() {
  const name = document.getElementById('new-name').value.trim();
  if(!name) return notify('輸入你的名字','err');
  if(!selectedJobVal) return notify('請選擇職業','err');
  try {
    await AC_API.createChar(name, selectedJobVal);
    notify('踏上了征途！','ok');
    goScreen('chars');
  } catch(e) { notify(e.message,'err'); }
}

// ════════════════════════════════════════════
//  INIT — auto-restore session on page load
// ════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async ()=>{
  const token = AC_API.getToken();
  if(!token){ goScreen('title'); return; }
  const lastId = localStorage.getItem('ac_last_char');
  if(!lastId){ goScreen('chars'); return; }
  try {
    state.char = await AC_API.getChar(lastId);
    connectGameSocket();
    goScreen('game');
    refreshSidebar();
    updateGatherBonusLabels();
    updateHousePanelStatus();
    initCombatPanel();
  } catch(e) {
    goScreen('chars');
  }
});