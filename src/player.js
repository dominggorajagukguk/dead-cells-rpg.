// The Beheaded Player Character Controller & Movement

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 56;
    this.vx = 0;
    this.vy = 0;

    // Movement physics
    this.speed = 360;
    this.jumpForce = -560;
    this.gravity = 1400;
    this.facing = 1;

    // States
    this.grounded = false;
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.isWallSliding = false;
    this.wallDir = 0;

    // Dodge Roll
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollDuration = 0.32;
    this.rollCooldown = 0.42;
    this.rollCooldownTimer = 0;
    this.isInvulnerable = false;

    // Down Smash
    this.isDownSmashing = false;

    // Combat
    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.currentAttackDuration = 0.22;
    this.attackCooldown = 0;
    this.attackProgress = 0;

    // Secondary & Skills
    this.secondaryCooldownTimer = 0;
    this.skill1CooldownTimer = 0;
    this.skill2CooldownTimer = 0;

    // Flasks
    this.flasks = 3;
    this.maxFlasks = 3;
    this.flaskCooldownTimer = 0;

    // Stats
    this.brutality = 1;
    this.tactics = 1;
    this.survival = 1;
    this.baseMaxHp = 120;
    this.maxHp = 120;
    this.hp = 120;
    this.rallyHp = 120;
    this.rallyTimer = 0;

    this.gold = 50;
    this.cells = 5;

    // Items
    this.primary = { ...WEAPONS.rusty_sword, tier: 1 };
    this.secondary = { ...WEAPONS.ice_bow, tier: 1 };
    this.skill1 = { ...WEAPONS.cluster_bomb, tier: 1 };
    this.skill2 = { ...WEAPONS.frost_blast, tier: 1 };

    // Animation & Visuals
    this.animTime = 0;
    this.runDustTimer = 0;
    this.hurtFlashTimer = 0;
    this.checkpoint = { x: x, y: y, stage: 1 };
  }

  recalculateStats() {
    this.maxHp = Math.round(this.baseMaxHp * Math.pow(1.35, this.survival - 1) * Math.pow(1.15, (this.brutality - 1) + (this.tactics - 1)));
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    if (this.rallyHp > this.maxHp) this.rallyHp = this.maxHp;
  }

  getPrimaryDamage() {
    const tierBonus = 1 + (this.primary.tier - 1) * 0.35;
    const statBonus = 1 + (this.brutality - 1) * 0.45;
    return Math.round(this.primary.baseDamage * tierBonus * statBonus);
  }

  getSecondaryDamage() {
    const tierBonus = 1 + (this.secondary.tier - 1) * 0.35;
    const statBonus = 1 + (this.tactics - 1) * 0.45;
    return Math.round(this.secondary.baseDamage * tierBonus * statBonus);
  }

  getSkillDamage(skill) {
    const tierBonus = 1 + (skill.tier - 1) * 0.35;
    const statBonus = 1 + (this.tactics - 1) * 0.5;
    return Math.round(skill.baseDamage * tierBonus * statBonus);
  }

  update(dt, input, level, game) {
    this.animTime += dt;

    if (this.rollCooldownTimer > 0) this.rollCooldownTimer -= dt;
    if (this.secondaryCooldownTimer > 0) this.secondaryCooldownTimer -= dt;
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer -= dt;
    if (this.skill2CooldownTimer > 0) this.skill2CooldownTimer -= dt;
    if (this.flaskCooldownTimer > 0) this.flaskCooldownTimer -= dt;
    if (this.hurtFlashTimer > 0) this.hurtFlashTimer -= dt;

    if (this.rallyTimer > 0) {
      this.rallyTimer -= dt;
      if (this.rallyTimer <= 0) {
        this.rallyHp = this.hp;
      }
    } else {
      this.rallyHp = this.hp;
    }

    // 1. Dodge Roll
    if (this.isRolling) {
      this.rollTimer -= dt;
      this.isInvulnerable = true;
      this.vx = this.facing * 560;
      this.vy = 0;

      window.particleSystem.addGhostTrail(this.x, this.y, this.w, this.h, this.facing, '#ff1744');

      if (this.rollTimer <= 0) {
        this.isRolling = false;
        this.isInvulnerable = false;
        this.vx *= 0.35;
      }
    } else if (this.isDownSmashing) {
      // 2. Down Smash
      this.vy = 950;
      this.vx = 0;
      window.particleSystem.addFlameEmbers(this.x, this.y - 10, '#ff1744', 4);

      if (this.grounded) {
        this.isDownSmashing = false;
        window.soundEngine.playDownSmash();
        window.particleSystem.addShockwave(this.x, this.y + 4, '#ff1744', 160);
        window.particleSystem.addSparks(this.x, this.y, '#ffd700', 22);
        game.camera.shake(18, 0.35);

        game.enemies.forEach(enemy => {
          const dist = Math.abs(enemy.x - this.x);
          if (dist < 150 && Math.abs(enemy.y - this.y) < 70) {
            enemy.takeDamage(this.getPrimaryDamage() * 2.2, true, this.facing, game);
          }
        });
      }
    } else {
      // 3. Normal Movement
      let moveDir = 0;
      if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveDir -= 1;
      if (input.keys['KeyD'] || input.keys['ArrowRight']) moveDir += 1;

      if (!this.isAttacking) {
        if (moveDir !== 0) {
          this.vx = moveDir * this.speed;
          this.facing = moveDir;

          if (this.grounded) {
            this.runDustTimer += dt;
            if (this.runDustTimer > 0.16) {
              this.runDustTimer = 0;
              window.particleSystem.addDustPuff(this.x - this.facing * 14, this.y);
            }
          }
        } else {
          this.vx *= 0.72;
          if (Math.abs(this.vx) < 10) this.vx = 0;
        }
      } else {
        this.vx *= 0.85;
      }

      // Jump & Double Jump
      if (input.justPressed['KeyW'] || input.justPressed['ArrowUp'] || input.justPressed['Space']) {
        if (input.keys['KeyS'] || input.keys['ArrowDown']) {
          if (!this.grounded) {
            this.isDownSmashing = true;
          }
        } else if (this.grounded) {
          this.vy = this.jumpForce;
          this.grounded = false;
          this.jumpCount = 1;
          window.soundEngine.playJump(false);
          window.particleSystem.addDustPuff(this.x, this.y);
        } else if (this.isWallSliding) {
          this.vy = this.jumpForce * 0.95;
          this.vx = -this.wallDir * this.speed * 1.25;
          this.facing = -this.wallDir;
          this.jumpCount = 1;
          window.soundEngine.playJump(true);
          window.particleSystem.addSparks(this.x, this.y - 20, '#ffd700', 12);
        } else if (this.jumpCount < this.maxJumps) {
          this.vy = this.jumpForce * 0.9;
          this.jumpCount++;
          window.soundEngine.playJump(true);
          window.particleSystem.addShockwave(this.x, this.y, '#00e5ff', 45);
        }
      }

      // Dodge Roll
      if ((input.justPressed['ShiftLeft'] || input.justPressed['ShiftRight'] || input.justPressed['KeyK']) && this.rollCooldownTimer <= 0) {
        this.isRolling = true;
        this.rollTimer = this.rollDuration;
        this.rollCooldownTimer = this.rollCooldown;
        this.isAttacking = false;
        window.soundEngine.playRoll();
      }

      // Attack Controls
      if ((input.justPressed['KeyJ'] || input.mouseLeft) && !this.isAttacking) {
        this.performPrimaryAttack(game);
      }

      if ((input.justPressed['KeyK'] || input.mouseRight) && this.secondaryCooldownTimer <= 0) {
        this.performSecondaryAttack(game);
      }

      if (input.justPressed['KeyQ'] && this.skill1CooldownTimer <= 0) {
        this.performSkill1(game);
      }

      if (input.justPressed['KeyE'] && this.skill2CooldownTimer <= 0) {
        this.performSkill2(game);
      }

      if (input.justPressed['KeyR'] && this.flasks > 0 && this.flaskCooldownTimer <= 0 && this.hp < this.maxHp) {
        this.useFlask();
      }

      // Gravity
      this.vy += this.gravity * dt;
      if (this.vy > 950) this.vy = 950;
    }

    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
      }
    }

    if (this.isAttacking) {
      this.attackTimer -= dt;
      this.attackProgress = Math.min(1, Math.max(0, 1 - (this.attackTimer / (this.currentAttackDuration || 0.22))));
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    this.handleLevelCollisions(dt, level, game);

    window.particleSystem.addFlameEmbers(this.x, this.y - this.h + 8, '#ff1744', 2);
  }

  performPrimaryAttack(game) {
    this.isAttacking = true;
    if (this.comboResetTimer <= 0) {
      this.comboStep = 0;
    }
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboResetTimer = 0.85;

    const baseSpeed = this.primary.attackSpeed || 0.22;
    if (this.comboStep === 1) {
      this.currentAttackDuration = baseSpeed;
      this.vx = this.facing * 200;
    } else if (this.comboStep === 2) {
      this.currentAttackDuration = baseSpeed * 1.1;
      this.vx = this.facing * 160;
      window.particleSystem.addSparks(this.x + this.facing * 15, this.y, '#ffd700', 8);
    } else {
      this.currentAttackDuration = baseSpeed * 1.4;
      this.vx = this.facing * 260;
      if (this.grounded) {
        this.vy = -180; // Small leaping hop for execution slam
      }
    }
    this.attackTimer = this.currentAttackDuration;

    window.soundEngine.playSlash(this.comboStep);

    const isSpin = false;
    const slashType = this.comboStep === 1 ? 'horizontal' : this.comboStep === 2 ? 'uppercut' : 'slam';
    const range = this.comboStep === 3 ? this.primary.range + 45 : (this.comboStep === 2 ? this.primary.range + 25 : this.primary.range + 15);
    const slashX = this.x + this.facing * (this.comboStep === 3 ? 42 : (this.comboStep === 2 ? 32 : 36));
    const slashY = this.y - (this.comboStep === 2 ? 26 : (this.comboStep === 3 ? 12 : 18));

    window.particleSystem.addSlash(slashX, slashY, this.facing, this.primary.color || '#ff1744', range, isSpin, slashType, this.comboStep);

    const isCrit = (this.comboStep === 3 && this.primary.id === 'twin_daggers') || (this.comboStep === 3) || Math.random() < 0.22;
    const critMult = this.comboStep === 3 ? (this.primary.critMultiplier || 1.8) : (this.primary.critMultiplier || 1.5);
    const dmg = isCrit ? Math.round(this.getPrimaryDamage() * critMult) : this.getPrimaryDamage();

    let hitAny = false;
    game.enemies.forEach(enemy => {
      if (enemy.dead) return;
      const dx = (enemy.x - this.x) * this.facing;
      const dy = Math.abs(enemy.y - this.y);
      if (dx > -10 && dx < range + 35 && dy < 75) {
        enemy.takeDamage(dmg, isCrit, this.facing, game);
        hitAny = true;
      }
    });

    if (hitAny) {
      const shakeIntensity = this.comboStep === 3 ? (isCrit ? 16 : 10) : (isCrit ? 9 : 5);
      const shakeDuration = this.comboStep === 3 ? 0.25 : 0.16;
      game.camera.shake(shakeIntensity, shakeDuration);
      game.triggerHitStop(this.comboStep === 3 ? (isCrit ? 0.08 : 0.05) : (isCrit ? 0.05 : 0.03));
      if (this.hp < this.rallyHp) {
        const recoverAmt = Math.min(16, this.rallyHp - this.hp);
        this.hp += recoverAmt;
        window.particleSystem.addDamageText(this.x, this.y - 35, recoverAmt, 'rally');
      }
    }
  }

  performSecondaryAttack(game) {
    this.secondaryCooldownTimer = this.secondary.cooldown;
    window.soundEngine.playBowShoot();

    const dmg = this.getSecondaryDamage();
    if (this.secondary.id === 'ice_bow' || this.secondary.id === 'heavy_crossbow') {
      game.projectiles.push({
        x: this.x + this.facing * 24,
        y: this.y - 18,
        vx: this.facing * 720,
        vy: 0,
        damage: dmg,
        isPlayer: true,
        type: this.secondary.effect || 'arrow',
        color: this.secondary.color,
        life: 1.4
      });
    } else if (this.secondary.id === 'electric_whip') {
      let closest = null;
      let minDist = 240;
      game.enemies.forEach(e => {
        if (e.dead) return;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < minDist && (e.x - this.x) * this.facing >= 0) {
          closest = e;
          minDist = d;
        }
      });

      if (closest) {
        closest.takeDamage(dmg, false, this.facing, game);
        window.particleSystem.addSparks(closest.x, closest.y - 20, '#b042ff', 16);
        window.particleSystem.addSlash(closest.x, closest.y - 15, this.facing, '#b042ff', 50, true);
        game.camera.shake(6, 0.12);
      }
    } else {
      [-40, 40].forEach(angleOff => {
        game.projectiles.push({
          x: this.x + this.facing * 20,
          y: this.y - 16,
          vx: this.facing * 600,
          vy: angleOff,
          damage: Math.round(dmg * 0.65),
          isPlayer: true,
          type: 'bleed',
          color: '#ff1744',
          life: 1.2
        });
      });
    }
  }

  performSkill1(game) {
    this.skill1CooldownTimer = this.skill1.cooldown;
    const dmg = this.getSkillDamage(this.skill1);

    if (this.skill1.id === 'cluster_bomb') {
      window.soundEngine.playBowShoot();
      game.projectiles.push({
        x: this.x,
        y: this.y - 20,
        vx: this.facing * 420,
        vy: -240,
        gravity: 650,
        damage: dmg,
        isPlayer: true,
        type: 'cluster_bomb',
        color: '#ff5722',
        life: 0.95
      });
    } else if (this.skill1.id === 'shadow_dash') {
      let target = null;
      let minDist = 280;
      game.enemies.forEach(e => {
        if (e.dead) return;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < minDist) { target = e; minDist = d; }
      });
      if (target) {
        this.x = target.x + (target.facing > 0 ? -45 : 45);
        this.y = target.y;
        this.facing = target.x > this.x ? 1 : -1;
        target.takeDamage(Math.round(dmg * 1.6), true, this.facing, game);
        window.soundEngine.playHit(true, true);
        window.particleSystem.addShockwave(this.x, this.y, '#b042ff', 90);
      }
    }
  }

  performSkill2(game) {
    this.skill2CooldownTimer = this.skill2.cooldown;
    const dmg = this.getSkillDamage(this.skill2);

    if (this.skill2.id === 'frost_blast') {
      window.soundEngine.playHit(false, true);
      window.particleSystem.addShockwave(this.x + this.facing * 60, this.y, '#00e5ff', 160);
      game.enemies.forEach(e => {
        if (e.dead) return;
        const dx = (e.x - this.x) * this.facing;
        if (dx > 0 && dx < 200 && Math.abs(e.y - this.y) < 70) {
          e.takeDamage(dmg, false, this.facing, game);
          e.freezeTimer = 2.8;
        }
      });
    } else if (this.skill2.id === 'sinew_slicer') {
      game.deployables.push({
        x: this.x,
        y: this.y,
        damage: dmg,
        life: 7.0,
        fireTimer: 0,
        fireRate: 0.42
      });
    }
  }

  useFlask() {
    this.flasks--;
    this.flaskCooldownTimer = 1.0;
    const healAmt = Math.round(this.maxHp * 0.65);
    this.hp = Math.min(this.maxHp, this.hp + healAmt);
    this.rallyHp = this.hp;
    window.soundEngine.playPotion();
    window.particleSystem.addDamageText(this.x, this.y - 35, healAmt, 'rally');
    window.particleSystem.addSparks(this.x, this.y - 20, '#3b9eff', 20);
  }

  takeDamage(amount, fromX = null, game = null) {
    if (this.isInvulnerable) return;

    this.hurtFlashTimer = 0.22;
    this.isInvulnerable = true;
    setTimeout(() => { this.isInvulnerable = false; }, 360);

    this.rallyHp = this.hp;
    this.rallyTimer = 2.5;
    this.hp -= amount;

    if (game) {
      game.camera.shake(14, 0.28);
      game.triggerHitStop(0.06);
    }
    window.soundEngine.playHit(false, true);
    window.particleSystem.addBloodSpurt(this.x, this.y - 25, '#ff1744', 20);
    window.particleSystem.addDamageText(this.x, this.y - 25, amount, 'player-hurt');

    if (fromX !== null) {
      this.vx = (this.x > fromX ? 1 : -1) * 280;
      this.vy = -200;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      if (game) {
        game.onPlayerDied();
      } else if (window.game) {
        window.game.onPlayerDied();
      }
    }
  }

  handleLevelCollisions(dt, level, game) {
    const ts = level.tileSize;

    this.x += this.vx * dt;
    const boxLeft = this.x - this.w / 2;
    const boxRight = this.x + this.w / 2;
    const boxTop = this.y - this.h;
    const boxBottom = this.y;

    if (level.isSolid(boxLeft, boxTop + 10) || level.isSolid(boxLeft, boxBottom - 10)) {
      this.x = Math.floor(boxLeft / ts + 1) * ts + this.w / 2;
      this.vx = 0;
      if (!this.grounded && this.vy > 0) {
        this.isWallSliding = true;
        this.wallDir = -1;
        window.particleSystem.addSparks(this.x - 14, this.y - 20, '#ff9800', 1);
      }
    } else if (level.isSolid(boxRight, boxTop + 10) || level.isSolid(boxRight, boxBottom - 10)) {
      this.x = Math.floor(boxRight / ts) * ts - this.w / 2;
      this.vx = 0;
      if (!this.grounded && this.vy > 0) {
        this.isWallSliding = true;
        this.wallDir = 1;
        window.particleSystem.addSparks(this.x + 14, this.y - 20, '#ff9800', 1);
      }
    } else {
      this.isWallSliding = false;
    }

    this.y += this.vy * dt;
    const checkB = this.y;
    const checkT = this.y - this.h;

    if (this.vy > 0) {
      if (level.isSolid(boxLeft + 4, checkB) || level.isSolid(boxRight - 4, checkB)) {
        this.y = Math.floor(checkB / ts) * ts;
        this.vy = 0;
        if (!this.grounded) {
          window.particleSystem.addDustPuff(this.x, this.y);
        }
        this.grounded = true;
        this.jumpCount = 0;
      } else {
        this.grounded = false;
      }
    } else if (this.vy < 0) {
      if (level.isSolid(boxLeft + 4, checkT) || level.isSolid(boxRight - 4, checkT)) {
        this.y = Math.floor(checkT / ts + 1) * ts + this.h;
        this.vy = 0;
      }
      this.grounded = false;
    }

    if (level.isSpike(this.x, this.y - 10)) {
      this.takeDamage(25, this.x - this.facing * 20, game);
      this.vy = -340;
    }
  }

  draw(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);

    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.hurtFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.w / 2, -this.h, this.w, this.h);
      ctx.restore();
      return;
    }

    // Render detailed stylized sprite
    window.spriteRenderer.drawPlayer(ctx, this);

    ctx.restore();
  }
}

window.Player = Player;
