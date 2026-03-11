// ════════════════════════════════════════════
//  GATHERING SYSTEM - 新版獨立等級系統
// ════════════════════════════════════════════

/**
 * 獲取採集加成 (來自房屋)
 */
function getGatherBonus(type) {
  let xpBonus = 0, goldBonus = 0, rareBonus = 0;
  Object.keys(state.houses).forEach(hid => {
    if (!state.houses[hid]) return;
    const b = HOUSE_CONFIG[hid]?.gatherBonus?.[type];
    if (b) {
      xpBonus += b.xp || 0;
      goldBonus += b.gold || 0;
      rareBonus += b.rare || 0;
    }
  });
  return { xpBonus, goldBonus, rareBonus };
}

/**
 * 更新採集加成標籤
 */
function updateGatherBonusLabels() {
  ['farm', 'fish', 'wood', 'mine'].forEach(type => {
    const el = document.getElementById('gbonus-' + type);
    if (!el) return;
    
    const gatherLevels = state.char?.gatherLevels || {};
    const level = gatherLevels[type] || 1;
    const tier = getGatherTier(level);
    
    const b = getGatherBonus(type);
    const tierLabel = `Tier ${tier} (Lv.${level})`;
    const bonusLabel = (b.xpBonus > 0 || b.goldBonus > 0)
      ? ` · 加成：EXP +${b.xpBonus}% · 金幣 +${b.goldBonus}%`
      : '';
    
    el.innerHTML = `<span style="color:var(--gold)">${tierLabel}</span>${bonusLabel}`;
  });
}

let _gatherTimer = null;

/**
 * 開始採集
 */
function startGather(type) {
  if (state.gather.active) {
    notify('已在採集中！先停止當前活動。', 'err');
    return;
  }
  if (!state.char) return;

  const cfg = GATHER_CONFIG[type];
  state.gather = { active: true, type, ticks: 0, interval: null };

  // 更新 UI 狀態
  document.querySelectorAll('.gather-card').forEach(c => c.classList.remove('active-gather'));
  const card = document.getElementById('gcard-' + type);
  if (card) card.classList.add('active-gather');

  const bar = document.getElementById('gather-bar');
  if (bar) {
    bar.style.display = 'block';
    document.getElementById('gather-bar-title').textContent = cfg.icon + ' ' + cfg.name;
  }
  document.getElementById('gather-prog-txt').textContent = '採集中…';

  const log = document.getElementById('gather-log');
  if (log) log.innerHTML = '';

  // 獲取採集等級和工具等級
  const gatherLevels = state.char.gatherLevels || {};
  const gatherLevel = gatherLevels[type] || 1;
  
  // 工具對應表
  const toolIdMap = { farm: 'tool_hoe', fish: 'tool_rod', wood: 'tool_axe', mine: 'tool_pickaxe' };
  const toolLv = (state.char.learnedSkills || {})[toolIdMap[type]] || 1;

  // 計算採集間隔 (工具等級加速)
  const tickMs = Math.max(500, cfg.tickMs - (toolLv - 1) * 20);

  // 開始採集循環
  _gatherTimer = setInterval(() => {
    state.gather.ticks++;
    const prog = ((state.gather.ticks % 10) / 10) * 100;
    document.getElementById('gather-prog-fill').style.width = prog + '%';

    // 每 10 ticks 完成一次採集
    if (state.gather.ticks % 10 === 0) {
      // 獲取當前等級和 tier
      const currentGatherLevel = (state.char.gatherLevels || {})[type] || 1;
      const currentTier = getGatherTier(currentGatherLevel);
      
      // 計算收益
      const result = calculateGatherReward(cfg, currentGatherLevel, toolLv);
      
      // 房屋加成
      const houseBonus = getGatherBonus(type);
      const finalXp = Math.floor(result.xp * (1 + houseBonus.xpBonus / 100));
      const finalGold = Math.floor(result.gold * (1 + houseBonus.goldBonus / 100));

      // 採集技能經驗
      const gatherSkillXp = GATHER_XP_FORMULA(currentTier);

      // 構建訊息
      const rarityIcon = {
        'common': '',
        'rare': '✦',
        'epic': '✦✦',
        'legend': '✦✦✦'
      };
      const msg = `${cfg.icon} 獲得【${result.item.name}】${rarityIcon[result.item.rarity]} · +${finalXp} EXP · +${finalGold} G · 採集經驗 +${gatherSkillXp}`;
      
      if (log) {
        const li = document.createElement('div');
        li.innerHTML = msg;
        if (result.item.rarity !== 'common') {
          li.style.color = result.item.rarity === 'legend' ? 'var(--gold)' : 
                          result.item.rarity === 'epic' ? 'var(--purple)' : 'var(--sky)';
        }
        log.prepend(li);
      }
      
      document.getElementById('gather-prog-txt').textContent = `已採集 ${state.gather.ticks / 10} 次`;
      
      if (result.item.rarity !== 'common') {
        notify(`發現 ${result.item.rarity === 'legend' ? '傳說' : result.item.rarity === 'epic' ? '史詩' : '稀有'} 物品【${result.item.name}】！`, 'ok');
      }

      // 呼叫 API 將採集結果存入資料庫
      if (AC_API && AC_API.gatherReward) {
        AC_API.gatherReward(state.char.id, {
          xp: finalXp,
          gold: finalGold,
          item: result.item.name,
          itemRarity: result.item.rarity,
          gatherType: type,
          gatherXp: gatherSkillXp,
          tier: currentTier
        }).then(res => {
          if (res.character) {
            state.char = res.character;
          }
          if (typeof refreshSidebar === 'function') refreshSidebar();
          if (typeof updateGatherBonusLabels === 'function') updateGatherBonusLabels();
          if (res.leveledUp) notify('🎉 角色升級了！', 'ok');
          if (res.gatherLeveledUp) {
            notify(`🎉 採集技能【${cfg.name}】升級到 Lv.${res.newGatherLevel}！`, 'ok');
            // 更新 UI 顯示新的 tier 物品
            renderGatherItemPreview(type);
          }
        }).catch(e => console.error(e));
      } else {
        // 備用：本地更新
        state.char.xp = (state.char.xp || 0) + finalXp;
        state.char.gold = (state.char.gold || 0) + finalGold;
        if (typeof refreshSidebar === 'function') refreshSidebar();
      }
    }
  }, Math.round(tickMs / 10));
  
  state.gather.interval = _gatherTimer;
}

