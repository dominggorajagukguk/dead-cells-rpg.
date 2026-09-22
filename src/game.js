// ============================================================
// DEAD CELLS HD GAME ENGINE
// Dynamic Lighting, Post-Processing (Bloom, Chromatic Aberration),
// and Native HD Rendering.
// ============================================================

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    // Render directly to main canvas for true HD, bypassing low-res offscreen canvas
    this.ctx = this.canvas.getContext('2d');
    
    // Light map canvas for dynamic lighting overlays
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = 1280;
    this.lightCanvas.height = 720;
    this.lightCtx = this.lightCanvas.getContext('2d');

    // Foreground canvas for lighting isolation (dungeon platforms, entities, midground)
    this.fgCanvas = document.createElement('canvas');
    this.fgCanvas.width = 1280;
    this.fgCanvas.height = 720;
    this.fgCtx = this.fgCanvas.getContext('2d');

    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.width = 1280;
    this.height = 720;

    this.camera = {
      x: 0,
      y: 0,
      w: this.width,
      h: this.height,
      shakeIntensity: 0,
      shakeDuration: 0,
      shake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
      },
      update(dt, target, mapW, mapH, ts) {
        const targetX = target.x - this.w / 2 + target.facing * 100;
        const targetY = target.y - this.h / 2 - 40;
        
        // Smooth camera follow
        this.x += (targetX - this.x) * 6 * dt;
        this.y += (targetY - this.y) * 6 * dt;

        if (this.shakeDuration > 0) {
          this.shakeDuration -= dt;
          const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
          const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
          this.x += offsetX;
          this.y += offsetY;
          this.shakeIntensity *= 0.9;
        }

        const maxX = Math.max(0, mapW * ts - this.w);
        const maxY = Math.max(0, mapH * ts - this.h);
        if (this.x < 0) this.x = 0;
        if (this.x > maxX) this.x = maxX;
        if (this.y < 0) this.y = 0;
        if (this.y > maxY) this.y = maxY;
      }
    };

    this.levelManager = new LevelManager();
    this.npcManager = new NPCManager();

    this.player = new Player(240, 520);
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.deployables = [];
    this.dungeonDust = [];

    this.currentStage = 1;
    this.isPaused = false;
    this.hitStopTimer = 0;
    this.time = 0;

    this.input = {
      keys: {},
      justPressed: {},
      mouseLeft: false,
      mouseRight: false
    };

    this.initDungeonDust();
    this.setupEventListeners();
    this.loadStage(1);
  }

  initDungeonDust() {
    this.dungeonDust = [];
    for (let i = 0; i < 80; i++) {
      this.dungeonDust.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 20,
        vy: -5 - Math.random() * 20,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.3
      });
    }
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (!this.input.keys[e.code]) {
        this.input.justPressed[e.code] = true;
      }
      this.input.keys[e.code] = true;
      if (e.code === 'KeyF') this.handleInteraction();
      if (e.code === 'Escape') this.closeModals();
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      window.soundEngine.init();
      if (e.button === 0) this.input.mouseLeft = true;
      if (e.button === 2) this.input.mouseRight = true;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.input.mouseLeft = false;
      if (e.button === 2) this.input.mouseRight = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.getElementById('modal-close-btn').onclick = () => this.closeModals();
    document.getElementById('respawn-btn').onclick = () => this.respawnPlayer();
    document.getElementById('restart-btn').onclick = () => this.restartGame();
    document.getElementById('victory-restart-btn').onclick = () => this.restartGame();
    document.getElementById('start-game-btn').onclick = () => {
      window.soundEngine.init();
      document.getElementById('start-overlay').classList.remove('active');
      this.isPaused = false;
      this.loadStage(1);
      window.focus();
    };
  }

  triggerHitStop(duration) {
    this.hitStopTimer = duration;
    // Massive hit adds screen shake
    if (duration > 0.05) {
      this.camera.shake(duration * 200, duration * 2);
    }
  }

  loadStage(stageNum) {
    this.currentStage = stageNum;
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.deployables = [];

    this.levelManager.loadLevel(stageNum, this);

    if (stageNum === 1) {
      this.player.x = 240; this.player.y = 520;
    } else if (stageNum === 2) {
      this.player.x = 160; this.player.y = 560;
    } else {
      this.player.x = 140; this.player.y = 600;
    }
    this.player.checkpoint = { x: this.player.x, y: this.player.y, stage: stageNum };

    this.spawnEnemiesForStage(stageNum);

    const bossHud = document.getElementById('boss-hud');
    if (stageNum === 3) bossHud.classList.add('active');
    else bossHud.classList.remove('active');

    this.updateHUD();
    this.showToast(`STAGE ${stageNum} STARTED!`);
  }

  spawnEnemiesForStage(stage) {
    if (stage === 1) {
      this.enemies.push(new BaseEnemy(480, 440, 'zombie'));
      this.enemies.push(new ArcherEnemy(720, 320));
      this.enemies.push(new BaseEnemy(1020, 440, 'zombie'));
      this.enemies.push(new ShieldEnemy(1280, 600));
      this.enemies.push(new ArcherEnemy(1850, 400));
      this.enemies.push(new BaseEnemy(2200, 400, 'zombie'));
      this.enemies.push(new ShieldEnemy(2550, 520));
    } else if (stage === 2) {
      this.enemies.push(new BaseEnemy(520, 580, 'zombie'));
      this.enemies.push(new ArcherEnemy(780, 440));
      this.enemies.push(new PhaserEnemy(1120, 440));
      this.enemies.push(new ShieldEnemy(1420, 480));
      this.enemies.push(new ArcherEnemy(1850, 240));
      this.enemies.push(new PhaserEnemy(2150, 480));
      this.enemies.push(new ShieldEnemy(2600, 600));
    } else if (stage === 3) {
      this.enemies.push(new BossMalakor(1300, 640));
    }
  }

  handleInteraction() {
    for (const npc of this.levelManager.npcs) {
      const dist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
      if (dist < 75) {
        this.npcManager.interactWith(npc, this);
        return;
      }
    }
    for (const cp of this.levelManager.checkpoints) {
      const dist = Math.hypot(cp.x - this.player.x, cp.y - this.player.y);
      if (dist < 75) {
        cp.activated = true;
        this.player.checkpoint = { x: cp.x, y: cp.y, stage: this.currentStage };
        this.player.hp = this.player.maxHp;
        this.player.flasks = this.player.maxFlasks;
        this.showToast('CHECKPOINT ACTIVE! HP Restored.');
        window.soundEngine.playUpgrade();
        window.particleSystem.addShockwave(cp.x, cp.y, '#00f0ff', 200);
        this.updateHUD();
        return;
      }
    }
    for (const chest of this.levelManager.chests) {
      const dist = Math.hypot(chest.x - this.player.x, chest.y - this.player.y);
      if (dist < 75 && !chest.opened) {
        chest.opened = true;
        window.soundEngine.playUpgrade();
        window.particleSystem.addSparks(chest.x, chest.y, '#ffd700', 50);
        if (chest.reward === 'gold') {
          this.player.gold += 90;
          this.showToast('Found +90 Gold!');
        } else {
          const weaponKeys = Object.keys(WEAPONS);
          const chosen = WEAPONS[weaponKeys[Math.floor(Math.random() * weaponKeys.length)]];
          this.drops.push(new DropEntity(chest.x, chest.y, 'weapon', { ...chosen, tier: this.currentStage + 1 }));
          this.showToast('Chest Opened!');
        }
        this.updateHUD();
        return;
      }
    }
    if (this.levelManager.exitDoor) {
      const dist = Math.hypot(this.levelManager.exitDoor.x - this.player.x, this.levelManager.exitDoor.y - this.player.y);
      if (dist < 85) {
        this.loadStage(this.levelManager.exitDoor.nextStage);
        return;
      }
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (d.type === 'weapon' && Math.hypot(d.x - this.player.x, d.y - this.player.y) < 65) {
        const oldWep = this.player.primary;
        this.player.primary = { ...d.data };
        d.data = oldWep;
        window.soundEngine.playUpgrade();
        this.showToast(`Equipped ${this.player.primary.name}!`);
        this.updateHUD();
        return;
      }
    }
  }

  chooseScroll(type) {
    if (type === 'brutality') this.player.brutality++;
    else if (type === 'tactics') this.player.tactics++;
    else if (type === 'survival') this.player.survival++;
    this.player.recalculateStats();
    this.player.hp = this.player.maxHp;
    this.player.rallyHp = this.player.maxHp;
    window.soundEngine.playUpgrade();
    this.showToast(`${type.toUpperCase()} Increased!`);
    document.getElementById('scroll-modal').classList.remove('active');
    this.isPaused = false;
    this.updateHUD();
  }

  showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2400);
  }

  closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => {
      if (m.id !== 'gameover-modal' && m.id !== 'victory-modal' && m.id !== 'start-overlay') {
        m.classList.remove('active');
      }
    });
    this.isPaused = false;
  }

  onPlayerDied() {
    document.getElementById('gameover-modal').classList.add('active');
    this.isPaused = true;
  }

  respawnPlayer() {
    document.getElementById('gameover-modal').classList.remove('active');
    this.isPaused = false;
    const cp = this.player.checkpoint;
    if (this.currentStage !== cp.stage) this.loadStage(cp.stage);
    this.player.x = cp.x;
    this.player.y = cp.y;
    this.player.hp = this.player.maxHp;
    this.player.rallyHp = this.player.maxHp;
    this.player.flasks = this.player.maxFlasks;
    this.updateHUD();
  }

  restartGame() {
    document.getElementById('gameover-modal').classList.remove('active');
    document.getElementById('victory-modal').classList.remove('active');
    this.isPaused = false;
    this.player = new Player(240, 520);
    this.loadStage(1);
  }

  onBossDefeated() {
    setTimeout(() => {
      document.getElementById('victory-modal').classList.add('active');
      this.isPaused = true;
    }, 1800);
  }

  updateHUD() {
    const hpPct = Math.max(0, this.player.hp / this.player.maxHp);
    const rallyPct = Math.max(0, this.player.rallyHp / this.player.maxHp);
    const hpFill = document.getElementById('player-hp-fill');
    const hpRally = document.getElementById('player-hp-rally');
    const hpText = document.getElementById('player-hp-text');
    if (hpFill) hpFill.style.width = (hpPct * 100) + '%';
    if (hpRally) hpRally.style.width = (rallyPct * 100) + '%';
    if (hpText) hpText.innerText = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;

    const bVal = document.getElementById('stat-brutality-val');
    const tVal = document.getElementById('stat-tactics-val');
    const sVal = document.getElementById('stat-survival-val');
    if (bVal) bVal.innerText = this.player.brutality;
    if (tVal) tVal.innerText = this.player.tactics;
    if (sVal) sVal.innerText = this.player.survival;

    const gVal = document.getElementById('gold-val');
    const cVal = document.getElementById('cells-val');
    if (gVal) gVal.innerText = this.player.gold;
    if (cVal) cVal.innerText = this.player.cells;

    const pTier = document.getElementById('primary-tier');
    const pIcon = document.getElementById('primary-icon');
    if (pTier) pTier.innerText = 'I'.repeat(this.player.primary.tier || 1);
    if (pIcon) pIcon.innerText = this.player.primary.icon || '🗡️';

    const sTier = document.getElementById('secondary-tier');
    const sIcon = document.getElementById('secondary-icon');
    if (sTier) sTier.innerText = 'I'.repeat(this.player.secondary.tier || 1);
    if (sIcon) sIcon.innerText = this.player.secondary.icon || '🏹';

    const sk1Tier = document.getElementById('skill1-tier');
    const sk1Icon = document.getElementById('skill1-icon');
    if (sk1Tier) sk1Tier.innerText = 'I'.repeat(this.player.skill1.tier || 1);
    if (sk1Icon) sk1Icon.innerText = this.player.skill1.icon || '💣';

    const sk2Tier = document.getElementById('skill2-tier');
    const sk2Icon = document.getElementById('skill2-icon');
    if (sk2Tier) sk2Tier.innerText = 'I'.repeat(this.player.skill2.tier || 1);
    if (sk2Icon) sk2Icon.innerText = this.player.skill2.icon || '❄️';

    const fCharges = document.getElementById('flask-charges');
    if (fCharges) fCharges.innerText = `${this.player.flasks}/${this.player.maxFlasks}`;
  }

  update(dt) {
    this.time += dt;
    if (this.isPaused) return;

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      // Continue updating particles even during hit-stop for extra impact
      window.particleSystem.update(dt);
      this.camera.update(dt, this.player, this.levelManager.mapWidth, this.levelManager.mapHeight, this.levelManager.tileSize);
      return;
    }

    this.player.update(dt, this.input, this.levelManager, this);

    for (const door of this.levelManager.doors) {
      if (!door.broken && Math.abs(door.x - this.player.x) < 45 && Math.abs(door.y - this.player.y) < 60) {
        if (this.player.isAttacking || this.player.isRolling || this.player.isDownSmashing) {
          door.broken = true;
          window.soundEngine.playExplosion();
          window.particleSystem.addSparks(door.x, door.y - 30, '#ffd54f', 40);
          window.particleSystem.addDustPuff(door.x, door.y);
          this.camera.shake(15, 0.3);
          this.showToast('DOOR BREACHED!');
        }
      }
    }

    this.camera.update(dt, this.player, this.levelManager.mapWidth, this.levelManager.mapHeight, this.levelManager.tileSize);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player, this.levelManager, this);
      if (enemy.dead && enemy.type !== 'boss') {
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;
      
      // Projectile Trail
      window.particleSystem.addSparks(p.x, p.y, p.color, 1);

      if (p.isPlayer) {
        this.enemies.forEach(e => {
          if (!e.dead && Math.hypot(e.x - p.x, e.y - 20 - p.y) < 36) {
            e.takeDamage(p.damage, false, p.vx > 0 ? 1 : -1, this);
            if (p.type === 'freeze') e.freezeTimer = 2.4;
            if (p.type === 'bleed') { e.bleedTimer = 3.0; e.bleedTicks = 0; }
            p.life = 0;
            window.particleSystem.addSparks(p.x, p.y, p.color, 20);
          }
        });
      } else {
        if (Math.hypot(this.player.x - p.x, this.player.y - 25 - p.y) < 30) {
          this.player.takeDamage(p.damage, p.x, this);
          p.life = 0;
        }
      }

      if (p.life <= 0) {
        if (p.type === 'cluster_bomb') {
          window.soundEngine.playExplosion();
          window.particleSystem.addShockwave(p.x, p.y, '#ff5722', 150);
          this.enemies.forEach(e => {
            if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 130) {
              e.takeDamage(p.damage, true, 1, this);
            }
          });
        }
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.deployables.length - 1; i >= 0; i--) {
      const dep = this.deployables[i];
      dep.life -= dt;
      dep.fireTimer -= dt;
      if (dep.fireTimer <= 0) {
        dep.fireTimer = dep.fireRate;
        let target = null;
        let minDist = 320;
        this.enemies.forEach(e => {
          if (e.dead) return;
          const d = Math.hypot(e.x - dep.x, e.y - dep.y);
          if (d < minDist) { target = e; minDist = d; }
        });
        if (target) {
          const dir = target.x > dep.x ? 1 : -1;
          this.projectiles.push({
            x: dep.x,
            y: dep.y - 12,
            vx: dir * 600,
            vy: 0,
            damage: dep.damage,
            isPlayer: true,
            color: '#f97316',
            life: 1.1
          });
          window.particleSystem.addSparks(dep.x, dep.y - 12, '#f97316', 10);
        }
      }
      if (dep.life <= 0) this.deployables.splice(i, 1);
    }

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.update(dt, this.levelManager);
      const dist = Math.hypot(drop.x - this.player.x, drop.y - this.player.y);
      if (dist < 44 && !drop.collected) {
        if (drop.type === 'gold') {
          this.player.gold += drop.data.amount || 5;
          window.soundEngine.playGold();
          window.particleSystem.addDamageText(drop.x, drop.y, `+${drop.data.amount} Gold`, 'normal');
          this.drops.splice(i, 1);
        } else if (drop.type === 'cell') {
          this.player.cells += drop.data.amount || 1;
          window.soundEngine.playCell();
          window.particleSystem.addDamageText(drop.x, drop.y, `+${drop.data.amount} Cell`, 'rally');
          this.drops.splice(i, 1);
        }
      }
    }

    for (const scr of this.levelManager.scrolls) {
      if (!scr.collected && Math.hypot(scr.x - this.player.x, scr.y - this.player.y) < 55) {
        scr.collected = true;
        document.getElementById('scroll-modal').classList.add('active');
        this.isPaused = true;
      }
    }

    for (const dust of this.dungeonDust) {
      dust.x += dust.vx * dt;
      dust.y += dust.vy * dt;
      if (dust.y < 0) dust.y = this.height;
      if (dust.x < 0) dust.x = this.width;
      if (dust.x > this.width) dust.x = 0;
    }

    window.particleSystem.update(dt);
    this.updateInteractionPrompt();
    this.updateCooldowns();
    this.renderMinimap();

    this.input.justPressed = {};
  }

  renderMinimap() {
    if (!this.minimapCtx) return;
    const mctx = this.minimapCtx;
    const mw = this.minimapCanvas.width;
    const mh = this.minimapCanvas.height;

    mctx.clearRect(0, 0, mw, mh);
    mctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    mctx.fillRect(0, 0, mw, mh);

    const scaleX = mw / (this.levelManager.mapWidth * this.levelManager.tileSize);
    const scaleY = mh / (this.levelManager.mapHeight * this.levelManager.tileSize);

    mctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    for (let y = 0; y < this.levelManager.mapHeight; y++) {
      if (!this.levelManager.tiles[y]) continue;
      for (let x = 0; x < this.levelManager.mapWidth; x++) {
        if (this.levelManager.tiles[y][x] === 1) {
          mctx.fillRect(
            x * this.levelManager.tileSize * scaleX,
            y * this.levelManager.tileSize * scaleY,
            Math.max(2, this.levelManager.tileSize * scaleX),
            Math.max(2, this.levelManager.tileSize * scaleY)
          );
        }
      }
    }

    for (const cp of this.levelManager.checkpoints) {
      mctx.fillStyle = cp.activated ? '#00f0ff' : '#64748b';
      mctx.beginPath(); mctx.arc(cp.x * scaleX, cp.y * scaleY, 3, 0, Math.PI * 2); mctx.fill();
    }

    mctx.fillStyle = '#ffffff';
    mctx.shadowColor = '#00f0ff';
    mctx.shadowBlur = 4;
    mctx.beginPath(); mctx.arc(this.player.x * scaleX, this.player.y * scaleY, 4, 0, Math.PI * 2); mctx.fill();
    mctx.shadowBlur = 0;
  }

  updateInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    const label = document.getElementById('interaction-label');
    if (!prompt || !label) return;
    let promptText = null;

    for (const npc of this.levelManager.npcs) {
      if (Math.hypot(npc.x - this.player.x, npc.y - this.player.y) < 75) promptText = `Talk to ${npc.name}`;
    }
    for (const cp of this.levelManager.checkpoints) {
      if (Math.hypot(cp.x - this.player.x, cp.y - this.player.y) < 75) promptText = 'Use Checkpoint';
    }
    for (const ch of this.levelManager.chests) {
      if (Math.hypot(ch.x - this.player.x, ch.y - this.player.y) < 75 && !ch.opened) promptText = 'Open Chest';
    }
    if (this.levelManager.exitDoor && Math.hypot(this.levelManager.exitDoor.x - this.player.x, this.levelManager.exitDoor.y - this.player.y) < 85) {
      promptText = 'Enter Next Area';
    }
    for (const d of this.drops) {
      if (d.type === 'weapon' && Math.hypot(d.x - this.player.x, d.y - this.player.y) < 65) promptText = `Pick up ${d.data.name}`;
    }

    if (promptText) {
      label.innerText = promptText;
      prompt.classList.add('visible');
    } else {
      prompt.classList.remove('visible');
    }
  }

  updateCooldowns() {
    const secCdPct = Math.max(0, this.player.secondaryCooldownTimer / this.player.secondary.cooldown);
    const secCd = document.getElementById('secondary-cd');
    if (secCd) secCd.style.height = (secCdPct * 100) + '%';
    const s1CdPct = Math.max(0, this.player.skill1CooldownTimer / this.player.skill1.cooldown);
    const s1Cd = document.getElementById('skill1-cd');
    if (s1Cd) s1Cd.style.height = (s1CdPct * 100) + '%';
    const s2CdPct = Math.max(0, this.player.skill2CooldownTimer / this.player.skill2.cooldown);
    const s2Cd = document.getElementById('skill2-cd');
    if (s2Cd) s2Cd.style.height = (s2CdPct * 100) + '%';
  }

  _hexToRgb(hex) {
    let c = (hex || '#ffffff').replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  // ── SOFT, NON-GLARING AMBIENT LIGHTING ──────────────────────
  addSoftLight(targetCtx, x, y, radius, r, g, b, intensity) {
    const lx = Math.round(x - this.camera.x);
    const ly = Math.round(y - this.camera.y);
    if (lx < -radius || lx > this.width + radius || ly < -radius || ly > this.height + radius) return;
    
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'lighter';
    const grad = targetCtx.createRadialGradient(lx, ly, 0, lx, ly, radius);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
    grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${intensity * 0.35})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.arc(lx, ly, radius, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
  }

  render() {
    const ctx = this.ctx;
    const fgCtx = this.fgCtx;
    
    // Clear contexts
    ctx.clearRect(0, 0, this.width, this.height);
    fgCtx.clearRect(0, 0, this.width, this.height);

    // ──────────────────────────────────────────────────────────
    // PASS 1: AUTHENTIC RAMPARTS PARALLAX BACKDROP (PRISTINE)
    // Drawn directly to main canvas. It will NEVER be touched or washed out
    // by dungeon lighting, providing authentic atmospheric depth!
    // ──────────────────────────────────────────────────────────
    this.levelManager.drawSkyAndParallax(ctx, this.camera);

    // ──────────────────────────────────────────────────────────
    // PASS 2: PLAYFIELD & DUNGEON STRUCTURES (DRAWN ON FG CANVAS)
    // ──────────────────────────────────────────────────────────
    this.levelManager.drawMidground(fgCtx, this.camera);
    this.levelManager.drawDecorations(fgCtx, this.camera);

    for (const door of this.levelManager.doors) {
      window.spriteRenderer.drawWoodenDoor(fgCtx, door, this.camera);
    }
    window.spriteRenderer.drawProps(fgCtx, this.levelManager.props, this.camera);

    this.levelManager.drawTiles(fgCtx, this.camera);
    this.levelManager.drawInteractions(fgCtx, this.camera);

    this.npcManager.draw(fgCtx, this.levelManager.npcs, this.camera);
    for (const drop of this.drops) drop.draw(fgCtx, this.camera);
    for (const enemy of this.enemies) enemy.draw(fgCtx, this.camera);
    
    for (const dep of this.deployables) {
      const rx = Math.round(dep.x - this.camera.x);
      const ry = Math.round(dep.y - this.camera.y);
      fgCtx.fillStyle = '#b45309'; fgCtx.fillRect(rx - 10, ry - 20, 20, 20);
      fgCtx.fillStyle = '#1e293b'; fgCtx.fillRect(rx - 4, ry - 30, 8, 10);
    }

    this.player.draw(fgCtx, this.camera);

    for (const p of this.projectiles) {
      const rx = Math.round(p.x - this.camera.x);
      const ry = Math.round(p.y - this.camera.y);
      fgCtx.fillStyle = p.color || '#ffffff';
      fgCtx.beginPath(); fgCtx.arc(rx, ry, 3.5, 0, Math.PI * 2); fgCtx.fill();
    }

    window.particleSystem.draw(fgCtx, this.camera);

    // ──────────────────────────────────────────────────────────
    // PASS 3: SOFT, NATURAL, NON-GLARING LIGHTING (ONLY ON FOREGROUND)
    // ──────────────────────────────────────────────────────────
    // Torches: gentle warm amber glow (soft, pleasant, NOT blinding)
    for (const torch of this.levelManager.torches) {
      const flicker = Math.sin(this.time * 12 + torch.flicker) * 8;
      this.addSoftLight(fgCtx, torch.x, torch.y - 15, 160 + flicker, 255, 175, 75, 0.28);
    }

    // Crystals: subtle cyan luminescence
    for (const crystal of this.levelManager.crystals) {
      const pulse = Math.sin(this.time * 3 + crystal.x * 0.1) * 6;
      this.addSoftLight(fgCtx, crystal.x, crystal.y - 10, 80 + pulse, 0, 220, 255, 0.20);
    }

    // Player flame head: subtle soft emerald ambient aura
    this.addSoftLight(fgCtx, this.player.x, this.player.y - 20, 85, 52, 211, 153, 0.18);

    // Checkpoints: gentle cyan beacon
    for (const cp of this.levelManager.checkpoints) {
      if (cp.activated) this.addSoftLight(fgCtx, cp.x, cp.y - 20, 150, 0, 230, 255, 0.24);
    }

    // Projectile glow
    for (const p of this.projectiles) {
      this.addSoftLight(fgCtx, p.x, p.y, 45, 200, 220, 255, 0.28);
    }

    // ──────────────────────────────────────────────────────────
    // PASS 4: COMPOSITE LIT FOREGROUND OVER PRISTINE BACKDROP
    // ──────────────────────────────────────────────────────────
    ctx.drawImage(this.fgCanvas, 0, 0);

    // Foreground atmospheric dust
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (const dust of this.dungeonDust) {
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hit Flash (subtle damage vignette, non-jarring)
    if (this.player.hurtFlashTimer > 0) {
      const vig = ctx.createRadialGradient(this.width / 2, this.height / 2, this.height * 0.3, this.width / 2, this.height / 2, this.width * 0.75);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, `rgba(180, 0, 0, ${Math.min(0.35, this.player.hurtFlashTimer * 2)})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}

window.GameEngine = GameEngine;

window.onload = () => {
  window.game = new GameEngine();
  let lastTime = performance.now();
  
  function loop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    
    window.game.update(dt);
    window.game.render();
    
    requestAnimationFrame(loop);
  }
  
  requestAnimationFrame(loop);
};
