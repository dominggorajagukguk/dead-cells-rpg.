// Dead Cells Main Game Coordinator - HD Engine, Minimap, Door Breach & Dynamic Lighting

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

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
        const targetX = target.x - this.w / 2 + target.facing * 80;
        const targetY = target.y - this.h / 2 - 25;
        this.x += (targetX - this.x) * 9 * dt;
        this.y += (targetY - this.y) * 9 * dt;

        if (this.shakeDuration > 0) {
          this.shakeDuration -= dt;
          const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
          const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
          this.x += offsetX;
          this.y += offsetY;
          this.shakeIntensity *= 0.92;
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

    this.player = new Player(140, 580);
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.deployables = [];
    this.dungeonDust = [];

    this.currentStage = 1;
    this.isPaused = false;
    this.hitStopTimer = 0;
    this.lastTime = performance.now();

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
    for (let i = 0; i < 45; i++) {
      this.dungeonDust.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 18,
        vy: -10 - Math.random() * 15,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.25 + Math.random() * 0.45
      });
    }
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (!this.input.keys[e.code]) {
        this.input.justPressed[e.code] = true;
      }
      this.input.keys[e.code] = true;

      if (e.code === 'KeyF') {
        this.handleInteraction();
      }

      if (e.code === 'Escape') {
        this.closeModals();
      }
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
      this.loadStage(1);
    };
  }

  triggerHitStop(duration) {
    this.hitStopTimer = duration;
  }

  loadStage(stageNum) {
    this.currentStage = stageNum;
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.deployables = [];

    this.levelManager.loadLevel(stageNum, this);

    if (stageNum === 1) {
      this.player.x = 140;
      this.player.y = 580;
    } else if (stageNum === 2) {
      this.player.x = 160;
      this.player.y = 560;
    } else {
      this.player.x = 140;
      this.player.y = 600;
    }
    this.player.checkpoint = { x: this.player.x, y: this.player.y, stage: stageNum };

    this.spawnEnemiesForStage(stageNum);

    const bossHud = document.getElementById('boss-hud');
    if (stageNum === 3) {
      bossHud.classList.add('active');
    } else {
      bossHud.classList.remove('active');
    }

    this.updateHUD();
    this.showToast(`STAGE ${stageNum} STARTED!`);
  }

  spawnEnemiesForStage(stage) {
    if (stage === 1) {
      // Inquisitors, Zombies, Shielded Knights
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
        this.showToast('CHECKPOINT AKTIF! HP & Potion Dipulihkan.');
        window.soundEngine.playUpgrade();
        window.particleSystem.addShockwave(cp.x, cp.y, '#00f0ff', 140);
        this.updateHUD();
        return;
      }
    }

    for (const chest of this.levelManager.chests) {
      const dist = Math.hypot(chest.x - this.player.x, chest.y - this.player.y);
      if (dist < 75 && !chest.opened) {
        chest.opened = true;
        window.soundEngine.playUpgrade();
        window.particleSystem.addSparks(chest.x, chest.y, '#ffd700', 30);
        if (chest.reward === 'gold') {
          this.player.gold += 90;
          this.showToast('Mendapatkan +90 Gold!');
        } else {
          const weaponKeys = Object.keys(WEAPONS);
          const chosen = WEAPONS[weaponKeys[Math.floor(Math.random() * weaponKeys.length)]];
          this.drops.push(new DropEntity(chest.x, chest.y, 'weapon', { ...chosen, tier: this.currentStage + 1 }));
          this.showToast('Peti Terbuka!');
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
        this.showToast(`Memakai ${this.player.primary.name}!`);
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
    this.showToast(`Stat ${type.toUpperCase()} Ditingkatkan!`);
    document.getElementById('scroll-modal').classList.remove('active');
    this.isPaused = false;
    this.updateHUD();
  }

  showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 2400);
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
    if (this.currentStage !== cp.stage) {
      this.loadStage(cp.stage);
    }
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
    this.player = new Player(140, 580);
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
    if (this.isPaused) return;

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    // 1. Update Player
    this.player.update(dt, this.input, this.levelManager, this);

    // 2. Door Breach Check (Player attacks or rolls through a wooden door)
    for (const door of this.levelManager.doors) {
      if (!door.broken && Math.abs(door.x - this.player.x) < 45 && Math.abs(door.y - this.player.y) < 60) {
        if (this.player.isAttacking || this.player.isRolling || this.player.isDownSmashing) {
          door.broken = true;
          window.soundEngine.playExplosion();
          window.particleSystem.addSparks(door.x, door.y - 30, '#ffd54f', 24);
          window.particleSystem.addDustPuff(door.x, door.y);
          this.camera.shake(14, 0.3);
          this.showToast('DOOR BREACHED!');
        }
      }
    }

    // 3. Update Camera
    this.camera.update(dt, this.player, this.levelManager.mapWidth, this.levelManager.mapHeight, this.levelManager.tileSize);

    // 4. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player, this.levelManager, this);
      if (enemy.dead && enemy.type !== 'boss') {
        this.enemies.splice(i, 1);
      }
    }

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;

      if (p.isPlayer) {
        this.enemies.forEach(e => {
          if (!e.dead && Math.hypot(e.x - p.x, e.y - 20 - p.y) < 36) {
            e.takeDamage(p.damage, false, p.vx > 0 ? 1 : -1, this);
            if (p.type === 'freeze') e.freezeTimer = 2.4;
            if (p.type === 'bleed') { e.bleedTimer = 3.0; e.bleedTicks = 0; }
            p.life = 0;
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
          window.particleSystem.addShockwave(p.x, p.y, '#ff5722', 130);
          this.enemies.forEach(e => {
            if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 130) {
              e.takeDamage(p.damage, true, 1, this);
            }
          });
        }
        this.projectiles.splice(i, 1);
      }
    }

    // 6. Update Deployable Turrets
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
            vx: dir * 450,
            vy: 0,
            damage: dep.damage,
            isPlayer: true,
            color: '#ff9800',
            life: 1.1
          });
        }
      }

      if (dep.life <= 0) this.deployables.splice(i, 1);
    }

    // 7. Update Loot Drops
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

    // 8. Scroll Collection
    for (const scr of this.levelManager.scrolls) {
      if (!scr.collected && Math.hypot(scr.x - this.player.x, scr.y - this.player.y) < 55) {
        scr.collected = true;
        document.getElementById('scroll-modal').classList.add('active');
        this.isPaused = true;
      }
    }

    // 9. Update Dust Motes
    for (const dust of this.dungeonDust) {
      dust.x += dust.vx * dt;
      dust.y += dust.vy * dt;
      if (dust.y < 0) dust.y = this.height;
      if (dust.x < 0) dust.x = this.width;
      if (dust.x > this.width) dust.x = 0;
    }

    // 10. Update Particles
    window.particleSystem.update(dt);

    // 11. Update UI Prompts & Cooldowns
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

    // Holographic Grid Background
    mctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    mctx.fillRect(0, 0, mw, mh);

    const scaleX = mw / (this.levelManager.mapWidth * this.levelManager.tileSize);
    const scaleY = mh / (this.levelManager.mapHeight * this.levelManager.tileSize);

    // Draw Explored Rooms / Platforms in Neon Blue
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

    // Checkpoint Icons
    for (const cp of this.levelManager.checkpoints) {
      mctx.fillStyle = cp.activated ? '#00f0ff' : '#64748b';
      mctx.beginPath();
      mctx.arc(cp.x * scaleX, cp.y * scaleY, 3, 0, Math.PI * 2);
      mctx.fill();
    }

    // Player Position Icon (Glowing White/Cyan Dot)
    mctx.fillStyle = '#ffffff';
    mctx.shadowColor = '#00f0ff';
    mctx.shadowBlur = 6;
    mctx.beginPath();
    mctx.arc(this.player.x * scaleX, this.player.y * scaleY, 4, 0, Math.PI * 2);
    mctx.fill();
  }

  updateInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    const label = document.getElementById('interaction-label');
    if (!prompt || !label) return;
    let promptText = null;

    for (const npc of this.levelManager.npcs) {
      if (Math.hypot(npc.x - this.player.x, npc.y - this.player.y) < 75) {
        promptText = `Bicara dengan ${npc.name}`;
      }
    }

    for (const cp of this.levelManager.checkpoints) {
      if (Math.hypot(cp.x - this.player.x, cp.y - this.player.y) < 75) {
        promptText = 'Aktifkan Checkpoint Teleport';
      }
    }

    for (const ch of this.levelManager.chests) {
      if (Math.hypot(ch.x - this.player.x, ch.y - this.player.y) < 75 && !ch.opened) {
        promptText = 'Buka Peti Harta';
      }
    }

    if (this.levelManager.exitDoor && Math.hypot(this.levelManager.exitDoor.x - this.player.x, this.levelManager.exitDoor.y - this.player.y) < 85) {
      promptText = 'Masuki Area Selanjutnya';
    }

    for (const d of this.drops) {
      if (d.type === 'weapon' && Math.hypot(d.x - this.player.x, d.y - this.player.y) < 65) {
        promptText = `Ambil ${d.data.name}`;
      }
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

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Parallax Dungeon & Tilemap
    this.levelManager.draw(ctx, this.camera);

    // 2. Draw NPCs
    this.npcManager.draw(ctx, this.levelManager.npcs, this.camera);

    // 3. Draw Loot Drops
    for (const drop of this.drops) {
      drop.draw(ctx, this.camera);
    }

    // 4. Draw Enemies
    for (const enemy of this.enemies) {
      enemy.draw(ctx, this.camera);
    }

    // 5. Draw Deployable Turrets (HD Tekken cannon)
    for (const dep of this.deployables) {
      const rx = Math.round(dep.x - this.camera.x);
      const ry = Math.round(dep.y - this.camera.y);
      ctx.save();
      // Turret base
      const baseG = ctx.createLinearGradient(rx - 14, ry - 24, rx + 14, ry);
      baseG.addColorStop(0, '#78350f');
      baseG.addColorStop(0.5, '#b45309');
      baseG.addColorStop(1, '#451a03');
      ctx.fillStyle = baseG;
      ctx.fillRect(rx - 14, ry - 24, 28, 24);
      // Cannon barrel
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(rx - 3, ry - 32, 6, 10);
      ctx.fillStyle = '#475569';
      ctx.fillRect(rx - 4, ry - 34, 8, 4);
      // Muzzle glow
      const muzzG = ctx.createRadialGradient(rx, ry - 36, 0, rx, ry - 36, 10);
      muzzG.addColorStop(0, 'rgba(255, 150, 0, 0.7)');
      muzzG.addColorStop(1, 'transparent');
      ctx.fillStyle = muzzG;
      ctx.beginPath();
      ctx.arc(rx, ry - 36, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Draw Player
    this.player.draw(ctx, this.camera);

    // 7. Draw Projectiles (HD Tekken energy shots with trails)
    for (const p of this.projectiles) {
      const rx = Math.round(p.x - this.camera.x);
      const ry = Math.round(p.y - this.camera.y);
      ctx.save();
      const pc = p.color || '#fff';

      // Motion trail
      const trailLen = Math.min(28, Math.abs(p.vx) * 0.04);
      const trailG = ctx.createLinearGradient(rx - trailLen, ry, rx, ry);
      trailG.addColorStop(0, 'transparent');
      trailG.addColorStop(1, pc);
      ctx.fillStyle = trailG;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(rx - trailLen, ry - 3, trailLen, 6);
      ctx.globalAlpha = 1;

      // Outer glow
      const projG = ctx.createRadialGradient(rx, ry, 0, rx, ry, 10);
      projG.addColorStop(0, '#ffffff');
      projG.addColorStop(0.3, pc);
      projG.addColorStop(1, 'transparent');
      ctx.fillStyle = projG;
      ctx.shadowColor = pc;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(rx, ry, 8, 0, Math.PI * 2);
      ctx.fill();

      // Hard core
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 8. Draw Particles & Damage Numbers
    window.particleSystem.draw(ctx, this.camera);

    // 9. Volumetric Player Light (Tekken rim glow)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const prx = Math.round(this.player.x - this.camera.x);
    const pry = Math.round(this.player.y - this.camera.y - this.player.h + 8);
    // Main flame light
    const pGlow = ctx.createRadialGradient(prx, pry, 0, prx, pry, 140);
    pGlow.addColorStop(0, 'rgba(251, 191, 36, 0.52)');
    pGlow.addColorStop(0.35, 'rgba(249, 115, 22, 0.18)');
    pGlow.addColorStop(0.65, 'rgba(239, 68, 68, 0.06)');
    pGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = pGlow;
    ctx.beginPath();
    ctx.arc(prx, pry, 140, 0, Math.PI * 2);
    ctx.fill();
    // Floor caustic light
    const floorGlow = ctx.createRadialGradient(prx, this.player.y - this.camera.y, 0, prx, this.player.y - this.camera.y, 90);
    floorGlow.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
    floorGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.ellipse(prx, this.player.y - this.camera.y, 90, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 10. Ambient Dust Motes (Tekken particle dust)
    ctx.save();
    for (const dust of this.dungeonDust) {
      const dustG = ctx.createRadialGradient(dust.x, dust.y, 0, dust.x, dust.y, dust.size * 2);
      dustG.addColorStop(0, `rgba(255, 240, 210, ${dust.alpha})`);
      dustG.addColorStop(1, 'transparent');
      ctx.fillStyle = dustG;
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 11. HIT-FLASH Chromatic Aberration (when player is hurt)
    if (this.player.hurtFlashTimer > 0) {
      const aberration = Math.min(6, this.player.hurtFlashTimer * 30);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.35;
      // Red channel shift right
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.fillRect(aberration, 0, this.width, this.height);
      // Cyan channel shift left
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.fillRect(-aberration, 0, this.width, this.height);
      ctx.restore();
      // Red flash vignette
      const hurtVig = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.height * 0.2,
        this.width / 2, this.height / 2, this.width * 0.8
      );
      hurtVig.addColorStop(0, 'transparent');
      hurtVig.addColorStop(1, `rgba(180, 0, 0, ${this.player.hurtFlashTimer * 2.5})`);
      ctx.fillStyle = hurtVig;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 12. Cinematic Vignette (Tekken dark edge)
    const vignette = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.38,
      this.width / 2, this.height / 2, this.width * 0.78
    );
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(0.6, 'rgba(0, 0, 0, 0.18)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    // 13. CRT Scan-line overlay (Tekken Arcade authentic)
    ctx.save();
    ctx.globalAlpha = 0.028;
    ctx.fillStyle = '#000000';
    for (let sl = 0; sl < this.height; sl += 3) {
      ctx.fillRect(0, sl, this.width, 1);
    }
    ctx.restore();

    // 14. Cinematic Letterbox Bars (Tekken intro/fight black bars)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, 18);
    ctx.fillRect(0, this.height - 18, this.width, 18);
  }

  loop(currentTime) {
    try {
      const dt = Math.min(0.08, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;

      this.update(dt);
      this.render();
    } catch (err) {
      console.error('Game loop error handled:', err);
    }

    requestAnimationFrame((time) => this.loop(time));
  }

  start() {
    requestAnimationFrame((time) => {
      this.lastTime = time;
      this.loop(time);
    });
  }
}

window.onload = () => {
  window.game = new GameEngine();
  window.game.start();
};
