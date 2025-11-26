/* portal.app.js — Game Portal with Authentication and Progress Tracking
   Features:
   - User authentication check
   - Multiple games with automatic progress tracking
   - Score submission to backend
   - Replay functionality
*/

const API_URL = 'http://localhost:3000/api';

// Check authentication on page load
let currentUser = null;
let authToken = null;

window.addEventListener('DOMContentLoaded', () => {
  authToken = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  
  if (!authToken || !userStr) {
    // Redirect to login
    window.location.href = 'login.html';
    return;
  }
  
  currentUser = JSON.parse(userStr);
  document.getElementById('username').textContent = currentUser.username || 'Guest';
  
  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });
});

// CONFIG: All available games
const GAMES = [
  { id:'snake', title:'Neon Serpent', category:'Arcade', embed:'./games/snake/index.html', blurb:'Synth snake combos with chaining boosts.' },
  { id:'pingpong', title:'Loop Rally', category:'Arcade', embed:'./games/pingpong/index.html', blurb:'Laser-fast paddle rallies with looping shots.' },
  { id:'bubbleshooter', title:'Orb Pop Deluxe', category:'Arcade', embed:'./games/bubbleshooter/index.html', blurb:'Color-matching bubble calm with score climbs.' },
  { id:'carracing', title:'Turbo Drift', category:'Racing', embed:'./games/carracing/index.html', blurb:'Slide through neon corners and chase best laps.' },
  { id:'puzzle', title:'Slide Forge', category:'Puzzle', embed:'./games/puzzle/index.html', blurb:'Craft the picture one satisfying move at a time.' },
  { id:'crazytype', title:'Key Frenzy', category:'Skill', embed:'./games/monkeytyping/index.html', blurb:'Typing gauntlet for lightning-fast accuracy.' },
  { id:'dino', title:'Astro Strider', category:'Arcade', embed:'./games/dino/index.html', blurb:'Dash over cosmic cliffs and dodge meteors.' },
  { id:'wordguesser', title:'Cipher Quest', category:'Puzzle', embed:'./games/wordguesser/index.html', blurb:'Guess words under pressure with streak bonuses.' },
  { id:'reactiontime', title:'Blink Lab', category:'Skill', embed:'./games/reactiontime/index.html', blurb:'Minimal reflex trials to shave off milliseconds.' },
  { id:'haunted-calculator', title:'Phantom Calc', category:'Puzzle', embed:'./games/haunted/index.html', blurb:'Haunted math riddles that glitch the display.' },
  { id:'wordle', title:'Word Pulse', category:'Puzzle', embed:'./games/wordle/index.html', blurb:'Word-wave challenge with hints and penalties.' }
];

// Thumbnail file paths (SVG). Replace with real art assets later.
const THUMBS = {
  snake: 'assets/thumbs/snake.svg',
  pingpong: 'assets/thumbs/pingpong.svg',
  bubbleshooter: 'assets/thumbs/bubbleshooter.svg',
  carracing: 'assets/thumbs/carracing.svg',
  puzzle: 'assets/thumbs/puzzle.svg',
  crazytype: 'assets/thumbs/crazytype.svg',
  dino: 'assets/thumbs/dino.svg',
  wordguesser: 'assets/thumbs/wordguesser.svg',
  reactiontime: 'assets/thumbs/reactiontime.svg',
  'haunted-calculator': 'assets/thumbs/haunted-calculator.svg'
  ,wordle: 'assets/thumbs/wordle.svg'
};

// Feedback opt-out key
const FEEDBACK_OPT_KEY = 'portal_feedback_optout';

const grid = document.getElementById('grid');
const fsGame = document.getElementById('fsGame'); // fullscreen container

