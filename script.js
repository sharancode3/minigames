/* Hyper Plays 2.0 front page logic */
const qs = (s,ctx=document)=>ctx.querySelector(s);
const qsa = (s,ctx=document)=>[...ctx.querySelectorAll(s)];

// Intersection reveal observer
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
},{threshold:.2});

function watchReveal(el){ if(el) io.observe(el); }
qsa('.reveal').forEach(watchReveal);

// Data-driven game library
const gamesData = [
  { id:'snake', title:'Neon Serpent', blurb:'Chain flawless turns inside a synth arena and push the speed ceiling.', category:'arcade', mood:'Retro Rush', difficulty:'Medium', tags:['arcade','retro','trending'], cover:'assets/thumbs/snake.svg' },
  { id:'pingpong', title:'Loop Rally', blurb:'Ultra-fast paddle duels with laser trails and looping shots.', category:'arcade', mood:'Versus', difficulty:'Hard', tags:['arcade','skill'], cover:'assets/thumbs/pingpong.svg' },
  { id:'bubbleshooter', title:'Orb Pop Deluxe', blurb:'Relaxed bubble sniping with gentle color storms.', category:'puzzle', mood:'Calm Arcade', difficulty:'Easy', tags:['puzzle','calm'], cover:'assets/thumbs/bubbleshooter.svg' },
  { id:'carracing', title:'Turbo Drift', blurb:'Slide through neon corners, collect boosts, and chase milliseconds.', category:'racing', mood:'Speed Run', difficulty:'Hard', tags:['racing','trending'], cover:'assets/thumbs/carracing.svg' },
  { id:'puzzle', title:'Slide Forge', blurb:'Tactile tile puzzles where every move forges the final picture.', category:'puzzle', mood:'Brainy', difficulty:'Medium', tags:['puzzle','retro'], cover:'assets/thumbs/puzzle.svg' },
  { id:'crazytype', title:'Key Frenzy', blurb:'Rapid-fire typing gauntlet that trains clutch accuracy.', category:'skill', mood:'Focus Mode', difficulty:'Hard', tags:['skill','trending'], cover:'assets/thumbs/crazytype.svg' },
  { id:'dino', title:'Astro Strider', blurb:'Dash over cosmic cliffs and dodge meteors with style.', category:'arcade', mood:'Runner', difficulty:'Medium', tags:['arcade'], cover:'assets/thumbs/dino.svg' },
  { id:'wordguesser', title:'Cipher Quest', blurb:'Quickfire guessing with streak bonuses and hints.', category:'puzzle', mood:'Brainy', difficulty:'Medium', tags:['puzzle'], cover:'assets/thumbs/wordguesser.svg' },
  { id:'reactiontime', title:'Blink Lab', blurb:'Minimal reflex trials to shave off milliseconds.', category:'skill', mood:'Focus Mode', difficulty:'Medium', tags:['skill','calm'], cover:'assets/thumbs/reactiontime.svg' },
  { id:'haunted-calculator', title:'Phantom Calc', blurb:'Haunted math riddles that glitch the display.', category:'puzzle', mood:'Mystery', difficulty:'Hard', tags:['puzzle','retro'], cover:'assets/thumbs/haunted-calculator.svg' },
  { id:'wordle', title:'Word Pulse', blurb:'Word-wave challenge with hints, streaks, and score penalties.', category:'puzzle', mood:'Brainy', difficulty:'Medium', tags:['puzzle','new','trending'], cover:'assets/thumbs/wordle.svg' }
];

const gridEl = qs('#gameGrid');
const featuredEl = qs('#featuredRow');
const pills = qsa('.pill');
const chips = qsa('.chip');
let featuredFilter = 'trending';

function navigate(link){ if(!link) return; playClick(); window.location.href = link; }

