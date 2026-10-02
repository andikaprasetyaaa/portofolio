import { playStepSound, playJumpSound } from './audio.js';

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export class TerrariaPlayer {
  public x: number = 220;
  public y: number = 0;
  public groundY: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public facing: 1 | -1 = 1; // 1 = right, -1 = left
  public isWalking: boolean = false;
  public isJumping: boolean = false;
  public walkFrame: number = 0;
  public walkTimer: number = 0;
  public stepAudioTimer: number = 0;

  // Interaction
  public targetX: number | null = null;
  public equippedWeapon: 'sword' | 'pickaxe' = 'sword';
  public emoteText: string | null = "⚔️ Ready to build AI!";
  public emoteTimer: number = 240; // show at start

  // Dust particles from footsteps
  public dustList: DustParticle[] = [];

  // Frame counts
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private idleTime: number = 0;

  constructor(initialX: number = 240) {
    this.x = initialX;
  }

  public setGround(ground: number): void {
    this.groundY = ground;
    if (this.y === 0 || (!this.isJumping && Math.abs(this.y - ground) < 40)) {
      this.y = ground;
    }
  }

  public jump(): void {
    if (!this.isJumping) {
      this.vy = -11;
      this.isJumping = true;
      playJumpSound();
      this.createJumpDust();
    }
  }

  public toggleWeapon(): void {
    this.equippedWeapon = this.equippedWeapon === 'sword' ? 'pickaxe' : 'sword';
    this.triggerEmote(this.equippedWeapon === 'sword' ? "⚔️ Silver Broadsword" : "⛏️ Gold Pickaxe");
  }

  public triggerEmote(text?: string): void {
    const defaultEmotes = [
      "⚔️ Let's forge AI!",
      "⛏️ Mining data...",
      "🧠 IndoBERT entailing...",
      "🥊 Combat sports mode!",
      "✨ Welcome traveler!",
      "🌿 Terraria vibes!"
    ];
    this.emoteText = text || defaultEmotes[Math.floor(Math.random() * defaultEmotes.length)];
    this.emoteTimer = 180; // 3 seconds at 60fps
  }

  public moveTo(targetX: number): void {
    this.targetX = targetX;
  }

  private createStepDust(): void {
    const colors = ['#3fa535', '#6b4423', '#8b5a2b', '#a0c060'];
    for (let i = 0; i < 3; i++) {
      this.dustList.push({
        x: this.x + (Math.random() - 0.5) * 12,
        y: this.y + 2,
        vx: -this.facing * (0.8 + Math.random() * 1.5),
        vy: -0.5 - Math.random() * 1.2,
        size: 2 + Math.floor(Math.random() * 3),
        alpha: 0.9,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private createJumpDust(): void {
    const colors = ['#a0c060', '#6b4423', '#e0e0e0'];
    for (let i = 0; i < 6; i++) {
      this.dustList.push({
        x: this.x + (Math.random() - 0.5) * 16,
        y: this.y + 2,
        vx: (Math.random() - 0.5) * 3,
        vy: -1 - Math.random() * 2,
        size: 3 + Math.floor(Math.random() * 3),
        alpha: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  public update(): void {
    this.idleTime++;

    // Mouse click navigation target
    if (this.targetX !== null) {
      const dx = this.targetX - this.x;
      if (Math.abs(dx) > 6) {
        this.facing = dx > 0 ? 1 : -1;
        this.vx = this.facing * 3.5;
        this.isWalking = true;
      } else {
        this.x = this.targetX;
        this.vx = 0;
        this.targetX = null;
        this.isWalking = false;
      }
    }

    // Physics
    this.x += this.vx;
    this.y += this.vy;

    // Gravity
    if (this.y < this.groundY) {
      this.vy += 0.55; // gravity
      this.isJumping = true;
    } else if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.isJumping = false;
    }

    // Walking animation cycle
    if (this.isWalking && !this.isJumping) {
      this.walkTimer++;
      if (this.walkTimer % 6 === 0) {
        this.walkFrame = (this.walkFrame + 1) % 4;
        if (this.walkFrame === 1 || this.walkFrame === 3) {
          this.createStepDust();
          this.stepAudioTimer++;
          if (this.stepAudioTimer % 2 === 0) {
            playStepSound();
          }
        }
      }
    } else {
      this.walkFrame = 0;
    }

    // Blinking eye
    this.blinkTimer++;
    if (this.blinkTimer > 180) {
      this.isBlinking = true;
      if (this.blinkTimer > 192) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Emote timer
    if (this.emoteTimer > 0) {
      this.emoteTimer--;
      if (this.emoteTimer === 0) {
        this.emoteText = null;
      }
    }

    // Update dust
    for (let i = this.dustList.length - 1; i >= 0; i--) {
      const d = this.dustList[i];
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.1;
      d.alpha -= 0.03;
      if (d.alpha <= 0) {
        this.dustList.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Draw dust particles under feet first
    this.dustList.forEach(d => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, d.alpha);
      ctx.fillStyle = d.color;
      ctx.fillRect(Math.round(d.x), Math.round(d.y), d.size, d.size);
      ctx.restore();
    });

    const scale = 3;
    const px = Math.round(this.x);
    const py = Math.round(this.y);

    // Idle breathing bob
    const idleBob = (!this.isWalking && !this.isJumping)
      ? Math.sin(this.idleTime * 0.08) * 1.5
      : 0;

    ctx.save();
    ctx.translate(px, py + idleBob);
    ctx.scale(this.facing, 1);

    // --- LEGS & SHOES ---
    let leftLegX = -3 * scale;
    let rightLegX = 0;
    let legY = -6 * scale;
    let legHeight = 6 * scale;

    if (this.isWalking && !this.isJumping) {
      // 4-frame Terraria leg strides
      if (this.walkFrame === 1) {
        leftLegX = -5 * scale;
        rightLegX = 2 * scale;
      } else if (this.walkFrame === 2) {
        leftLegX = -2 * scale;
        rightLegX = -1 * scale;
        legY -= 1 * scale;
      } else if (this.walkFrame === 3) {
        leftLegX = 1 * scale;
        rightLegX = -4 * scale;
      }
    } else if (this.isJumping) {
      legY -= 2 * scale;
      legHeight = 5 * scale;
      leftLegX = -4 * scale;
      rightLegX = 1 * scale;
    }

    // Pants (Zoro green / dark emerald trousers)
    ctx.fillStyle = '#1c3e29';
    ctx.fillRect(leftLegX, legY, 3 * scale, legHeight);
    ctx.fillRect(rightLegX, legY, 3 * scale, legHeight);

    // Boots (Terraria Leather boots)
    ctx.fillStyle = '#4a2d18';
    ctx.fillRect(leftLegX - 1 * scale, legY + legHeight - 2 * scale, 4 * scale, 2 * scale);
    ctx.fillRect(rightLegX - 1 * scale, legY + legHeight - 2 * scale, 4 * scale, 2 * scale);
    // Boot soles (black/dark)
    ctx.fillStyle = '#1f130b';
    ctx.fillRect(leftLegX - 1 * scale, legY + legHeight - 0.7 * scale, 4 * scale, 0.7 * scale);
    ctx.fillRect(rightLegX - 1 * scale, legY + legHeight - 0.7 * scale, 4 * scale, 0.7 * scale);

    // --- TORSO / SHIRT ---
    const torsoY = -14 * scale;
    // White adventurer shirt
    ctx.fillStyle = '#f0ede6';
    ctx.fillRect(-4 * scale, torsoY, 7 * scale, 8 * scale);
    // Shirt shading
    ctx.fillStyle = '#d5cebe';
    ctx.fillRect(-4 * scale, torsoY + 4 * scale, 7 * scale, 4 * scale);

    // Red martial arts sash / belt (Terraria style)
    ctx.fillStyle = '#a62424';
    ctx.fillRect(-4.5 * scale, torsoY + 6 * scale, 8 * scale, 2.5 * scale);
    // Gold buckle
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(-1 * scale, torsoY + 6.2 * scale, 2 * scale, 2 * scale);

    // --- HEAD & FACE ---
    const headY = -22 * scale;
    // Skin tone
    ctx.fillStyle = '#ffd3a1';
    ctx.fillRect(-4 * scale, headY, 8 * scale, 8 * scale);
    // Neck
    ctx.fillRect(-2 * scale, torsoY - 1 * scale, 4 * scale, 1.5 * scale);

    // Dark green bandana / hair (Zoro's iconic look)
    ctx.fillStyle = '#1e5230';
    ctx.fillRect(-4.5 * scale, headY - 1 * scale, 9 * scale, 3.5 * scale);
    // Hair spikes on top
    ctx.fillRect(-3 * scale, headY - 2.5 * scale, 6 * scale, 2 * scale);
    ctx.fillRect(-1 * scale, headY - 3.5 * scale, 3 * scale, 1.5 * scale);
    // Hair highlights
    ctx.fillStyle = '#3ca462';
    ctx.fillRect(-3 * scale, headY - 1.5 * scale, 4 * scale, 1 * scale);

    // Eye (facing right)
    if (!this.isBlinking) {
      // White of eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0.5 * scale, headY + 3.5 * scale, 2.5 * scale, 2 * scale);
      // Dark pupil looking ahead
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(1.5 * scale, headY + 3.5 * scale, 1.5 * scale, 2 * scale);
    } else {
      // Blink line
      ctx.fillStyle = '#7a4b27';
      ctx.fillRect(0.5 * scale, headY + 4.5 * scale, 2.5 * scale, 1 * scale);
    }
    // Mouth / determination line
    ctx.fillStyle = '#b8754b';
    ctx.fillRect(1 * scale, headY + 6.5 * scale, 2 * scale, 0.7 * scale);

    // --- ARMS & WEAPON ---
    const armY = -13 * scale;
    let armAngle = 0;
    if (this.isWalking && !this.isJumping) {
      armAngle = (this.walkFrame === 1 ? 0.3 : (this.walkFrame === 3 ? -0.3 : 0));
    }

    ctx.save();
    ctx.translate(0, armY);
    ctx.rotate(armAngle);

    // Arm (sleeve + skin hand)
    ctx.fillStyle = '#f0ede6';
    ctx.fillRect(1 * scale, 0, 3 * scale, 4 * scale);
    ctx.fillStyle = '#ffd3a1'; // hand
    ctx.fillRect(2 * scale, 3 * scale, 2.5 * scale, 2.5 * scale);

    // WEAPON IN HAND
    if (this.equippedWeapon === 'sword') {
      // Terraria Silver Broadsword
      // Hilt (gold)
      ctx.fillStyle = '#ffd24a';
      ctx.fillRect(3 * scale, 2 * scale, 1.5 * scale, 4 * scale);
      // Crossguard
      ctx.fillRect(2 * scale, 2 * scale, 4 * scale, 1.2 * scale);
      // Blade (gleaming steel with cyan glint)
      ctx.fillStyle = '#e8f4f8';
      ctx.fillRect(4.5 * scale, -8 * scale, 2 * scale, 11 * scale);
      ctx.fillStyle = '#9fd2e8'; // inner fuller
      ctx.fillRect(5 * scale, -7 * scale, 1 * scale, 9 * scale);
      // Sword tip
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5 * scale, -9 * scale, 1.5 * scale, 1.5 * scale);
    } else {
      // Terraria Gold Pickaxe
      // Handle (brown wood)
      ctx.fillStyle = '#78471f';
      ctx.fillRect(2.5 * scale, -5 * scale, 1.5 * scale, 10 * scale);
      // Golden pickaxe head
      ctx.fillStyle = '#ffd24a';
      ctx.fillRect(0, -7 * scale, 6 * scale, 2.5 * scale);
      ctx.fillRect(-1.5 * scale, -6 * scale, 2 * scale, 2 * scale);
      ctx.fillRect(5 * scale, -6 * scale, 2 * scale, 2 * scale);
      // Sharp metallic tips
      ctx.fillStyle = '#fff4a3';
      ctx.fillRect(-2 * scale, -5 * scale, 1 * scale, 1.5 * scale);
      ctx.fillRect(6.5 * scale, -5 * scale, 1 * scale, 1.5 * scale);
    }

    ctx.restore();

    ctx.restore(); // restore facing transform

    // --- EMOTE SPEECH BUBBLE ---
    if (this.emoteText && this.emoteTimer > 0) {
      this.drawEmoteBubble(ctx, px, py - 30 * scale);
    }
  }

  private drawEmoteBubble(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    const textWidth = ctx.measureText(this.emoteText!).width;
    const padding = 10;
    const boxW = Math.max(120, textWidth + padding * 2);
    const boxH = 34;
    const boxX = Math.round(x - boxW / 2);
    const boxY = Math.round(y - boxH);

    // Terraria style dialogue bubble (dark blue frame with gold/white border)
    ctx.fillStyle = 'rgba(15, 20, 50, 0.92)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#ffd24a';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Bubble pointer pointing down to player's head
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.moveTo(x - 6, boxY + boxH);
    ctx.lineTo(x + 6, boxY + boxH);
    ctx.lineTo(x, boxY + boxH + 8);
    ctx.closePath();
    ctx.fill();

    // Text inside
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoteText!, x, boxY + boxH / 2);

    ctx.restore();
  }
}