if (!grid || !fsGame) {
  console.error('portal.app.js: required DOM elements missing (#grid or #fsGame).');
} else {

  // small background particle canvas (optional, non-blocking)
  (function smallParticles(){
    const c = document.getElementById('bgCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    function fit(){ c.width = innerWidth; c.height = innerHeight; }
    fit(); addEventListener('resize', fit);
    const palette = ['255,0,77','0,240,255','124,58,237'];
    const parts = Array.from({length: Math.max(12, Math.floor((c.width*c.height)/120000))}, () => ({
      x: Math.random()*c.width,
      y: Math.random()*c.height,
      r: Math.random()*1.8+0.4,
      a: Math.random()*0.08+0.03,
      vx: (Math.random()-0.5)*0.25,
      vy: (Math.random()-0.5)*0.08,
      tint: palette[Math.floor(Math.random()*palette.length)]
    }));
    (function tick(){
      ctx.clearRect(0,0,c.width,c.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = c.width + 10; if (p.x > c.width + 10) p.x = -10;
        if (p.y < -10) p.y = c.height + 10; if (p.y > c.height + 10) p.y = -10;
        ctx.beginPath(); ctx.fillStyle = `rgba(${p.tint},${p.a})`; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(tick);
    })();
  })();

  // Search functionality
  const searchInput = document.getElementById('search');
  let filteredGames = [...GAMES];
  
  searchInput && searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filteredGames = GAMES.filter(g => 
      g.title.toLowerCase().includes(query) || 
      g.category.toLowerCase().includes(query)
    );
    render();
  });

  const playCTA = document.getElementById('ctaPlay');
  playCTA && playCTA.addEventListener('click', () => {
    grid?.scrollIntoView({ behavior:'smooth', block:'start' });
  });

  // Theme toggle cycling through presets
  const themeToggle = document.getElementById('themeToggle');
  const themes = ['theme-ocean','theme-sunset','theme-forest'];
  let themeIndex = 0;
  themeToggle && themeToggle.addEventListener('click', () => {
    document.body.classList.remove(...themes);
    const next = themes[themeIndex];
    document.body.classList.add(next);
    themeIndex = (themeIndex + 1) % themes.length;
  });

  // render grid
  function createCard(g){
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = g.id;
    const thumb = THUMBS[g.id] ? `<img class="thumb" src="${THUMBS[g.id]}" alt="${escapeHtml(g.title)} thumbnail"/>` : `<div class="logo" aria-hidden="true">${g.title.split(' ').map(w=>w[0]).join('').toUpperCase()}</div>`;
    card.innerHTML = `
      ${thumb}
      <div class="meta">
        <div class="title">${g.title}</div>
        <div class="cat">${g.category}</div>
        <p class="blurb">${g.blurb || ''}</p>
      </div>
      <div class="play-badge">Play</div>
    `;
    card.addEventListener('click', ()=> openFullscreenGame(g));
    return card;
  }
  function render(){
    grid.innerHTML = '';
    filteredGames.forEach((g,i)=> {
      const c = createCard(g);
      c.style.animationDelay = `${80 + i*80}ms`;
      grid.appendChild(c);
    });
    
    if (filteredGames.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ff6b6b; padding: 40px;">No games found</div>';
    }
  }
  render();

  // Auto-launch game if query param provided (enables direct HUD play from homepage)
  const launchParam = new URLSearchParams(location.search).get('game');
  if (launchParam){
    const autoGame = GAMES.find(g=>g.id===launchParam);
    if (autoGame){
      // Slight delay to ensure DOM ready
      setTimeout(()=> openFullscreenGame(autoGame), 50);
    }
  }

  // helper to build iframe (ensures consistent z-index/pointer behavior)
  function buildIframe(src){
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.allowFullscreen = true;
    iframe.sandbox = 'allow-scripts allow-forms allow-same-origin';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.loading = 'eager';
    iframe.style.zIndex = '1002';
    iframe.style.pointerEvents = 'auto';
    return iframe;
  }

  // state
  let currentGame = null;
  let currentIframe = null;
  let awaitingReplyAfterGameOver = false; // flag indicates game_over received and waiting for key to auto-open reply
  let replyVisible = false;

  // Open fullscreen game with right-side controls
  let paused = false;
  function openFullscreenGame(game){
    currentGame = game;
    paused = false;
    fsGame.classList.add('active');
    fsGame.setAttribute('aria-hidden','false');
    fsGame.innerHTML = `
      <div class="stage">
        <div class="game-frame" id="gameFrame"></div>
        <aside class="hud-panel" id="hudPanel" aria-label="Player Stats">
          <div class="hud-row hud-user">👤 <span id="hudUser">${escapeHtml(currentUser?.username||'Player')}</span></div>
          <div class="hud-row hud-game">🎮 <span id="hudGame">${escapeHtml(game.title)}</span></div>
          <div class="hud-row">Score: <span id="hudScore">—</span></div>
          <div class="hud-row">High: <span id="hudHigh">${getStoredHigh(game.id) ?? '—'}</span></div>
          <div class="hud-mini-help">(Scores update after each run)</div>
        </aside>
        <div class="game-controls" aria-label="Game Controls">
          <button class="gc-btn" id="btnPause">⏸ Pause</button>
          <button class="gc-btn hidden" id="btnResume">▶ Resume</button>
          <button class="gc-btn exit" id="btnExit">⌂ Home</button>
          <button class="gc-btn" id="btnReplay">↻ Replay</button>
        </div>
        <div class="pause-layer" id="pauseLayer" aria-hidden="true"><div class="pause-msg">PAUSED</div></div>
      </div>`;
    const frame = document.getElementById('gameFrame');
    attachNewIframeToWrap(game.embed, frame);
    wireFullscreenControls();
    setTimeout(()=> { try { currentIframe?.contentWindow?.focus(); } catch(e){} }, 350);
  }

  function wireFullscreenControls(){
    const btnPause = document.getElementById('btnPause');
    const btnResume = document.getElementById('btnResume');
    const btnExit = document.getElementById('btnExit');
    const btnReplay = document.getElementById('btnReplay');
    const pauseLayer = document.getElementById('pauseLayer');
    const frame = document.getElementById('gameFrame');

    btnPause?.addEventListener('click', ()=>{
      if (paused) return; paused = true;
      pauseLayer.classList.add('show');
      btnPause.classList.add('hidden');
      btnResume.classList.remove('hidden');
      frame.style.filter = 'blur(3px) brightness(.6)';
    });
    btnResume?.addEventListener('click', ()=>{
      if (!paused) return; paused = false;
      pauseLayer.classList.remove('show');
      btnResume.classList.add('hidden');
      btnPause.classList.remove('hidden');
      frame.style.filter = 'none';
      try { currentIframe?.contentWindow?.focus(); } catch(e){}
    });
    btnExit?.addEventListener('click', ()=>{
      if (replyVisible){ return; }
      exitFullscreen();
    });
    btnReplay?.addEventListener('click', ()=>{
      if (!frame) return;
      if (currentIframe && currentIframe.parentNode) try { currentIframe.remove(); } catch(e){}
      attachNewIframeToWrap(currentGame.embed, frame);
      if (paused){ paused=false; pauseLayer.classList.remove('show'); btnResume.classList.add('hidden'); btnPause.classList.remove('hidden'); frame.style.filter='none'; }
    });
  }

  function attachNewIframeToWrap(src, wrapEl){
    if (!wrapEl) return;
    // remove previous iframe
    if (currentIframe && currentIframe.parentNode) try { currentIframe.remove(); } catch(e){}
    // create new
    const ifr = buildIframe(src);
    wrapEl.appendChild(ifr);
    currentIframe = ifr;

    // Ensure the iframe posts focus once loaded
    ifr.addEventListener('load', ()=> {
      try { ifr.contentWindow && ifr.contentWindow.focus && ifr.contentWindow.focus(); } catch(e){}
    });
  }

  function exitFullscreen(){
    if (currentIframe && currentIframe.parentNode) try { currentIframe.remove(); } catch(e){}
    currentIframe = null; currentGame = null; awaitingReplyAfterGameOver = false; replyVisible = false;
    fsGame.classList.remove('active');
    fsGame.setAttribute('aria-hidden','true');
    fsGame.innerHTML = '';
  }

  // PostMessage listener for game over
  window.addEventListener('message', (ev) => {
    // In production, restrict origin checking here
    let data = ev.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch(e) {}
    if (!data || data.type !== 'game_over') return;
    
    // Save progress to backend
    saveGameProgress(data.gameId || currentGame?.id, data.score, data.stats, data.result);
    
    // Update HUD score/high
    const gid = data.gameId || currentGame?.id;
    const scoreVal = typeof data.score === 'number' ? data.score : (data.score? Number(data.score): null);
    if (gid && scoreVal != null){
      const hs = updateHighIfNeeded(gid, scoreVal);
      const hudScore = document.getElementById('hudScore');
      const hudHigh = document.getElementById('hudHigh');
      if(hudScore) hudScore.textContent = scoreVal;
      if(hudHigh) hudHigh.textContent = hs;
    }

    if (data.result === 'lost') {
      if (localStorage.getItem(FEEDBACK_OPT_KEY)==='1') return; // user opted out
      awaitingReplyAfterGameOver = true;
      showReplyBox(data.gameId || data.id || currentGame?.id || 'unknown', data.score ?? null);
    }
  });

  // Save game progress to backend
  async function saveGameProgress(gameId, score, stats, result) {
    if (!authToken || !gameId) return;
    
    try {
      const response = await fetch(`${API_URL}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          gameId,
          score: score || 0,
          stats: stats || {},
          result: result || 'completed'
        })
      });
      
      if (response.ok) {
        console.log('Progress saved successfully');
      }
    } catch (error) {
      console.log('Could not save progress (offline mode):', error);
      // Fallback to localStorage
      const offlineProgress = JSON.parse(localStorage.getItem('offlineProgress') || '[]');
      offlineProgress.push({
        gameId,
        score,
        stats,
        result,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('offlineProgress', JSON.stringify(offlineProgress));
    }
  }

  // show reply UI (disables closing while visible). If already visible, no-op.
  function showReplyBox(gameId, score){
    if (replyVisible) return;
    replyVisible = true;
    // disable close buttons/backdrop by leaving replyVisible true
    // build box
    const existing = document.getElementById('portal-reply-box');
    if (existing) existing.remove();
    const g = GAMES.find(x=>x.id===gameId);
    const title = g ? g.title : (gameId || 'Game');

    const box = document.createElement('div');
    box.id = 'portal-reply-box';
    Object.assign(box.style, {
      position:'fixed', right:'20px', bottom:'20px', width:'340px', maxWidth:'calc(100% - 40px)',
      borderRadius:'12px', padding:'12px', background:'linear-gradient(180deg,rgba(8,12,18,0.98),#000)',
      boxShadow:'0 18px 60px rgba(2,6,23,0.8)', zIndex:13050, color:'#eaf9ff', fontFamily:'Inter, system-ui, sans-serif'
    });
    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-weight:800">${escapeHtml(title)}</div>
        <button id="reply-close" aria-label="Close feedback" style="background:transparent;border:0;color:#9fb0c6;cursor:pointer">✕</button>
      </div>
      <div style="font-size:13px;color:#9fb0c6;margin-bottom:8px">You lost • Score: ${score ?? '—'} (optional feedback)</div>
      <textarea id="reply-text" rows="3" placeholder="Quick feedback (optional)" style="width:100%;border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,0.04);background:rgba(255,255,255,0.01);color:#eaf9ff"></textarea>
      <div class="opt-row"><input type="checkbox" id="reply-optout" /> <label for="reply-optout">Don't ask again</label></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
        <button id="reply-send" style="padding:8px 12px;border-radius:8px;border:0;background:linear-gradient(180deg,#00b7e6,#00d5ff);color:#041017;font-weight:800;cursor:pointer">Send</button>
        <button id="reply-skip" style="padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#9fb0c6;cursor:pointer">Skip</button>
      </div>
    `;
    document.body.appendChild(box);

    // Disable modal close behavior while reply visible by setting replyVisible true (close handlers check it)
    // Hook buttons
    function finishClose(){
      const opt = document.getElementById('reply-optout');
      if (opt && opt.checked){ localStorage.setItem(FEEDBACK_OPT_KEY,'1'); }
      replyVisible = false;
      const el = document.getElementById('portal-reply-box'); if (el) el.remove();
    }
    document.getElementById('reply-close').addEventListener('click', finishClose);
    document.getElementById('reply-skip').addEventListener('click', finishClose);
    document.getElementById('reply-send').addEventListener('click', () => {
      const text = document.getElementById('reply-text').value.trim();
      if (text){
        const reply = { id:'r_'+Date.now(), gameId, score, text, ts: new Date().toISOString() };
        try { const arr = JSON.parse(localStorage.getItem('gameReplies')||'[]'); arr.push(reply); localStorage.setItem('gameReplies', JSON.stringify(arr)); } catch(e){}
        console.log('Saved reply:', reply);
      }
      box.innerHTML = `<div style="padding:18px;text-align:center;color:#baf6ff;font-weight:800">${text? 'Thanks — feedback saved.' : 'Skipped.'}</div>`;
      setTimeout(finishClose, 900);
    });

    // (Key-trigger auto open removed to reduce disturbance.)
  }

  // Also support manual test: any key after game_over triggers the reply UI (if awaitingReplyAfterGameOver true)
  window.addEventListener('keydown', (e) => {
    if (awaitingReplyAfterGameOver && !replyVisible) {
      // open the reply for the last known game
      showReplyBox(currentGame?.id || 'unknown', null);
      // reset awaiting flag so it doesn't reopen repeatedly
      awaitingReplyAfterGameOver = false;
    }
    // Esc closes modal if reply not visible
    if (e.key === 'Escape' && !replyVisible) {
      if (fsGame.classList.contains('active')) exitFullscreen();
    }
  });

  // small helper
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // High score helpers
  function highKey(gameId){ return `hp_highscore_${currentUser?.username||'guest'}_${gameId}`; }
  function getStoredHigh(gameId){ const v = localStorage.getItem(highKey(gameId)); return v? Number(v): null; }
  function updateHighIfNeeded(gameId, score){
    if(score == null) return getStoredHigh(gameId) ?? score ?? 0;
    const prev = getStoredHigh(gameId) ?? 0;
    if(score > prev){ localStorage.setItem(highKey(gameId), String(score)); return score; }
    return prev;
  }

} // end main
