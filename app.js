import { Game } from "./game.js"
import { MultiplayerApi } from "./MultiplayerApi.js";
import { Snake } from "./snake.js";

const DEFAULT_WS_URL = "wss://mpapi.se/net";
let api = null;

const canvas =  document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

const CELL_SIZE = 20;

let tongueOut = false;
let tongueTimer = 0;
const TONGUE_INTERVAL = 20;
const TONGUE_DURATION = 8; 

const statusDiv = document.getElementById("status")

const scoreHostDiv = document.getElementById("scoreHost")
const scoreBlueDiv = document.getElementById("scoreBlue")
const startBtn = document.getElementById("startBtn")

const resetBtn = document.getElementById('resetBtn')
const hostBtn = document.getElementById('hostBtn')
const joinBtn = document.getElementById('joinBtn')
const sessionInput = document.getElementById('sessionInput')
const serverUrlInput = document.getElementById('serverUrlInput');
if (serverUrlInput) serverUrlInput.value = DEFAULT_WS_URL;

// Prefill server URL from query string: ?server=ws://host:port/path
try {
  const params = new URLSearchParams(window.location.search);
  const serverParam = params.get('server');
  if (serverParam && serverUrlInput) {
    serverUrlInput.value = serverParam;
  }
} catch {}

// Increased grid to make logical and visual board larger
const GRID_WIDTH = 60;
const GRID_HEIGHT = 45;

// Ensure canvas matches logical grid size so walls are visible
canvas.width = GRID_WIDTH * CELL_SIZE;
canvas.height = GRID_HEIGHT * CELL_SIZE;

let sessionId = null;

const game = new Game({
  width: GRID_WIDTH,
  height: GRID_HEIGHT,
  tickRate: 80,
  onRender: render
})

// Skapa alltid en orm för host (host-läge) eller local (singleplayer)
if (!sessionId) {
  if (!game.snakesById['local']) {
    game.addPlayer('local', 'lime');
  }
}

let clientId = 'local';
let isHost = false;
let activePlayerIds = new Set();

function reconcileSnakes() {
  // Alltid visa både host och klient (eller local) på båda sidor
  let ids = [];
  if (isHost) {
    // Host: alltid host + EN klient (max 2 ormar)
    const allIds = Object.keys(game.snakesById);
    const clientIds = allIds.filter(id => id !== 'host');
    ids = ['host'];
    if (clientIds.length > 0) ids.push(clientIds[0]);
    // Rensa bort övriga ormar ur snakesById och snakes
    for (const id of Object.keys(game.snakesById)) {
      if (!ids.includes(id)) delete game.snakesById[id];
    }
    game.snakes = ids.map(id => game.snakesById[id]).filter(Boolean);
  } else {
    // Klient: alltid host + min egen orm
    ids = ['host', clientId];
  }
  // Bygg snakes-listan i rätt ordning
  game.snakes = ids.map(id => game.snakesById[id]).filter(Boolean);
  // Rebuild snakesById och färger
  const map = {};
  for (const s of game.snakes) {
    if (s.id === 'host') {
      s.color = 'lime';
      // Säkerställ att host alltid startar på rätt plats
      if (s.segments && s.segments.length > 0) {
        s.segments[0] = { x: 5, y: 10 };
        if (s.segments[1]) s.segments[1] = { x: 4, y: 10 };
      }
    } else {
      s.color = 'blue';
      // Säkerställ att client alltid startar på rätt plats
      if (s.segments && s.segments.length > 0) {
        s.segments[0] = { x: 15, y: 10 };
        if (s.segments[1]) s.segments[1] = { x: 14, y: 10 };
      }
    }
    map[s.id] = s;
  }
  game.snakesById = map;
}

function withTimeout(promise, ms, onTimeoutMsg = 'Timeout') {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(onTimeoutMsg)), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); })
           .catch((e) => { clearTimeout(t); reject(e); });
  });
}

