// ════════════════════════════════════════════
//  GATHERING SYSTEM
// ════════════════════════════════════════════
function getGatherBonus(type) {
  let xpBonus=0, goldBonus=0, rareBonus=0;
  Object.keys(state.houses).forEach(hid=>{
    if(!state.houses[hid]) return;
    const b = HOUSE_CONFIG[hid].gatherBonus[type];
    if(b){ xpBonus+=b.xp||0; goldBonus+=b.gold||0; rareBonus+=b.rare||0; }
  });
  return { xpBonus, goldBonus, rareBonus };
}

function updateGatherBonusLabels() {
  ['farm','fish','wood','mine'].forEach(type=>{
    const el = document.getElementById('gbonus-'+type);
    if(!el) return;
    const b = getGatherBonus(type);
    el.textContent = (b.xpBonus>0||b.goldBonus>0)
      ? `加成：EXP +${b.xpBonus}% · 金幣 +${b.goldBonus}%`
      : '加成：─（建造對應房屋解鎖）';
  });
}

let _gatherTimer = null;

function startGather(type) {
  if(state.gather.active){ notify('已在採集中！先停止當前活動。','err'); return; }
  if(!state.char) return;

  const cfg = GATHER_CONFIG[type];
  state.gather = { active:true, type, ticks:0, interval:null };

  document.querySelectorAll('.gather-card').forEach(c=>c.classList.remove('active-gather'));
  const card = document.getElementById('gcard-'+type);
  if(card) card.classList.add('active-gather');

  const bar = document.getElementById('gather-bar');
  if(bar){ bar.style.display='block'; document.getElementById('gather-bar-title').textContent=cfg.icon+' '+cfg.name; }
  document.getElementById('gather-prog-txt').textContent = '採集中…';

  const log = document.getElementById('gather-log');
  if(log) log.innerHTML = '';

  _gatherTimer = setInterval(()=>{
    state.gather.ticks++;
    const prog = ((state.gather.ticks%10)/10)*100;
    document.getElementById('gather-prog-fill').style.width = prog+'%';

    if(state.gather.ticks%10===0) {
      const b       = getGatherBonus(type);
      const xp      = Math.round(cfg.xpPer*(1+b.xpBonus/100));
      const gold    = Math.round(cfg.goldPer*(1+b.goldBonus/100));
      const isRare  = Math.random()*100 < (5+b.rareBonus/4);
      const items   = cfg.items;
      const item    = isRare ? items[items.length-1] : items[Math.floor(Math.random()*(items.length-1))];

      state.char.xp   = (state.char.xp||0)   + xp;
      state.char.gold = (state.char.gold||0)  + gold;
      refreshSidebar();

      const msg = `${cfg.icon} 獲得【${item}】· +${xp} EXP · +${gold} G${isRare?' ✦稀有！':''}`;
      if(log){ const li=document.createElement('div'); li.textContent=msg; log.prepend(li); }
      document.getElementById('gather-prog-txt').textContent = `已採集 ${state.gather.ticks/10} 次`;
      notify(msg.slice(0,32),'ok');
    }
  }, Math.round(cfg.tickMs/10));
  state.gather.interval = _gatherTimer;
}

function stopGather() {
  if(!state.gather.active) return;
  clearInterval(state.gather.interval);
  state.gather = { active:false, type:null, interval:null, ticks:0 };
  document.querySelectorAll('.gather-card').forEach(c=>c.classList.remove('active-gather'));
  const bar = document.getElementById('gather-bar');
  if(bar) bar.style.display = 'none';
  const fill = document.getElementById('gather-prog-fill');
  if(fill) fill.style.width = '0%';
  notify('停止採集','info');
}
