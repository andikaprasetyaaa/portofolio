import { playStepSound, playJumpSound } from './audio.js';
import { ImageAssets } from './assets.js';


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
  public emoteText: string | null = "Ready to build AI!";
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
    this.triggerEmote(this.equippedWeapon === 'sword' ? "Silver Broadsword" : "Gold Pickaxe");
  }

  public triggerEmote(text?: string): void {
    const defaultEmotes = [
      "Let's forge AI!",
      "⛏️ Mining data...",
      "IndoBERT entailing...",
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

    ctx.save();
    ctx.translate(px, py);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    if (ImageAssets['guide'] && ImageAssets['guide'].complete && ImageAssets['guide'].naturalWidth !== 0) {
      // Walking bobbing effect
      const bobY = this.isWalking ? Math.abs(Math.sin(this.walkTimer * 0.2)) * 2 * scale : 0;
      ctx.translate(0, -bobY);

      // Draw guide sprite, centered horizontally, bottom aligned
      ctx.drawImage(ImageAssets['guide'], -12 * scale, -24 * scale, 24 * scale, 24 * scale);

      // Draw equipped weapon if any
      if (this.equippedWeapon === 'sword') {
        const attackAngle = this.isWalking ? Math.sin(this.walkTimer * 0.3) * 0.5 : 0;
        ctx.save();
        ctx.translate(6 * scale, -10 * scale);
        ctx.rotate(attackAngle + (Math.PI / 4));

        if (ImageAssets['copper_sword'] && ImageAssets['copper_sword'].complete) {
          ctx.drawImage(ImageAssets['copper_sword'], -6 * scale, -18 * scale, 12 * scale, 18 * scale);
        } else {
          ctx.fillStyle = '#8b6f47'; // Bronze
          ctx.fillRect(-2 * scale, -18 * scale, 4 * scale, 18 * scale);
        }
        ctx.restore();
      }
    } else {
      // Fallback simple pixel character
      this.drawFallbackCharacter(ctx, scale);
    }

    ctx.restore();

    // Draw interaction UI
    if (this.emoteTimer > 0 && this.emoteText) {
      this.drawEmoteBubble(ctx, px, py - 30 * scale);
    }
  }

  private drawFallbackCharacter(ctx: CanvasRenderingContext2D, scale: number): void {
    const bobY = this.isWalking ? Math.abs(Math.sin(this.walkTimer * 0.2)) * 2 : 0;

    ctx.translate(0, -bobY);

    // Back arm
    ctx.fillStyle = '#e5a570'; // Skin tone
    ctx.fillRect(-1 * scale, -14 * scale, 4 * scale, 10 * scale);

    // Legs
    ctx.fillStyle = '#4c3f2d'; // Brown pants
    const legSwing = this.isWalking ? Math.sin(this.walkTimer * 0.3) * 4 : 0;
    ctx.fillRect((-4 + legSwing) * scale, -10 * scale, 4 * scale, 10 * scale); // back leg
    ctx.fillRect((-2 - legSwing) * scale, -10 * scale, 4 * scale, 10 * scale); // front leg

    // Body (Green tunic)
    ctx.fillStyle = '#3fa535';
    ctx.fillRect(-5 * scale, -18 * scale, 10 * scale, 12 * scale);
    // Belt
    ctx.fillStyle = '#553b1b';
    ctx.fillRect(-5 * scale, -9 * scale, 10 * scale, 2 * scale);
    // Buckle
    ctx.fillStyle = '#d8b941';
    ctx.fillRect(-2 * scale, -9 * scale, 4 * scale, 2 * scale);

    // Head
    ctx.fillStyle = '#e5a570';
    ctx.fillRect(-5 * scale, -28 * scale, 10 * scale, 10 * scale);

    // Eyes
    ctx.fillStyle = '#111';
    if (!this.isBlinking) { ctx.fillRect(1 * scale, -26 * scale, 2 * scale, 2 * scale); }

    // Hair / Hat
    ctx.fillStyle = '#26571b'; // Green cap
    ctx.fillRect(-6 * scale, -30 * scale, 12 * scale, 4 * scale);
    ctx.fillRect(-6 * scale, -28 * scale, 4 * scale, 4 * scale); // side flap

    // Front arm
    const armSwing = this.isWalking ? Math.sin(this.walkTimer * 0.3) * -4 : 0;
    ctx.fillStyle = '#3fa535'; // sleeve
    ctx.fillRect((-3 + armSwing) * scale, -18 * scale, 4 * scale, 6 * scale);
    ctx.fillStyle = '#e5a570'; // hand
    ctx.fillRect((-3 + armSwing) * scale, -12 * scale, 4 * scale, 4 * scale);

    // Draw weapon
    if (this.equippedWeapon === 'sword') {
      ctx.fillStyle = '#949494';
      ctx.fillRect((-2 + armSwing) * scale, -26 * scale, 2 * scale, 14 * scale);
      ctx.fillStyle = '#6e502a'; // hilt
      ctx.fillRect((-4 + armSwing) * scale, -14 * scale, 6 * scale, 2 * scale);
    } else if (this.equippedWeapon === 'pickaxe') {
      ctx.fillStyle = '#6e502a'; // handle
      ctx.fillRect((-2 + armSwing) * scale, -22 * scale, 2 * scale, 10 * scale);
      ctx.fillStyle = '#949494'; // head
      ctx.fillRect((-6 + armSwing) * scale, -24 * scale, 10 * scale, 2 * scale);
      ctx.fillRect((-6 + armSwing) * scale, -22 * scale, 2 * scale, 2 * scale);
      ctx.fillRect((2 + armSwing) * scale, -22 * scale, 2 * scale, 2 * scale);
    }
  }

  private drawEmoteBubble(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.font = '20px "Patrick Hand", "Andy", cursive';
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
