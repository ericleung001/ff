// ════════════════════════════════════════════
//  TOWNS & MONSTERS DATA  (JOB_NAMES / JOB_ICONS 已在 game-data.js 宣告)
// ════════════════════════════════════════════
const TOWNS = [
  {
    id:'forest', name:'新手森林', icon:'🌲', lvReq:1, color:'#2d5a27',
    monsters:[
      {id:'slime',    name:'史萊姆',  icon:'🟢', type:'森林 · Lv.1', hp:30,  atk:[3,6],   def:0, xp:10,  gold:5,   loot:'史萊姆核心', diff:1, boss:false},
      {id:'goblin',   name:'哥布林',  icon:'👺', type:'森林 · Lv.2', hp:45,  atk:[5,9],   def:1, xp:18,  gold:8,   loot:'哥布林耳環', diff:1, boss:false},
      {id:'bat',      name:'吸血蝙蝠',icon:'🦇', type:'森林 · Lv.3', hp:38,  atk:[6,10],  def:1, xp:22,  gold:10,  loot:'蝙蝠翅膀',   diff:1, boss:false},
      {id:'wolf',     name:'野狼',    icon:'🐺', type:'森林 · Lv.4', hp:60,  atk:[8,14],  def:2, xp:30,  gold:15,  loot:'狼牙',       diff:2, boss:false},
      {id:'treant',   name:'樹人',    icon:'🌳', type:'精英 · Lv.5', hp:120, atk:[12,18], def:5, xp:80,  gold:40,  loot:'古樹之心',   diff:2, boss:true },
    ]
  },
  {
    id:'cave', name:'黑暗洞窟', icon:'🕳️', lvReq:5, color:'#3a2a1a',
    monsters:[
      {id:'bat_l',    name:'巨型蝙蝠',icon:'🦇', type:'洞窟 · Lv.5', hp:80,  atk:[12,18], def:3,  xp:45,  gold:22,  loot:'洞窟結晶',   diff:2, boss:false},
      {id:'spider',   name:'毒蜘蛛',  icon:'🕷️', type:'洞窟 · Lv.6', hp:70,  atk:[14,20], def:2,  xp:50,  gold:25,  loot:'蜘蛛絲',     diff:2, boss:false},
      {id:'skeleton', name:'骷髏兵',  icon:'💀', type:'洞窟 · Lv.7', hp:95,  atk:[16,24], def:4,  xp:60,  gold:30,  loot:'枯骨',       diff:2, boss:false},
      {id:'golem',    name:'石像鬼',  icon:'🗿', type:'洞窟 · Lv.8', hp:150, atk:[18,26], def:8,  xp:85,  gold:45,  loot:'石魔之核',   diff:3, boss:false},
      {id:'cave_boss',name:'洞窟龍',  icon:'🐉', type:'BOSS · Lv.9', hp:320, atk:[28,42], def:12, xp:250, gold:120, loot:'龍鱗',       diff:3, boss:true },
    ]
  },
  {
    id:'castle', name:'魔王要塞', icon:'🏰', lvReq:12, color:'#2a1a3a',
    monsters:[
      {id:'dark_knight',  name:'黑暗騎士', icon:'🗡️', type:'要塞 · Lv.12',hp:200, atk:[35,52], def:15,xp:160, gold:90,  loot:'黑鐵碎片', diff:3,boss:false},
      {id:'witch',        name:'邪惡女巫', icon:'🧙', type:'要塞 · Lv.14',hp:170, atk:[42,60], def:10,xp:185, gold:100, loot:'魔女之眼', diff:3,boss:false},
      {id:'demon',        name:'惡魔使者', icon:'😈', type:'要塞 · Lv.16',hp:260, atk:[48,70], def:18,xp:220, gold:130, loot:'惡魔之骨', diff:3,boss:false},
      {id:'skeleton_k',   name:'骷髏騎士', icon:'💀', type:'要塞 · Lv.21',hp:460, atk:[75,108],def:28,xp:430, gold:240, loot:'死靈護甲', diff:3,boss:false},
      {id:'fire_dragon',  name:'炎龍幼體', icon:'🐲', type:'要塞 · Lv.22',hp:620, atk:[88,120],def:35,xp:550, gold:300, loot:'龍鱗碎片', diff:4,boss:false},
      {id:'lich',         name:'巫妖術士', icon:'🧟‍♂️',type:'精英 · Lv.23',hp:580, atk:[95,135],def:25,xp:620, gold:350, loot:'巫妖魔典', diff:4,boss:false},
      {id:'demon_lord_l', name:'魔王近衛', icon:'👿', type:'精英 · Lv.24',hp:800, atk:[105,150],def:40,xp:800,gold:500,  loot:'魔王符文', diff:5,boss:false},
      {id:'demon_lord',   name:'魔王索瑪', icon:'👹', type:'BOSS · Lv.25',hp:2000,atk:[130,180],def:55,xp:2500,gold:2000,loot:'封印之冠',diff:5,boss:true },
    ]
  },
];

let _selectedTown  = null;
let _createTown    = null;
let _createMonster = null;
let _combatMode    = 'solo';
let _currentMonster= null;

let _autoRunning = false;
let _autoRemain  = 0;
let _autoDone    = 0;
let _autoTimer   = null;
let _combatSpeed = 800;
let _roundNum    = 0;

let _multiCombatState = {
  enemies: [],
  party: [],
  turnOrder: [],
  currentTurn: null,
  floor: 1
};

const _hp  = () => (isFinite(state.char?.hp)       ? state.char.hp       : 0);
const _mhp = () => (isFinite(state.char?.effMaxHp)  ? state.char.effMaxHp : (isFinite(state.char?.maxHp) ? state.char.maxHp : 1));
const _mp  = () => (isFinite(state.char?.mp)        ? state.char.mp       : 0);
const _mmp = () => (isFinite(state.char?.effMaxMp)  ? state.char.effMaxMp : (isFinite(state.char?.maxMp) ? state.char.maxMp : 1));

// ════════════════════════════════════════════
//  COMBAT MODE TABS
// ════════════════════════════════════════════
function setCombatMode(mode) {
  _combatMode = mode;
  document.querySelectorAll('.combat-mode-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.combat-mode-pane').forEach(p=>p.classList.remove('active'));
  document.getElementById('cmtab-'+mode)?.classList.add('active');
  document.getElementById('cm-'+mode)?.classList.add('active');
  if(mode==='multi'){ renderCreateTownGrid(); refreshMultiRooms(); }
}

