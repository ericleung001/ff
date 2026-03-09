// ════════════════════════════════════════════
//  SKILL TREE & LEVELING SYSTEM (1 - 100)
// ════════════════════════════════════════════
function renderSkillTree() {
  const c = state.char; if(!c) return;
  
  const spDisplay = document.getElementById('sk-sp');
  if(spDisplay) spDisplay.textContent = c.sp;

  // 使用統一的技能庫
  const tree = typeof JOB_SKILLS_DB !== 'undefined' ? JOB_SKILLS_DB[c.job] : [];

  let learnedMap = {};
  if (Array.isArray(c.learnedSkills)) {
    c.learnedSkills.forEach(s => learnedMap[s] = 1);
  } else if (c.learnedSkills) {
    learnedMap = c.learnedSkills;
  }

  const grid = document.getElementById('sk-grid');
  if(!grid) return;

  grid.innerHTML = tree.map(n => {
    // basic_atk 預設至少 Lv.1
    const currentLv = n.id === 'basic_atk' ? Math.max(1, learnedMap[n.id] || 1) : (learnedMap[n.id] || 0);
    const mastered = currentLv >= 100;
    
    // 驗證前置技能
    const reqOk = !n.req || (learnedMap[n.req] || 0) >= 1;
    // 升級花費
    const cost = (n.spCost || 1) + currentLv;

    let cls = 'locked';
    if (mastered) cls = 'mastered';
    else if (reqOk) cls = 'unlocked';

    const badgeHtml = currentLv > 0 
      ? `<div class="tn-badge" style="width:auto;padding:0 6px;border-radius:4px;top:-10px;right:-10px">Lv.${currentLv}</div>` 
      : '';
      
    const reqName = n.req ? (tree.find(x => x.id === n.req)?.name || n.req) : '';

    return `<div class="tree-node ${cls}" onclick="doLearnSkill('${n.id}', ${cost}, '${n.req||''}', ${currentLv})">
      ${badgeHtml}
      <span class="tn-icon">${n.icon}</span>
      <span class="tn-name">${n.name}</span>
      <div class="tn-desc" style="color:var(--sky); font-size:0.65rem; margin-bottom:4px;">
        ${n.cost > 0 ? n.cost+'MP' : '免費'} | 威力: ${n.dmg}
      </div>
      <div class="tn-desc">${n.desc}</div>
      <div class="tn-cost" style="margin-top:6px; color:var(--gold)">
        ${mastered ? '已達滿級' : !reqOk ? `需解鎖 [${reqName}]` : `升級需 ${cost} SP`}
      </div>
    </div>`;
  }).join('');
}

async function doLearnSkill(id, cost, req, currentLv) {
  const c = state.char; if(!c) return;

  let learnedMap = {};
  if (Array.isArray(c.learnedSkills)) {
    c.learnedSkills.forEach(s => learnedMap[s] = 1);
  } else if (c.learnedSkills) {
    learnedMap = c.learnedSkills;
  }

  if (currentLv >= 100) return notify('技能已達最高等級！', 'info');
  if (req && (learnedMap[req] || 0) < 1) return notify('需要先解鎖前置技能！', 'err');
  if (c.sp < cost) return notify(`技能點數不足（需要 ${cost} SP）`, 'err');

  try {
    const updated = await AC_API.learnSkill(c.id, id, cost);
    state.char = updated;
    
    renderSkillTree();
    if (typeof refreshSidebar === 'function') refreshSidebar();
    
    notify(`升級成功！【${id}】達到 Lv.${currentLv + 1}`, 'ok');
  } catch(e) { 
    notify(e.message, 'err'); 
  }
}