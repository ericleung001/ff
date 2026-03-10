// client/js/api.js — HTTP + Socket.io client wrapper

const BASE = window.location.origin;
let _token = localStorage.getItem('ac_token') || null;
let _socket = null;

function setToken(t) { _token = t; localStorage.setItem('ac_token', t); }
function clearToken()  { _token = null; localStorage.removeItem('ac_token'); }
function getToken()    { return _token; }

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ..._token ? { Authorization: 'Bearer ' + _token } : {},
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API 錯誤');
  return data;
}

async function register(username, email, password) {
  const d = await api('POST', '/api/auth/register', { username, email, password });
  setToken(d.token);
  return d;
}
async function login(username, password) {
  const d = await api('POST', '/api/auth/login', { username, password });
  setToken(d.token);
  return d;
}
function logout() { clearToken(); _socket?.disconnect(); }

const getChars      = ()            => api('GET',   '/api/characters');
const createChar    = (name, job)   => api('POST',  '/api/characters', { name, job });
const getChar       = (id)          => api('GET',   `/api/characters/${id}`);
const learnSkill    = (id, skillId, cost) => api('POST', `/api/characters/${id}/learn-skill`, { skillId, cost });
const equipItem     = (id, itemId, slot)  => api('POST', `/api/characters/${id}/equip`, { itemId, slot });
const updateStory   = (id, idx)     => api('PATCH', `/api/characters/${id}/story`, { storyIndex: idx });
const soloReward    = (id, data)    => api('POST',  `/api/characters/${id}/solo-reward`, data);
const saveHpMp      = (id, hp, mp) => api('POST',  `/api/characters/${id}/save-hp`, { hp, mp });

// ✅ 新增：採集獲得物品 API
const gatherReward  = (id, data)    => api('POST',  `/api/characters/${id}/gather`, data);

const createRoom    = (characterId, dungeonId=1, maxPlayers=4, isPrivate=false, title='', extra={}) =>
  api('POST', '/api/dungeons/rooms', { characterId, dungeonId, maxPlayers, isPrivate, title, targetMonster: extra.targetMonster });
const joinRoom      = (roomCode, characterId)  => api('POST', '/api/dungeons/rooms/join', { roomCode, characterId });
const getRoomInfo   = (code)        => api('GET',   `/api/dungeons/rooms/${code}`);
const listRooms     = ()            => api('GET',   '/api/dungeons/rooms');
const setReady      = (roomId, characterId) => api('PATCH', `/api/dungeons/rooms/${roomId}/ready`, { characterId });

const craftItem       = (id, craftId) => api('POST', `/api/characters/${id}/craft`, { craftId });
const disassembleItem = (id, invId)   => api('POST', `/api/characters/${id}/disassemble`, { invId });
const upgradeTool     = (id, toolId)  => api('POST', `/api/characters/${id}/upgrade-tool`, { toolId });
const enhanceItem     = (id, invId, isEquipped) => api('POST', `/api/characters/${id}/enhance`, { invId, isEquipped });

function connectSocket() {
  if (_socket?.connected) return _socket;
  _socket = io(BASE, { auth: { token: _token }, transports: ['websocket','polling'] });
  return _socket;
}
function getSocket() { return _socket; }

window.AC_API = {
  getToken, setToken, clearToken,
  register, login, logout,
  getChars, createChar, getChar, learnSkill, equipItem, updateStory,
  soloReward, saveHpMp, gatherReward,
  createRoom, joinRoom, getRoomInfo, listRooms, setReady,
  craftItem, disassembleItem, upgradeTool, enhanceItem,
  connectSocket, getSocket,
};