function setMultiTab(tab) {
  document.querySelectorAll('.multi-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('mtab-'+tab)?.classList.add('active');
  ['find','create','room'].forEach(t=>{
    const p=document.getElementById('mtab-pane-'+t);
    if(!p) return;
    const show=(t===tab);
    p.style.display = show?'block':'none';
    if(show) p.classList.add('active'); else p.classList.remove('active');
  });
}

// ════════════════════════════════════════════
//  TOWN & MONSTER GRID BUILDERS
// ════════════════════════════════════════════
function _buildTownGrid(containerId, getSelected, onClickFn) {
  const lv   = state.char?.level || 1;
  const grid = document.getElementById(containerId);
  if(!grid) return;
  const sel  = getSelected();
  grid.innerHTML = TOWNS.map(t => {
    const ok  = lv >= t.lvReq;
    const act = sel === t.id;
    return `<div class="town-card ${!ok?'locked':''} ${act?'active':''}" onclick="${ok?onClickFn+'(\''+t.id+'\')':''}" style="${act?'border-color:var(--border-gold-hi);background:var(--bg4);':''} ${!ok?'opacity:.4;cursor:not-allowed;':''}">
      <span style="font-size:1.8rem">${t.icon}</span>
      <div class="town-name">${t.name}</div>
      <div class="town-lv" style="font-family:'DotGothic16',monospace;font-size:.65rem;color:var(--text-dim)">Lv.${t.lvReq}+</div>
    </div>`;
  }).join('');
}

function _buildMonsterList(listId, wrapId, iconId, nameId, subId, townId, onClickFn, selectedId=null) {
  const wrap = document.getElementById(wrapId);
  const list = document.getElementById(listId);
  if(!wrap||!list) return;
  if(!townId){ wrap.style.display='none'; return; }
  wrap.style.display='block';
  const t = TOWNS.find(x=>x.id===townId);
  if(!t){ wrap.style.display='none'; return; }
  const _t=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  _t(iconId, t.icon); _t(nameId, t.name+'的怪物'); _t(subId,'選擇目標出擊');
  const stars = m => '★'.repeat(m.diff)+'☆'.repeat(Math.max(0,5-m.diff));
  list.innerHTML = t.monsters.map(m=>{
    const isSel = m.id===selectedId;
    let btnHtml = '';
    if(onClickFn==='enterCombatSolo') {
      btnHtml = `<button class="monster-fight-btn" onclick="event.stopPropagation();enterCombatSolo('${m.id}')">出擊</button>`;
    } else if(onClickFn==='selectCreateMonster') {
      btnHtml = isSel ? `<button class="monster-fight-btn" style="opacity:1;transform:none;background:var(--gold);color:var(--bg)">✓ 已選</button>`
                      : `<button class="monster-fight-btn" onclick="event.stopPropagation();selectCreateMonster('${m.id}')">選擇</button>`;
    }
    let rowStyle = isSel ? 'background:rgba(240,192,64,.15); border-left:3px solid var(--gold);' : '';
    return `<div class="monster-row ${m.boss?'boss':''} ${isSel?'active':''}" onclick="${onClickFn}('${m.id}')" style="${rowStyle}">
      <span class="monster-icon">${m.icon}</span>
      <div class="monster-info">
        <div class="monster-name">${m.boss?'👑 ':''}${m.name}
          <span class="diff-stars ${m.diff>=4?'hard':''}">${stars(m)}</span></div>
        <div class="monster-type">${m.type}</div>
        <div class="monster-stats">
          <span class="monster-stat hp">❤️ HP ${m.hp}</span>
          <span class="monster-stat atk">⚔️ ATK ${m.atk[0]}-${m.atk[1]}</span>
          <span class="monster-stat xp">✨ EXP ${m.xp}</span>
          <span class="monster-stat gold">💰 ${m.gold}</span>
        </div>
        <div class="monster-loot">✦ ${m.loot}</div>
      </div>
      ${btnHtml}
    </div>`;
  }).join('');
}

function renderTownGrid() {
  _buildTownGrid('town-grid', ()=>_selectedTown, 'selectTown');
}
function selectTown(tid) {
  _selectedTown = (_selectedTown===tid) ? null : tid;
  renderTownGrid();
  _buildMonsterList('monster-list','monster-section-wrap','monster-section-icon','monster-section-name','monster-section-sub',_selectedTown,'enterCombatSolo');
}
function enterCombatSolo(mid) {
  const t=TOWNS.find(x=>x.id===_selectedTown);
  const m=t?.monsters.find(x=>x.id===mid);
  if(!m||!state.char) return;
  openCombatOverlay(m);
}

function renderCreateTownGrid() {
  _buildTownGrid('create-town-grid', ()=>_createTown, 'selectCreateTown');
}
function selectCreateTown(tid) {
  _createTown = (_createTown===tid) ? null : tid;
  _createMonster = null;
  renderCreateTownGrid();
  _buildMonsterList('create-monster-list','create-monster-wrap','create-monster-icon','create-monster-name','create-monster-sub',_createTown,'selectCreateMonster', null);
}
function selectCreateMonster(mid) {
  const t=TOWNS.find(x=>x.id===_createTown);
  _createMonster = t?.monsters.find(x=>x.id===mid);
  if(_createMonster) {
    notify('目標：'+_createMonster.name,'ok');
    _buildMonsterList('create-monster-list','create-monster-wrap','create-monster-icon','create-monster-name','create-monster-sub',_createTown,'selectCreateMonster', _createMonster.id);
  }
}

function initCombatPanel() {
  renderTownGrid();
  if(!_selectedTown){ _selectedTown=TOWNS[0].id; renderTownGrid(); selectTown(TOWNS[0].id); }
  _buildMonsterList('monster-list','monster-section-wrap','monster-section-icon','monster-section-name','monster-section-sub',_selectedTown,'enterCombatSolo');
}

// ════════════════════════════════════════════
//  MULTI ROOM ACTIONS
// ════════════════════════════════════════════
let _mcJobs = new Set();

function setMCPrivacy(isPrivate) {
  document.getElementById('mc-private').value = isPrivate?'1':'0';
  document.getElementById('mc-pub-btn').classList.toggle('sel',!isPrivate);
  document.getElementById('mc-priv-btn').classList.toggle('sel', isPrivate);
}
function toggleJobChip(el) {
  el.classList.toggle('sel');
  const j=el.dataset.job;
  el.classList.contains('sel') ? _mcJobs.add(j) : _mcJobs.delete(j);
}

async function doCreateMultiRoom() {
  if(!state.char)    return notify('請先選擇角色','err');
  if(!_createTown)   return notify('請先選擇城鎮','err');
  if(!_createMonster)return notify('請先選擇怪物','err');
  const title=document.getElementById('mc-title')?.value.trim()||'';
  const priv =document.getElementById('mc-private')?.value==='1';
  const minLv=parseInt(document.getElementById('mc-min-lv')?.value)||0;
  const jobs =[..._mcJobs];
  try {
    const r = await AC_API.createRoom(state.char.id,1,4,priv,title,{
      minLevel:minLv||undefined, requiredJobs:jobs.length?jobs:undefined,
      targetTown:_createTown, targetMonster:_createMonster.id,
    });
    state.roomCode = String(r.roomCode).toUpperCase();
    state.roomId = r.roomId;
    state.isLeader = true;
    _showRoomView(state.roomCode,title||state.roomCode,priv,minLv,jobs);
    joinRoomSocket(state.roomCode);
    notify('房間創建成功！','ok');
  } catch(e){ notify(e.message,'err'); }
}

async function doJoinMultiRoom() {
  const code=document.getElementById('mc-join-code')?.value.trim().toUpperCase();
  if(!code||!state.char) return notify(!code?'請輸入代碼':'請先選角色','err');
  try {
    const r=await AC_API.joinRoom(code,state.char.id);
    const info=await AC_API.getRoomInfo(r.roomCode);
    state.roomCode = String(r.roomCode).toUpperCase();
    state.roomId = r.roomId;
    state.isLeader = false;
    _showRoomView(state.roomCode,info.room_title||code,!!info.is_private,info.min_level,info.required_jobs);
    joinRoomSocket(state.roomCode);
  } catch(e){ notify(e.message,'err'); }
}

async function refreshMultiRooms() {
  const list=document.getElementById('multi-room-list'); if(!list) return;
  list.innerHTML='<div style="font-family:\'DotGothic16\',monospace;font-size:.75rem;color:var(--text-dim);text-align:center;padding:12px">載入中…</div>';
  try {
    const rooms=await AC_API.listRooms();
    if(!rooms.length){ list.innerHTML='<div style="font-family:\'DotGothic16\',monospace;font-size:.75rem;color:var(--text-dim);text-align:center;padding:14px">暫無公開房間</div>'; return; }
    list.innerHTML=rooms.map(r=>{
      const tags=[];
      if(r.min_level) tags.push(`Lv.${r.min_level}+`);
      if(r.required_jobs?.length) tags.push(...r.required_jobs.map(j=>JOB_NAMES[j]||j));
      const tagHtml=tags.length?`<div class="room-tags">${tags.map(t=>`<span class="room-tag req">${t}</span>`).join('')}</div>`:'';
      return `<div class="room-card"><div>
        <div class="room-code">${r.room_title||r.room_code}</div>
        <div class="room-info">${r.leader_name} · ${r.member_count}/${r.max_players||4}人 · ${r.room_code}</div>
        ${tagHtml}</div>
        <button class="btn btn-sm" onclick="quickJoinMulti('${r.room_code}')">加入</button></div>`;
    }).join('');
  } catch(e){ list.innerHTML='<div style="font-family:\'DotGothic16\',monospace;font-size:.75rem;color:var(--red);text-align:center;padding:10px">載入失敗</div>'; }
}

async function quickJoinMulti(code) {
  if(!state.char) return notify('請先選角色','err');
  try {
    const r=await AC_API.joinRoom(code,state.char.id);
    const info=await AC_API.getRoomInfo(r.roomCode);
    state.roomCode = String(r.roomCode).toUpperCase();
    state.roomId = r.roomId;
    state.isLeader = false;
    _showRoomView(state.roomCode,info.room_title||code,!!info.is_private,info.min_level,info.required_jobs);
    joinRoomSocket(state.roomCode);
  } catch(e){ notify(e.message,'err'); }
}

function _showRoomView(code,title,isPrivate,minLv,jobs) {
  const tab=document.getElementById('mtab-room'); if(tab) tab.style.display='';
  setMultiTab('room');
  const _t=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  _t('mr-code',code); _t('mr-title-lbl',title||code);
  const pb=document.getElementById('mr-privacy-badge'); if(pb) pb.textContent=isPrivate?'🔒 私人':'🌐 公開';
  const rqs=document.getElementById('mr-reqs');
  if(rqs){ const tags=[]; if(minLv) tags.push(`Lv.${minLv}+`); if(jobs?.length) tags.push(...jobs.map(j=>JOB_NAMES[j]||j)); rqs.innerHTML=tags.map(t=>`<span class="room-tag req">${t}</span>`).join(''); }
  const startBtn = document.getElementById('mr-start-btn');
  if(startBtn) {
    startBtn.classList.toggle('hide', !state.isLeader);
    startBtn.textContent = '▶ 等待準備...';
    startBtn.style.opacity = '0.5';
  }
  _refreshRoomMembers();
}

async function _refreshRoomMembers() {
  if(!state.roomCode) return;
  try{ const r=await AC_API.getRoomInfo(state.roomCode); renderMultiMembers(r.members); }catch{}
}

function renderMultiMembers(members) {
  const el=document.getElementById('mr-members'); if(!el) return;
  el.innerHTML=members.map(m=>{
    const isMe = Number(m.character_id) === Number(state.char.id);
    let kickBtn = '';
    if (state.isLeader && !isMe) {
      kickBtn = `<button class="btn btn-sm btn-red" style="padding:2px 6px;font-size:0.6rem;min-height:0;margin-left:6px" onclick="kickPlayer(${m.character_id})">踢出</button>`;
    }
    return `<div class="member-row">
      <span class="member-icon">${JOB_ICONS[m.job]||'⚔️'}</span>
      <div><div class="member-name">${m.name}</div>
      <div class="member-job">${JOB_NAMES[m.job]||m.job} · Lv.${m.level}</div></div>
      ${Number(m.is_leader)===1
        ? `<span style="font-family:'DotGothic16',monospace;font-size:.7rem;color:var(--gold);margin-left:auto">👑 隊長</span>`
        : Number(m.is_ready)===1
          ? `<span class="member-ready" style="margin-left:auto">✓ 準備</span>${kickBtn}`
          : `<span class="member-notready" style="margin-left:auto">⏳ 未準備</span>${kickBtn}`}
    </div>`;
  }).join('');

  if(state.isLeader) {
    const allReady = members.every(m => Number(m.is_leader)===1 || Number(m.is_ready)===1);
    const startBtn = document.getElementById('mr-start-btn');
    if(startBtn) {
      startBtn.textContent = allReady ? '▶ 全員準備，開始！' : '▶ 等待準備...';
      startBtn.style.opacity = allReady ? '1' : '0.5';
    }
  }
}

window.kickPlayer = function(id) {
  if (state.socket && state.roomCode) {
    state.socket.emit('room:kick', { roomCode: state.roomCode, targetId: id });
  }
};

function toggleReady(){
  if(!state.socket){ notify('未連線到伺服器','err'); return; }
  if(!state.roomCode){ notify('請先加入房間','err'); return; }
  state.socket.emit('room:ready', { roomCode: state.roomCode });
}

function startDungeon(){
  if(!state.socket || !state.roomCode) return;
  state.socket.emit('dungeon:start', { roomCode: state.roomCode });
}

function leaveMultiRoom() {
  if (state.socket && state.roomCode) {
    state.socket.emit('room:leave', { roomCode: state.roomCode });
  }
  state.roomCode=null; state.roomId=null; state.isLeader=false;
  const tab=document.getElementById('mtab-room'); if(tab) tab.style.display='none';
  setMultiTab('find'); refreshMultiRooms();
}

function joinRoomSocket(roomCode){
  if(!state.socket && typeof connectGameSocket === 'function') {
    connectGameSocket();
  }
  let retries = 0;
  const tryJoin = setInterval(() => {
    if(state.socket && state.socket.connected && state.char) {
      clearInterval(tryJoin);
      state.socket.emit('room:join', { roomCode: String(roomCode).toUpperCase(), characterId: state.char.id });
    }
    retries++;
    if (retries > 20) clearInterval(tryJoin);
  }, 200);
}

// ════════════════════════════════════════════
//  COMBAT OVERLAY VISIBILITY CONTROL
// ════════════════════════════════════════════
function applyCombatUIVisibility() {
  const autoBar   = document.querySelector('.cov-auto-bar');
  const bottomBar = document.querySelector('.cov-bottom');
  // 多人非隊長：隱藏自動按鈕 (由 server 控制)
  if (_combatMode === 'multi' && !state.isLeader) {
    if (autoBar)   autoBar.style.display   = 'none';
    if (bottomBar) bottomBar.style.display = 'none';
  } else {
    if (autoBar)   autoBar.style.display   = 'flex';
    if (bottomBar) bottomBar.style.display = 'flex';
  }
}

// ════════════════════════════════════════════
//  COMBAT OVERLAY — SOLO  ✅ BUG FIX: 加了 _combatMode = 'solo'
// ════════════════════════════════════════════
function openCombatOverlay(monsterData) {
  if(!state.char) return;
  _combatMode     = 'solo';          // ← BUG FIX #1: 強制重設為 solo 模式
  _currentMonster = monsterData;
  _roundNum = 0; _autoRunning = false; _autoDone = 0;

  applyCombatUIVisibility();

  document.getElementById('cov-progress').style.display='none';
  _txt('cov-start-btn','▶ 開始戰鬥');
  const fleeBtn = document.querySelector('.cov-flee-btn');
  if(fleeBtn) { fleeBtn.innerHTML = '⚡ 逃跑'; fleeBtn.onclick = doFlee; }
  document.getElementById('combat-overlay')?.classList.add('active');
  _startRound(monsterData);
}

// ════════════════════════════════════════════
//  COMBAT OVERLAY — MULTI
// ════════════════════════════════════════════
function openMultiCombatOverlay(floor, enemies, party) {
  if(!state.char) return;
  _roundNum = 0; _autoRunning = false; _autoDone = 0; _autoRemain = 0;
  _combatMode = 'multi';

  _multiCombatState = {
    enemies: enemies || [],
    party:   party   || [],
    turnOrder: [],
    currentTurn: null,
    floor: floor
  };

  applyCombatUIVisibility();

  const firstEnemy = enemies?.[0] || { name:'未知敵人', icon:'👹', maxHp:100, currentHp:100 };
  _currentMonster = null;

  const prog=document.getElementById('cov-progress'); if(prog) prog.style.display='none';
  _txt('cov-start-btn','⏳ 等待出手...');
  const fleeBtn = document.querySelector('.cov-flee-btn');
  if(fleeBtn) { fleeBtn.innerHTML = '⚡ 逃跑'; fleeBtn.onclick = doFlee; }

  _updateAutoLabel();
  document.getElementById('combat-overlay')?.classList.add('active');

  state.combat = {
    active: true,
    enemy: {
      name:      firstEnemy.name    || '未知敵人',
      icon:      firstEnemy.icon    || '👹',
      hp:        firstEnemy.maxHp   || 100,
      currentHp: firstEnemy.currentHp || firstEnemy.maxHp || 100
    },
    myTurn: false
  };

  _updateMultiCombatUI();

  const lg=document.getElementById('cov-log'); if(lg) lg.innerHTML='';
  _covLog('sys', `⚔️ 第 ${floor} 層戰鬥開始！`);

  _txt('cov-round',     `第 ${floor} 層`);
  _txt('cov-enemy-tag', `⚔️ ${firstEnemy.name || '敵人'}`);
  _txt('cov-e-icon',    firstEnemy.icon || '👹');
  _txt('cov-e-name',    firstEnemy.name || '敵人');
  _txt('cov-e-type',    `第 ${floor} 層`);
}

// ════════════════════════════════════════════
//  ROUND LOGIC — SOLO
// ════════════════════════════════════════════
function _startRound(monsterData) {
  _roundNum++;
  const e = { ...monsterData, currentHp: monsterData.hp };
  state.combat = { active:true, enemy:e, myTurn:true };
  _txt('cov-round',     `Round ${_roundNum}`);
  _txt('cov-enemy-tag', `⚔️ ${e.name}`);
  _refreshUI();
  renderCombatSkills(true, false);

  const ind = document.getElementById('c-turn-ind');
  if(ind){ ind.textContent='⚔ 輪到你出擊！'; ind.className='turn-indicator my'; }
}

function toggleCombatAuto() {
  if(!state.combat?.active) {
    if (_combatMode === 'multi') {
      if (state.isLeader) state.socket.emit('combat:request_restart', { roomCode: state.roomCode });
      return;
    }
    if(_currentMonster) openCombatOverlay(_currentMonster);
    else return;
    // openCombatOverlay 會自動 _startRound，不需要繼續
    _autoRunning = true;
    _txt('cov-start-btn','⏸ 暫停');
    _updateAutoLabel();
    _schedulePlayer();
    return;
  }

  _autoRunning = !_autoRunning;
  _txt('cov-start-btn', _autoRunning ? '⏸ 暫停' : '▶ 繼續');
  _updateAutoLabel();

  if (_combatMode === 'multi' && state.isLeader) {
    const n = Math.max(1, parseInt(document.getElementById('cov-count')?.value)||10);
    if(_autoRunning && _autoDone === 0) _autoRemain = n;
    state.socket.emit('combat:host_auto', { roomCode: state.roomCode, autoState: _autoRunning, count: _autoRemain });
  }

  if(_autoRunning) _schedulePlayer();
  else clearTimeout(_autoTimer);
}

function exitCombat() {
  clearTimeout(_autoTimer); _autoRunning=false; state.combat={active:false};
  document.getElementById('combat-overlay')?.classList.remove('active');
}

// ════════════════════════════════════════════
//  AUTO LABEL & SPEED
// ════════════════════════════════════════════
function _updateAutoLabel() {
  const lbl = document.getElementById('cov-auto-lbl');
  if(lbl) lbl.textContent = _autoRunning ? '▶ 自動中' : '⏸ 已停止';
}

function setCombatSpeed(ms, btn) {
  _combatSpeed = ms;
  document.querySelectorAll('.cov-speed-btn').forEach(b=>b.classList.remove('sel'));
  if(btn) btn.classList.add('sel');
}

// ════════════════════════════════════════════
//  UI HELPERS
// ════════════════════════════════════════════
function _refreshUI() {
  const c = state.char, e = state.combat?.enemy;
  _txt('cov-p-name', c?.name || '勇者');
  _txt('cov-p-icon', typeof JOB_ICONS !== 'undefined' ? JOB_ICONS[c?.job]||'⚔️' : '⚔️');
  _txt('cov-p-hp',   `${c.hp}/${c.effMaxHp || c.maxHp}`);
  _txt('cov-p-mp',   `MP ${c.mp}/${c.effMaxMp || c.maxMp}`);
  _setBar('cov-p-hp-bar', (c.hp / (c.effMaxHp || c.maxHp)) * 100);
  _setBar('cov-p-mp-bar', (c.mp / (c.effMaxMp || c.maxMp)) * 100);
  if(e) {
    _txt('cov-e-hp', `${e.currentHp} / ${e.hp}`);
    _setBar('cov-e-hp-bar', (e.currentHp / e.hp) * 100);
    _txt('cov-e-name', e.name);
  }
}

function _txt(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function _setBar(id,pct){ const el=document.getElementById(id); if(el) el.style.width=Math.max(0,Math.min(100,pct))+'%'; }

function _covLog(type, msg) {
  const log=document.getElementById('cov-log');
  if(log){
    const d=document.createElement('div');
    d.className=`cov-entry ${type}`;
    d.textContent=msg;
    log.appendChild(d);
    log.scrollTop=log.scrollHeight;
    while(log.children.length > 80) log.removeChild(log.firstChild);
  }
}

function _floater(txt, cls, targetId) {
  const target = document.getElementById(targetId);
  if(!target) return;
  const el = document.createElement('div');
  el.className = `dmg-floater ${cls}`;
  el.textContent = txt;
  el.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    font-family:'DotGothic16',monospace;font-size:1.2rem;font-weight:bold;pointer-events:none;z-index:99;
    animation:floatUp .9s ease forwards;`;
  target.style.position = 'relative';
  target.appendChild(el);
  setTimeout(()=>el.remove(), 900);
}

function _flashCard(id, cls) {
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls), 350);
}

function _shakeEl(id) {
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('shake');
  setTimeout(()=>el.classList.remove('shake'), 350);
}

function _updateMultiCombatUI() {
  state.combat = state.combat || { active: true };
  if (!_multiCombatState.enemies?.length) return;

  const activeEnemy = _multiCombatState.enemies.find(e => e.currentHp > 0) || _multiCombatState.enemies[0];
  if (activeEnemy) {
    _txt('cov-round',     `第 ${_multiCombatState.floor} 層`);
    _txt('cov-enemy-tag', `⚔️ ${activeEnemy.name}`);
    _txt('cov-e-icon',    activeEnemy.icon || '👹');
    _txt('cov-e-name',    activeEnemy.name);
    const eHp = activeEnemy.currentHp || 0, eMhp = activeEnemy.maxHp || 1;
    _txt('cov-e-hp', `${eHp} / ${eMhp}`);
    _setBar('cov-e-hp-bar', Math.max(0, Math.min(100, (eHp/eMhp)*100)));
    state.combat.enemy = { name: activeEnemy.name, icon: activeEnemy.icon, currentHp: activeEnemy.currentHp, hp: activeEnemy.maxHp };
  }

  const myChar = _multiCombatState.party.find(p => Number(p.characterId) === Number(state.char?.id));
  if (myChar) { state.char.hp = myChar.hp; state.char.mp = myChar.mp; state.char.maxHp = myChar.maxHp; state.char.maxMp = myChar.maxMp; }
  _refreshUI();

  // 多人陣容條
  const partyHps = document.getElementById('c-party-hps');
  if(partyHps) {
    partyHps.innerHTML = _multiCombatState.party.map(p=>{
      const isCurrent = Number(p.characterId) === Number(_multiCombatState.currentTurn);
      const hpPct = Math.max(0, Math.min(100, (p.hp/p.maxHp)*100));
      return `<div class="party-hp-card">
        <div class="phc-name ${isCurrent?'active-turn':''}">${JOB_ICONS[p.job]||'⚔️'} ${p.name}</div>
        <div style="height:4px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:3px">
          <div style="height:100%;width:${hpPct}%;background:${hpPct>50?'var(--green)':hpPct>25?'var(--gold)':'var(--red)'};border-radius:2px;transition:width .3s"></div>
        </div>
        <div style="font-family:'DotGothic16',monospace;font-size:.6rem;color:var(--text-dim)">${p.hp}/${p.maxHp}</div>
      </div>`;
    }).join('');
  }
}

// ════════════════════════════════════════════
//  SKILL RENDERING & USAGE
// ════════════════════════════════════════════
function renderCombatSkills(myTurn, isMulti=false) {
  const c = state.char; if(!c) return;
  const skills = typeof window.getEquippedSkills === 'function' ? window.getEquippedSkills(c) : [];
  const el = document.getElementById('c-skills');
  if(!el) return;
  const learnedMap = Array.isArray(c.learnedSkills) ? {} : (c.learnedSkills || {});

  el.innerHTML = skills.map(sk => {
    if (!sk) return '';
    const noMp = sk.cost > 0 && _mp() < sk.cost;
    const dis  = !myTurn || noMp;
    const fn   = isMulti ? `useCombatSkillMulti('${sk.id}',${sk.cost})` : `useSoloCombatSkill('${sk.id}',${sk.cost})`;
    let lv = learnedMap[sk.id] || 1;
    return `<button class="sk-btn${myTurn?' my-turn':''}" ${dis?'disabled':''} onclick="${fn}">
      <span class="sn">${sk.icon} ${sk.name} <span style="font-size:0.6rem;color:var(--gold-dim)">Lv.${lv}</span></span>
      <span class="sc">${sk.cost>0?sk.cost+'MP':'免費'}</span>
      <span class="sd">${sk.dmg}</span>
    </button>`;
  }).join('');
}

function useSoloCombatSkill(skillId, mpCost) {
  if(!state.combat.myTurn||!state.combat.active) return;
  const c=state.char, e=state.combat.enemy;
  if(_mp() < mpCost) { notify('MP不足！','err'); return; }
  state.char.mp = Math.max(0, _mp() - mpCost);
  renderCombatSkills(false);
  const skills = typeof window.getEquippedSkills === 'function' ? window.getEquippedSkills(c) : [];
  const chosen = skills.find(s=>s?.id===skillId) || skills[0];
  _executeSkillEffect(c, e, chosen);
}

function useCombatSkillMulti(skillId, mpCost) {
  if(state.socket && state.roomCode) {
    state.combat.myTurn = false;
    renderCombatSkills(false, true);
    state.socket.emit('combat:action', { roomCode: state.roomCode, skillId, targetIdx: 0 });
  }
}

// ════════════════════════════════════════════
//  AUTO BATTLE ENGINE
// ════════════════════════════════════════════
function _schedulePlayer() {
  if(!_autoRunning || !state.combat?.active) return;
  clearTimeout(_autoTimer);
  _autoTimer = setTimeout(_doPlayerTurn, _combatSpeed);
}

function _doPlayerTurn() {
  if(!_autoRunning || !state.combat?.active) return;

  if (_combatMode === 'multi') {
    if (Number(_multiCombatState.currentTurn) !== Number(state.char.id)) return;
  } else {
    if (!state.combat.myTurn) return;
  }

  const c = state.char;
  const skills = typeof window.getEquippedSkills === 'function' ? window.getEquippedSkills(c) : [];
  const healSk = skills.find(s => s && (s.id==='heal' || s.id.includes('heal') || s.id==='revive'));
  let chosen   = skills[0];

  const hpRatio = _hp() / _mhp();
  if(healSk && hpRatio < 0.4 && _mp() >= healSk.cost) {
    chosen = healSk;
  } else {
    let best = null;
    for(const sk of skills) {
      if(!sk) continue;
      if(sk.id==='heal'||sk.id.includes('heal')||sk.id==='revive') continue;
      if(_mp() >= sk.cost) best = sk;
    }
    chosen = best || skills[0];
  }

  if(_combatMode === 'multi') {
    useCombatSkillMulti(chosen.id, chosen.cost);
  } else {
    state.char.mp = Math.max(0, _mp() - (chosen.cost||0));
    _executeSkillEffect(c, state.combat.enemy, chosen);
  }
}

function _executeSkillEffect(c, e, chosen) {
  if(!chosen) return;
  const learnedMap = Array.isArray(c.learnedSkills) ? {} : (c.learnedSkills || {});
  const skLv   = learnedMap[chosen.id] || 1;
  const lvMult = 1 + (skLv - 1) * 0.08;

  const isHeal = ['heal','revive','shield','skin','bless','barrier','evade','lifesteal','warcry'].some(k=>(chosen?.id||'').includes(k));

  if(isHeal) {
    let stat = c.effStats?.WIS || c.stats?.WIS || 10;
    if(c.job==='warrior') stat = c.effStats?.STR || 10;
    if(c.job==='rogue')   stat = c.effStats?.AGI || 10;
    if(c.job==='mage')    stat = c.effStats?.INT || 10;
    const baseMult = chosen.id==='revive' ? 2.5 : (chosen.cost > 20 ? 1.5 : 1.1);
    const heal = Math.floor((18 + stat * baseMult) * lvMult);
    state.char.hp = Math.min(_mhp(), _hp() + heal);
    _covLog('pl', `✨ ${chosen.name} (Lv.${skLv}) → 回復 ${heal} HP`);
    _floater('+'+heal, 'hl', 'cov-player'); _flashCard('cov-player','p-heal');
  } else {
    const isMagic = ['fire','frost','arcane','holy','divine','magic','chain','meteor','smite','blizzard','drain','purify'].some(k=>(chosen?.id||'').includes(k));
    const isAgi   = ['smoke','trap','assassin','shadow_step','poison','dagger','backstab'].some(k=>(chosen?.id||'').includes(k));

    let stat = c.effStats?.STR || c.stats?.STR || 10;
    if(isMagic) stat = c.effStats?.INT || c.stats?.INT || 10;
    else if(isAgi) stat = c.effStats?.AGI || c.stats?.AGI || 10;

    let base = Math.floor(Math.random()*10+6) + Math.floor(stat*0.5);
    if(chosen.cost > 25)      base += 20;
    else if(chosen.cost > 15) base += 12;
    else if(chosen.cost > 5)  base += 6;

    base = Math.floor(base * lvMult);
    base = Math.max(1, base - Math.floor((e.def||0)*0.35));

    const agi = c.effStats?.AGI || c.stats?.AGI || 8;
    let critChance = 0.12 + (agi * 0.005);
    if(chosen.id==='backstab' || chosen.id==='assassin') critChance += 0.3;

    const crit = Math.random() < critChance;
    const miss = Math.random() < 0.04;

    if(miss) {
      _covLog('pl', `${chosen?.icon||'⚔️'} ${chosen?.name} (Lv.${skLv}) → 未命中！`);
      _floater('MISS','ms','cov-enemy');
    } else {
      const dmg = crit ? Math.floor(base*1.8) : base;
      e.currentHp = Math.max(0, e.currentHp - dmg);
      _covLog('pl', `${chosen?.icon||'⚔️'} ${chosen?.name} (Lv.${skLv}) → ${dmg}${crit?' 會心！':''}`);
      _floater(crit?`💥${dmg}`:`-${dmg}`, crit?'cr':'pl', 'cov-enemy');
      _flashCard('cov-enemy','p-hit'); _shakeEl('cov-e-icon');
    }
  }

  state.char.mp = Math.min(_mmp(), _mp()+4);
  _refreshUI();

  if(e.currentHp <= 0) { _onVictory(); return; }

  if(!_autoRunning) {
    const ind = document.getElementById('c-turn-ind');
    if(ind){ ind.textContent='敵人回合...'; ind.className='turn-indicator wait'; }
    setTimeout(_doEnemyTurn, 900);
  } else {
    _autoTimer = setTimeout(_doEnemyTurn, Math.max(150, _combatSpeed*0.55));
  }
}

function _doEnemyTurn() {
  if(!state.combat?.active) return;
  const c=state.char, e=state.combat.enemy;
  const [mn,mx]=e.atk.map(Number);
  let dmg = Math.floor(Math.random()*(mx-mn+1))+mn;

  const def = c.effStats?.DEF || c.stats?.DEF || 0;
  const agi = c.effStats?.AGI || c.stats?.AGI || 8;

  dmg = Math.max(1, dmg - Math.floor(def*0.35));
  const miss = Math.random() < 0.05 + (agi * 0.003);

  if(miss) {
    _covLog('en', `${e.name} → 閃避！`); _floater('MISS','ms','cov-player');
  } else {
    state.char.hp = Math.max(0, _hp()-dmg);
    _covLog('en', `${e.name} → ${dmg}傷害`);
    _floater('-'+dmg,'en','cov-player'); _flashCard('cov-player','p-hit'); _shakeEl('cov-p-icon');
  }
  _refreshUI();
  if(_hp()<=0){ _onDefeat(); return; }

  state.combat.myTurn = true;
  if(!_autoRunning) {
    const ind = document.getElementById('c-turn-ind');
    if(ind){ ind.textContent='⚔ 輪到你出擊！'; ind.className='turn-indicator my'; }
    renderCombatSkills(true);
  } else {
    _schedulePlayer();
  }
}

function doFlee() { exitCombat(); if(_combatMode==='multi') leaveMultiRoom(); }

// ════════════════════════════════════════════
//  VICTORY / DEFEAT
// ════════════════════════════════════════════
async function _onVictory() {
  clearTimeout(_autoTimer);
  state.combat.active = false;
  state.combat.myTurn = false;
  const e = state.combat.enemy;

  _covLog('win', `✦ 勝利！擊敗 ${e.name}！`);
  notify(`⚔️ 勝利！+${e.xp||0}EXP +${e.gold||0}G`, 'ok');
  _flashCard('cov-enemy','p-hit');

  // 更新最近戰績
  if(typeof appendStory === 'function') {
    appendStory('reward', `⚔ 擊敗 ${e.name} → +${e.xp||0}EXP +${e.gold||0}G`);
  }

  // 儲存獎勵到 server
  try {
    const res = await AC_API.soloReward(state.char.id, {
      xp:   e.xp   || 0,
      gold: e.gold  || 0,
      loot: e.loot  || '',
      hp:   state.char.hp,
      mp:   state.char.mp
    });
    // server 返回 { character: {...}, leveledUp: bool }，需要取 .character
    const updated = res?.character || res;
    // 確保 updated 係有效角色物件（有 id、name、job）才整體替換 state.char
    if(updated && updated.id && updated.name && updated.job) {
      // 補回 server 可能冇回傳嘅欄位，防止 refreshSidebar 出 undefined
      updated.equipment     = updated.equipment     || state.char.equipment     || [];
      updated.learnedSkills = updated.learnedSkills || state.char.learnedSkills || {};
      updated.stats         = updated.stats         || state.char.stats         || {};
      updated.hp            = updated.hp            ?? state.char.hp;
      updated.mp            = updated.mp            ?? state.char.mp;
      state.char = updated;
      if(res?.leveledUp) notify('🎉 升級了！現在是 Lv.' + updated.level + '！', 'ok');
    } else {
      // server 回應格式有問題 → 只本地補數值，保留原有 state.char
      state.char.xp   = (state.char.xp   || 0) + (e.xp   || 0);
      state.char.gold = (state.char.gold || 0) + (e.gold || 0);
    }
  } catch(err) {
    // 網絡失敗 → 只本地補數值，保留原有 state.char
    state.char.xp   = (state.char.xp   || 0) + (e.xp   || 0);
    state.char.gold = (state.char.gold || 0) + (e.gold || 0);
  }
  // 無論成功失敗都刷新 UI
  if(typeof refreshSidebar === 'function') refreshSidebar();

  // 自動重複
  if(_autoRunning) {
    _autoDone++;
    _autoRemain = Math.max(0, _autoRemain-1);
    const doneEl = document.getElementById('cov-done');
    if(doneEl) doneEl.textContent = _autoDone;
    document.getElementById('cov-progress').style.display = 'flex';
    _txt('cov-total', _autoDone + _autoRemain);

    if(_autoRemain > 0) {
      setTimeout(()=>{ if(_autoRunning && _currentMonster) openCombatOverlay(_currentMonster); }, 400);
    } else {
      _autoRunning = false;
      _txt('cov-start-btn','▶ 開始戰鬥');
      _updateAutoLabel();
      notify('✦ 自動戰鬥完成！', 'ok');
    }
  } else {
    _txt('cov-start-btn','▶ 再戰一場');
  }
}

async function _onDefeat() {
  clearTimeout(_autoTimer);
  state.combat.active = false;
  _autoRunning = false;
  _covLog('lose', `☠ 被 ${state.combat.enemy?.name||'敵人'} 擊敗...`);
  notify('☠ 戰鬥失敗！', 'err');
  _txt('cov-start-btn','▶ 再試一次');
  _updateAutoLabel();
  try { await AC_API.saveHpMp(state.char.id, Math.floor((state.char.effMaxHp||100)*0.2), state.char.mp); } catch{}
}

// ════════════════════════════════════════════
//  SOCKET LISTENERS  ✅ BUG FIX #2: 多人副本修復
// ════════════════════════════════════════════
let _combatExtraSocketBound = false;
function initCombatExtraSockets() {
  if (_combatExtraSocketBound || !state.socket) return setTimeout(initCombatExtraSockets, 500);
  _combatExtraSocketBound = true;
  const s = state.socket;

  // ── BUG FIX #2a: dungeon:countdown 改用 notify，不依賴按鈕存在 ──
  s.on('dungeon:countdown', ({ seconds }) => {
    let sec = seconds;

    // 更新 room 內按鈕（如果存在）
    const btn = document.getElementById('mr-start-btn');
    if(btn) { btn.disabled = true; btn.textContent = `⏳ 戰鬥倒數 ${sec}...`; }

    notify(`⚔️ 戰鬥即將開始！倒數 ${sec} 秒...`, 'ok');

    if (window._dungeonCdIntv) clearInterval(window._dungeonCdIntv);
    window._dungeonCdIntv = setInterval(() => {
      sec--;
      if(sec > 0) {
        if(btn) btn.textContent = `⏳ 戰鬥倒數 ${sec}...`;
      } else {
        clearInterval(window._dungeonCdIntv);
        if(btn) { btn.disabled = false; btn.textContent = '▶ 開始戰鬥！'; }
      }
    }, 1000);
  });

  // ── BUG FIX #2b: combat:start 先確保在 game 畫面 ──
  s.on('combat:start', (payload) => {
    _combatMode = 'multi';

    // 確保在 game 畫面（combat overlay 是 game 畫面內的元素）
    if (typeof goScreen === 'function') goScreen('game');

    // 小延遲等 DOM 就位
    setTimeout(() => {
      if (typeof setMenu === 'function') setMenu('combat');
      openMultiCombatOverlay(payload.floor, payload.enemies, payload.party);

      _multiCombatState.turnOrder  = payload.turnOrder  || [];
      _multiCombatState.currentTurn = payload.currentTurn;

      const isMyTurn = Number(payload.currentTurn) === Number(state.char?.id);
      state.combat.myTurn = isMyTurn;
      renderCombatSkills(isMyTurn, true);

      const ind = document.getElementById('c-turn-ind');
      if(ind) {
        ind.classList.remove('hide');
        ind.textContent = isMyTurn ? '⚔ 輪到你出擊！' : '⏳ 等待隊友行動...';
        ind.className   = `turn-indicator ${isMyTurn?'my':'wait'}`;
      }

      if (_autoRunning && isMyTurn) _schedulePlayer();
      notify('⚔️ 戰鬥正式開始！', 'ok');
    }, 150);
  });

  s.on('combat:state', ({ enemies, party }) => {
    _multiCombatState.enemies = enemies;
    _multiCombatState.party   = party;
    _updateMultiCombatUI();
  });

  s.on('combat:turn', ({ currentTurn }) => {
    _multiCombatState.currentTurn = currentTurn;
    const isMyTurn = Number(currentTurn) === Number(state.char?.id);
    state.combat.myTurn = isMyTurn;
    renderCombatSkills(isMyTurn, true);

    const ind = document.getElementById('c-turn-ind');
    if(ind) {
      ind.classList.remove('hide');
      if(isMyTurn) {
        _covLog('sys', `⚔️ 輪到你行動！`);
        ind.textContent = '⚔ 輪到你出擊！';
        ind.className   = 'turn-indicator my';
        if(_autoRunning) _schedulePlayer();
      } else {
        const currentChar = _multiCombatState.party.find(p => Number(p.characterId) === Number(currentTurn));
        ind.textContent = currentChar ? `${currentChar.name} 行動中...` : '⏳ 等待...';
        ind.className   = 'turn-indicator wait';
      }
    }
  });

  s.on('combat:log', ({ type, msg }) => {
    const logType = type==='player' ? 'pl' : type==='enemy' ? 'en' : 'sys';
    _covLog(logType, msg);
  });

  s.on('combat:sync_auto', ({ autoState, count }) => {
    _autoRunning = autoState;
    if(autoState) {
      _autoRemain = count;
      _txt('cov-total', count);
      _txt('cov-done', 0);
      document.getElementById('cov-progress').style.display='flex';
      _txt('cov-start-btn','⏸ 暫停');
      _updateAutoLabel();
      if(state.combat?.myTurn) _schedulePlayer();
    } else {
      clearTimeout(_autoTimer);
      _txt('cov-start-btn','▶ 繼續');
      _updateAutoLabel();
    }
  });

  s.on('room:update', ({ members, status }) => {
    if(status === 'waiting') {
      // 戰鬥結束，返回房間視圖
      exitCombat();
      if(typeof renderMultiMembers === 'function') renderMultiMembers(members);
    } else {
      if(typeof renderMultiMembers === 'function') renderMultiMembers(members);
    }
  });

  s.on('room:kicked', ({ reason }) => {
    notify(reason, 'err');
    exitCombat();
    leaveMultiRoom();
  });

  s.on('combat:end', ({ result, rewards }) => {
    state.combat.active = false;
    if(result === 'victory') {
      notify(`✦ 副本勝利！+${rewards.xp}EXP +${rewards.gold}G`, 'ok');
      _covLog('win', `✦ 副本勝利！${rewards.xp}EXP · ${rewards.gold}G`);
      if(rewards.loot?.length) _covLog('win', `🎁 戰利品：${rewards.loot.join('、')}`);

      const fleeBtn = document.querySelector('.cov-flee-btn');
      if(fleeBtn) { fleeBtn.innerHTML = '🚪 離開'; fleeBtn.onclick = () => { exitCombat(); leaveMultiRoom(); }; }

      _txt('cov-start-btn', state.isLeader ? '▶ 發起再戰' : '⏳ 等待隊長...');

      if(state.isLeader) {
        _autoRemain--;
        if(_autoRunning && _autoRemain > 0) {
          setTimeout(() => { state.socket.emit('combat:request_restart', { roomCode: state.roomCode }); }, 1500);
        }
      }

      // 更新本地角色數據
      state.char.xp   = (state.char.xp   || 0) + rewards.xp;
      state.char.gold = (state.char.gold || 0) + rewards.gold;
      if(typeof refreshSidebar === 'function') refreshSidebar();

    } else {
      notify('☠ 全滅...2秒後返回房間', 'err');
      _covLog('lose', '☠ 全滅。隊伍即將傳回大廳。');
      _autoRunning = false;
      setTimeout(() => { exitCombat(); leaveMultiRoom(); }, 2000);
    }
  });

  s.on('combat:restart_vote', ({ seconds }) => {
    const btn = document.getElementById('cov-start-btn');
    if(!btn) return;
    let sec = seconds, voted = false;

    const render = () => {
      if(state.isLeader) {
        btn.textContent = `⏳ 等待隊友 (${sec})`;
        btn.disabled = true;
      } else {
        if(!voted) {
          btn.textContent = `▶ 確認再戰 (${sec})`;
          btn.disabled = false;
          btn.onclick = () => {
            voted = true; btn.disabled = true;
            btn.textContent = `✅ 已確認 (${sec})`;
            state.socket.emit('combat:vote_yes', { roomCode: state.roomCode });
          };
        } else {
          btn.textContent = `✅ 已確認 (${sec})`;
        }
      }
    };

    if(window._voteCdIntv) clearInterval(window._voteCdIntv);
    window._voteCdIntv = setInterval(() => {
      sec--;
      if(sec >= 0) render(); else clearInterval(window._voteCdIntv);
    }, 1000);
    render();

    if(_autoRunning && !state.isLeader) {
      setTimeout(() => {
        if(!voted && state.combat && !state.combat.active) {
          voted = true;
          if(btn) { btn.disabled = true; btn.textContent = `✅ 已自動確認`; }
          state.socket.emit('combat:vote_yes', { roomCode: state.roomCode });
        }
      }, 1500);
    }
  });

  s.on('dungeon:completed', () => {
    notify('🏆 副本全部通關！', 'ok');
    _covLog('win', '🏆 全部樓層通關！');
    exitCombat();
  });
}
initCombatExtraSockets();
