// ════════════════════════════════════════════
//  CRAFT SYSTEM (全新分類與動態渲染)
// ════════════════════════════════════════════
let _currentCraftTab = 'cook';
let _currentCraft = null;
let _currentDisassembleItem = null;
let _currentEnhanceItem = null;

function switchCraftTab(tab) {
  _currentCraftTab = tab;
  
  // 更新分頁按鈕的活躍狀態
  document.querySelectorAll('#panel-craft .bag-tab').forEach(b => b.classList.remove('active'));
  const activeTab = document.getElementById('ctab-' + tab);
  if (activeTab) activeTab.classList.add('active');
  
  // 隱藏所有視圖，顯示對應的視圖
  document.querySelectorAll('.craft-view-pane').forEach(p => p.classList.add('hide'));
  const activeView = document.getElementById('craft-view-' + tab);
  if (activeView) activeView.classList.remove('hide');
  
  closeCraft();
  renderCraftGrids();
}

function renderCraftGrids() {
  // 1. 渲染 煮食、武器、防具
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

  // 2. 渲染 分解 介面 (列出背包中可分解的裝備)
  if (_currentCraftTab === 'disassemble') {
    const grid = document.getElementById('craft-grid-disassemble');
    if (!grid) return;
    const inv = (state.char?.inventory || []).filter(i => ['weapon','armor','head','hand','foot','accessory','accessory_l','accessory_r','headgear','neck'].includes(i.type));
    if (!inv.length) {
      grid.innerHTML = '<div class="inv-empty" style="grid-column:1/-1">背包中沒有可分解的裝備</div>';
      return;
    }
    grid.innerHTML = inv.map((item, idx) => {
      const icon = typeof ITEM_ICONS !== 'undefined' ? (ITEM_ICONS[item.type] || '📦') : '📦';
      return `<div class="inv-item" onclick="openDisassemble(${idx})">
        <span class="inv-item-icon">${icon}</span>
        <span class="inv-item-name rarity-${item.rarity}">${item.name}</span>
        <span class="inv-item-type" style="color:var(--red)">點擊分解</span>
      </div>`;
    }).join('');
  }

  // 3. 渲染 強化 介面 (列出身上穿的與背包的裝備)
  if (_currentCraftTab === 'enhance') {
    const grid = document.getElementById('craft-grid-enhance');
    if (!grid) return;
    
    const eq = (state.char?.equipment || []).map(e => ({...e, isEquipped: true, _id: e.slot}));
    const inv = (state.char?.inventory || []).filter(i => ['weapon','armor','head','hand','foot','accessory','accessory_l','accessory_r','headgear','neck'].includes(i.type)).map((i, idx) => ({...i, originalIdx: idx, isEquipped: false, _id: idx}));
    const all = [...eq, ...inv];
    
    if (!all.length) {
      grid.innerHTML = '<div class="inv-empty" style="grid-column:1/-1">沒有可強化的裝備</div>';
      return;
    }
    grid.innerHTML = all.map(item => {
      const icon = typeof ITEM_ICONS !== 'undefined' ? (ITEM_ICONS[item.type || item.slot] || '📦') : '📦';
      const equipTag = item.isEquipped ? `<br><span style="color:var(--gold);font-size:0.65rem">(裝備中)</span>` : '';
      return `<div class="inv-item" onclick="openEnhance('${item._id}', ${item.isEquipped})">
        <span class="inv-item-icon">${icon}</span>
        <span class="inv-item-name rarity-${item.rarity}">${item.name}${equipTag}</span>
        <span class="inv-item-type" style="color:var(--sky)">點擊強化</span>
      </div>`;
    }).join('');
  }
}

function openCraft(id) {
  const d = CRAFT_DATA[id]; if(!d) return;
  _currentCraft = id;
  
  // 相容保留舊的工具製作介面
  const isTools = (d.panel === 'tools');
  const resultId = isTools ? 'craft-result-tools' : 'craft-result';
  const titleId  = isTools ? 'craft-result-tools-title' : 'craft-result-title';
  const bodyId   = isTools ? 'craft-result-tools-body'  : 'craft-result-body';

  document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
  const card = document.getElementById(resultId);
  if(!card) return;
  
  document.getElementById(titleId).textContent = `⚒️ ${d.name} 製作確認`;
  document.getElementById(bodyId).innerHTML    = `所需素材：${d.req}<br>製作效果：${d.result}`;
  
  const flexBtns = card.querySelector('.flex-btns');
  if (flexBtns) {
      flexBtns.innerHTML = `
        <button class="btn btn-full" onclick="doCraft()">確認製作</button>
        <button class="btn btn-full btn-ghost" onclick="closeCraft()">取消</button>
      `;
  }
  card.classList.add('show');
  card.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function openDisassemble(idx) {
    const item = state.char.inventory[idx];
    if(!item) return;
    _currentDisassembleItem = item;
    
    document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
    const card = document.getElementById('craft-result');
    document.getElementById('craft-result-title').textContent = `🔨 分解確認：${item.name}`;
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
        item = state.char.inventory[id];
    }
    if(!item) return;

    document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
    const card = document.getElementById('craft-result');
    document.getElementById('craft-result-title').textContent = `✨ 強化確認：${item.name}`;
    document.getElementById('craft-result-body').innerHTML = `強化需要消耗 <b>魔晶礦石 ×2</b> 與 <b>100 金幣</b>。<br><span style="color:var(--green)">成功機率：70% (失敗無懲罰)</span>`;
    card.querySelector('.flex-btns').innerHTML = `
      <button class="btn btn-full" onclick="doEnhance()">確認強化</button>
      <button class="btn btn-full btn-ghost" onclick="closeCraft()">取消</button>`;
    card.classList.add('show');
    card.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function closeCraft() {
  _currentCraft = null;
  _currentDisassembleItem = null;
  _currentEnhanceItem = null;
  document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
}

function doCraft() {
  if(!_currentCraft) return;
  const d = CRAFT_DATA[_currentCraft];
  notify(`✦ 成功製作【${d.name}】！${d.result}`, 'ok');
  closeCraft();
}

function doDisassemble() {
  if(!_currentDisassembleItem) return;
  notify(`✦ 成功分解【${_currentDisassembleItem.name}】，獲得了素材！`, 'ok');
  closeCraft();
}

function doEnhance() {
  if(!_currentEnhanceItem) return;
  const success = Math.random() < 0.7;
  if (success) {
    notify(`✨ 強化成功！裝備屬性提升了！`, 'ok');
  } else {
    notify(`💦 強化失敗... 素材消失了。`, 'err');
  }
  closeCraft();
}