function buildCard(game){
  const card = document.createElement('article');
  card.className = 'card reveal';
  card.dataset.category = game.category;
  card.innerHTML = `
    <div class="card-header">
      <div class="card-thumb"><img src="${game.cover}" alt="${game.title} art" loading="lazy" /></div>
      <div>
        <h3>${game.title}</h3>
        <div class="tag-row">
          <span class="tag">${game.category}</span>
          <span class="tag">${game.difficulty}</span>
        </div>
      </div>
    </div>
    <p>${game.blurb}</p>
    <div class="tag-row">
      <span class="tag">${game.mood}</span>
      ${(game.tags||[]).slice(0,2).map(t=>`<span class="tag">${t}</span>`).join('')}
    </div>
    <button class="play-btn" data-link="portal.html?game=${game.id}">Play Now</button>
  `;

  const btn = card.querySelector('.play-btn');
  btn.addEventListener('click', (e)=>{ e.stopPropagation(); navigate(btn.dataset.link); });
  card.addEventListener('click', ()=> navigate(`portal.html?game=${game.id}`));
  addTilt(card);
  watchReveal(card);
  return card;
}

function renderGrid(filter='all'){
  if(!gridEl) return;
  gridEl.innerHTML = '';
  const pool = gamesData.filter(game => {
    if(filter==='all') return true;
    if(filter==='retro') return game.tags?.includes('retro');
    return game.category === filter;
  });
  pool.forEach(game => gridEl.appendChild(buildCard(game)));
}

function renderFeatured(){
  if(!featuredEl) return;
  const picks = gamesData.filter(g => featuredFilter==='all'? true : g.tags?.includes(featuredFilter)).slice(0,3);
  featuredEl.innerHTML = '';
  picks.forEach(game => {
    const card = document.createElement('article');
    card.className = 'feature-card reveal';
    card.innerHTML = `
      <div class="feature-meta">
        <span class="badge">${game.category}</span>
        <span class="badge">${game.difficulty}</span>
      </div>
      <h3>${game.title}</h3>
      <p>${game.blurb}</p>
      <div class="feature-meta">
        ${(game.tags||[]).slice(0,3).map(tag=>`<span class="badge">${tag}</span>`).join('')}
      </div>
    `;
    card.addEventListener('click', ()=> navigate(`portal.html?game=${game.id}`));
    watchReveal(card);
    featuredEl.appendChild(card);
  });
}

// Theme toggle
const themeBtn = qs('#themeToggle');
if(localStorage.getItem('hp_theme')==='light') document.body.classList.add('light');
themeBtn?.addEventListener('click',()=>{
  const light = document.body.classList.toggle('light');
  localStorage.setItem('hp_theme', light? 'light':'dark');
  playClick();
});

// Sound toggle
let soundOn = false, audioCtx;
const soundBtn = qs('#soundToggle');
function playClick(){
  if(!soundOn) return;
  if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type='triangle';
  osc.frequency.value = 520;
  gain.gain.value = 0.08;
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.12);
}
soundBtn?.addEventListener('click',()=>{
  soundOn = !soundOn;
  soundBtn.textContent = `Sound: ${soundOn? 'On':'Off'}`;
  playClick();
});

// Primary calls-to-action
qs('#startBtn')?.addEventListener('click',()=>{
  qs('#games')?.scrollIntoView({behavior:'smooth'});
  playClick();
});
qs('#heroPortal')?.addEventListener('click',()=> navigate('portal.html'));

// Category filters
pills.forEach(pill => {
  pill.addEventListener('click', ()=>{
    pills.forEach(p=>p.classList.remove('active'));
    pill.classList.add('active');
    renderGrid(pill.dataset.filter);
    playClick();
  });
});

// Featured chips
chips.forEach(chip => {
  chip.addEventListener('click', ()=>{
    chips.forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    featuredFilter = chip.dataset.chip;
    renderFeatured();
    playClick();
  });
});
const defaultChip = chips.find(c=>c.dataset.chip===featuredFilter);
defaultChip?.classList.add('active');

// Shuffle deck button
qs('#shuffleBtn')?.addEventListener('click', ()=>{
  gamesData.sort(()=>Math.random() - 0.5);
  renderGrid(qs('.pill.active')?.dataset.filter || 'all');
  renderFeatured();
  playClick();
});

function addTilt(card){
  card.addEventListener('pointermove', e=>{
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left)/rect.width;
    const y = (e.clientY - rect.top)/rect.height;
    card.style.transform = `perspective(900px) rotateX(${-(y-.5)*8}deg) rotateY(${(x-.5)*10}deg)`;
  });
  card.addEventListener('pointerleave', ()=>{
    card.style.transform = '';
  });
}

renderFeatured();
renderGrid();

// Keyboard accessibility helper
addEventListener('keydown', e=>{ if(e.key==='Tab') document.documentElement.classList.add('show-focus'); });
