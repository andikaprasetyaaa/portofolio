let canvas, ctx;
let particles = [];
let width, height;
let isReducedMotion = false;
let animationFrameId;
let isPaused = false;

// Player sprite state
let playerX = 0;
let playerY = 0;
let frameCount = 0;
let walkState = 0;

export function initCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) return; // Skip particles if reduced motion

    resize();
    window.addEventListener('resize', resize);
    
    document.addEventListener("visibilitychange", () => {
        isPaused = document.hidden;
        if (!isPaused) {
            loop();
        } else {
            cancelAnimationFrame(animationFrameId);
        }
    });

    // Parallax logic
    window.addEventListener('scroll', handleParallax);
    
    loop();
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false; // Pixel art style
    
    playerX = width / 2;
    playerY = height * 0.7; // Approx surface level
}

function handleParallax() {
    if (isReducedMotion) return;
    
    const scrollY = window.scrollY;
    
    const farHills = document.querySelector('.far-hills');
    const midTrees = document.querySelector('.mid-trees');
    const nearGrass = document.querySelector('.near-grass');
    
    if (farHills) farHills.style.transform = `translate3d(0, ${scrollY * 0.5}px, 0)`;
    if (midTrees) midTrees.style.transform = `translate3d(0, ${scrollY * 0.2}px, 0)`;
    if (nearGrass) nearGrass.style.transform = `translate3d(0, ${scrollY * 0.05}px, 0)`;
}

function loop() {
    if (isPaused) return;
    
    ctx.clearRect(0, 0, width, height);
    
    frameCount++;
    
    spawnParticles();
    updateAndDrawParticles();
    
    // Only draw player on surface
    if (window.scrollY < window.innerHeight) {
        drawPlayer();
    }
    
    animationFrameId = requestAnimationFrame(loop);
}

function spawnParticles() {
    const maxParticles = width > 768 ? 60 : 25;
    if (particles.length >= maxParticles) return;
    
    const scrollY = window.scrollY;
    const depth = scrollY / window.innerHeight; // 0 = Surface, 1 = Underground, 2 = Caverns, 3 = Underworld
    
    if (Math.random() < 0.05) {
        if (depth < 0.5) {
            // Surface: leaves, slimes, butterflies
            const type = Math.random();
            if (type < 0.6) {
                // Leaf
                particles.push(createParticle('leaf', Math.random() * width, -10));
            } else if (type < 0.9) {
                // Butterfly
                particles.push(createParticle('butterfly', Math.random() * width, Math.random() * height * 0.5));
            } else {
                // Slime
                particles.push(createParticle('slime', Math.random() > 0.5 ? -20 : width + 20, height * 0.8));
            }
        } else if (depth < 2.5) {
            // Caves: bats, dust
            if (Math.random() < 0.2) {
                particles.push(createParticle('bat', Math.random() > 0.5 ? -20 : width + 20, Math.random() * height));
            } else {
                particles.push(createParticle('dust', Math.random() * width, Math.random() * height));
            }
        } else {
            // Underworld: Embers
            particles.push(createParticle('ember', Math.random() * width, height + 10));
        }
    }
}