async function hostSession() {
  if (isHost) return;
  isHost = true;
  try {
    console.log('[MP] HostSession clicked');
    const url = serverUrlInput?.value?.trim() || DEFAULT_WS_URL;
    api = new MultiplayerApi(url);
    let res = null;
    let lastErr = null;
    statusDiv.innerText = `Status: Connecting ${url}...`;
    try {
      res = await withTimeout(api.host(), 7000, `Socket connect timeout for ${url}`);
      if (serverUrlInput) serverUrlInput.value = url;
    } catch (e) {
      lastErr = e;
      console.warn('[MP] Host attempt failed for', url, e?.message || e);
    }
    if (!res) throw lastErr || new Error('No working WebSocket endpoint');
    sessionId = res.session;
    clientId = 'host';
    if (!game.snakesById) game.snakesById = {};
    // Ta bort local-snake om den finns
    game.removePlayer('local');
    // Sätt host-snake
    if (!game.snakesById['host']) {
      game.addPlayer('host', 'lime');
    }
    game.snakesById['host'].id = 'host';
    game.snakesById['host'].color = 'lime';
    activePlayerIds = new Set(['host']);
    reconcileSnakes();
    render();
    api.listen(handleNetworkEvent);
    console.log('[LISTEN] api.listen(handleNetworkEvent) kopplad (host)');
    statusDiv.innerText = `Status: Hosting ${sessionId}`;
    if (sessionInput) sessionInput.value = sessionId;
    console.log('[MP] Hosting OK. sessionId=', sessionId);
    try {
      const players = Object.keys(game.snakesById || {});
      api.game({ type: 'presence', players });
    } catch {}
  } catch (e) {
    isHost = false;
    console.error('Failed to host session', e);
    statusDiv.innerText = `Status: Host failed: ${e?.message || e}`;
    alert(`Could not host session. Check server URL/path och försök igen.`);
  }
}

async function joinSession(id) {
  if (!id) return;
  isHost = false;
  sessionId = id;
  clientId = `client_${Date.now()}_${Math.floor(Math.random()*100000)}`;
  try {
    const url = serverUrlInput?.value?.trim() || DEFAULT_WS_URL;
    api = new MultiplayerApi(url);
    let lastErr = null;
    statusDiv.innerText = `Status: Joining ${id} @ ${url}...`;
    try {
      const joinRes = await withTimeout(api.join(sessionId, { name: clientId, color: 'blue' }), 7000, `Socket connect timeout for ${url}`);
      if (serverUrlInput) serverUrlInput.value = url;
    } catch (e) {
      lastErr = e;
      console.warn('[MP] Join attempt failed for', url, e?.message || e);
    }
    if (lastErr) throw lastErr;
    if (!game.snakesById) game.snakesById = {};
    // Ta bort local-snake om den finns
    game.removePlayer('local');
    // Lägg till client-snake
    if (!game.snakesById[clientId]) {
      game.addPlayer(clientId, 'blue');
    }
    game.snakesById[clientId].id = clientId;
    game.snakesById[clientId].color = 'blue';
    // Lägg till host-snake så den syns direkt
    if (!game.snakesById['host']) {
      game.addPlayer('host', 'lime');
    }
    
    activePlayerIds = new Set(['host', clientId]);
    reconcileSnakes();
    render();
    api.listen(handleNetworkEvent);
    console.log('[LISTEN] api.listen(handleNetworkEvent) kopplad (klient)');
    statusDiv.innerText = `Status: Joined ${sessionId}`;
    console.log('[MP] Join OK. clientId=', clientId);
    // Request presence from host to ensure we sync player list
    try { api.game({ type: 'presence_request', clientId }); } catch {}
    // Announce to host with our id/color so det kan mappa vår snake
    try { api.game({ type: 'hello', clientId, color: 'blue' }); } catch {}
  } catch (e) {
    console.error('Failed to join session', e);
    statusDiv.innerText = `Status: Join failed: ${e?.message || e}`;
    alert(`Could not join session ${id}. Check server URL/path och försök igen.`);
  }
}

