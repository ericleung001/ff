// ════════════════════════════════════════════
//  CRAFT SYSTEM
// ════════════════════════════════════════════
let _currentCraft = null;

function openCraft(id) {
  const d = CRAFT_DATA[id]; if(!d) return;
  _currentCraft = id;
  const isTools = (d.panel === 'tools');
  const resultId = isTools ? 'craft-result-tools' : 'craft-result';
  const titleId  = isTools ? 'craft-result-tools-title' : 'craft-result-title';
  const bodyId   = isTools ? 'craft-result-tools-body'  : 'craft-result-body';

  document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
  const card = document.getElementById(resultId);
  if(!card) return;
  document.getElementById(titleId).textContent = `${d.icon} ${d.name}　製作確認`;
  document.getElementById(bodyId).innerHTML    = `所需素材：${d.req}<br>製作效果：${d.result}`;
  card.classList.add('show');
  card.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function closeCraft() {
  _currentCraft = null;
  document.querySelectorAll('.craft-result-card').forEach(c=>c.classList.remove('show'));
}

function doCraft() {
  if(!_currentCraft) return;
  const d = CRAFT_DATA[_currentCraft];
  notify(`✦ 成功製作【${d.name}】！${d.result}`, 'ok');
  closeCraft();
}