function createParticle(type, x, y) {
    const p = { type, x, y, age: 0, life: 300 + Math.random() * 200, frame: 0 };
    
    switch (type) {
        case 'leaf':
            p.vx = (Math.random() - 0.5) * 2;
            p.vy = 1 + Math.random() * 2;
            p.color = '#3fa535';
            break;
        case 'butterfly':
            p.vx = (Math.random() - 0.5) * 4;
            p.vy = (Math.random() - 0.5) * 2;
            p.color = ['#ff9999', '#99ccff', '#ffff99'][Math.floor(Math.random()*3)];
            break;
        case 'slime':
            p.vx = x < 0 ? 1 : -1;
            p.vy = 0;
            p.color = 'rgba(0, 150, 255, 0.7)';
            p.jumpTimer = 0;
            break;
        case 'bat':
            p.vx = x < 0 ? 2 + Math.random() * 2 : -2 - Math.random() * 2;
            p.vy = Math.sin(p.x * 0.05) * 2;
            p.color = '#111';
            break;
        case 'dust':
            p.vx = (Math.random() - 0.5) * 0.5;
            p.vy = (Math.random() - 0.5) * 0.5;
            p.color = 'rgba(200, 200, 200, 0.5)';
            p.size = 1 + Math.random() * 2;
            break;
        case 'ember':
            p.vx = (Math.random() - 0.5) * 2;
            p.vy = -2 - Math.random() * 3;
            p.color = Math.random() > 0.5 ? '#ff5a14' : '#ffd24a';
            p.size = 2 + Math.random() * 3;
            break;
    }
    
    return p;
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age++;
        p.frame++;
        
        if (p.age > p.life || p.y > height + 50 || p.y < -50 || p.x < -50 || p.x > width + 50) {
            particles.splice(i, 1);
            continue;
        }
        
        p.x += p.vx;
        p.y += p.vy;
        
        ctx.fillStyle = p.color;
        
        if (p.type === 'leaf') {
            p.vx += (Math.random() - 0.5) * 0.5; // flutter
            ctx.fillRect(p.x, p.y, 4, 4);
        } else if (p.type === 'butterfly') {
            p.y += Math.sin(p.age * 0.1);
            const flap = Math.sin(p.frame * 0.5) > 0 ? 6 : 2;
            ctx.fillRect(p.x, p.y, flap, 4);
        } else if (p.type === 'slime') {
            p.jumpTimer++;
            if (p.jumpTimer > 100) {
                p.vy = -5; // jump
                p.jumpTimer = 0;
            }
            if (p.y < height * 0.8) {
                p.vy += 0.2; // gravity
            } else {
                p.y = height * 0.8;
                p.vy = 0;
            }
            
            // Draw slime (simple blob)
            const squash = p.vy === 0 ? 12 : 16;
            const stretch = p.vy === 0 ? 16 : 12;
            ctx.fillRect(p.x - stretch/2, p.y - squash, stretch, squash);
        } else if (p.type === 'bat') {
            p.vy = Math.sin(p.x * 0.02) * 2;
            const flap = Math.sin(p.frame * 0.3) > 0 ? 10 : 4;
            ctx.fillRect(p.x, p.y, flap, 4);
        } else if (p.type === 'dust' || p.type === 'ember') {
            ctx.globalAlpha = 1 - (p.age / p.life);
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1.0;
        }
    }
}

function drawPlayer() {
    // Very simple code-generated pixel player (boxer stance)
    const px = 150; // Fixed position on left side
    const py = height * 0.7 - (window.scrollY * 0.5); // Slight parallax
    const scale = 4;
    
    // Idle bobbing
    const bob = Math.floor(Math.sin(frameCount * 0.05)) * scale;
    
    ctx.save();
    ctx.translate(px, py + bob);
    
    // Body (White shirt)
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2*scale, -6*scale, 4*scale, 6*scale);
    
    // Head (Skin tone)
    ctx.fillStyle = '#ffc896';
    ctx.fillRect(-3*scale, -12*scale, 6*scale, 6*scale);
    
    // Hair (Dark)
    ctx.fillStyle = '#111';
    ctx.fillRect(-3*scale, -13*scale, 6*scale, 2*scale);
    ctx.fillRect(-4*scale, -11*scale, 1*scale, 3*scale);
    
    // Eyes (blinking)
    if (frameCount % 120 > 5) {
        ctx.fillStyle = '#000';
        ctx.fillRect(-1*scale, -10*scale, 1*scale, 1*scale); // Right eye (facing right)
    }
    
    // Boxing Gloves (Red)
    ctx.fillStyle = '#e8262d';
    // Front glove (guard)
    ctx.fillRect(1*scale, -7*scale, 3*scale, 3*scale);
    // Back glove (chin)
    ctx.fillRect(-3*scale, -8*scale, 2*scale, 2*scale);
    
    // Pants (Dark Grey)
    ctx.fillStyle = '#444';
    ctx.fillRect(-2*scale, 0, 4*scale, 4*scale);
    
    // Legs
    ctx.fillStyle = '#ffc896';
    ctx.fillRect(-2*scale, 4*scale, 1.5*scale, 2*scale);
    ctx.fillRect(0.5*scale, 4*scale, 1.5*scale, 2*scale);
    
    ctx.restore();
}
