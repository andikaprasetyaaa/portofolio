import { TerrariaPlayer } from './character.js';
import { Particle } from './types.js';

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
  width = window.innerWidth;
  height = window.innerHeight;
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
    // Rotating radiant sun rays
    ctx.save();
    ctx.rotate(frameCount * 0.008);
    ctx.fillStyle = '#ffd24a';
    for (let i = 0; i < 8; i++) {
      ctx.rotate((Math.PI * 2) / 8);
      ctx.fillRect(-4, -42, 8, 12);
      ctx.fillRect(-2, -48, 4, 6);
    }
    ctx.restore();

    // Terraria Golden Smiling Sun Body
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(-26, -26, 52, 52);
    ctx.fillStyle = '#ffb300'; // border shade
    ctx.fillRect(-28, -22, 2, 44);
    ctx.fillRect(26, -22, 2, 44);
    ctx.fillRect(-22, -28, 44, 2);
    ctx.fillRect(-22, 26, 44, 2);

    // Cute Sunglasses / Smiling face
    ctx.fillStyle = '#1c1b18';
    // Sunglasses frame
    ctx.fillRect(-16, -8, 12, 8);
    ctx.fillRect(4, -8, 12, 8);
    ctx.fillRect(-4, -6, 8, 3);
    // Lens reflection
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-14, -6, 3, 3);
    ctx.fillRect(6, -6, 3, 3);
    // Smile
    ctx.fillStyle = '#bd5e00';
    ctx.fillRect(-10, 8, 20, 3);
    ctx.fillRect(-12, 6, 2, 3);
    ctx.fillRect(10, 6, 2, 3);
  } else {
    // Crescent Moon
    ctx.fillStyle = '#e8eff7';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0f2e';
    ctx.beginPath();
    ctx.arc(10, -5, 24, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const sx = Math.sin(i * 1.5) * 60;
      const sy = Math.cos(i * 2.1) * 45;
      const sparkle = (frameCount + i * 20) % 60 > 30 ? 3 : 1.5;
      ctx.fillRect(sx, sy, sparkle, sparkle);
    }
  }

  ctx.restore();
}

// --- HANGING VINES & FLOATING ISLAND TERRAIN ---
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

  // Gentle hovering floating oscillation
  const hoverX = Math.sin(frameCount * 0.02) * 25;
  const hoverY = Math.cos(frameCount * 0.025) * 18;
  eyeOfCthulhu.x = eyeOfCthulhu.baseX + hoverX;
  eyeOfCthulhu.y = eyeOfCthulhu.baseY + hoverY;

  const ex = Math.round(eyeOfCthulhu.x);
  const ey = Math.round(eyeOfCthulhu.y);
  const r = eyeOfCthulhu.radius;

  // Pupil tracks mouse or player
  const angleToTarget = Math.atan2(mouseY - ey, mouseX - ex);
  const pupilDist = 12;
  const pupilX = Math.cos(angleToTarget) * pupilDist;
  const pupilY = Math.sin(angleToTarget) * pupilDist;

  c.save();
  c.translate(ex, ey);

  // 1. Trailing red muscle tendrils behind the eye
  eyeOfCthulhu.tendrils.forEach((t, i) => {
    const wave = Math.sin(frameCount * 0.08 + t.phase) * 8;
    c.fillStyle = '#a61c1c';
    c.beginPath();
    c.moveTo(r * 0.7, t.offset);
    c.quadraticCurveTo(r * 0.7 + 25 + wave, t.offset + (i - 2) * 5, r * 0.7 + 45 + wave * 1.5, t.offset * 1.4);
    c.lineTo(r * 0.7 + 35 + wave, t.offset + 4);
    c.closePath();
    c.fill();
  });

  // 2. Eyeball body (Terraria Pixel Eyeball)
  c.fillStyle = '#1c1b18'; // outer dark border
  c.beginPath();
  c.arc(0, 0, r + 2, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#edece8'; // Sclera white
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();

  // 3. Bloodshot red veins radiating from back to front
  c.strokeStyle = '#c92222';
  c.lineWidth = 2;
  c.beginPath();
  // Vein 1
  c.moveTo(r * 0.8, -12);
  c.lineTo(r * 0.3, -15);
  c.lineTo(0, -10);
  // Vein 2
  c.moveTo(r * 0.8, 10);
  c.lineTo(r * 0.4, 14);
  c.lineTo(0, 8);
  // Vein 3
  c.moveTo(r * 0.7, 0);
  c.lineTo(r * 0.2, 2);
  c.stroke();

  // 4. Iris (Terraria Blue Iris)
  c.fillStyle = '#1e5fad';
  c.beginPath();
  c.arc(pupilX, pupilY, 15, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#429bf5'; // light blue ring
  c.beginPath();
  c.arc(pupilX, pupilY, 12, 0, Math.PI * 2);
  c.fill();

  // 5. Pupil (Deep black with glint)
  c.fillStyle = '#080808';
  c.beginPath();
  c.arc(pupilX, pupilY, 8, 0, Math.PI * 2);
  c.fill();

  // White eye glint reflection
  c.fillStyle = '#ffffff';
  c.fillRect(pupilX - 5, pupilY - 5, 4, 4);

  c.restore();
}

// --- CRITTERS: BLUE SLIME & BUNNY ---
function updateAndDrawCritters(): void {
  if (!ctx) return;
  const ground = height * 0.78;

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

  // Draw Slime
  ctx.save();
  ctx.translate(Math.round(slime.x), Math.round(slime.y));
  const isJumping = !slime.onGround;
  const sw = isJumping ? 22 : 30;
  const sh = isJumping ? 26 : 18;

  // Gel body
  ctx.fillStyle = 'rgba(0, 140, 255, 0.85)';
  ctx.fillRect(-sw / 2, -sh, sw, sh);
  // Darker bottom gel
  ctx.fillStyle = 'rgba(0, 90, 200, 0.9)';
  ctx.fillRect(-sw / 2, -sh * 0.4, sw, sh * 0.4);
  // Specular gleam
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(-sw / 2 + 3, -sh + 3, 5, 4);
  ctx.restore();

  // 2. TERRARIA BUNNY
  bunny.hopTimer++;
  if (bunny.hopTimer > 180 && bunny.onGround) {
    bunny.vy = -5.5;
    bunny.facing = Math.random() > 0.5 ? 1 : -1;
    bunny.vx = bunny.facing * 1.5;
    bunny.onGround = false;
    bunny.hopTimer = 0;
  }

  if (!bunny.onGround) {
    bunny.x += bunny.vx;
    bunny.y += bunny.vy;
    bunny.vy += 0.35;
    if (bunny.y >= ground) {
      bunny.y = ground;
      bunny.vy = 0;
      bunny.vx = 0;
      bunny.onGround = true;
    }
  }

  // Draw Bunny
  ctx.save();
  ctx.translate(Math.round(bunny.x), Math.round(bunny.y));
  ctx.scale(bunny.facing, 1);

  // White fluffy body
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-8, -12, 16, 12);
  // Head
  ctx.fillRect(4, -18, 10, 10);
  // Inner Pink Ear
  ctx.fillStyle = '#ffb3c6';
  ctx.fillRect(6, -24, 3, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(9, -24, 3, 8);
  // Eye
  ctx.fillStyle = '#1c1b18';
  ctx.fillRect(10, -15, 2, 2);
  // Tail
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(-11, -10, 4, 5);

  ctx.restore();
}

// --- BIOME PARTICLES ---
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
