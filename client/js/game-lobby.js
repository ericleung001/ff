// ════════════════════════════════════════════
//  SOCKET.IO & GLOBAL CHAT
// ════════════════════════════════════════════

function connectGameSocket() {
  if (!AC_API.getToken()) return;
  if (state.socket) return; // 避免重複連線
  
  state.socket = AC_API.connectSocket();
  const s = state.socket;

  s.on('connect', () => {
      console.log('[Socket] Connected to server.');
      notify('已連線到伺服器！', 'ok');
  });
  
  s.on('connect_error', () => {
      notify('伺服器連線失敗，請重整網頁', 'err');
  });

  // ── 全域聊天室 ──
  s.on('chat', ({from, message}) => {
    const area = document.getElementById('g-chat');
    if (!area) return;
    
    const msgHtml = `<span class="chat-from">${from}: </span><span class="chat-txt">${message}</span>`;
    const d = document.createElement('div'); 
    d.className = 'chat-msg'; 
    d.innerHTML = msgHtml;
    
    area.appendChild(d); 
    area.scrollTop = area.scrollHeight;
    
    // 呼叫 game-ui.js 的通知紅點
    if (typeof notifyChatBadge === 'function') notifyChatBadge();
  });

  // ── 錯誤捕捉 ──
  s.on('error', ({msg}) => {
      notify(msg, 'err');
  });

  //  備註：所有關於「房間更新」、「戰鬥開始」、「回合倒數」等 Socket 事件，
  // 已經全部移交給 game-combat.js 內的 initCombatExtraSockets() 統一處理！
}

function sendChat() {
  const inp = document.getElementById('g-chat-inp');
  if (!inp) return;
  const msg = inp.value.trim(); 
  if (!msg || !state.socket) return;
  
  state.socket.emit('chat', { roomCode: state.roomCode || 'global', message: msg });
  inp.value = '';
}

function sendChatMob() { 
  sendChat(); 
}