function handleNetworkEvent(event, messageId, senderId, data) {
  // Debug: logga ALLA inkommande event på klienten
  console.log('[EVENT]', event, { messageId, senderId, data });
  if (event === 'socket_error') {
    statusDiv.innerText = `Status: Socket error. Check server ${data?.serverUrl || ''}`;
    console.error('[MP] Socket error', data);
    return;
  }
  if (event === 'socket_close') {
    statusDiv.innerText = `Status: Socket closed (${data?.code || ''} ${data?.reason || ''}).`;
    console.warn('[MP] Socket closed', data);
    return;
  }
  if (event === 'joined') {
    // Ignore join events for ourselves to avoid duplicates
      if (senderId === clientId) return;
      // No need to create snake here, it's added in 'hello' or state sync
      render();
    // Deduplicate snakes by id (keep one per id)
    const seen = new Set();
    game.snakes = game.snakes.filter(s => {
      const id = s.id;
      if (!id) return false; // drop snakes without id
      if (seen.has(id)) return false; // drop duplicates
      seen.add(id);
      return true;
    });
    // Ensure snakesById reflects current snakes uniquely
    // Preserve existing active players; add new sender; cap later in reconcile
    if (!(activePlayerIds instanceof Set)) activePlayerIds = new Set();
    activePlayerIds.add('host');
    if (senderId) activePlayerIds.add(senderId);
    reconcileSnakes();
    // If host, broadcast presence to sync all clients
    if (isHost) {
      try {
        const players = Object.keys(game.snakesById || {});
        api.sendGame({ type: 'presence', players });
      } catch {}
    }
  }
  if (event === 'game') {
    // Debug: logga data.type för alla game-events
    console.log('[EVENT:game] data.type:', data?.type, data);
    if (data?.type === 'state' && !isHost) {
      // --- Multiplayer sync: ta emot state från host ---
      const snapshot = data;
      if (!game.snakesById) game.snakesById = {};
      console.log('[SYNC] Mottar state från host:', JSON.stringify(snapshot.snakes, null, 2));
      const ids = new Set();
      // Skapa eller uppdatera ormar från hostens state
      for (const sn of (snapshot.snakes || [])) {
        ids.add(sn.id);
        let s = game.snakesById[sn.id];
        if (!s) {
          s = new Snake({ id: sn.id, startPosition: { x: 0, y: 0 }, color: sn.color || 'lime' });
          game.snakesById[sn.id] = s;
        }
        // Alltid överskriv position och riktning från host
        s.segments = sn.segments.map(seg => ({ x: seg.x, y: seg.y }));
        s.direction = sn.direction;
        s.nextDirection = sn.nextDirection;
        s.color = sn.color || s.color;
        s.alive = sn.alive !== false;
      }
      // Ta bort ormar som inte finns i hostens state från snakesById
      for (const id of Object.keys(game.snakesById)) {
        if (!ids.has(id)) {
          delete game.snakesById[id];
        }
      }
      // Bygg om snakes-listan så den matchar hostens state exakt (ordning och antal)
      game.snakes = (snapshot.snakes || []).map(sn => game.snakesById[sn.id]).filter(Boolean);
      console.log('[SYNC] Efter sync snakesById:', JSON.stringify(game.snakesById, null, 2));
      activePlayerIds = ids;
      // reconcileSnakes() behövs ej, vi har redan rätt lista
      console.log('[SYNC] Efter rebuild snakes:', JSON.stringify(game.snakes, null, 2));
      if (snapshot.food) game.food = { x: snapshot.food.x, y: snapshot.food.y };
      if (typeof snapshot.score === 'number') game.score = snapshot.score;
      render();
      return;
    }
    if (data?.type === 'hello' && isHost) {
      // Host: ensure a snake exists for the announcing client (alltid lägg till om saknas)
      if (!game.snakesById) game.snakesById = {};
      const pid = data?.clientId;
      if (pid && !game.snakesById[pid]) {
        game.addPlayer(pid, data?.color || 'lime');
        render();
      }
      if (pid) {
        // Host tracks only itself och senaste klient
        activePlayerIds = new Set(['host', pid]);
        reconcileSnakes();
      }
      return;
    }
    if (data?.type === 'start') {
      // Client starts when host broadcasts start
      if (!isHost && game.state === 'Waiting') {
        try { game.start(); } catch {}
      }
      return;
    }
    if (data?.type === 'restart') {
      // New round initiated by host: clients reset and WAIT for input or Start Game
      try {
        if (!isHost) {
          if (!game.snakesById) game.snakesById = {};
          if (!game.snakesById[clientId]) {
            game.addPlayer(clientId, 'blue');
          }
          game.reset();
          render();
          // Do NOT auto-start; wait for arrow keys or Start Game
        }
      } catch {}
      return;
    }
    if (data?.type === 'restart_and_start') {
      // Restart and auto-start clients for a new round
      try {
        if (!isHost) {
          if (!game.snakesById) game.snakesById = {};
          if (!game.snakesById[clientId]) {
            game.addPlayer(clientId, 'blue');
          }
          game.reset();
          render();
          // Auto-start on play again for clients
          try { game.start(); } catch {}
        }
      } catch {}
      return;
    }
    if (data?.type === 'state' && !isHost) {
      const snapshot = data;
      if (!game.snakesById) game.snakesById = {};
      // Debug: logga vilka ormar som kommer från host
      console.log('[SYNC] Mottar state från host:', JSON.stringify(snapshot.snakes, null, 2));
      // Sync snakes
      const ids = new Set();
      for (const sn of (snapshot.snakes || [])) {
        ids.add(sn.id);
        let s = game.snakesById[sn.id];
        if (!s) {
          game.addPlayer(sn.id, sn.color || 'lime');
          s = game.snakesById[sn.id];
        }
        // Replace segments and direction
        s.segments = sn.segments.map(seg => ({ x: seg.x, y: seg.y }));
        s.direction = sn.direction || s.direction;
        s.nextDirection = sn.nextDirection || s.direction;
        s.color = sn.color || s.color;
        s.alive = sn.alive !== false;
      }
      // Debug: logga snakesById efter sync
      console.log('[SYNC] Efter sync snakesById:', JSON.stringify(game.snakesById, null, 2));
      activePlayerIds = ids;
      reconcileSnakes();
      // Debug: logga snakes-listan efter reconcile
      console.log('[SYNC] Efter reconcile snakes:', JSON.stringify(game.snakes, null, 2));
      // Sync food and score
      if (snapshot.food) game.food = { x: snapshot.food.x, y: snapshot.food.y };
      if (typeof snapshot.score === 'number') game.score = snapshot.score;
      // Ensure rendering
      render();
      return;
    }
    if (data?.type === 'presence_request' && isHost) {
      try {
        const players = Object.keys(game.snakesById || {});
        api.sendGame({ type: 'presence', players });
      } catch {}
      return;
    }
    if (data?.type === 'presence' && Array.isArray(data.players)) {
      if (!game.snakesById) game.snakesById = {};
      // Build allowed roster differently for host vs client
      let players;
      if (isHost) {
        // Host keeps itself plus at most one non-host player from presence
        const others = data.players.filter(p => p && p !== 'host');
        players = ['host', ...others.slice(0, 1)];
      } else {
        // Client keeps host and itself
        players = data.players.filter(p => p === 'host' || p === clientId).slice(0, 2);
      }
      for (const pid of players) {
        if (!game.snakesById[pid] && game.snakes.length < 2) {
          const color = pid === 'host' ? 'lime' : 'blue';
          game.addPlayer(pid, color);
        }
      }
      activePlayerIds = new Set(players);
      reconcileSnakes();
      render();
      return;
    }
    if (data?.type === 'direction') {
      if (isHost && data?.clientId) {
        // Extra loggning för felsökning av styrning
        console.log('[HOST] Mottar direction:', data.dir, 'för clientId:', data.clientId);
        let s = game.snakesById?.[data.clientId];
        if (!s) {
          // Skapa orm för klient om den saknas
          console.warn('[HOST] Saknade snake för clientId, skapar ny blå orm:', data.clientId);
          s = game.addPlayer(data.clientId, 'blue');
        }
        if (s) {
          s.setDirection(data.dir);
          console.log('[HOST] Sätter direction på orm:', s.id, 'till:', data.dir);
        } else {
          console.error('[HOST] Kunde inte hitta eller skapa orm för clientId:', data.clientId);
        }
        // Om spelet väntar, starta på input
        if (game.state === 'Waiting') {
          try { game.start(); } catch {}
        }
      }
      return;
    }
    if (data?.type === 'start_request' && isHost) {
      // Client requests the host to start; host starts and broadcasts
      try {
        if (game.state === 'Waiting') {
          game.start();
          api.sendGame({ type: 'start' });
        }
      } catch {}
      return;
    }
  }
}

