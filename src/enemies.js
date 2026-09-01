// Enemies AI & Boss Encounters - High-Detail Stylized Sprite Delegation

class BaseEnemy {
  constructor(x, y, type = 'zombie') {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = 34;
    this.h = 52;
    this.type = type;
    this.facing = 1;
    this.grounded = false;

    this.maxHp = 70;
    this.hp = 70;
    this.damage = 16;
    this.speed = 130;
    this.detectionRange = 380;
    this.attackRange = 50;

    this.attackCooldown = 1.3;
    this.attackTimer = 0;
    this.isAttacking = false;
    this.windupTimer = 0;

    this.isShielded = false;
    this.freezeTimer = 0;
    this.bleedTimer = 0;
    this.bleedTicks = 0;
    this.hurtFlash = 0;
    this.animTime = Math.random() * 10;
    this.dead = false;
  }

  takeDamage(amount, isCrit = false, fromFacing = 1, game = null) {
    if (this.dead) return;

    if (this.isShielded && this.facing === -fromFacing) {
      window.soundEngine.playHit(false, true);
      window.particleSystem.addSparks(this.x, this.y - 20, '#ffd700', 14);
      window.particleSystem.addDamageText(this.x, this.y - 30, 'BLOCKED', 'normal');
      return;
    }

    this.hp -= amount;
    this.hurtFlash = 0.16;
    window.soundEngine.playHit(isCrit, false);
    window.particleSystem.addBloodSpurt(this.x, this.y - 20, '#8e24aa', isCrit ? 22 : 12);
    window.particleSystem.addDamageText(this.x, this.y - 25, amount, isCrit ? 'crit' : 'normal');

    this.vx = fromFacing * (isCrit ? 240 : 130);
    this.vy = -120;

    if (this.hp <= 0) {
      this.die(game);
    }
  }

  die(game) {
    this.dead = true;
    window.soundEngine.playEnemyDeath();
    window.particleSystem.addBloodSpurt(this.x, this.y - 20, '#8e24aa', 30);
    window.particleSystem.addSparks(this.x, this.y - 20, '#00e5ff', 16);

    const goldDrop = 15 + Math.floor(Math.random() * 25);
    const cellDrop = 1 + Math.floor(Math.random() * 3);

    if (game) {
      for (let i = 0; i < 3; i++) {
        game.drops.push(new DropEntity(this.x, this.y, 'gold', { amount: Math.ceil(goldDrop / 3) }));
      }
      for (let i = 0; i < cellDrop; i++) {
        game.drops.push(new DropEntity(this.x, this.y, 'cell', { amount: 1 }));
      }

      if (Math.random() < 0.2) {
        const weaponKeys = Object.keys(WEAPONS);
        const randomWeapon = WEAPONS[weaponKeys[Math.floor(Math.random() * weaponKeys.length)]];
        game.drops.push(new DropEntity(this.x, this.y, 'weapon', { ...randomWeapon, tier: game.currentStage }));
      }
    }
  }

  update(dt, player, level, game) {
    if (this.dead) return;
    this.animTime += dt;

    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;

    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      window.particleSystem.addFlameEmbers(this.x, this.y, '#00e5ff', 1);
      return;
    }

    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      this.bleedTicks += dt;
      if (this.bleedTicks >= 0.4) {
        this.bleedTicks = 0;
        this.hp -= 6;
        window.particleSystem.addDamageText(this.x, this.y - 20, 6, 'bleed');
        if (this.hp <= 0) this.die(game);
      }
    }

    this.behave(dt, player, level, game);

    this.vy += 1200 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const ts = level.tileSize;
    if (this.vy > 0 && level.isSolid(this.x, this.y)) {
      this.y = Math.floor(this.y / ts) * ts;
      this.vy = 0;
      this.grounded = true;
    }

    this.vx *= 0.82;
  }

  behave(dt, player, level, game) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    this.facing = player.x > this.x ? 1 : -1;

    if (dist < this.attackRange && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      this.windupTimer = 0.38;
    }

    if (this.windupTimer > 0) {
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        if (Math.hypot(player.x - this.x, player.y - this.y) < this.attackRange + 30) {
          player.takeDamage(this.damage, this.x, game);
        }
        window.soundEngine.playSlash(1);
        window.particleSystem.addSlash(this.x + this.facing * 25, this.y - 15, this.facing, '#8e24aa', 50);
      }
    } else if (dist < this.detectionRange && dist > this.attackRange - 10) {
      this.vx = this.facing * this.speed;
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);
    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.w / 2, -this.h, this.w, this.h);
      ctx.restore();
      return;
    }

    // Render detailed monster sprite
    window.spriteRenderer.drawZombie(ctx, this);

    // Health Bar
    const hpPct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-22, -this.h - 12, 44, 6);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(-22, -this.h - 12, 44 * hpPct, 6);

    ctx.restore();
  }
}

