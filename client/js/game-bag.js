// ════════════════════════════════════════════
//  BAG / INVENTORY
// ════════════════════════════════════════════
const ITEM_ICONS   = { weapon:'⚔️', armor:'🛡️', accessory:'💍', consumable:'🧪', material:'💎', head:'🪖', headgear:'👑', neck:'📿', hand:'🧤', foot:'👞', accessory_l:'💍', accessory_r:'💍' };
const RARITY_LABELS= { common:'普通', rare:'稀有', epic:'史詩', legend:'傳說' };
const SLOT_NAMES   = { head:'頭部', headgear:'頭飾', neck:'頸部', weapon:'武器', armor:'身體', hand:'手部', foot:'腳部', accessory_l:'左飾', accessory_r:'右飾' };
const SLOT_ICONS   = { head:'🪖', headgear:'👑', neck:'📿', weapon:'⚔️', armor:'🛡️', hand:'🧤', foot:'👞', accessory_l:'💍', accessory_r:'💍' };

let _modalItem = null;

function switchBagTab(tab){
  document.getElementById('bag-equip-view').classList.toggle('hide', tab!=='equip');
  document.getElementById('bag-inv-view').classList.toggle('hide',  tab!=='inv');
  document.getElementById('btab-equip').classList.toggle('active',  tab==='equip');
  document.getElementById('btab-inv').classList.toggle('active',    tab==='inv');
}

async function loadBag(){
  if(!state.char) return;
  try { state.char = await AC_API.getChar(state.char.id); } catch{}
  const c=state.char;
  document.getElementById('bag-gold').textContent=`💰 ${c.gold||0} 金幣`;

  // ✅ 更新道具袋的 9 個裝備槽位
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

  const inv=c.inventory||[];
  const grid=document.getElementById('bag-inv-grid');
  if(!inv.length){ grid.innerHTML='<div class="inv-empty">背包空空如也…<br>擊敗怪物來獲取戰利品吧！</div>'; return; }
  grid.innerHTML=inv.map((item,idx)=>{
    const icon=ITEM_ICONS[item.type]||'📦';
    return `<div class="inv-item" onclick="openItemModal(${idx})">
      ${item.quantity>1?`<span class="inv-item-qty">×${item.quantity}</span>`:''}
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
  
  // ✅ 確保新裝備可以裝備
  const canEquip=['head', 'headgear', 'neck', 'weapon', 'armor', 'hand', 'foot', 'accessory_l', 'accessory_r'].includes(item.type);
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
    closeItemModal(); loadBag(); refreshSidebar();
  } catch(e){ notify(e.message,'err'); }
}
