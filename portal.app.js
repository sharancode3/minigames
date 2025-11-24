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
  { id:'snake', title:'Crazy Snake', category:'Arcade', embed:'./games/snake/index.html' },
  { id:'haunted-calculator', title:'Haunted Calculator', category:'Puzzle', embed:'./games/haunted/index.html' },
  { id:'pingpong', title:'Ping Pong', category:'Sports', embed:'./games/pingpong/index.html' },
  { id:'dino', title:'Dino Run', category:'Arcade', embed:'./games/dino/index.html' },
  { id:'wordguesser', title:'Word Guesser', category:'Puzzle', embed:'./games/wordguesser/index.html' },
  { id:'reactiontime', title:'Reaction Time', category:'Skill', embed:'./games/reactiontime/index.html' }
];

const grid = document.getElementById('grid');
const launcher = document.getElementById('launcher'); // modal container

if (!grid || !launcher) {
  console.error('portal.app.js: required DOM elements missing (#grid or #launcher).');
} else {

  // small background particle canvas (optional, non-blocking) - Red theme
  (function smallParticles(){
    const c = document.getElementById('bgCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    function fit(){ c.width = innerWidth; c.height = innerHeight; }
    fit(); addEventListener('resize', fit);
    const parts = Array.from({length: Math.max(8, Math.floor((c.width*c.height)/140000))}, ()=>({
      x: Math.random()*c.width, y: Math.random()*c.height, r: Math.random()*1.8+0.4, a: Math.random()*0.08+0.03, vx: (Math.random()-0.5)*0.25, vy: (Math.random()-0.5)*0.08
    }));
    (function tick(){
      ctx.clearRect(0,0,c.width,c.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = c.width + 10; if (p.x > c.width + 10) p.x = -10;
        if (p.y < -10) p.y = c.height + 10; if (p.y > c.height + 10) p.y = -10;
        ctx.beginPath(); ctx.fillStyle = `rgba(255,0,0,${p.a})`; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(tick);
    })();
  })();

  // Search functionality
  const searchInput = document.getElementById('search');
  let filteredGames = [...GAMES];
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filteredGames = GAMES.filter(g => 
      g.title.toLowerCase().includes(query) || 
      g.category.toLowerCase().includes(query)
    );
    render();
  });

  // render grid
  function createCard(g){
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = g.id;
    card.innerHTML = `
      <div class="logo" aria-hidden="true">${g.title.split(' ').map(w=>w[0]).join('').toUpperCase()}</div>
      <div class="meta"><div class="title">${g.title}</div><div class="cat">${g.category}</div></div>
      <div class="play-badge">Play</div>
    `;
    card.addEventListener('click', ()=> openGameModal(g));
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

  // open modal and attach replay/close behavior (container recreated every time for simplicity)
  function openGameModal(game) {
    currentGame = game;
    // clear and build modal skeleton
    launcher.classList.add('open');
    launcher.setAttribute('aria-hidden', 'false');
    launcher.innerHTML = `
      <div class="backdrop" aria-hidden="true" style="z-index:1000;pointer-events:auto;"></div>
      <div class="container" id="launcherContainer" role="document" style="display:flex;flex-direction:column;position:relative;z-index:1001;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.03);background:linear-gradient(180deg,rgba(255,255,255,0.01),transparent)">
          <div style="font-weight:800">${escapeHtml(game.title)}</div>
          <div style="display:flex;gap:8px">
            <button id="replayBtn" class="btn" title="Replay">Replay</button>
            <button id="closeBtn" class="btn close" title="Close">Close</button>
          </div>
        </div>
        <div id="iframeWrap" style="flex:1;min-height:320px;background:#000;position:relative;z-index:1002"></div>
      </div>
    `;

    const backdrop = launcher.querySelector('.backdrop');
    const iframeWrap = document.getElementById('iframeWrap');

    // add iframe
    attachNewIframeToWrap(game.embed, iframeWrap);

    // handlers: replay & close
    const replayBtn = document.getElementById('replayBtn');
    const closeBtn = document.getElementById('closeBtn');

    // replay reloads iframe (works multiple times)
    replayBtn && replayBtn.addEventListener('click', () => {
      if (!iframeWrap) return;
      // remove old iframe safely
      if (currentIframe && currentIframe.parentNode) try { currentIframe.remove(); } catch(e){}
      attachNewIframeToWrap(game.embed, iframeWrap);
    });

    // close hides modal unless reply is visible (when replyVisible is true we prevent close)
    closeBtn && closeBtn.addEventListener('click', () => {
      if (replyVisible) {
        // optionally show brief shake or notice
        const notice = document.createElement('div');
        notice.textContent = 'Reply required before closing';
        Object.assign(notice.style, { position:'fixed', left:'50%', top:'20%', transform:'translateX(-50%)', background:'#ffb3b3', color:'#200', padding:'8px 12px', borderRadius:'6px', zIndex:13000 });
        document.body.appendChild(notice);
        setTimeout(()=> notice.remove(), 900);
        return;
      }
      closeModal();
    });

    // backdrop click closes if reply not visible
    backdrop && backdrop.addEventListener('click', () => {
      if (replyVisible) return;
      closeModal();
    });

    // focus iframe after short delay
    setTimeout(()=> { try { currentIframe && currentIframe.contentWindow && currentIframe.contentWindow.focus && currentIframe.contentWindow.focus(); } catch(e){}; }, 250);
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

  function closeModal(){
    // remove iframe
    if (currentIframe && currentIframe.parentNode) try { currentIframe.remove(); } catch(e){}
    currentIframe = null;
    currentGame = null;
    awaitingReplyAfterGameOver = false;
    replyVisible = false;
    // re-enable any disabled state
    launcher.classList.remove('open');
    launcher.innerHTML = '';
    launcher.setAttribute('aria-hidden', 'true');
  }

  // PostMessage listener for game over
  window.addEventListener('message', (ev) => {
    // In production, restrict origin checking here
    let data = ev.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch(e) {}
    if (!data || data.type !== 'game_over') return;
    
    // Save progress to backend
    saveGameProgress(data.gameId || currentGame?.id, data.score, data.stats, data.result);
    
    if (data.result === 'lost') {
      // mark awaiting reply; show reply immediately
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
        <button id="reply-close" style="background:transparent;border:0;color:#9fb0c6;cursor:pointer">✕</button>
      </div>
      <div style="font-size:13px;color:#9fb0c6;margin-bottom:8px">You lost • Score: ${score ?? '—'}</div>
      <textarea id="reply-text" rows="4" placeholder="Leave feedback..." style="width:100%;border-radius:8px;padding:8px;border:1px solid rgba(255,255,255,0.04);background:rgba(255,255,255,0.01);color:#eaf9ff"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button id="reply-send" style="padding:8px 12px;border-radius:8px;border:0;background:linear-gradient(180deg,#00b7e6,#00d5ff);color:#041017;font-weight:800;cursor:pointer">Send</button>
        <button id="reply-skip" style="padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#9fb0c6;cursor:pointer">Skip</button>
      </div>
    `;
    document.body.appendChild(box);

    // Disable modal close behavior while reply visible by setting replyVisible true (close handlers check it)
    // Hook buttons
    document.getElementById('reply-close').addEventListener('click', () => {
      // allow closing reply box (but keep modal open)
      replyVisible = false;
      const el = document.getElementById('portal-reply-box'); if (el) el.remove();
    });
    document.getElementById('reply-skip').addEventListener('click', () => {
      replyVisible = false;
      const el = document.getElementById('portal-reply-box'); if (el) el.remove();
    });
    document.getElementById('reply-send').addEventListener('click', () => {
      const text = document.getElementById('reply-text').value.trim();
      if (!text) {
        box.animate([{ transform:'translateX(0)' }, { transform:'translateX(-8px)' }, { transform:'translateX(0)' }], { duration:220 });
        return;
      }
      const reply = { id:'r_'+Date.now(), gameId, score, text, ts: new Date().toISOString() };
      try {
        const arr = JSON.parse(localStorage.getItem('gameReplies')||'[]'); arr.push(reply); localStorage.setItem('gameReplies', JSON.stringify(arr));
      } catch(e){}
      console.log('Saved reply:', reply);
      // remove box and re-enable close
      replyVisible = false;
      box.innerHTML = `<div style="padding:18px;text-align:center;color:#baf6ff;font-weight:800">Thanks — reply saved.</div>`;
      setTimeout(()=> { const el = document.getElementById('portal-reply-box'); if (el) el.remove(); }, 1200);
    });

    // After showing reply, also listen for ANY key press to auto-send the reply UI if they press a key (one-time)
    function onAnyKeyOpenReply(e){
      // If reply already visible we ignore here
      if (replyVisible) return;
      showReplyBox(gameId, score);
      window.removeEventListener('keydown', onAnyKeyOpenReply);
    }
    // (We already show it immediately above, but keep this handler in case you prefer open on key)
    // window.addEventListener('keydown', onAnyKeyOpenReply, { once: true });
    // (We commented it out because we display reply immediately when game_over occurs)
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
      if (launcher.classList.contains('open')) closeModal();
    }
  });

  // small helper
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

} // end main