function render() {
    const state = game.getState();

    // Update tongue animation
    if (state.state === "Playing") {
      tongueTimer++;
      if (tongueTimer >= TONGUE_INTERVAL && tongueTimer < TONGUE_INTERVAL + TONGUE_DURATION) {
        tongueOut = true;
      } else if (tongueTimer >= TONGUE_INTERVAL + TONGUE_DURATION) {
        tongueOut = false;
        tongueTimer = 0;
      } else {
        tongueOut = false;
      }
    } else {
      tongueOut = false;
      tongueTimer = 0;
    }

    // Clear with background color (faster than clearRect + fillRect)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

   
    drawFood(state.food.x, state.food.y);

    // Draw all snakes (local + remote)
    if (Array.isArray(state.snakes)) {
      for (const s of state.snakes) {
        drawConnectedSnake(s);
      }
    }

    // Show game state plus multiplayer session info so Hosting/Joined persists
    statusDiv.innerText = `Status: ${state.state}${sessionId ? ` • ${isHost ? 'Hosting ' + sessionId : 'Joined ' + sessionId}` : ''}`;

    // Per-player score boxes: lime (host/local) and blue (client)
    let hostScore = 0;
    let blueScore = 0;
    if (Array.isArray(state.snakes)) {
      const hostSnake = state.snakes.find(s => s && (s.color === 'lime' || s.id === 'host'));
      const blueSnake = state.snakes.find(s => s && s.color === 'blue');
      if (hostSnake && hostSnake.segments) hostScore = hostSnake.segments.length;
      if (blueSnake && blueSnake.segments) blueScore = blueSnake.segments.length;
    }
    if (scoreHostDiv) scoreHostDiv.innerText = `Player 1: ${hostScore}`;
    if (scoreBlueDiv) scoreBlueDiv.innerText = `Player 2: ${blueScore}`;

    if (state.state === "gameover") {   
      showGameOver(state.score);
    }

    // Host broadcasts authoritative state so clients stay in sync
    if (isHost) {
      try {
        const snakesPayload = state.snakes.map(s => ({
          id: s.id,
          color: s.color,
          direction: s.direction,
          nextDirection: s.nextDirection,
          alive: s.alive,
          segments: s.segments.map(seg => ({ x: seg.x, y: seg.y }))
        }));
        // Debug: logga vad som skickas ut (som JSON)
        console.log('[HOST SYNC] Skickar state till klienter:', JSON.stringify({ snakes: snakesPayload, food: state.food, score: state.score }, null, 2));
        api.game({ type: 'state', snakes: snakesPayload, food: state.food, score: state.score });
      } catch {}
    }
}

