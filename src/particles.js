// Tekken Arcade & Dead Cells Style Particle & Visual FX System

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.slashes = [];
    this.shockwaves = [];
    this.ghostTrails = [];
    this.dustPuffs = [];
    this.starbursts = [];
  }

  update(dt) {
    // 1. General particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Floating damage numbers
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.x += ft.vx * dt;
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.scale = Math.max(1, ft.scale - dt * 2.8);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 3. Slash wave arcs
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      s.progress = 1 - (s.life / s.maxLife);
      if (s.life <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // 4. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.life -= dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 5. Ghost trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const gt = this.ghostTrails[i];
      gt.alpha -= dt * 4.2;
      if (gt.alpha <= 0) {
        this.ghostTrails.splice(i, 1);
      }
    }

    // 6. Dust puffs
    for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
      const dp = this.dustPuffs[i];
      dp.x += dp.vx * dt;
      dp.y += dp.vy * dt;
      dp.size += dt * 14;
      dp.alpha -= dt * 3.0;
      if (dp.alpha <= 0) {
        this.dustPuffs.splice(i, 1);
      }
    }

    // 7. Starburst Hit Sparks (Tekken Arcade Style)
    for (let i = this.starbursts.length - 1; i >= 0; i--) {
      const sb = this.starbursts[i];
      sb.life -= dt;
      sb.scale += dt * 8;
      if (sb.life <= 0) {
        this.starbursts.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    ctx.save();

    // 1. Ghost Trails
    for (const gt of this.ghostTrails) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, gt.alpha * 0.75);
      ctx.fillStyle = gt.color || '#ff1744';
      ctx.shadowColor = gt.color || '#ff1744';
      ctx.shadowBlur = 14;
      ctx.translate(gt.x - camera.x, gt.y - camera.y);
      if (gt.facing < 0) ctx.scale(-1, 1);
      ctx.fillRect(-gt.w / 2, -gt.h, gt.w, gt.h);
      ctx.restore();
    }

    // 2. Dust Puffs
    for (const dp of this.dustPuffs) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, dp.alpha * 0.6);
      ctx.fillStyle = dp.color || '#a8a29e';
      ctx.beginPath();
      ctx.arc(dp.x - camera.x, dp.y - camera.y, dp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Slashes (Thick High-Contrast Blade Arcs with Core Energy)
    for (const s of this.slashes) {
      ctx.save();
      ctx.translate(s.x - camera.x, s.y - camera.y);
      ctx.rotate(s.angle);
      const alpha = Math.max(0, 1 - s.progress);

      // Outer Neon Trail
      ctx.strokeStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 22;
      ctx.lineWidth = s.width * (1.3 - s.progress * 0.5);
      ctx.globalAlpha = alpha * 0.95;
      ctx.beginPath();
      if (s.isSpin) {
        ctx.arc(0, 0, s.radius * (0.8 + s.progress * 0.4), 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, s.radius * (0.8 + s.progress * 0.35), -1.0, 1.0);
      }
      ctx.stroke();

      // Sharp White Core Light
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, s.width * 0.4);
      ctx.beginPath();
      if (s.isSpin) {
        ctx.arc(0, 0, s.radius * (0.8 + s.progress * 0.4), 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, s.radius * (0.8 + s.progress * 0.35), -0.8, 0.8);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. 3D Perspective Ground Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.strokeStyle = sw.color;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 6 * alpha;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(sw.x - camera.x, sw.y - camera.y, sw.radius, sw.radius * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner White Ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * alpha;
      ctx.beginPath();
      ctx.ellipse(sw.x - camera.x, sw.y - camera.y, sw.radius * 0.65, sw.radius * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Tekken Arcade Starburst Hit Sparks
    for (const sb of this.starbursts) {
      ctx.save();
      const alpha = Math.max(0, sb.life / sb.maxLife);
      ctx.translate(sb.x - camera.x, sb.y - camera.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sb.color || '#fbbf24';
      ctx.shadowColor = sb.color || '#fbbf24';
      ctx.shadowBlur = 16;

      // 8-Pointed Sharp Starburst
      const rOuter = 24 * sb.scale;
      const rInner = 6 * sb.scale;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI / 4);
        ctx.lineTo(Math.cos(a) * rOuter, Math.sin(a) * rOuter);
        const a2 = a + (Math.PI / 8);
        ctx.lineTo(Math.cos(a2) * rInner, Math.sin(a2) * rInner);
      }
      ctx.closePath();
      ctx.fill();

      // Bright white center core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 5 * sb.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Rich Particle Sprites (Blood Splatters, Plasma Sparks)
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.glow ? p.color : 'transparent';
      ctx.shadowBlur = p.glow ? 10 : 0;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      const x = Math.round(p.x - camera.x);
      const y = Math.round(p.y - camera.y);

      if (p.shape === 'spark') {
        // Cross Spark
        ctx.fillRect(x - p.size, y - 1, p.size * 2, 2);
        ctx.fillRect(x - 1, y - p.size, 2, p.size * 2);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    // 7. Floating Damage Numbers (Arcade Pop Style)
    for (const ft of this.floatingTexts) {
      ctx.save();
      const fontSize = Math.round(ft.size * ft.scale);
      ctx.font = `900 ${fontSize}px 'Rajdhani', sans-serif`;
      ctx.textAlign = 'center';
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;

      const px = Math.round(ft.x - camera.x);
      const py = Math.round(ft.y - camera.y);

      // Deep Double Outline for maximum arcade readability
      ctx.fillStyle = '#000000';
      for (let ox = -3; ox <= 3; ox += 3) {
        for (let oy = -3; oy <= 3; oy += 3) {
          ctx.fillText(ft.text, px + ox, py + oy);
        }
      }

      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.fillText(ft.text, px, py);
      ctx.restore();
    }

    ctx.restore();
  }

  // --- Spawners ---

  addStarburst(x, y, color = '#fbbf24') {
    this.starbursts.push({
      x: x,
      y: y,
      scale: 0.6,
      color: color,
      life: 0.18,
      maxLife: 0.18
    });
  }

  addBloodSpurt(x, y, color = '#dc2626', count = 24) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 90 + Math.random() * 260;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90,
        gravity: 460,
        size: 3.0 + Math.random() * 3.5,
        color: Math.random() > 0.3 ? color : '#7f1d1d',
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        shape: 'rect',
        glow: false
      });
    }
  }

  addFlameEmbers(x, y, color = '#f97316', count = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 40,
        vy: -55 - Math.random() * 65,
        gravity: -15,
        size: 2.5 + Math.random() * 3,
        color: Math.random() > 0.4 ? color : (Math.random() > 0.5 ? '#fbbf24' : '#fef08a'),
        life: 0.38 + Math.random() * 0.25,
        maxLife: 0.65,
        shape: 'circle',
        glow: true
      });
    }
  }

  addSparks(x, y, color = '#fbbf24', count = 16) {
    this.addStarburst(x, y, color);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 280;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 280,
        size: 3.5 + Math.random() * 3,
        color: color,
        life: 0.28 + Math.random() * 0.2,
        maxLife: 0.48,
        shape: 'spark',
        glow: true
      });
    }
  }

  addDustPuff(x, y, color = '#78716c') {
    for (let i = 0; i < 3; i++) {
      this.dustPuffs.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y,
        vx: (Math.random() - 0.5) * 45,
        vy: -18 - Math.random() * 30,
        size: 5 + Math.random() * 5,
        color: color,
        alpha: 0.85
      });
    }
  }

  addShockwave(x, y, color = '#ef4444', maxRadius = 150) {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 8,
      speed: 380,
      color: color,
      life: 0.42,
      maxLife: 0.42
    });
  }

  addSlash(x, y, facing = 1, color = '#ef4444', radius = 70, isSpin = false) {
    this.slashes.push({
      x: x,
      y: y,
      angle: facing > 0 ? 0 : Math.PI,
      radius: radius,
      width: 16,
      color: color,
      life: 0.18,
      maxLife: 0.18,
      progress: 0,
      isSpin: isSpin
    });
  }

  addGhostTrail(x, y, w, h, facing, color = '#ff1744') {
    this.ghostTrails.push({
      x: x,
      y: y,
      w: w,
      h: h,
      facing: facing,
      color: color,
      alpha: 1.0
    });
  }

  addDamageText(x, y, text, type = 'normal') {
    let color = '#ffffff';
    let size = 22;
    let scale = 1.5;

    if (type === 'crit') {
      color = '#fbbf24';
      size = 30;
      scale = 2.0;
      text = text + ' CRIT!';
    } else if (type === 'rally') {
      color = '#38bdf8';
      size = 22;
      text = '+' + text;
    } else if (type === 'bleed') {
      color = '#ef4444';
      size = 20;
      text = text + '🩸';
    } else if (type === 'frost') {
      color = '#38bdf8';
      size = 22;
      text = text + '❄️';
    } else if (type === 'player-hurt') {
      color = '#dc2626';
      size = 26;
      scale = 1.7;
    }

    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 26,
      y: y - 14,
      vx: (Math.random() - 0.5) * 55,
      vy: -85 - Math.random() * 45,
      text: text.toString(),
      color: color,
      size: size,
      scale: scale,
      life: 0.8,
      maxLife: 0.8
    });
  }
}

window.particleSystem = new ParticleSystem();
