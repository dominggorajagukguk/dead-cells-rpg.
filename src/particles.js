// ============================================================
// DEAD CELLS HD PARTICLE & VFX SYSTEM
// Fluid physics, blood splatters, dynamic sparks, and hit effects.
// ============================================================

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.slashes = [];
    this.shockwaves = [];
    this.ghostTrails = [];
    this.dustPuffs = [];
    this.starbursts = [];
    this.fissures = [];
    this.weaponTrails = [];
  }

  update(dt) {
    // 1. General particles (with Physics & Floor Bouncing)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      if (p.gravity) p.vy += p.gravity * dt;
      
      // Fake floor collision for fluid/debris
      if (p.floorY && p.y > p.floorY) {
        p.y = p.floorY;
        p.vy = -p.vy * p.bounce;
        p.vx *= 0.6; // friction
      }

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
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // 3. Slash wave arcs
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      s.progress = 1 - (s.life / s.maxLife);
      if (s.life <= 0) this.slashes.splice(i, 1);
    }

    // 4. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.life -= dt;
      if (sw.life <= 0) this.shockwaves.splice(i, 1);
    }

    // 5. Ghost trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const gt = this.ghostTrails[i];
      gt.alpha -= dt * 4.2;
      if (gt.alpha <= 0) this.ghostTrails.splice(i, 1);
    }

    // 6. Dust puffs
    for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
      const dp = this.dustPuffs[i];
      dp.x += dp.vx * dt;
      dp.y += dp.vy * dt;
      dp.size += dt * 14;
      dp.alpha -= dt * 3.0;
      if (dp.alpha <= 0) this.dustPuffs.splice(i, 1);
    }

    // 7. Starburst Hit Sparks
    for (let i = this.starbursts.length - 1; i >= 0; i--) {
      const sb = this.starbursts[i];
      sb.life -= dt;
      sb.scale += dt * 8;
      if (sb.life <= 0) this.starbursts.splice(i, 1);
    }

    // 8. Ground Fissure Cracks
    for (let i = this.fissures.length - 1; i >= 0; i--) {
      const f = this.fissures[i];
      f.life -= dt;
      if (f.life <= 0) this.fissures.splice(i, 1);
    }
  }

  draw(ctx, camera) {
    ctx.save();

    // Ground Fissures (Behind entities & particles)
    for (const f of this.fissures) {
      this._drawGroundFissure(ctx, f, camera);
    }

    // Ghost Trails
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

    // Dust Puffs
    for (const dp of this.dustPuffs) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, dp.alpha * 0.6);
      ctx.fillStyle = dp.color || '#a8a29e';
      ctx.beginPath();
      ctx.arc(dp.x - camera.x, dp.y - camera.y, dp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Cinematic Slashes & Blade Ribbons
    for (const s of this.slashes) {
      this._drawCinematicSlash(ctx, s, camera);
    }

    // Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = sw.color;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 6 * alpha;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(sw.x - camera.x, sw.y - camera.y, sw.radius, sw.radius * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Starbursts
    for (const sb of this.starbursts) {
      ctx.save();
      const alpha = Math.max(0, sb.life / sb.maxLife);
      ctx.translate(sb.x - camera.x, sb.y - camera.y);
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = sb.color || '#fbbf24';
      ctx.shadowColor = sb.color || '#fbbf24';
      ctx.shadowBlur = 20;

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

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 5 * sb.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Rich Particles (Blood, Sparks)
    for (const p of this.particles) {
      ctx.save();
      ctx.globalCompositeOperation = p.glow ? 'lighter' : 'source-over';
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.glow ? p.color : 'transparent';
      ctx.shadowBlur = p.glow ? 15 : 0;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      const x = Math.round(p.x - camera.x);
      const y = Math.round(p.y - camera.y);

      if (p.shape === 'spark') {
        // Stretched motion blur spark based on velocity
        const speed = Math.hypot(p.vx, p.vy);
        const angle = Math.atan2(p.vy, p.vx);
        ctx.translate(x, y);
        ctx.rotate(angle);
        const len = Math.max(4, speed * 0.05);
        ctx.fillRect(-len/2, -1, len, 2);
      } else if (p.shape === 'circle') {
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    // Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      const fontSize = Math.round(ft.size * ft.scale);
      ctx.font = `900 ${fontSize}px 'Rajdhani', 'Impact', sans-serif`;
      ctx.textAlign = 'center';
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;

      const px = Math.round(ft.x - camera.x);
      const py = Math.round(ft.y - camera.y);

      ctx.fillStyle = '#000000';
      for (let ox = -3; ox <= 3; ox += 3) {
        for (let oy = -3; oy <= 3; oy += 3) {
          ctx.fillText(ft.text, px + ox, py + oy);
        }
      }

      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 15;
      ctx.fillText(ft.text, px, py);
      ctx.restore();
    }

    ctx.restore();
  }

  // --- Spawners ---

  addStarburst(x, y, color = '#fbbf24') {
    this.starbursts.push({
      x: x, y: y, scale: 0.6, color: color, life: 0.18, maxLife: 0.18
    });
  }

  addBloodSpurt(x, y, color = '#dc2626', count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 100 + Math.random() * 300;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        gravity: 800,
        floorY: y + 20 + Math.random()*20, // Bounce physics
        bounce: 0.3 + Math.random()*0.2,
        size: 2.0 + Math.random() * 4.0,
        color: Math.random() > 0.4 ? color : '#7f1d1d', // mixed dark/bright blood
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
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
        gravity: -20, // Float up
        size: 2.5 + Math.random() * 3,
        color: Math.random() > 0.4 ? color : '#fbbf24',
        life: 0.38 + Math.random() * 0.25,
        maxLife: 0.65,
        shape: 'circle',
        glow: true
      });
    }
  }

  addSparks(x, y, color = '#fbbf24', count = 20) {
    this.addStarburst(x, y, color);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 400;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 400,
        floorY: y + 10 + Math.random()*30,
        bounce: 0.5,
        size: 3,
        color: color,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        shape: 'spark',
        glow: true
      });
    }
  }

  addDustPuff(x, y, color = '#78716c') {
    for (let i = 0; i < 4; i++) {
      this.dustPuffs.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: (Math.random() - 0.5) * 50,
        vy: -20 - Math.random() * 30,
        size: 6 + Math.random() * 6,
        color: color,
        alpha: 0.85
      });
    }
  }

  addShockwave(x, y, color = '#ef4444', maxRadius = 150) {
    this.shockwaves.push({
      x: x, y: y, radius: 10, speed: 450, color: color, life: 0.35, maxLife: 0.35
    });
  }

  addSlash(x, y, facing = 1, color = '#ef4444', radius = 80, isSpin = false, slashType = 'horizontal', comboStep = 1) {
    const sType = isSpin ? 'spin' : slashType || (comboStep === 2 ? 'uppercut' : comboStep === 3 ? 'slam' : 'horizontal');
    this.slashes.push({
      x: x, y: y, facing: facing, color: color, radius: radius,
      width: 28, life: 0.18, maxLife: 0.18, progress: 0,
      isSpin: isSpin, slashType: sType, comboStep: comboStep
    });

    // Tangential cutting sparks
    const sparkCount = comboStep === 3 ? 24 : 14;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (facing > 0 ? -0.3 : Math.PI - 0.3) + (Math.random() - 0.5) * 1.1;
      const speed = 180 + Math.random() * 280;
      this.particles.push({
        x: x + facing * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 300,
        size: 2.5,
        color: Math.random() > 0.3 ? color : '#ffffff',
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        shape: 'spark',
        glow: true
      });
    }

    // If combo 3 (or slam), trigger ground crater impact
    if (comboStep === 3 || sType === 'slam') {
      this.addGroundCrater(x, y + 20, facing, color, radius * 1.2);
    }
  }

  addGroundCrater(x, y, facing = 1, color = '#ff1744', length = 110) {
    const points = [];
    let curX = 0;
    let curY = 0;
    const segs = 6;
    for (let i = 1; i <= segs; i++) {
      curX += (length / segs) * (0.8 + Math.random() * 0.4);
      curY = (Math.random() - 0.5) * 6;
      points.push({ dx: curX, dy: curY });
    }

    this.fissures.push({
      x: x, y: y, facing: facing, color: color, points: points, life: 0.45, maxLife: 0.45
    });

    this.addShockwave(x + facing * 40, y, color, 140);
    for (let i = 0; i < 14; i++) {
      const angle = (facing > 0 ? -Math.PI * 0.7 : -Math.PI * 0.3) + (Math.random() - 0.5) * 1.2;
      const spd = 160 + Math.random() * 260;
      this.particles.push({
        x: x + facing * (Math.random() * 50),
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 900,
        floorY: y + 2,
        bounce: 0.35,
        size: 3.5 + Math.random() * 4,
        color: Math.random() > 0.4 ? '#475569' : '#1e293b',
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        shape: 'rect',
        glow: false
      });
    }

    this.addSparks(x + facing * 35, y - 5, color, 18);
  }

  _drawCinematicSlash(ctx, s, camera) {
    const rx = s.x - camera.x;
    const ry = s.y - camera.y;
    const alpha = Math.max(0, 1 - s.progress);
    const expand = 0.8 + s.progress * 0.45;
    const r = s.radius * expand;

    ctx.save();
    ctx.translate(rx, ry);
    if (s.facing < 0) ctx.scale(-1, 1);
    ctx.globalCompositeOperation = 'lighter';

    const color = s.color || '#ff1744';

    if (s.slashType === 'spin' || s.isSpin) {
      // 360-degree Whirlwind Dual Crescent Vortex
      ctx.rotate(s.progress * Math.PI * 1.5);
      
      for (let i = 0; i < 2; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI);
        
        const ribbonGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r);
        ribbonGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        ribbonGrad.addColorStop(0.5, color);
        ribbonGrad.addColorStop(0.9, '#ffffff');
        ribbonGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = ribbonGrad;
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.arc(0, 0, r, -0.4, 1.8);
        ctx.arc(0, 0, r * 0.65, 1.8, -0.4, true);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * alpha;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.95, -0.3, 1.6);
        ctx.stroke();

        ctx.restore();
      }

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.2 * (1 - s.progress), 0, Math.PI * 2);
      ctx.fill();

    } else if (s.slashType === 'uppercut' || s.comboStep === 2) {
      // ── COMBO 2: RISING CRESCENT UPPERCUT ──
      ctx.rotate(-0.35 + s.progress * 0.4);

      const slashG = ctx.createLinearGradient(0, r * 0.6, r * 0.9, -r * 1.1);
      slashG.addColorStop(0, color);
      slashG.addColorStop(0.5, '#ffffff');
      slashG.addColorStop(1, color);

      ctx.fillStyle = slashG;
      ctx.globalAlpha = alpha * 0.75;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(-10, r * 0.4);
      ctx.quadraticCurveTo(r * 0.9, r * 0.2, r * 0.7, -r * 0.95);
      ctx.lineTo(r * 0.55, -r * 1.1);
      ctx.quadraticCurveTo(r * 0.4, -r * 0.1, 0, r * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 * alpha;
      ctx.beginPath();
      ctx.moveTo(5, r * 0.3);
      ctx.quadraticCurveTo(r * 0.75, r * 0.15, r * 0.6, -r * 1.0);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = alpha * 0.5;
      for (let sl = 0; sl < 3; sl++) {
        const off = sl * 14;
        ctx.beginPath();
        ctx.moveTo(off, r * 0.45);
        ctx.quadraticCurveTo(r * 0.6 + off * 0.5, -r * 0.2, r * 0.45 + off, -r * 0.85);
        ctx.stroke();
      }

    } else if (s.slashType === 'slam' || s.comboStep === 3) {
      // ── COMBO 3: HEAVY OVERHEAD EXECUTION SLAM ──
      ctx.rotate(0.25 - s.progress * 0.3);

      const slamG = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.2);
      slamG.addColorStop(0, '#ffffff');
      slamG.addColorStop(0.4, color);
      slamG.addColorStop(0.8, '#fbbf24');
      slamG.addColorStop(1, 'transparent');

      ctx.fillStyle = slamG;
      ctx.globalAlpha = alpha * 0.8;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(-15, -r * 0.95);
      ctx.bezierCurveTo(r * 0.8, -r * 0.75, r * 1.25, -r * 0.1, r * 0.85, r * 0.6);
      ctx.lineTo(r * 0.65, r * 0.7);
      ctx.bezierCurveTo(r * 0.7, 0, r * 0.3, -r * 0.4, 0, -r * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5 * alpha;
      ctx.beginPath();
      ctx.moveTo(-5, -r * 0.9);
      ctx.quadraticCurveTo(r * 1.0, -r * 0.3, r * 0.75, r * 0.65);
      ctx.stroke();

      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = alpha * 0.6;
      for (let i = -1; i <= 1; i++) {
        const ang = i * 0.2;
        ctx.beginPath();
        ctx.moveTo(r * 0.4, r * 0.3);
        ctx.lineTo(r * 0.4 + Math.cos(ang) * (r * 0.5), r * 0.3 + Math.sin(ang) * (r * 0.35));
        ctx.stroke();
      }

    } else {
      // ── COMBO 1: SWIFT HORIZONTAL RAZOR CLEAVE ──
      ctx.rotate(-0.15 + s.progress * 0.3);

      const horizG = ctx.createLinearGradient(0, -r * 0.3, r * 1.2, 0);
      horizG.addColorStop(0, 'rgba(255,255,255,0.1)');
      horizG.addColorStop(0.3, color);
      horizG.addColorStop(0.8, '#ffffff');
      horizG.addColorStop(1, color);

      ctx.fillStyle = horizG;
      ctx.globalAlpha = alpha * 0.75;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(-10, -r * 0.4);
      ctx.quadraticCurveTo(r * 0.6, -r * 0.35, r * 1.25, -r * 0.05);
      ctx.lineTo(r * 1.15, 0.1);
      ctx.quadraticCurveTo(r * 0.5, r * 0.2, 0, r * 0.35);
      ctx.quadraticCurveTo(r * 0.3, 0, -10, -r * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 * alpha;
      ctx.beginPath();
      ctx.moveTo(-5, -r * 0.35);
      ctx.quadraticCurveTo(r * 0.6, -r * 0.3, r * 1.2, 0);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = alpha * 0.5;
      for (let i = 0; i < 3; i++) {
        const oy = -r * 0.25 + i * (r * 0.2);
        ctx.beginPath();
        ctx.moveTo(r * 0.2, oy);
        ctx.lineTo(r * 0.8 + i * 6, oy + (i - 1) * 4);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  _drawGroundFissure(ctx, f, camera) {
    const rx = f.x - camera.x;
    const ry = f.y - camera.y;
    const alpha = Math.max(0, f.life / f.maxLife);

    ctx.save();
    ctx.translate(rx, ry);
    if (f.facing < 0) ctx.scale(-1, 1);

    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = f.color || '#ff1744';
    ctx.shadowBlur = 18;

    ctx.strokeStyle = f.color || '#ff1744';
    ctx.lineWidth = 3 * alpha;
    ctx.globalAlpha = alpha * 0.85;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (const pt of f.points) {
      ctx.lineTo(pt.dx, pt.dy);
    }
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * alpha;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (const pt of f.points) {
      ctx.lineTo(pt.dx * 0.8, pt.dy);
    }
    ctx.stroke();

    ctx.restore();
  }

  addGhostTrail(x, y, w, h, facing, color = '#ff1744') {
    this.ghostTrails.push({ x: x, y: y, w: w, h: h, facing: facing, color: color, alpha: 1.0 });
  }

  addDamageText(x, y, text, type = 'normal') {
    let color = '#ffffff';
    let size = 22;
    let scale = 1.5;

    if (type === 'crit') {
      color = '#fbbf24'; size = 30; scale = 2.0; text = text + ' CRIT!';
    } else if (type === 'rally') {
      color = '#38bdf8'; size = 22; text = '+' + text;
    } else if (type === 'bleed') {
      color = '#ef4444'; size = 20; text = text + '🩸';
    } else if (type === 'frost') {
      color = '#38bdf8'; size = 22; text = text + '❄️';
    } else if (type === 'player-hurt') {
      color = '#dc2626'; size = 26; scale = 1.7;
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
