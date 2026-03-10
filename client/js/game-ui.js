// ════════════════════════════════════════════
//  COLLAPSIBLE UI CONTROLS
// ════════════════════════════════════════════
function toggleMenuNav() {
  const nav = document.getElementById('menu-nav');
  if (nav) nav.classList.toggle('collapsed');
}

function togglePlayerPanel() {
  const panel    = document.getElementById('player-panel');
  const backdrop = document.getElementById('player-backdrop');
  const fab      = document.getElementById('mob-player-fab');
  const isMobile = window.innerWidth <= 700;

  if (!panel) return;

  if (isMobile) {
    const isOpening = !panel.classList.contains('mob-open');
    if (isOpening) {
      panel.classList.add('mob-open');
      if (backdrop) backdrop.classList.add('show');
      if (fab) fab.style.display = 'none';
    } else {
      panel.classList.remove('mob-open');
      if (backdrop) backdrop.classList.remove('show');
      if (fab) fab.style.display = 'flex';
    }
  } else {
    panel.classList.toggle('collapsed');
  }
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 700) {
    const panel = document.getElementById('player-panel');
    const backdrop = document.getElementById('player-backdrop');
    const fab = document.getElementById('mob-player-fab');
    if (panel) panel.classList.remove('mob-open');
    if (backdrop) backdrop.classList.remove('show');
    if (fab) fab.style.display = '';
  }
});

function toggleChatBar() {
  const bar   = document.getElementById('chat-bar');
  const badge = document.getElementById('chat-badge');
  if (!bar) return;
  
  bar.classList.toggle('expanded');
  if (bar.classList.contains('expanded') && badge) {
    badge.textContent = '0';
    badge.classList.remove('show');
  }
}

function togglePPSec(hdr) {
  const body  = hdr.nextElementSibling;
  const arrow = hdr.querySelector('.pp-sec-arrow');
  if (body) {
    body.classList.toggle('closed');
    if (arrow) arrow.style.transform = body.classList.contains('closed') ? 'rotate(-90deg)' : '';
  }
}

// ════════════════════════════════════════════
//  MENU SWITCHING
// ════════════════════════════════════════════
const MENU_HEADERS = {
  combat:  ['◆ 戰鬥副本',  '■ 選擇出擊方式'],
  gather:  ['◆ 採集活動',  '■ 選擇採集類型'],
  house:   ['◆ 房屋管理',  '■ 建造設施強化採集'],
  craft:   ['◆ 製作裝備',  '■ 打造武器與防具'],
  tools:   ['◆ 製作工具',  '■ 強化採集工具'],
  quests:  ['◆ 任務列表',  '■ 完成任務獲取獎勵'],
  friends: ['◆ 朋友列表',  '■ 一起冒險吧'],
};

function setMenu(tab) {
  document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-'+tab);
  if (panel) panel.classList.add('active');

  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('mbtn-'+tab);
  if (btn) btn.classList.add('active');

  if (tab === 'combat' && typeof initCombatPanel === 'function') {
    initCombatPanel();
  }

  const h = MENU_HEADERS[tab] || ['◆ 冒險', '■'];
  const t = document.getElementById('g-chapter');
  const s = document.getElementById('g-loc');
  if (t) t.textContent = h[0];
  if (s) s.textContent = h[1];
}

// ════════════════════════════════════════════
//  SKILL EQUIP SYSTEM
// ════════════════════════════════════════════
window.getAvailableActiveSkills = function(c) {
  if(!c) return [];
  const db = typeof JOB_SKILLS_DB !== 'undefined' ? JOB_SKILLS_DB[c.job] || [] : [];
  
  const learned = c.learnedSkills || {};
  const learnedIds = Array.isArray(learned) ? learned : Object.keys(learned);
  
  return db.filter(sk => sk.id === 'basic_atk' || learnedIds.includes(sk.id));
};

window.getEquippedSkills = function(c) {
  if(!c) return [];
  const available = window.getAvailableActiveSkills(c);
  const saved = localStorage.getItem(`ac_eq_skills_${c.id}`);
  if(saved) {
    try {
      const ids = JSON.parse(saved);
      return [0,1,2,3].map(i => available.find(s => s.id === ids[i]) || available[i] || available[0]);
    }catch(e){}
  }
  return [0,1,2,3].map(i => available[i] || available[0]);
};