// --- Specialized Enemy Types ---

class ArcherEnemy extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'archer');
    this.maxHp = 50;
    this.hp = 50;
    this.speed = 90;
    this.attackRange = 400;
    this.attackCooldown = 2.0;
    this.w = 28;
    this.h = 50;
  }

  behave(dt, player, level, game) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    this.facing = player.x > this.x ? 1 : -1;

    if (dist < this.attackRange && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      this.windupTimer = 0.55;
    }

    if (this.windupTimer > 0) {
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        window.soundEngine.playBowShoot();
        game.projectiles.push({
          x: this.x + this.facing * 18,
          y: this.y - 22,
          vx: this.facing * 520,
          vy: 0,
          damage: 20,
          isPlayer: false,
          color: '#e040fb',
          life: 1.6
        });
      }
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);
    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.w / 2, -this.h, this.w, this.h);
      ctx.restore();
      return;
    }

    window.spriteRenderer.drawArcher(ctx, this);

    // Health Bar
    const hpPct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-20, -this.h - 12, 40, 5);
    ctx.fillStyle = '#e040fb';
    ctx.fillRect(-20, -this.h - 12, 40 * hpPct, 5);

    ctx.restore();

    // Laser Sight Line
    if (this.windupTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(224, 64, 251, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(this.x - camera.x, this.y - 22 - camera.y);
      ctx.lineTo(this.x + this.facing * 400 - camera.x, this.y - 22 - camera.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}

class ShieldEnemy extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'shield');
    this.maxHp = 100;
    this.hp = 100;
    this.isShielded = true;
    this.speed = 100;
    this.attackRange = 45;
    this.damage = 24;
    this.w = 36;
    this.h = 56;
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);
    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.w / 2, -this.h, this.w, this.h);
      ctx.restore();
      return;
    }

    window.spriteRenderer.drawShieldKnight(ctx, this);

    const hpPct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-22, -this.h - 12, 44, 6);
    ctx.fillStyle = '#039be5';
    ctx.fillRect(-22, -this.h - 12, 44 * hpPct, 6);

    ctx.restore();
  }
}

class PhaserEnemy extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'phaser');
    this.maxHp = 75;
    this.hp = 75;
    this.speed = 150;
    this.teleportTimer = 3.0;
  }

  behave(dt, player, level, game) {
    super.behave(dt, player, level, game);
    this.teleportTimer -= dt;
    if (this.teleportTimer <= 0) {
      this.teleportTimer = 3.2;
      this.x = player.x + (player.facing > 0 ? -65 : 65);
      this.y = player.y;
      window.particleSystem.addShockwave(this.x, this.y, '#b042ff', 80);
      window.soundEngine.playHit(false, true);
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);
    if (this.facing < 0) ctx.scale(-1, 1);

    window.spriteRenderer.drawPhaser(ctx, this);

    ctx.restore();
  }
}