function drawFood(x, y) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE / 2 - 2;

  // Draw shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + radius * 0.9, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw apple body with gradient
  const gradient = ctx.createRadialGradient(
    centerX - radius * 0.4,
    centerY - radius * 0.4,
    0,
    centerX,
    centerY,
    radius * 1.2
  );
  gradient.addColorStop(0, "#ff8a8a");
  gradient.addColorStop(0.5, "#ef4444");
  gradient.addColorStop(1, "#b91c1c");
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(220, 38, 38, 0.3)";
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i;
    const speckX = centerX + Math.cos(angle) * radius * 0.4;
    const speckY = centerY + Math.sin(angle) * radius * 0.4;
    ctx.beginPath();
    ctx.arc(speckX, speckY, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius * 0.9);
  ctx.quadraticCurveTo(
    centerX + radius * 0.1,
    centerY - radius * 1.2,
    centerX + radius * 0.25,
    centerY - radius * 1.3
  );
  ctx.stroke();

  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.ellipse(
    centerX + radius * 0.5,
    centerY - radius * 1.2,
    radius * 0.5,
    radius * 0.3,
    Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Leaf vein
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX + radius * 0.35, centerY - radius * 1.2);
  ctx.lineTo(centerX + radius * 0.65, centerY - radius * 1.2);
  ctx.stroke();

  const highlightGradient = ctx.createRadialGradient(
    centerX - radius * 0.4,
    centerY - radius * 0.4,
    0,
    centerX - radius * 0.4,
    centerY - radius * 0.4,
    radius * 0.5
  );
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  
  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawConnectedSnake(snake) {
  const segments = snake.segments;
  const radius = CELL_SIZE / 2;

  // Use snake.color for body and head
  const bodyColor = snake.color || "lime";
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = CELL_SIZE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  segments.forEach((seg, index) => {
    const x = seg.x * CELL_SIZE + CELL_SIZE / 2;
    const y = seg.y * CELL_SIZE + CELL_SIZE / 2;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw body segments
  segments.forEach((seg, index) => {
    if (index === 0) return; // Skip head
    const centerX = seg.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = seg.y * CELL_SIZE + CELL_SIZE / 2;
    if (!isFinite(centerX) || !isFinite(centerY)) return;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    if (index % 2 === 0) {
      ctx.strokeStyle = "rgba(21, 128, 61, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Draw head
  const head = segments[0];
  const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
  const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(headX, headY, radius * 1.1, 0, Math.PI * 2);
  ctx.fill();

  const direction = snake.direction;
  let eye1X, eye1Y, eye2X, eye2Y;
  const eyeOffset = radius * 0.5;
  const eyeDistance = radius * 0.6;

  if (direction === "UP") {
    eye1X = headX - eyeDistance; eye1Y = headY - eyeOffset;
    eye2X = headX + eyeDistance; eye2Y = headY - eyeOffset;
  } else if (direction === "DOWN") {
    eye1X = headX - eyeDistance; eye1Y = headY + eyeOffset;
    eye2X = headX + eyeDistance; eye2Y = headY + eyeOffset;
  } else if (direction === "LEFT") {
    eye1X = headX - eyeOffset; eye1Y = headY - eyeDistance;
    eye2X = headX - eyeOffset; eye2Y = headY + eyeDistance;
  } else {
    eye1X = headX + eyeOffset; eye1Y = headY - eyeDistance;
    eye2X = headX + eyeOffset; eye2Y = headY + eyeDistance;
  }

  const eyeRadius = radius * 0.35;
  const pupilRadius = radius * 0.18;
  const shineRadius = radius * 0.08;
  const shineOffset = radius * 0.08;

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
  ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, pupilRadius, 0, Math.PI * 2);
  ctx.arc(eye2X, eye2Y, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(eye1X - shineOffset, eye1Y - shineOffset, shineRadius, 0, Math.PI * 2);
  ctx.arc(eye2X - shineOffset, eye2Y - shineOffset, shineRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw tongue if it's out (draw after eyes so it's on top)
  if (tongueOut) {
    drawTongue(headX, headY, radius, direction);
  }
}

function drawTongue(headX, headY, radius, direction) {
  const tongueLength = radius * 1.5;
  const tongueWidth = radius * 0.15;
  let tongueX, tongueY, forkX1, forkY1, forkX2, forkY2;

  // Position tongue based on direction
  if (direction === "UP") {
    tongueX = headX;
    tongueY = headY - radius * 1.1 - tongueLength;
    forkX1 = tongueX - tongueWidth * 2;
    forkY1 = tongueY - tongueWidth * 2;
    forkX2 = tongueX + tongueWidth * 2;
    forkY2 = tongueY - tongueWidth * 2;
  } else if (direction === "DOWN") {
    tongueX = headX;
    tongueY = headY + radius * 1.1 + tongueLength;
    forkX1 = tongueX - tongueWidth * 2;
    forkY1 = tongueY + tongueWidth * 2;
    forkX2 = tongueX + tongueWidth * 2;
    forkY2 = tongueY + tongueWidth * 2;
  } else if (direction === "LEFT") {
    tongueX = headX - radius * 1.1 - tongueLength;
    tongueY = headY;
    forkX1 = tongueX - tongueWidth * 2;
    forkY1 = tongueY - tongueWidth * 2;
    forkX2 = tongueX - tongueWidth * 2;
    forkY2 = tongueY + tongueWidth * 2;
  } else { // RIGHT
    tongueX = headX + radius * 1.1 + tongueLength;
    tongueY = headY;
    forkX1 = tongueX + tongueWidth * 2;
    forkY1 = tongueY - tongueWidth * 2;
    forkX2 = tongueX + tongueWidth * 2;
    forkY2 = tongueY + tongueWidth * 2;
  }

  // Draw tongue line
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = tongueWidth * 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  
  if (direction === "UP" || direction === "DOWN") {
    ctx.moveTo(headX, headY + (direction === "UP" ? -radius * 1.1 : radius * 1.1));
    ctx.lineTo(tongueX, tongueY);
  } else {
    ctx.moveTo(headX + (direction === "LEFT" ? -radius * 1.1 : radius * 1.1), headY);
    ctx.lineTo(tongueX, tongueY);
  }
  ctx.stroke();

  ctx.lineWidth = tongueWidth * 1.5;
  ctx.beginPath();
  ctx.moveTo(tongueX, tongueY);
  ctx.lineTo(forkX1, forkY1);
  ctx.moveTo(tongueX, tongueY);
  ctx.lineTo(forkX2, forkY2);
  ctx.stroke();
}



window.addEventListener("keydown", e => {
  // Debug: logga relevant info vid piltryck
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
    if (!game.snakesById?.[clientId]) {
      console.log("[DEBUG] snake undefined! clientId:", clientId, "game.snakes:", game.snakes, "game.snakesById:", game.snakesById);
    }
    console.log("Piltangent:", e.key, "clientId:", clientId, "game.state:", game.state, "snake:", game.snakesById?.[clientId]);
  }
  // Gör så att piltangenter alltid styr ormen, även om input har fokus
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
    // Förhindra scroll och att input-fält fångar piltangenter
    e.preventDefault();
    // Om du är i multiplayer: se till att clientId är rätt
    const snake = game.snakesById?.[clientId];
    const wasIdle = game.state === "Waiting";

    // Compute direction first
    const dir = (
      e.key === 'ArrowUp' ? 'UP' :
      e.key === 'ArrowDown' ? 'DOWN' :
      e.key === 'ArrowLeft' ? 'LEFT' :
      e.key === 'ArrowRight' ? 'RIGHT' : null
    );

    // Apply local direction for responsiveness
    if (snake && dir) {
      snake.setDirection(dir);
      console.log("Set direction on snake id:", clientId, "color:", snake?.color, "to:", dir);
    }

    // Broadcast input for multiplayer
    if (dir) {
      try { api.game({ type: 'direction', clientId, dir }); } catch {}
      // Om klient trycker pil när spelet väntar, be host starta
      if (!isHost && game.state === 'Waiting') {
        try { api.game({ type: 'start_request', clientId }); } catch {}
        // Fallback: starta lokalt för responsivitet
        try { game.start(); } catch {}
      }
    }

    // Host startar spelet på piltryck om idle
    if (isHost && wasIdle && snake) {
      game.start();
    }
  }
});


const gameOverPopup = document.getElementById("gameOverPopup");
const finalScoreDiv = document.getElementById("finalScore");
const playAgainBtn = document.getElementById("playAgainBtn");
const closePopupBtn = document.getElementById("closePopupBtn");

function showGameOver(score) {
  finalScoreDiv.innerText = `Final Score: ${score}`;
  gameOverPopup.style.display = "flex";
}

function hideGameOver() {
  gameOverPopup.style.display = "none";
}

// Wire reset to coordinated host/client behavior
resetBtn.addEventListener("click", () => {
  if (isHost) {
    if (!game.snakesById) game.snakesById = {};
    if (!game.snakesById[clientId]) {
      game.addPlayer(clientId, 'lime');
    }
    game.reset();
    hideGameOver();
    render();
    // Do NOT auto-start; broadcast restart and wait for input or Start Game
    try { api.game({ type: 'restart' }); } catch {}
  } else {
    game.reset();
    hideGameOver();
    render();
  }
});

// Close popup: just hide overlay, no restart
if (closePopupBtn) {
  closePopupBtn.addEventListener("click", () => {
    hideGameOver();
  });
}

render();             

// Simple shortcuts: H to host, J to join
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'h') {
    hostSession();
  }
  if (e.key.toLowerCase() === 'j') {
    const id = prompt('Enter session ID to join:');
    if (id) joinSession(id);
  }
});