// ════════════════════════════════════════════
//  PLAYER PANEL (right sidebar)
// ════════════════════════════════════════════
function refreshSidebar() {
  const c = state.char; if(!c) return;

  let bonusHp = 0, bonusMp = 0;
  const effStats = { ...(c.stats || {}) };

  (c.equipment || []).forEach(eq => {
    if (eq.bonus) {
      Object.entries(eq.bonus).forEach(([k, v]) => {
        const val = parseInt(v) || 0;
        if (k === 'maxHp') bonusHp += val;
        else if (k === 'maxMp') bonusMp += val;
        else if (effStats[k] !== undefined) effStats[k] += val;
        else effStats[k] = val;
      });
    }
  });

  c.effMaxHp = (c.maxHp || 100) + bonusHp;
  c.effMaxMp = (c.maxMp || 60) + bonusMp;
  c.effStats = effStats;

  if (c.hp > c.effMaxHp) c.hp = c.effMaxHp;
  if (c.mp > c.effMaxMp) c.mp = c.effMaxMp;

  document.getElementById('g-portrait').textContent = typeof JOB_ICONS !== 'undefined' ? JOB_ICONS[c.job]||'⚔️' : '⚔️';
  document.getElementById('g-name').textContent     = c.name;
  document.getElementById('g-job').textContent      = `${typeof JOB_NAMES !== 'undefined'?JOB_NAMES[c.job]:c.job} · Lv.${c.level}`;

  const hpP = (c.hp/c.effMaxHp)*100, mpP = (c.mp/c.effMaxMp)*100, xpP = (c.xp/c.xpNext)*100;
  const _t = (id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  const _w = (id,v)=>{ const e=document.getElementById(id); if(e) e.style.width=v; };
  
  _t('g-hp',`${c.hp}/${c.effMaxHp}`); _t('g-mp',`${c.mp}/${c.effMaxMp}`); _t('g-xp',`${c.xp}/${c.xpNext}`);
  _w('g-hp-bar',hpP+'%'); _w('g-mp-bar',mpP+'%'); _w('g-xp-bar',xpP+'%');
  
  const hpBar = document.getElementById('g-hp-bar');
  if(hpBar) {
    hpBar.style.background = hpP>60 ? 'linear-gradient(90deg,#c0392b,#e74c3c)' : 
                             hpP>30 ? 'linear-gradient(90deg,#e67e22,#f39c12)' : 
                             'linear-gradient(90deg,#c0392b,#ff6b6b)';
  }

  const statsEl = document.getElementById('g-stats');
  if(statsEl) {
    statsEl.innerHTML = Object.entries(effStats).map(([k,v])=>{
      const baseV = c.stats[k] || 0;
      const diff = v - baseV;
      const diffHtml = diff > 0 ? `<span style="color:var(--green);font-size:.65rem;margin-left:4px">(+${diff})</span>` : '';
      return `<div class="stat-row"><span class="stat-key">${k}</span><span class="stat-val">${v}${diffHtml}</span></div>`;
    }).join('');
  }

  const mobStats = document.getElementById('mob-stats');
  if(mobStats) {
    mobStats.innerHTML = Object.entries(effStats).map(([k,v])=> {
      const baseV = c.stats[k] || 0;
      const diff = v - baseV;
      const diffHtml = diff > 0 ? `<span style="color:var(--green);font-size:.6rem;display:block">(+${diff})</span>` : '';
      return `<div class="mob-stat-cell"><span class="sk">${k}</span><span class="sv">${v}</span>${diffHtml}</div>`;
    }).join('');
  }

  // ✅ 更新裝備清單，包含 9 個位置
  const equip = c.equipment||[];
  const slots = ['head', 'headgear', 'neck', 'weapon', 'armor', 'hand', 'foot', 'accessory_l', 'accessory_r'];
  const slotNames = {
    head: '頭部', headgear: '頭飾', neck: '頸部',
    weapon: '武器', armor: '身體', hand: '手部',
    foot: '腳部', accessory_l: '左飾', accessory_r: '右飾'
  };

  const equipHtml = slots.map(slot=>{
    const e = equip.find(x=>x.slot===slot);
    const bonusStr = e?.bonus ? Object.entries(e.bonus).filter(([,v])=>v).map(([k,v])=>`${k}+${v}`).join(' ') : '';
    return `<div class="equip-slot">
      <span class="equip-slot-lbl" style="width:36px">${slotNames[slot]}</span>
      <span class="rarity-${e?.rarity||'common'}">${e?.name||'─'}</span>
      <div style="flex:1"></div>
      ${bonusStr ? `<span style="font-size:0.6rem;color:var(--green);margin-right:4px">${bonusStr}</span>` : ''}
      <button class="equip-change-btn" onclick="openEquipChange('${slot}')" title="更換">↺</button>
    </div>`;
  }).join('');
  const equipEl = document.getElementById('g-equip');
  if(equipEl) equipEl.innerHTML = equipHtml;

  const eqSkills = window.getEquippedSkills(c);
  const skillsEl = document.getElementById('g-skills');
  let learnedMap = Array.isArray(c.learnedSkills) ? {} : (c.learnedSkills || {});
  
  if(skillsEl) {
    skillsEl.innerHTML = eqSkills.map((sk, idx) => {
      let lv = learnedMap[sk.id] || (sk.id === 'basic_atk' ? 1 : 0);
      return `<div class="skill-item">
        <span>${sk.icon} ${sk.name} <span style="color:var(--gold-dim);font-size:.65rem">Lv.${lv}</span> <span style="color:var(--sky);font-size:.65rem;margin-left:4px">${sk.cost>0?sk.cost+'MP':'免費'}</span></span>
        <button class="equip-change-btn" onclick="openSkillChange(${idx})" title="更換技能">↺</button>
      </div>`;
    }).join('');
  }

  const goldEl = document.getElementById('g-gold-display');
  if(goldEl) goldEl.textContent = ` ${c.gold||0} 金幣`;

  const housesEl = document.getElementById('g-houses');
  const userHouses = state.houses || {};
  const owned = Object.keys(userHouses).filter(k => userHouses[k]);
  
  if(housesEl) {
    housesEl.innerHTML = owned.length === 0
      ? '<div style="font-family:\'DotGothic16\',monospace;font-size:.7rem;color:var(--text-dim);padding:5px;letter-spacing:.5px">── 尚未建造 ──</div>'
      : owned.map(hid=>{
          const hc = typeof HOUSE_CONFIG !== 'undefined' ? HOUSE_CONFIG[hid] : {name: hid, icon: ''};
          return `<div class="house-status-row" onclick="setMenu('house')">
            <span class="house-status-icon">${hc.icon||''}</span>${hc.name}
          </div>`;
        }).join('');
  }

  syncMobFab();
  
  const partyEl = document.getElementById('g-party');
  if(partyEl) partyEl.innerHTML = `<div class="party-slot filled">${c.name} (你)</div><div class="party-slot">── 空位 ──</div>`;
}

// ── Quick equip-change modal ──────────────────────────────
function openEquipChange(slot) {
  if(!state.char) return;
  const inv = (state.char.inventory||[]).filter(i=>i.slot===slot || i.type===slot);
  const slotNames = {
    head: '頭部', headgear: '頭飾', neck: '頸部',
    weapon: '武器', armor: '身體', hand: '手部',
    foot: '腳部', accessory_l: '左手飾物', accessory_r: '右手飾物'
  };
  
  let html = `<div class="modal-overlay" id="equip-modal" onclick="if(event.target.id==='equip-modal')closeEquipModal()">
    <div class="modal-box">
      <div class="modal-title">更換${slotNames[slot]||slot}</div>`;
      
  if(inv.length === 0){
    html += `<div class="modal-empty">背包中沒有可裝備的${slotNames[slot]||slot}</div>`;
  } else {
    html += inv.map(item => {
      const bonusStr = item.bonus ? Object.entries(item.bonus).filter(([,v])=>v).map(([k,v])=>`${k}+${v}`).join(' ') : '';
      return `
      <div class="modal-item" onclick="doEquip('${item.itemId}', '${item.type || slot}')">
        <span class="rarity-${item.rarity||'common'}">${item.name}</span>
        <span class="modal-item-stat">${bonusStr}</span>
      </div>`;
    }).join('');
  }
  
  html += `<button class="btn btn-ghost btn-full" style="margin-top:10px" onclick="closeEquipModal()">取消</button>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function closeEquipModal() {
  const m = document.getElementById('equip-modal');
  if(m) m.remove();
}

async function doEquip(itemId, itemType) {
  closeEquipModal();
  if(!state.char) return;
  try {
    const updated = await AC_API.equipItem(state.char.id, itemId, itemType);
    state.char = updated;
    refreshSidebar();
    notify('裝備更換成功！','ok');
  } catch(e) { 
    notify(e.message||'裝備失敗','err'); 
  }
}

// ── Skill equip modal ──────────────────────────────
function openSkillChange(slotIdx) {
  const c = state.char; if(!c) return;
  const available = window.getAvailableActiveSkills(c);
  let learnedMap = Array.isArray(c.learnedSkills) ? {} : (c.learnedSkills || {});
  
  let html = `<div class="modal-overlay" id="skill-modal" onclick="if(event.target.id==='skill-modal')closeSkillModal()">
    <div class="modal-box">
      <div class="modal-title">更換技能 (欄位 ${slotIdx+1})</div>`;
      
  if(available.length === 0){
    html += `<div class="modal-empty">沒有可更換的技能</div>`;
  } else {
    html += available.map(sk => {
      let lv = learnedMap[sk.id] || (sk.id === 'basic_atk' ? 1 : 0);
      return `<div class="modal-item" onclick="doEquipSkill('${sk.id}', ${slotIdx})">
        <span style="color:var(--gold)">${sk.icon} ${sk.name} <span style="color:var(--text-dim);font-size:0.65rem">Lv.${lv}</span></span>
        <span class="modal-item-stat" style="color:var(--silver)">${sk.cost>0?sk.cost+'MP':'免費'} | ${sk.dmg}</span>
      </div>`;
    }).join('');
  }
  
  html += `<button class="btn btn-ghost btn-full" style="margin-top:10px" onclick="closeSkillModal()">取消</button>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function closeSkillModal() {
  const m = document.getElementById('skill-modal');
  if(m) m.remove();
}

function doEquipSkill(skillId, slotIdx) {
  const c = state.char; if(!c) return;
  const eqSkills = window.getEquippedSkills(c);
  
  const existingIdx = eqSkills.findIndex(s => s.id === skillId);
  if(existingIdx !== -1 && existingIdx !== slotIdx) {
    eqSkills[existingIdx] = eqSkills[slotIdx]; // 互換位置
  }
  
  const available = window.getAvailableActiveSkills(c);
  eqSkills[slotIdx] = available.find(s => s.id === skillId) || eqSkills[slotIdx];
  
  localStorage.setItem(`ac_eq_skills_${c.id}`, JSON.stringify(eqSkills.map(s => s.id)));
  closeSkillModal();
  refreshSidebar();
  
  if(typeof renderCombatSkills === 'function' && state.combat?.active) {
    renderCombatSkills(state.combat.myTurn);
  }
  notify('技能更換成功！', 'ok');
}

function notifyChatBadge() {
  const bar   = document.getElementById('chat-bar');
  if(!bar || bar.classList.contains('expanded')) return;
  const badge = document.getElementById('chat-badge');
  if(!badge) return;
  const n = parseInt(badge.textContent||'0')+1;
  badge.textContent = n;
  badge.classList.add('show');
}

function appendStory(type, text) {
  const log = document.getElementById('combat-log-recent');
  if(!log) return;
  
  const div = document.createElement('div');
  div.style.cssText = 'font-family:\'DotGothic16\',monospace;font-size:.75rem;line-height:2;letter-spacing:.5px;color:'
    +(type==='reward'?'var(--gold)':type==='player-action'?'var(--sky)':'var(--text-dim)');
  div.textContent = (type==='reward'?'◆ ':type==='system'?'■ ':'▶ ')+text;
  
  log.prepend(div);
  while(log.children.length > 8) log.removeChild(log.lastChild);
}

function initMap(){}
function renderMap(){}
function renderMobMap(){}

function syncMobFab(){
  const fab = document.getElementById('mob-fab-portrait');
  if(fab && state.char) fab.textContent = typeof JOB_ICONS!=='undefined'?JOB_ICONS[state.char.job]||'⚔️':'⚔️';
}

// ════════════════════════════════════════════
//  SYSTEM: 自然回復 (HP/MP Regen over time)
// ════════════════════════════════════════════
setInterval(() => {
  const c = state.char;
  const statusEl = document.getElementById('g-recover-status');
  
  if (!c) {
    if(statusEl) statusEl.textContent = '';
    return;
  }
  
  if (state.combat && state.combat.active) {
    if(statusEl) statusEl.innerHTML = '<span style="color:var(--red)">⚔️ 戰鬥中...暫停回復</span>';
    return;
  }
  
  const effHp = c.effMaxHp || c.maxHp || 100;
  const effMp = c.effMaxMp || c.maxMp || 60;
  
  const hpRegen = Math.max(1, Math.floor(effHp * 0.05));
  const mpRegen = Math.max(1, Math.floor(effMp * 0.05));
  
  let needsHeal = false;

  if (c.hp < effHp || c.mp < effMp) {
    c.hp = Math.min(effHp, c.hp + hpRegen);
    c.mp = Math.min(effMp, c.mp + mpRegen);
    needsHeal = true;
    
    refreshSidebar();
    
    if (Math.random() < 0.1) {
      try { if(AC_API && AC_API.saveHpMp) AC_API.saveHpMp(c.id, c.hp, c.mp); } catch(e){}
    }

    const hpTicks = Math.ceil((effHp - c.hp) / hpRegen);
    const mpTicks = Math.ceil((effMp - c.mp) / mpRegen);
    const maxTicks = Math.max(hpTicks, mpTicks);

    if (maxTicks > 0) {
        if(statusEl) statusEl.innerHTML = `⏳ 休息中... 預計 <span style="color:var(--gold)">${maxTicks}秒</span> 後全滿`;
    } else {
        if(statusEl) statusEl.innerHTML = `✨ 狀態絕佳`;
        try { if(AC_API && AC_API.saveHpMp) AC_API.saveHpMp(c.id, c.hp, c.mp); } catch(e){}
    }
  } else {
    if(statusEl) statusEl.innerHTML = `✨ 狀態絕佳`;
  }
}, 1000);