// =========================================================================
// STAGE 3 BOSS: LORD MALAKOR, THE CURSED ALCHEMIST KING
// =========================================================================
class BossMalakor extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss');
    this.w = 58;
    this.h = 88;
    this.maxHp = 1350;
    this.hp = 1350;
    this.speed = 180;
    this.phase = 1;

    this.specialAttackTimer = 4.0;
    this.isOverdrive = false;
  }

  takeDamage(amount, isCrit = false, fromFacing = 1, game = null) {
    super.takeDamage(amount, isCrit, fromFacing, game);

    const hpPct = Math.max(0, this.hp / this.maxHp);
    const hpFill = document.getElementById('boss-hp-fill');
    if (hpFill) hpFill.style.width = (hpPct * 100) + '%';

    if (this.hp <= this.maxHp * 0.65 && this.phase === 1) {
      this.phase = 2;
      document.getElementById('boss-phase-badge').innerText = 'PHASE 2: ALCHEMICAL STORM';
      window.soundEngine.playBossRoar();
      if (game) game.camera.shake(20, 0.6);
      window.particleSystem.addShockwave(this.x, this.y, '#ff9800', 220);
    } else if (this.hp <= this.maxHp * 0.30 && this.phase === 2) {
      this.phase = 3;
      document.getElementById('boss-phase-badge').innerText = 'PHASE 3: CHAOS OVERDRIVE';
      this.isOverdrive = true;
      this.speed = 240;
      window.soundEngine.playBossRoar();
      if (game) game.camera.shake(28, 0.8);
      window.particleSystem.addShockwave(this.x, this.y, '#ff1744', 280);
    }
  }

  behave(dt, player, level, game) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    this.facing = player.x > this.x ? 1 : -1;
    this.specialAttackTimer -= dt;

    if (dist < 90 && this.attackTimer <= 0) {
      this.attackTimer = 1.5;
      this.windupTimer = 0.42;
    }

    if (this.windupTimer > 0) {
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        window.soundEngine.playSlash(3);
        window.particleSystem.addSlash(this.x + this.facing * 45, this.y - 25, this.facing, '#ff1744', 100);
        if (Math.hypot(player.x - this.x, player.y - this.y) < 120) {
          player.takeDamage(34, this.x, game);
        }
      }
    } else if (dist > 80) {
      this.vx = this.facing * this.speed;
    }

    if (this.specialAttackTimer <= 0) {
      this.specialAttackTimer = this.phase === 3 ? 2.8 : 4.5;

      if (this.phase === 1) {
        this.vy = -500;
        setTimeout(() => {
          this.vy = 850;
          window.soundEngine.playDownSmash();
          window.particleSystem.addShockwave(this.x, this.y, '#ff5722', 220);
          if (game) game.camera.shake(18, 0.45);
          if (Math.abs(player.x - this.x) < 240 && Math.abs(player.y - this.y) < 70) {
            player.takeDamage(30, this.x, game);
          }
        }, 380);
      } else if (this.phase === 2) {
        window.soundEngine.playBossRoar();
        for (let i = -2; i <= 2; i++) {
          game.projectiles.push({
            x: this.x + i * 90,
            y: this.y - 280,
            vx: 0,
            vy: 380,
            damage: 26,
            isPlayer: false,
            color: '#76ff03',
            life: 1.6
          });
        }
      } else if (this.phase === 3) {
        window.soundEngine.playBossRoar();
        if (game) game.camera.shake(22, 0.5);

        for (let a = -1.2; a <= 1.2; a += 0.4) {
          game.projectiles.push({
            x: this.x,
            y: this.y - 35,
            vx: a * 420,
            vy: -160 + Math.abs(a) * 90,
            gravity: 420,
            damage: 32,
            isPlayer: false,
            color: '#ff1744',
            life: 2.2
          });
        }
      }
    }
  }

  die(game) {
    super.die(game);
    window.soundEngine.playBossRoar();
    window.particleSystem.addShockwave(this.x, this.y, '#ffd700', 320);
    if (game) {
      game.camera.shake(32, 1.4);
      game.onBossDefeated();
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);
    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.w / 2, -this.h, this.w, this.h);
      ctx.restore();
      return;
    }

    window.spriteRenderer.drawBossMalakor(ctx, this);

    ctx.restore();
  }
}

window.BaseEnemy = BaseEnemy;
window.ArcherEnemy = ArcherEnemy;
window.ShieldEnemy = ShieldEnemy;
window.PhaserEnemy = PhaserEnemy;
window.BossMalakor = BossMalakor;
