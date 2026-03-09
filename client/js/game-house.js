// ════════════════════════════════════════════
//  HOUSE SYSTEM
// ════════════════════════════════════════════
function updateHousePanelStatus() {
  Object.keys(HOUSE_CONFIG).forEach(hid=>{
    const tag  = document.getElementById('htag-'+hid);
    const card = document.getElementById('hcard-'+hid);
    if(!tag||!card) return;
    if(state.houses[hid]){
      tag.textContent  = '✓ 已建造';
      tag.className    = 'house-tag owned';
      card.classList.add('owned');
    } else {
      tag.textContent  = '── 未建造 ──';
      tag.className    = 'house-tag locked';
      card.classList.remove('owned');
    }
  });
  updateGatherBonusLabels();
  refreshSidebar();
}

function toggleHouse(hid) {
  const already = !!state.houses[hid];
  state.houses[hid] = !already;
  notify(already
    ? `${HOUSE_CONFIG[hid].name} 已拆除`
    : `${HOUSE_CONFIG[hid].name} 建造完成！採集加成已啟用 ✦`,
    already ? 'info' : 'ok'
  );
  updateHousePanelStatus();
}