/**
 * 停止採集
 */
function stopGather() {
  if (!state.gather.active) return;
  clearInterval(state.gather.interval);
  state.gather = { active: false, type: null, interval: null, ticks: 0 };
  
  document.querySelectorAll('.gather-card').forEach(c => c.classList.remove('active-gather'));
  
  const bar = document.getElementById('gather-bar');
  if (bar) bar.style.display = 'none';
  
  const fill = document.getElementById('gather-prog-fill');
  if (fill) fill.style.width = '0%';
  
  notify('停止採集', 'info');
}

/**
 * 渲染採集物品預覽
 */
function renderGatherItemPreview(type) {
  const previewEl = document.getElementById('gpreview-' + type);
  if (!previewEl) return;
  
  const gatherLevels = state.char?.gatherLevels || {};
  const level = gatherLevels[type] || 1;
  const tier = getGatherTier(level);
  const cfg = GATHER_CONFIG[type];
  const tierData = cfg.tiers[tier - 1];
  
  // 稀有度顏色
  const rarityColors = {
    'common': 'var(--silver)',
    'rare': 'var(--sky)',
    'epic': 'var(--purple)',
    'legend': 'var(--gold)'
  };
  
  // 當前 tier 可採集的物品列表
  const itemsHtml = tierData.items.map(item => 
    `<span style="color:${rarityColors[item.rarity]};margin-right:8px">${item.name}</span>`
  ).join(' · ');
  
  // 下一 tier 預覽 (如果還有更高 tier)
  let nextTierHtml = '';
  if (tier < 6) {
    const nextTierData = cfg.tiers[tier];
    const nextTierReq = tier * 10;
    const nextItemsPreview = nextTierData.items.slice(0, 3).map(item => item.name).join(', ') + '...';
    nextTierHtml = `<div style="font-size:0.65rem;color:var(--text-dim);margin-top:6px">
      <span style="color:var(--gold)">Lv.${nextTierReq} 解鎖:</span> ${nextItemsPreview}
    </div>`;
  }
  
  previewEl.innerHTML = `
    <div style="font-size:0.7rem;color:var(--silver);margin-bottom:4px">可採集物品：</div>
    <div style="font-size:0.72rem;line-height:1.6">${itemsHtml}</div>
    ${nextTierHtml}
  `;
}

/**
 * 初始化所有採集類型的物品預覽
 */
function initGatherPreviews() {
  ['farm', 'fish', 'wood', 'mine'].forEach(type => {
    renderGatherItemPreview(type);
  });
}
