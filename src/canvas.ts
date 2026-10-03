import { TerrariaPlayer } from './character.js';
import { Particle } from './types.js';
import { ImageAssets, initAssets } from './assets.js';


let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let width = window.innerWidth;
let height = window.innerHeight;
let animationFrameId: number | null = null;
let isPaused = false;
let frameCount = 0;
let mouseX = window.innerWidth * 0.7;
let mouseY = 180;

// Export player instance so other modules can trigger actions (e.g. hotbar weapon toggle)
export const player = new TerrariaPlayer(180);

// Canvas entities
const particles: Particle[] = [];

// Eye of Cthulhu boss state
const eyeOfCthulhu = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  baseX: 0,
  baseY: 150,
  radius: 38,
  pupilX: 0,
  pupilY: 0,
  tendrils: [
    { offset: -20, phase: 0 },
    { offset: -10, phase: 1.2 },
    { offset: 0, phase: 2.4 },
    { offset: 10, phase: 3.6 },
    { offset: 20, phase: 4.8 }
  ]
};

// Critters: Slime and Bunny
const slime = {
  x: 350,
  y: 0,
  vx: 1.2,
  vy: 0,
  onGround: true,
  jumpTimer: 0,
  width: 28,
  height: 20
};

const bunny = {
  x: 480,
  y: 0,
  vx: 0.8,
  vy: 0,
  onGround: true,
  hopTimer: 0,
  facing: 1
};

// Floating Clouds
const clouds: Array<{ x: number; y: number; speed: number; scale: number }> = [
  { x: 50, y: 60, speed: 0.25, scale: 1 },
  { x: 420, y: 110, speed: 0.18, scale: 0.85 },
  { x: 800, y: 40, speed: 0.32, scale: 1.2 },
  { x: 1200, y: 90, speed: 0.2, scale: 0.9 }
];

