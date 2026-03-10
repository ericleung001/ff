// ════════════════════════════════════════════
//  BAG / INVENTORY
// ════════════════════════════════════════════
const ITEM_ICONS   = { weapon:'⚔️', armor:'🛡️', accessory:'💍', consumable:'🧪', material:'💎', head:'🪖', headgear:'👑', neck:'📿', hand:'🧤', foot:'👞', accessory_l:'💍', accessory_r:'💍' };
const RARITY_LABELS= { common:'普通', rare:'稀有', epic:'史詩', legend:'傳說' };

// (SLOT_NAMES 和 SLOT_ICONS 已經在 game-data.js 中定義過了，所以這裡移除避免重複報錯)

let _modalItem = null;
let _currentBagTab = 'equip'; 

function switchBagTab(tab) {
  _currentBagTab = tab;
  
  document.getElementById('bag-equip-view').classList.toggle('hide', tab !== 'equip');
  document.getElementById('bag-inv-view').classList.toggle('hide', tab === 'equip');
  
  document.querySelectorAll('.bag-tab').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('btab-' + tab);
  if (btn) btn.classList.add('active');

  if (tab !== 'equip') {
    renderInventoryGrid();
  }
}

async function loadBag(){
  if(!state.char) return;
  try { state.char = await AC_API.getChar(state.char.id); } catch{}
  const c = state.char;
  document.getElementById('bag-gold').textContent=`💰 ${c.gold||0} 金幣`;

  const slots=['head', 'headgear', 'neck', 'weapon', 'armor', 'hand', 'foot', 'accessory_l', 'accessory_r'];
  const equip=c.equipment||[];
  document.getElementById('bag-equip-slots').innerHTML=slots.map(slot=>{
    const e=equip.find(x=>x.slot===slot);
    const bonusStr=e?.bonus?Object.entries(e.bonus).filter(([,v])=>v).map(([k,v])=>`${k}+${v}`).join(' '):'';
    return `<div class="equip-card">
      <span class="equip-card-slot">${SLOT_ICONS[slot]||'📦'} ${SLOT_NAMES[slot]||slot}</span>
      <span class="equip-card-icon">${e?(ITEM_ICONS[e.type||slot]||'📦'):'─'}</span>
      <span class="equip-card-name rarity-${e?.rarity||'common'}">${e?.name||'未裝備'}</span>
      <span class="equip-card-stats">${bonusStr||(e?e.rarity:'')}</span>
    </div>`;
  }).join('');

  if (_currentBagTab !== 'equip') {
     renderInventoryGrid();
  }
}

function renderInventoryGrid() {
  const inv = state.char?.inventory || [];
  const grid = document.getElementById('bag-inv-grid');
  
  const grouped = {};
  inv.forEach((item, originalIdx) => {
    if(!grouped[item.itemId]) {
      grouped[item.itemId] = { ...item, originalIndex: originalIdx };
    } else {
      grouped[item.itemId].quantity += item.quantity;
    }
  });
  let filtered = Object.values(grouped);

  if (_currentBagTab === 'inv-equip') {
     filtered = filtered.filter(i => !['consumable', 'material'].includes(i.type));
  } else if (_currentBagTab === 'inv-mat') {
     filtered = filtered.filter(i => i.type === 'material');
  } else if (_currentBagTab === 'inv-item') {
     filtered = filtered.filter(i => i.type === 'consumable');
  }

  const rVal = { legend:4, epic:3, rare:2, common:1 };
  filtered.sort((a,b) => (rVal[b.rarity]||0) - (rVal[a.rarity]||0));

  if(!filtered.length){ 
    grid.innerHTML = `<div class="inv-empty" style="grid-column: 1 / -1;">該分類空空如也…<br>擊敗怪物來獲取戰利品吧！</div>`; 
    return; 
  }

  grid.innerHTML = filtered.map(item => {
    const icon = ITEM_ICONS[item.type] || '📦';
    return `<div class="inv-item" onclick="openItemModal(${item.originalIndex})">
      ${item.quantity > 1 ? `<span class="inv-item-qty">×${item.quantity}</span>` : ''}
      <span class="inv-item-icon">${icon}</span>
      <span class="inv-item-name rarity-${item.rarity}">${item.name}</span>
      <span class="inv-item-type">${RARITY_LABELS[item.rarity]||''} ${item.type==='material'?'素材':item.type==='consumable'?'消耗品':SLOT_NAMES[item.type]||item.type}</span>
    </div>`;
  }).join('');
}

function openItemModal(idx){
  const inv=state.char?.inventory||[];
  const item=inv[idx]; if(!item) return;
  _modalItem=item;
  
  document.getElementById('modal-icon').textContent=ITEM_ICONS[item.type]||'📦';
  document.getElementById('modal-name').textContent=item.name;
  document.getElementById('modal-name').className=`item-modal-name rarity-${item.rarity}`;
  document.getElementById('modal-type').textContent=`${RARITY_LABELS[item.rarity]||''} · ${item.type==='material'?'素材':item.type==='consumable'?'消耗品':SLOT_NAMES[item.type]||item.type}`;
  
  const bonus=item.bonus||{};
  const bonusLines=Object.entries(bonus).filter(([,v])=>v).map(([k,v])=>`${k} +${v}`);
  document.getElementById('modal-stats').innerHTML=bonusLines.length?bonusLines.join('<br>'):(item.type==='material'?'製作素材，暫無直接效果':'─');
  
  const canEquip = !['consumable', 'material'].includes(item.type);
  document.getElementById('modal-equip-btn').style.display=canEquip?'':'none';
  document.getElementById('item-modal').classList.add('open');
}

function closeItemModal(){
  document.getElementById('item-modal').classList.remove('open');
  _modalItem=null;
}

async function doEquipItem(){
  if(!_modalItem||!state.char) return;
  try {
    const updated=await AC_API.equipItem(state.char.id,_modalItem.itemId,_modalItem.type);
    state.char=updated;
    notify(`已裝備【${_modalItem.name}】！`,'ok');
    closeItemModal(); 
    loadBag(); 
    refreshSidebar();
  } catch(e){ notify(e.message,'err'); }
}
