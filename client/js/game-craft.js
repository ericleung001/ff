// ════════════════════════════════════════════
//  CRAFT SYSTEM (全新分類與動態渲染)
// ════════════════════════════════════════════
let _currentCraftTab = 'cook';
let _currentCraft = null;
let _currentDisassembleItem = null;
let _currentEnhanceItem = null;
let _currentToolUpgrade = null;

function switchCraftTab(tab) {
  _currentCraftTab = tab;
  
  document.querySelectorAll('#panel-craft .bag-tab').forEach(b => b.classList.remove('active'));
  const activeTab = document.getElementById('ctab-' + tab);
  if (activeTab) activeTab.classList.add('active');
  
  document.querySelectorAll('.craft-view-pane').forEach(p => p.classList.add('hide'));
  const activeView = document.getElementById('craft-view-' + tab);
  if (activeView) activeView.classList.remove('hide');
  
  closeCraft();
  renderCraftGrids();
}

function renderCraftGrids() {
  ['cook', 'weapon', 'armor'].forEach(cat => {
    const grid = document.getElementById('craft-grid-' + cat);
    if (!grid) return;
    
    const items = Object.keys(CRAFT_DATA).filter(k => CRAFT_DATA[k].category === cat);
    if (items.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim)">暫無配方</div>';
      return;
    }
    
    grid.innerHTML = items.map(id => {
      const d = CRAFT_DATA[id];
      const typeLabel = d.type === 'consumable' ? '消耗品' : (d.category === 'weapon' ? '武器' : '防具');
      return `<div class="craft-card" onclick="openCraft('${id}')">
        <span class="craft-icon">${d.icon}</span>
        <div class="craft-name">${d.name}</div>
        <div class="craft-type" style="color:var(--sky)">${typeLabel}</div>
        <div class="craft-req">${d.req}<br><span style="color:var(--green)">${d.result}</span></div>
      </div>`;
    }).join('');
  });

  if (_currentCraftTab === 'disassemble') {
    const grid = document.getElementById('craft-grid-disassemble');
    if (!grid) return;
    const inv = (state.char?.inventory || []).filter(i => ['weapon','armor','head','hand','foot','accessory','accessory_l','accessory_r','headgear','neck'].includes(i.type));
    if (!inv.length) {
      grid.innerHTML = '<div class="inv-empty" style="grid-column:1/-1">背包中沒有可分解的裝備</div>';
      return;
    }
    grid.innerHTML = inv.map((item) => {
      const icon = typeof ITEM_ICONS !== 'undefined' ? (ITEM_ICONS[item.type] || '📦') : '📦';
      const lvStr = item.bonus?.level > 1 ? `+${item.bonus.level} ` : '';
      return `<div class="inv-item" onclick="openDisassemble(${item.id}, '${item.name}')">
        <span class="inv-item-icon">${icon}</span>
        <span class="inv-item-name rarity-${item.rarity}">${lvStr}${item.name}</span>
        <span class="inv-item-type" style="color:var(--red)">點擊分解</span>
      </div>`;
    }).join('');
  }

  // ✅ 強化列表：將名稱、等級、屬性整合在一行清晰顯示
  if (_currentCraftTab === 'enhance') {
    const grid = document.getElementById('craft-grid-enhance');
    if (!grid) return;
    
    const eq = (state.char?.equipment || []).map(e => ({...e, isEquipped: true, _id: e.slot}));
    const inv = (state.char?.inventory || []).filter(i => ['weapon','armor','head','hand','foot','accessory','accessory_l','accessory_r','headgear','neck'].includes(i.type)).map((i, idx) => ({...i, originalIdx: idx, isEquipped: false, _id: i.id}));
    const all = [...eq, ...inv];
    
    if (!all.length) {
      grid.innerHTML = '<div class="inv-empty" style="grid-column:1/-1">沒有可強化的裝備</div>';
      return;
    }
    grid.innerHTML = all.map(item => {
      const icon = typeof ITEM_ICONS !== 'undefined' ? (ITEM_ICONS[item.type || item.slot] || '📦') : '📦';
      const equipTag = item.isEquipped ? `<span style="color:var(--gold);font-size:0.65rem;margin-left:4px">(裝備中)</span>` : '';
      const lv = item.bonus?.level || 1;
      
      // ✅ 乾淨過濾系統變數 (level, base)，只顯示純粹的屬性
      const bonusStr = item.bonus ? Object.entries(item.bonus).filter(([k,v]) => v && k !== 'level' && k !== 'base').map(([k,v]) => `${k}+${v}`).join(' ') : '';
      
      return `<div class="inv-item" onclick="openEnhance('${item._id}', ${item.isEquipped})" style="text-align:left;padding:10px;">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:1.8rem">${icon}</span>
          <div style="flex:1">
            <div class="rarity-${item.rarity}" style="font-family:'DotGothic16',monospace;font-size:0.85rem;margin-bottom:2px">${item.name}${equipTag}</div>
            <div style="color:var(--sky);font-family:'DotGothic16',monospace;font-size:0.7rem">Lv.${lv} | ${bonusStr}</div>
          </div>
        </div>
      </div>`;
    }).join('');
  }
}