export function initCanvas(): void {
  initAssets();
  canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  if (!ctx) return;

  resize();
  window.addEventListener('resize', resize);

  // Mouse tracking for Eye of Cthulhu and interactive clicks
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Canvas click to move character or interact
  canvas.addEventListener('click', (e) => {
    const rect = canvas!.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked player
    const distToPlayer = Math.hypot(clickX - player.x, clickY - (player.y - 30));
    if (distToPlayer < 45) {
      player.triggerEmote();
      return;
    }

    // Check if clicked Eye of Cthulhu
    const distToEye = Math.hypot(clickX - eyeOfCthulhu.x, clickY - eyeOfCthulhu.y);
    if (distToEye < eyeOfCthulhu.radius + 15) {
      eyeOfCthulhu.baseX += (Math.random() - 0.5) * 60;
      eyeOfCthulhu.baseY += (Math.random() - 0.5) * 40;
      player.triggerEmote("👁️ Eye of Cthulhu awakens!");
      return;
    }

    // Move player towards clicked X
    player.moveTo(clickX);
  });

  // Keyboard controls for walking and jumping
  window.addEventListener('keydown', (e) => {
    // If typing in input, ignore
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }

    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      player.facing = -1;
      player.vx = -3.5;
      player.isWalking = true;
      player.targetX = null;
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      player.facing = 1;
      player.vx = 3.5;
      player.isWalking = true;
      player.targetX = null;
    } else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === ' ') {
      player.jump();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      if (player.vx < 0) {
        player.vx = 0;
        player.isWalking = false;
      }
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      if (player.vx > 0) {
        player.vx = 0;
        player.isWalking = false;
      }
    }
  });

  // Visibility change
  document.addEventListener('visibilitychange', () => {
    isPaused = document.hidden;
    if (!isPaused) {
      loop();
    } else if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  loop();
}

function resize(): void {
  if (!canvas || !ctx) return;
  const parent = canvas.parentElement;
  width = parent ? parent.clientWidth : window.innerWidth;
  height = parent ? parent.clientHeight : window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = false;

  eyeOfCthulhu.baseX = Math.min(width * 0.72, width - 140);
  eyeOfCthulhu.baseY = Math.max(120, height * 0.22);

  updateGround();
}

function updateGround(): void {
  // Ground level relative to surface
  const groundY = height * 0.78;
  player.setGround(groundY);
  slime.y = groundY;
  bunny.y = groundY;
}

function loop(): void {
  if (isPaused || !ctx) return;

  frameCount++;
  ctx.clearRect(0, 0, width, height);

  const scrollY = window.scrollY;
  const isSurface = scrollY < height * 0.9;
  const isNight = document.documentElement.getAttribute('data-theme') === 'night';

  if (isSurface) {
    // 1. Draw Clouds
    drawClouds();

    // 2. Draw Terraria Sun or Moon
    drawTerrariaCelestial(isNight);

    // 3. Draw Hanging Vines & Floating Island Accents
    drawTerrariaTerrainAccents();

    // 4. Draw Eye of Cthulhu Boss
    updateAndDrawEyeOfCthulhu();

    // 5. Draw Critters (Blue Slime & Bunny)
    updateAndDrawCritters();

    // 6. Draw Animated Terraria Player
    player.update();
    player.draw(ctx);
  }

  // Draw Biome Particles across depths
  spawnBiomeParticles(scrollY);
  updateAndDrawParticles();

  animationFrameId = requestAnimationFrame(loop);
}

// --- CLOUDS ---
function drawClouds(): void {
  if (!ctx) return;
  clouds.forEach(c => {
    c.x += c.speed;
    if (c.x > width + 150) c.x = -150;

    ctx!.save();
    ctx!.translate(Math.round(c.x), Math.round(c.y));
    ctx!.scale(c.scale, c.scale);
    ctx!.fillStyle = 'rgba(255, 255, 255, 0.75)';

    // Terraria style stepped pixel cloud
    ctx!.fillRect(-50, 0, 100, 16);
    ctx!.fillRect(-35, -10, 70, 10);
    ctx!.fillRect(-15, -18, 40, 8);
    ctx!.fillRect(-45, 16, 90, 6);

    ctx!.restore();
  });
}

// --- TERRARIA SUN & MOON ---
function drawTerrariaCelestial(isNight: boolean): void {
  if (!ctx) return;
  const sunX = width - 110;
  const sunY = 95;

  ctx.save();
  ctx.translate(sunX, sunY);

  if (!isNight) {
    if (ImageAssets['sun'] && ImageAssets['sun'].complete && ImageAssets['sun'].naturalWidth !== 0) {
      // Gentle rotation for the sun
      ctx.rotate(frameCount * 0.002);
      ctx.drawImage(ImageAssets['sun'], -60, -60, 120, 120);
    } else {
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    if (ImageAssets['moon'] && ImageAssets['moon'].complete && ImageAssets['moon'].naturalWidth !== 0) {
      ctx.drawImage(ImageAssets['moon'], -40, -40, 80, 80);
    } else {
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTerrariaTerrainAccents(): void {
  if (!ctx) return;

  // Hanging vines on right cliff overhang (matching Terraria cover art)
  const cliffX = width * 0.62;
  const cliffY = height * 0.28;

  ctx.save();
  // Draw cliff dirt and grass shelf
  ctx.fillStyle = '#3fa535'; // Terraria lush grass top
  ctx.fillRect(cliffX, cliffY, width - cliffX, 16);
  ctx.fillStyle = '#2d7c25';
  ctx.fillRect(cliffX, cliffY + 14, width - cliffX, 4);

  // Dirt under layer
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(cliffX + 10, cliffY + 18, width - cliffX, 60);

  // Hanging green vines dangling down from the cliff
  const vineCount = 14;
  for (let i = 0; i < vineCount; i++) {
    const vx = cliffX + 15 + i * 18;
    if (vx > width) break;
    const baseLen = 45 + ((i * 37) % 65);
    const sway = Math.sin(frameCount * 0.03 + i) * 6;

    ctx.fillStyle = '#3fa535';
    for (let seg = 0; seg < baseLen; seg += 8) {
      const segSway = (seg / baseLen) * sway;
      ctx.fillRect(vx + segSway, cliffY + 16 + seg, 4, 7);
      // Small leaves on vine
      if (seg % 16 === 0) {
        ctx.fillStyle = '#56c24b';
        ctx.fillRect(vx + segSway - 3, cliffY + 18 + seg, 3, 3);
        ctx.fillStyle = '#3fa535';
      }
    }
  }

  ctx.restore();
}

// --- EYE OF CTHULHU BOSS ---
function updateAndDrawEyeOfCthulhu(): void {
  const c = ctx;
  if (!c) return;

  const hoverX = Math.sin(frameCount * 0.02) * 25;
  const hoverY = Math.cos(frameCount * 0.025) * 18;
  eyeOfCthulhu.x = eyeOfCthulhu.baseX + hoverX;
  eyeOfCthulhu.y = eyeOfCthulhu.baseY + hoverY;

  const ex = Math.round(eyeOfCthulhu.x);
  const ey = Math.round(eyeOfCthulhu.y);
  const r = eyeOfCthulhu.radius;

  const angleToTarget = Math.atan2(mouseY - ey, mouseX - ex);

  c.save();
  c.translate(ex, ey);

  // Rotate Eye towards target slightly
  c.rotate(angleToTarget + Math.PI);

  if (ImageAssets['eye'] && ImageAssets['eye'].complete && ImageAssets['eye'].naturalWidth !== 0) {
    c.drawImage(ImageAssets['eye'], -55, -76, 110, 152);
  } else {
    // Eyeball fallback
    c.fillStyle = '#1c1b18';
    c.beginPath();
    c.arc(0, 0, r + 2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#edece8';
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fill();

    // Pupil
    const pupilDist = 12;
    const pupilX = Math.cos(Math.PI) * pupilDist;
    const pupilY = Math.sin(Math.PI) * pupilDist;
    c.fillStyle = '#7a1926';
    c.beginPath();
    c.arc(pupilX, pupilY, r * 0.45, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(pupilX, pupilY, r * 0.25, 0, Math.PI * 2);
    c.fill();
  }

  c.restore();
}

function updateAndDrawCritters(): void {
  if (!ctx) return;
  const ground = height * 0.95;

  // 1. BLUE SLIME
  slime.jumpTimer++;
  if (slime.jumpTimer > 130 && slime.onGround) {
    slime.vy = -7.5;
    slime.vx = (Math.random() > 0.5 ? 1.5 : -1.5);
    slime.onGround = false;
    slime.jumpTimer = 0;
  }

  if (!slime.onGround) {
    slime.x += slime.vx;
    slime.y += slime.vy;
    slime.vy += 0.35; // gravity
    if (slime.y >= ground) {
      slime.y = ground;
      slime.vy = 0;
      slime.vx = 0;
      slime.onGround = true;
    }
  }

  ctx.save();
  ctx.translate(slime.x, slime.y);
  // Slime squish effect based on vertical velocity
  const squishY = slime.onGround ? 1 : Math.max(0.7, 1 - Math.abs(slime.vy) * 0.05);
  const squishX = slime.onGround ? 1 : Math.min(1.3, 1 + Math.abs(slime.vy) * 0.03);
  ctx.scale(squishX, squishY);

  if (ImageAssets['slime'] && ImageAssets['slime'].complete && ImageAssets['slime'].naturalWidth !== 0) {
    ctx.drawImage(ImageAssets['slime'], -16, -24, 32, 24);
  } else {
    ctx.fillStyle = 'rgba(0, 110, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(0, -10, 12, Math.PI, 0);
    ctx.lineTo(14, 0);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 2. BUNNY
  bunny.hopTimer++;
  if (bunny.hopTimer > 200 && bunny.onGround) {
    bunny.vy = -5;
    bunny.vx = (Math.random() > 0.5 ? 1.8 : -1.8) * 1.5;
    bunny.facing = bunny.vx > 0 ? 1 : -1;
    bunny.onGround = false;
    bunny.hopTimer = 0;
  }

  if (!bunny.onGround) {
    bunny.x += bunny.vx;
    bunny.y += bunny.vy;
    bunny.vy += 0.4;
    if (bunny.y >= ground) {
      bunny.y = ground;
      bunny.vy = 0;
      bunny.vx = 0;
      bunny.onGround = true;
    }
  }

  // Wrap around
  if (bunny.x > width + 50) bunny.x = -50;
  if (bunny.x < -50) bunny.x = width + 50;
  if (slime.x > width + 50) slime.x = -50;
  if (slime.x < -50) slime.x = width + 50;

  ctx.save();
  ctx.translate(bunny.x, bunny.y);
  if (bunny.facing === -1) {
    ctx.scale(-1, 1);
  }

  if (ImageAssets['bunny'] && ImageAssets['bunny'].complete && ImageAssets['bunny'].naturalWidth !== 0) {
    // hop animation frame approximation
    const squish = !bunny.onGround ? 0.9 : 1.0;
    ctx.scale(1, squish);
    ctx.drawImage(ImageAssets['bunny'], -16, -24, 32, 24);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -12, 16, 12); // body
    ctx.fillRect(4, -18, 4, 8); // ear
  }
  ctx.restore();
}

function spawnBiomeParticles(scrollY: number): void {
  const depth = scrollY / (height || 1);
  const maxParticles = width > 768 ? 60 : 30;
  if (particles.length >= maxParticles) return;

  if (Math.random() < 0.12) {
    if (depth < 0.6) {
      // Surface: Leaves & floating sparkles
      particles.push({
        type: 'leaf',
        x: Math.random() * width,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.2 + Math.random() * 1.5,
        age: 0,
        life: 250,
        color: '#4cb83b',
        size: 4
      });
    } else if (depth < 2.0) {
      // Caverns: bats, glowing gems & dust
      if (Math.random() < 0.3) {
        particles.push({
          type: 'sparkle',
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0,
          age: 0,
          life: 90,
          color: ['#05c8ff', '#ffd24a', '#ff4fa8', '#3fa535'][Math.floor(Math.random() * 4)],
          size: 3
        });
      } else {
        particles.push({
          type: 'bat',
          x: Math.random() > 0.5 ? -20 : width + 20,
          y: Math.random() * height * 0.7,
          vx: Math.random() > 0.5 ? 2.5 : -2.5,
          vy: 0,
          age: 0,
          life: 300,
          frame: 0
        });
      }
    } else {
      // Underworld: Embers & Lava bubbles
      particles.push({
        type: 'ember',
        x: Math.random() * width,
        y: height + 10,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 2.5,
        age: 0,
        life: 180,
        color: Math.random() > 0.5 ? '#ff5a14' : '#ffd24a',
        size: 3 + Math.random() * 2
      });
    }
  }
}

function updateAndDrawParticles(): void {
  if (!ctx) return;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age++;

    if (p.age > p.life || p.y > height + 60 || p.y < -60 || p.x < -60 || p.x > width + 60) {
      particles.splice(i, 1);
      continue;
    }

    p.x += p.vx;
    p.y += p.vy;

    if (p.type === 'leaf') {
      p.vx += (Math.random() - 0.5) * 0.4;
      ctx.fillStyle = p.color || '#4cb83b';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size || 4, p.size || 4);
    } else if (p.type === 'sparkle') {
      ctx.save();
      const alpha = Math.sin((p.age / p.life) * Math.PI);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color || '#ffd24a';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size || 3, p.size || 3);
      ctx.restore();
    } else if (p.type === 'bat') {
      p.frame = (p.frame || 0) + 1;
      p.vy = Math.sin(p.frame * 0.1) * 2;
      ctx.fillStyle = '#1c1b18';
      const wingFlap = Math.sin(p.frame * 0.35) > 0 ? 8 : 3;
      ctx.fillRect(Math.round(p.x) - 4, Math.round(p.y), 8, 4);
      ctx.fillRect(Math.round(p.x) - 8, Math.round(p.y) - wingFlap, 4, wingFlap + 2);
      ctx.fillRect(Math.round(p.x) + 4, Math.round(p.y) - wingFlap, 4, wingFlap + 2);
    } else if (p.type === 'ember') {
      ctx.save();
      ctx.globalAlpha = 1 - (p.age / p.life);
      ctx.fillStyle = p.color || '#ff5a14';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size || 3, p.size || 3);
      ctx.restore();
    }
  }
}
