
// Canvas "aurora" ribbons
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d',{alpha:true});
let w,h,dpr;
function resize(){
  dpr = Math.min(window.devicePixelRatio||1,2);
  w = canvas.width = Math.floor(innerWidth*dpr);
  h = canvas.height = Math.floor(innerHeight*dpr);
  canvas.style.width = innerWidth+'px';
  canvas.style.height = innerHeight+'px';
}
addEventListener('resize', resize, {passive:true}); resize();
let t=0, TAU=Math.PI*2;
function tick(){
  t+=1;
  ctx.clearRect(0,0,w,h);
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){
    const yBase = h*(0.3+0.1*i)+Math.sin(t*0.003+i)*10*dpr;
    ctx.beginPath();
    for(let x=0;x<=w;x+=6*dpr){
      const y = yBase + Math.sin(x*0.004+t*0.004+i)*18*dpr + Math.sin(x*0.008+t*0.002+i*1.3)*9*dpr;
      if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    const g = ctx.createLinearGradient(0,yBase,w,yBase);
    g.addColorStop(0, `hsla(${330+i*15},90%,70%,0.12)`);
    g.addColorStop(0.5, `hsla(${350+i*15},90%,65%,0.2)`);
    g.addColorStop(1, `hsla(${370+i*15},90%,70%,0.12)`);
    ctx.strokeStyle=g; ctx.lineWidth=8*dpr; ctx.lineCap='round'; ctx.stroke();
  }
  requestAnimationFrame(tick);
}
tick();

// Hearts
const layer = document.querySelector('.hearts');
function spawnHeart(){
  const el=document.createElement('div');
  el.className='heart';
  el.textContent = ['💗','💖','💘','💝','💞','❤️','🩷'][Math.floor(Math.random()*7)];
  el.style.left = Math.random()*100+'vw';
  el.style.animationDuration = (4+Math.random()*4)+'s';
  el.style.fontSize = (18+Math.random()*42)+'px';
  layer.appendChild(el); setTimeout(()=>el.remove(),7000);
}

// Typing + reveal
const btn = document.getElementById('surprise');
const love = document.getElementById('love');
const line1 = document.getElementById('line1');
const line2 = document.getElementById('line2');
const flash = document.getElementById('flash');
const muteBtn = document.getElementById('mute');

function typeText(el, text, speed=45){
  return new Promise(resolve=>{
    el.classList.add('typer');
    el.textContent='';
    let i=0;
    const id = setInterval(()=>{
      el.textContent = text.slice(0, i++);
      if(i>text.length){ clearInterval(id); el.classList.remove('typer'); resolve(); }
    }, speed);
  });
}

// Web Audio API: soft ambient pad + gentle bell
let audioCtx, masterGain, isMuted=false, started=false, padInterval=null;

function startMusic(){
  if(started) return;
  started = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.08; // low volume
  masterGain.connect(audioCtx.destination);

  // Ambient pad: two detuned saws through lowpass, slow LFO on filter
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 800;
  lowpass.Q.value = 0.7;
  lowpass.connect(masterGain);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.08; // very slow
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain);
  lfoGain.connect(lowpass.frequency);
  lfo.start();

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  osc1.type = 'sawtooth'; osc2.type = 'sawtooth';
  // Chord root A major (A, C#, E)
  osc1.frequency.value = 220; // A3
  osc2.frequency.value = 220 * Math.pow(2, 7/12); // E4
  const det1 = audioCtx.createGain(); det1.gain.value = 0.12;
  const det2 = audioCtx.createGain(); det2.gain.value = 0.12;
  osc1.connect(det1); osc2.connect(det2);
  det1.connect(lowpass); det2.connect(lowpass);
  osc1.start(); osc2.start();

  // Gentle bell every ~6s
  function bell(){
    const o = audioCtx.createOscillator();
    o.type='sine';
    o.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+2.2);
    o.connect(g); g.connect(masterGain);
    o.start();
    o.stop(audioCtx.currentTime+2.3);
  }
  padInterval = setInterval(bell, 6000);
}

function toggleMute(){
  if(!masterGain) return;
  isMuted = !isMuted;
  masterGain.gain.value = isMuted ? 0 : 0.08;
  muteBtn.textContent = isMuted ? '🔇 Muet' : '🔈 Son';
}

// Flash helper
function doFlash(){
  flash.classList.remove('flash');
  void flash.offsetWidth; // reflow to restart animation
  flash.classList.add('flash');
}

let played=false;
btn.addEventListener('click', async ()=>{
  if(played) return;
  played=true;

  // Start music (needs user gesture)
  startMusic();
  muteBtn.hidden = false;
  muteBtn.textContent = '🔈 Son';

  // Flash + hearts
  doFlash();
  for(let i=0;i<28;i++){ setTimeout(spawnHeart, i*55); }
  if(navigator.vibrate) navigator.vibrate(30);

  // Reveal message after click
  love.classList.remove('hidden');
  love.classList.add('reveal');
  line1.style.fontSize = 'clamp(42px, 7.5vw, 96px)';
  line2.style.fontSize = 'clamp(22px, 3vw, 34px)';
  await typeText(line1, "je t'aime ma belle Aicha", 40);
  await new Promise(r=>setTimeout(r, 300));
  await typeText(line2, "Tu es ma belle vie", 45);
});

muteBtn.addEventListener('click', ()=>{
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  toggleMute();
});