// Multiplayer buttons
if (hostBtn) {
  hostBtn.addEventListener('click', () => {
    try { hostSession(); } catch (e) { console.error(e); }
  });
}
if (joinBtn) {
  joinBtn.addEventListener('click', () => {
    const id = sessionInput?.value?.trim();
    if (id) {
      try { joinSession(id); } catch (e) { console.error(e); }
    } else {
      alert('Enter a Session ID');
    }
  });
}

// Synchronize start across tabs: host sends start, clients follow
function startGameSynced() {
  if (isHost) {
    // Ensure local snake exists before starting
    if (!game.snakesById) game.snakesById = {};
    if (!game.snakesById[clientId]) {
      game.addPlayer(clientId, 'lime');
    }
    // Hide game-over popup if visible
    hideGameOver();
    game.start();
    try { api.game({ type: 'start' }); } catch {}
  } else {
    // Clients rely on host 'start' broadcast; do not start here
  }
}

// Hook start button to synced start
if (startBtn) {
  // Overwrite any previous click handler to use synced start
  startBtn.onclick = null;
  startBtn.addEventListener('click', () => {
    if (isHost) {
      // Host starts both sides
      hideGameOver();
      startGameSynced();
    } else {
      // Client: start locally for responsiveness and request host to start
      hideGameOver();
      try { game.start(); } catch {}
      try { api.game({ type: 'start_request', clientId }); } catch {}
      statusDiv.innerText = `Status: Playing${sessionId ? ` • Joined ${sessionId}` : ''}`;
    }
  });
}

// Also start when arrow key pressed: host only, and broadcast
window.addEventListener('keydown', (e) => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
    if (isHost && game.state === 'Waiting') {
      startGameSynced();
    }
  }
});