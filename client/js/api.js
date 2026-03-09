// client/js/api.js — HTTP + Socket.io client wrapper

const BASE = window.location.origin;
let _token = localStorage.getItem('ac_token') || null;
let _socket = null;

// ── Token helpers ─────────────────────────────────────────
function setToken(t) { _token = t; localStorage.setItem('ac_token', t); }
function clearToken()  { _token = null; localStorage.removeItem('ac_token'); }
function getToken()    { return _token; }

// ── HTTP helper ───────────────────────────────────────────
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

// ── Auth ──────────────────────────────────────────────────
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

// ── Characters ────────────────────────────────────────────
const getChars      = ()            => api('GET',   '/api/characters');
const createChar    = (name, job)   => api('POST',  '/api/characters', { name, job });
const getChar       = (id)          => api('GET',   `/api/characters/${id}`);
const learnSkill    = (id, skillId, cost) => api('POST', `/api/characters/${id}/learn-skill`, { skillId, cost });
const equipItem     = (id, itemId, slot)  => api('POST', `/api/characters/${id}/equip`, { itemId, slot });
const updateStory   = (id, idx)     => api('PATCH', `/api/characters/${id}/story`, { storyIndex: idx });
const soloReward    = (id, data)    => api('POST',  `/api/characters/${id}/solo-reward`, data);
const saveHpMp      = (id, hp, mp) => api('POST',  `/api/characters/${id}/save-hp`, { hp, mp });

// ── Dungeons ──────────────────────────────────────────────
const createRoom    = (characterId, dungeonId=1, maxPlayers=4, isPrivate=false, title='') =>
  api('POST', '/api/dungeons/rooms', { characterId, dungeonId, maxPlayers, isPrivate, title });
const joinRoom      = (roomCode, characterId)  => api('POST', '/api/dungeons/rooms/join', { roomCode, characterId });
const getRoomInfo   = (code)        => api('GET',   `/api/dungeons/rooms/${code}`);
const listRooms     = ()            => api('GET',   '/api/dungeons/rooms');
const setReady      = (roomId, characterId) => api('PATCH', `/api/dungeons/rooms/${roomId}/ready`, { characterId });

// ── Socket ────────────────────────────────────────────────
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
  soloReward, saveHpMp,
  createRoom, joinRoom, getRoomInfo, listRooms, setReady,
  connectSocket, getSocket,
};