function renderToolGrids() {
    const grid = document.getElementById('craft-grid-tools');
    if (!grid) return;

    grid.innerHTML = Object.keys(TOOL_DATA).map(id => {
        const d = TOOL_DATA[id];
        const lv = (state.char?.learnedSkills || {})[id] || 1;
        const isMax = lv >= 100;
        let reqStr = Object.entries(d.baseReq).map(([k, v]) => `${k} ×${v * lv}`).join(' · ');
        if (isMax) reqStr = '已達最高等級';

        return `<div class="craft-card" onclick="openToolUpgrade('${id}')">
          <span class="craft-icon">${d.icon}</span>
          <div class="craft-name" style="margin-bottom:2px">${d.name} <span style="color:var(--gold);font-size:0.75rem">Lv.${lv}</span></div>
          <div class="craft-type" style="color:var(--silver);font-size:0.62rem;line-height:1.4;margin-bottom:6px">${d.desc}</div>
          <div class="craft-req" style="color:var(--sky)">${reqStr}</div>
        </div>`;
    }).join('');
}

function openToolUpgrade(id) {
    const d = TOOL_DATA[id]; if(!d) return;
    _currentToolUpgrade = id;

    const lv = (state.char?.learnedSkills || {})[id] || 1;
    const card = document.getElementById('craft-result-tools');
    if(!card) return;

    document.getElementById('craft-result-tools-title').textContent = `⚒️ 升級確認：${d.name}`;
    if (lv >= 100) {
        document.getElementById('craft-result-tools-body').innerHTML = `此工具已達最高等級上限！`;
        card.querySelector('.flex-btns').innerHTML = `<button class="btn btn-full btn-ghost" onclick="closeCraft()">關閉</button>`;
    } else {
        const reqStr = Object.entries(d.baseReq).map(([k, v]) => `${k} ×${v * lv}`).join(' · ');
        document.getElementById('craft-result-tools-body').innerHTML = `升級後：<b style="color:var(--gold)">Lv.${lv+1}</b><br>所需素材：${reqStr}`;
        card.querySelector('.flex-btns').innerHTML = `
          <button class="btn btn-full" onclick="doToolUpgrade()">確認升級</button>
          <button class="btn btn-full btn-ghost" onclick="closeCraft()">取消</button>`;
    }

    card.classList.add('show');
    card.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function openCraft(id) {
  const d = CRAFT_DATA[id]; if(!d) return;
  _currentCraft = id;

  document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
  const card = document.getElementById('craft-result');
  if(!card) return;
  
  document.getElementById('craft-result-title').textContent = `⚒️ ${d.name} 製作確認`;
  document.getElementById('craft-result-body').innerHTML    = `所需素材：${d.req}<br>製作效果：${d.result}`;
  
  card.querySelector('.flex-btns').innerHTML = `
    <button class="btn btn-full" onclick="doCraft()">確認製作</button>
    <button class="btn btn-full btn-ghost" onclick="closeCraft()">取消</button>
  `;
  card.classList.add('show');
  card.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function openDisassemble(invId, itemName) {
    _currentDisassembleItem = { id: invId, name: itemName };
    
    document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
    const card = document.getElementById('craft-result');
    document.getElementById('craft-result-title').textContent = `🔨 分解確認：${itemName}`;
    document.getElementById('craft-result-body').innerHTML = `分解此裝備將可獲得隨機素材。<br><span style="color:var(--red);font-weight:bold">警告：分解後裝備將永久消失！</span>`;
    card.querySelector('.flex-btns').innerHTML = `
      <button class="btn btn-full btn-red" onclick="doDisassemble()">確認分解</button>
      <button class="btn btn-full btn-ghost" onclick="closeCraft()">取消</button>`;
    card.classList.add('show');
    card.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function openEnhance(id, isEquipped) {
    _currentEnhanceItem = { id, isEquipped };
    let item = null;
    if (isEquipped) {
        item = state.char.equipment.find(e => e.slot === id);
    } else {
        item = state.char.inventory.find(i => String(i.id) === String(id));
    }
    if(!item) return;

    let lv = item.bonus?.level || 1;
    let toolLv = (state.char.learnedSkills || {}).tool_enhance || 1;

    document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
    const card = document.getElementById('craft-result');
    const lvStr = lv > 1 ? `+${lv} ` : '';
    document.getElementById('craft-result-title').textContent = `✨ 強化確認：${lvStr}${item.name}`;

    if (lv >= 100) {
        document.getElementById('craft-result-body').innerHTML = `此裝備已達最高等級上限！`;
        card.querySelector('.flex-btns').innerHTML = `<button class="btn btn-full btn-ghost" onclick="closeCraft()">關閉</button>`;
    } else if (lv >= toolLv) {
        document.getElementById('craft-result-body').innerHTML = `裝備等級(<span style="color:var(--gold)">${lv}</span>) 已達強化工具等級上限。<br>請先升級 <span style="color:var(--sky)">強化工具</span>！`;
        card.querySelector('.flex-btns').innerHTML = `<button class="btn btn-full btn-ghost" onclick="closeCraft()">關閉</button>`;
    } else {
        let goldCost = lv * 100;
        let oreCost = Math.ceil(lv / 5);
        
        // ✅ 計算並在一行內顯示升級後的屬性
        let nextLv = lv + 1;
        let nextBonusStr = [];
        let baseStats = item.bonus?.base || item.bonus || {};
        for (let k in baseStats) {
            if (k !== 'level' && k !== 'base') {
                let nextVal = Math.floor(baseStats[k] * (1 + (nextLv - 1) * 0.1));
                nextBonusStr.push(`${k}+${nextVal}`);
            }
        }
        let nextStats = nextBonusStr.join(' ');

        document.getElementById('craft-result-body').innerHTML = `升級後：<b style="color:var(--gold)">Lv.${nextLv} (${nextStats})</b><br>消耗：魔晶礦石 ×${oreCost} · ${goldCost} 金幣`;
        card.querySelector('.flex-btns').innerHTML = `
          <button class="btn btn-full" onclick="doEnhance()">確認強化</button>
          <button class="btn btn-full btn-ghost" onclick="closeCraft()">取消</button>`;
    }

    card.classList.add('show');
    card.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function closeCraft() {
  _currentCraft = null;
  _currentDisassembleItem = null;
  _currentEnhanceItem = null;
  _currentToolUpgrade = null;
  document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
}

async function doCraft() {
  if(!_currentCraft || !state.char) return;
  const d = CRAFT_DATA[_currentCraft];
  try {
      const updated = await AC_API.craftItem(state.char.id, _currentCraft);
      state.char = updated;
      notify(`✦ 成功製作【${d.name}】！已經放入道具袋中。`, 'ok');
      closeCraft();
      renderCraftGrids();
      if(typeof refreshSidebar === 'function') refreshSidebar();
  } catch (err) { notify(err.message || '製作失敗，素材不足！', 'err'); closeCraft(); }
}

async function doDisassemble() {
  if(!_currentDisassembleItem || !state.char) return;
  try {
      const updated = await AC_API.disassembleItem(state.char.id, _currentDisassembleItem.id);
      state.char = updated;
      notify(`✦ 成功分解【${_currentDisassembleItem.name}】，獲得了裝備碎片！`, 'ok');
      closeCraft();
      renderCraftGrids();
      if(typeof refreshSidebar === 'function') refreshSidebar();
  } catch (err) { notify(err.message || '分解失敗！', 'err'); closeCraft(); }
}

async function doEnhance() {
  if(!_currentEnhanceItem || !state.char) return;
  try {
      const updated = await AC_API.enhanceItem(state.char.id, _currentEnhanceItem.id, _currentEnhanceItem.isEquipped);
      state.char = updated;
      notify(`✨ 強化成功！裝備屬性提升了！`, 'ok');
      closeCraft();
      renderCraftGrids();
      if(typeof refreshSidebar === 'function') refreshSidebar();
  } catch (err) { notify(err.message || '強化失敗！', 'err'); closeCraft(); }
}

async function doToolUpgrade() {
    if(!_currentToolUpgrade || !state.char) return;
    try {
        const updated = await AC_API.upgradeTool(state.char.id, _currentToolUpgrade);
        state.char = updated;
        notify(`⚒️ 工具升級成功！`, 'ok');
        closeCraft();
        renderToolGrids();
        if(typeof refreshSidebar === 'function') refreshSidebar();
    } catch(err) { notify(err.message || '升級失敗，素材不足！', 'err'); closeCraft(); }
}
