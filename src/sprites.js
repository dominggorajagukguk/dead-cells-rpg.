// ============================================================
// DEAD CELLS HD PROCEDURAL SPRITE RENDERER (V2 PROFESSIONAL)
// State-of-the-art procedural skeletal animation, organic cloth
// physics, dynamic flame shaders, and grotesque enemy designs.
// ============================================================

class SpriteRenderer {
  constructor() {
    this.frameTime = 0;
  }

  // ── Skeletal Animation Helpers ─────────────────────────────
  
  drawSegment(ctx, x1, y1, x2, y2, width, color1, color2, highlight) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len <= 0) return;
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    
    // Base gradient for 3D volume
    if (typeof color1 === 'string') {
      const g = ctx.createLinearGradient(0, -width / 2, 0, width / 2);
      g.addColorStop(0, typeof highlight === 'string' ? highlight : color1);
      g.addColorStop(0.35, color1);
      g.addColorStop(1, typeof color2 === 'string' ? color2 : color1);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = color1;
    }
    
    const r = Math.min(width / 2, len / 2);
    ctx.beginPath();
    ctx.arc(r, 0, r, Math.PI / 2, -Math.PI / 2);
    ctx.arc(len - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    
    // Specular center ridge
    ctx.strokeStyle = highlight || 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r + 2, -width * 0.15);
    ctx.lineTo(len - r - 2, -width * 0.15);
    ctx.stroke();

    // Shadow contour line
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r + 2, width * 0.25);
    ctx.lineTo(len - r - 2, width * 0.25);
    ctx.stroke();
    
    ctx.restore();
  }

  drawDropShadow(ctx, x, y, width, alpha = 0.65) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, width);
    g.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    g.addColorStop(0.5, `rgba(0, 0, 0, ${alpha * 0.45})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, width, width * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── 1. THE BEHEADED (PRISONER) ─────────────────────────────
  
  drawPrisoner(ctx, t, hurtFlash, player) {
    this.drawPlayer(ctx, player || window.game.player);
  }

  drawPlayer(ctx, player) {
    if (!player) return;
    const t = player.animTime || 0;
    const atk = player.isAttacking || (player.attackTimer > 0);
    const combo = player.comboStep || 1;
    const ap = player.attackProgress || 0;
    const grounded = player.grounded;
    const rolling = player.isRolling || (player.rollTimer > 0);
    const downSmash = player.isDownSmashing;
    const vx = player.vx || 0;
    const vy = player.vy || 0;
    const h = player.h || 40;

    // Realistic ground shadow
    if (grounded) {
      this.drawDropShadow(ctx, 0, 0, 24, 0.85);
    } else {
      const heightOff = Math.min(60, Math.abs(vy) * 0.05);
      this.drawDropShadow(ctx, 0, 15 + heightOff, 20, Math.max(0.15, 0.75 - Math.abs(vy) / 1100));
    }

    ctx.save();
    
    if (rolling) {
      this._drawPrisonerRoll(ctx, t, h);
    } else if (downSmash) {
      this._drawPrisonerDownSmash(ctx, t, h);
    } else if (atk) {
      this._drawPrisonerAttack(ctx, t, h, combo, ap, vx);
    } else if (!grounded) {
      this._drawPrisonerAir(ctx, t, h, vy);
    } else if (Math.abs(vx) > 30) {
      this._drawPrisonerRun(ctx, t, h, vx);
    } else {
      this._drawPrisonerIdle(ctx, t, h);
    }
    ctx.restore();
  }

  // ── Poses: Idle, Run, Air, Attacks ──────────────────────────
  
  _drawPrisonerIdle(ctx, t, h) {
    // Breathing physics: smooth non-linear chest expansion & pelvis sway
    const breathe = Math.sin(t * 3.2);
    const bob = Math.abs(breathe) * 1.8;
    const chestExpand = breathe * 1.2;
    
    // Legs: grounded combat-ready stance
    this._drawLeg(ctx, -7, -32 + bob * 0.4, -5, 0, 10, 14, false); // Back leg
    this._drawLeg(ctx,  8, -32 + bob * 0.4,  7, 0, 10, 14, true);  // Front leg

    // Scarf / Cape (3-layer flowing rags)
    this._drawScarf(ctx, -4, -h + 16 + breathe, t, 0);

    // Back Arm (relaxed behind)
    this._drawBackArm(ctx, -12, -h + 22 + breathe, -6, 12, -2, 10);

    // Torso with layered cuirass & chainmail
    this._drawPrisonerTorso(ctx, 0, breathe, h, chestExpand);
    
    // Head: Organic Emerald Flame with Cyclops Eye
    this._drawPrisonerHead(ctx, 4, -h + 10 + breathe, t, false);

    // Front Arm & Resting Runed Weapon
    this._drawFrontArm(ctx, 8, -h + 18 + breathe, 4, 12, 16, 12, t);
    
    // Scarf Front Knot
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(2, -h + 17 + breathe, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _drawPrisonerRun(ctx, t, h, vx) {
    const runCycle = t * 19;
    const legSwing = Math.sin(runCycle);
    const bob = Math.abs(Math.sin(runCycle * 2)) * -5;
    const lean = 14; // Dynamic forward torso lean
    
    // Alternating leg stride with foot roll
    const backLegLift = Math.max(0, -legSwing * 12);
    const frontLegLift = Math.max(0, legSwing * 12);
    this._drawLeg(ctx, -6, -32 + bob, -6 + legSwing * 17, -14 + backLegLift, 17 + legSwing * 19, 14, false);
    this._drawLeg(ctx,  6, -32 + bob,  6 - legSwing * 17, -14 + frontLegLift, 17 - legSwing * 19, 14, true);

    // Scarf whips violently backwards with speed
    this._drawScarf(ctx, -10, -h + 16 + bob, t, 1.4);

    // Back Arm counter-swings with athletic momentum
    this._drawBackArm(ctx, -12 + lean, -h + 22 + bob, -12 - legSwing * 16, 8, -8 - legSwing * 22, 4);
    
    // Torso leans forward into the sprint
    ctx.save();
    ctx.translate(lean, bob);
    ctx.rotate(0.24); // Forward lean angle
    this._drawPrisonerTorso(ctx, 0, 0, h, 0);
    ctx.restore();

    // Head stays focused forward with trailing flame
    this._drawPrisonerHead(ctx, lean + 6, -h + 12 + bob, t, true);

    // Front Arm holding weapon at the ready during sprint
    const armX = lean + 6;
    const armY = -h + 18 + bob;
    this._drawFrontArm(ctx, armX, armY, armX + 8, armY + 12, armX + 22, armY + 8, t);
  }

  _drawPrisonerAir(ctx, t, h, vy) {
    const tuck = Math.min(1, Math.max(0, vy / 850 + 0.5));
    const stretch = 1 - tuck;

    // Legs tucked during ascent, extending during descent
    this._drawLeg(ctx, -6, -28 - stretch * 7, -8 - stretch * 9, -10 - tuck * 9, -6, 14 - stretch * 8, false);
    this._drawLeg(ctx,  6, -30 - stretch * 7,  8 + stretch * 9, -8 - tuck * 9,  6, 16 - stretch * 8, true);

    // Cape bills upward against the air resistance
    this._drawScarf(ctx, -6, -h + 12, t, -vy / 800);

    // Torso slightly arched
    ctx.save();
    ctx.rotate(-0.16 + tuck * 0.35);
    this._drawPrisonerTorso(ctx, 0, 0, h, 0);
    ctx.restore();

    this._drawPrisonerHead(ctx, 4, -h + 8, t, false);

    // Arms floating up for balance
    this._drawFrontArm(ctx, 6, -h + 16, -4, -h - 6, 12, -h - 12, t);
  }

  // ── 3-HIT COMBO ATTACK ANIMATIONS ───────────────────────────
  
  _drawPrisonerAttack(ctx, t, h, combo, ap, vx) {
    if (combo === 2) {
      this._drawPrisonerAttack2(ctx, t, h, ap);
    } else if (combo === 3) {
      this._drawPrisonerAttack3(ctx, t, h, ap);
    } else {
      this._drawPrisonerAttack1(ctx, t, h, ap);
    }
  }

  // Combo 1: Swift Forward Horizontal Razor Cleave
  _drawPrisonerAttack1(ctx, t, h, ap) {
    let lunge, armAngle, torsoRot, dip;

    if (ap < 0.25) {
      // Phase 1: Anticipation (coiling back)
      const p = ap / 0.25;
      lunge = -4 * p;
      dip = 3 * p;
      torsoRot = -0.15 * p;
      armAngle = -Math.PI * 0.7 - p * 0.2;
    } else if (ap < 0.65) {
      // Phase 2: Explosive Forward Strike
      const p = (ap - 0.25) / 0.4;
      lunge = -4 + p * 24;
      dip = 3 - p * 2;
      torsoRot = -0.15 + p * 0.45;
      armAngle = -Math.PI * 0.9 + p * Math.PI * 1.35;
    } else {
      // Phase 3: Follow-through Settle
      const p = (ap - 0.65) / 0.35;
      lunge = 20 - p * 4;
      dip = 1 + p * 1;
      torsoRot = 0.3 - p * 0.15;
      armAngle = 0.45 + p * 0.2;
    }

    // Dynamic wide leg stance
    this._drawLeg(ctx, -10, -32 + dip, -14, 0, -18, 14, false);
    this._drawLeg(ctx,   8 + lunge * 0.7, -32 + dip, 14 + lunge, 0, 20 + lunge, 14, true);

    // Scarf whips backwards with speed
    this._drawScarf(ctx, -4 + lunge * 0.5, -h + 16 + dip, t, 1.6);

    ctx.save();
    ctx.translate(lunge, dip);
    ctx.rotate(torsoRot);
    this._drawPrisonerTorso(ctx, 0, 0, h, 0);
    ctx.restore();

    this._drawPrisonerHead(ctx, lunge + 6, -h + 12 + dip, t, true);

    // Sweeping Arm & Weapon
    const shoulderX = lunge + 6;
    const shoulderY = -h + 16 + dip;
    const elbowX = shoulderX + Math.cos(armAngle - 0.4) * 15;
    const elbowY = shoulderY + Math.sin(armAngle - 0.4) * 15;
    const handX = elbowX + Math.cos(armAngle) * 15;
    const handY = elbowY + Math.sin(armAngle) * 15;

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(armAngle + Math.PI * 0.3);
    this._drawDeadCellsWeapon(ctx);
    ctx.restore();

    this.drawSegment(ctx, shoulderX, shoulderY, elbowX, elbowY, 8, '#475569', '#1e293b', '#64748b');
    this.drawSegment(ctx, elbowX, elbowY, handX, handY, 7, '#5c3d1a', '#291706', '#92400e');
  }

  // Combo 2: Rising Crescent Uppercut
  _drawPrisonerAttack2(ctx, t, h, ap) {
    let lunge, armAngle, torsoRot, riseY;

    if (ap < 0.25) {
      // Phase 1: Deep crouch pivot
      const p = ap / 0.25;
      lunge = p * 6;
      riseY = p * 5; // Crouch low
      torsoRot = 0.1 * p;
      armAngle = Math.PI * 0.35 + p * 0.1; // Sword down at floor
    } else if (ap < 0.65) {
      // Phase 2: Soaring Uppercut Ascension
      const p = (ap - 0.25) / 0.4;
      lunge = 6 + p * 16;
      riseY = 5 - p * 12; // Body extends upwards!
      torsoRot = 0.1 - p * 0.35; // Arching back
      armAngle = Math.PI * 0.45 - p * Math.PI * 1.5; // Floor to high overhead
    } else {
      // Phase 3: High Apex Hold
      const p = (ap - 0.65) / 0.35;
      lunge = 22 - p * 3;
      riseY = -7 + p * 5;
      torsoRot = -0.25 + p * 0.15;
      armAngle = -Math.PI * 1.05 + p * 0.25;
    }

    // Grounded extension stance
    this._drawLeg(ctx, -8, -32 + riseY, -10, 0, -14, 14, false);
    this._drawLeg(ctx, 10 + lunge * 0.6, -32 + riseY, 16 + lunge, 0, 22 + lunge, 14, true);

    this._drawScarf(ctx, -2 + lunge * 0.4, -h + 16 + riseY, t, -0.6);

    ctx.save();
    ctx.translate(lunge, riseY);
    ctx.rotate(torsoRot);
    this._drawPrisonerTorso(ctx, 0, 0, h, 0);
    ctx.restore();

    this._drawPrisonerHead(ctx, lunge + 5, -h + 12 + riseY, t, true);

    const shoulderX = lunge + 6;
    const shoulderY = -h + 16 + riseY;
    const elbowX = shoulderX + Math.cos(armAngle - 0.3) * 15;
    const elbowY = shoulderY + Math.sin(armAngle - 0.3) * 15;
    const handX = elbowX + Math.cos(armAngle) * 15;
    const handY = elbowY + Math.sin(armAngle) * 15;

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(armAngle + Math.PI * 0.25);
    this._drawDeadCellsWeapon(ctx);
    ctx.restore();

    this.drawSegment(ctx, shoulderX, shoulderY, elbowX, elbowY, 8, '#475569', '#1e293b', '#64748b');
    this.drawSegment(ctx, elbowX, elbowY, handX, handY, 7, '#5c3d1a', '#291706', '#92400e');
  }

  // Combo 3: Devastating Leaping Overhead Execution Slam
  _drawPrisonerAttack3(ctx, t, h, ap) {
    let lunge, armAngle, torsoRot, jumpY;

    if (ap < 0.3) {
      // Phase 1: Spring leap & raise two-handed sword overhead
      const p = ap / 0.3;
      lunge = p * 12;
      jumpY = -12 * Math.sin(p * Math.PI * 0.5);
      torsoRot = -0.22 * p;
      armAngle = -Math.PI * 0.5 - p * Math.PI * 0.4; // Straight overhead
    } else if (ap < 0.65) {
      // Phase 2: Brutal downward slam into earth
      const p = (ap - 0.3) / 0.35;
      lunge = 12 + p * 18;
      jumpY = -12 * (1 - p) + p * 6; // Crashes down
      torsoRot = -0.22 + p * 0.65; // Heavy forward smash
      armAngle = -Math.PI * 0.9 + p * Math.PI * 1.35; // Downward strike
    } else {
      // Phase 3: Cratering impact stance
      const p = (ap - 0.65) / 0.35;
      lunge = 30 - p * 2;
      jumpY = 6 - p * 2;
      torsoRot = 0.43 - p * 0.15;
      armAngle = Math.PI * 0.45;
    }

    // Tucked legs during leap, crushed crouch on landing
    this._drawLeg(ctx, -8, -32 + jumpY, -14, -10 + Math.max(0, -jumpY * 0.8), -10, 14, false);
    this._drawLeg(ctx, 12 + lunge * 0.5, -32 + jumpY, 18 + lunge, -6, 24 + lunge, 14, true);

    this._drawScarf(ctx, -4 + lunge * 0.4, -h + 14 + jumpY, t, jumpY < 0 ? -1.2 : 1.4);

    ctx.save();
    ctx.translate(lunge, jumpY);
    ctx.rotate(torsoRot);
    this._drawPrisonerTorso(ctx, 0, 0, h, 0);
    ctx.restore();

    this._drawPrisonerHead(ctx, lunge + 6, -h + 12 + jumpY, t, true);

    // Two-handed slam arm geometry
    const shoulderX = lunge + 6;
    const shoulderY = -h + 16 + jumpY;
    const elbowX = shoulderX + Math.cos(armAngle - 0.2) * 16;
    const elbowY = shoulderY + Math.sin(armAngle - 0.2) * 16;
    const handX = elbowX + Math.cos(armAngle) * 15;
    const handY = elbowY + Math.sin(armAngle) * 15;

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(armAngle + Math.PI * 0.25);
    this._drawDeadCellsWeapon(ctx);
    ctx.restore();

    this.drawSegment(ctx, shoulderX - 4, shoulderY, elbowX - 2, elbowY, 7, '#334155', '#0f172a', '#475569'); // Back arm assisting
    this.drawSegment(ctx, shoulderX, shoulderY, elbowX, elbowY, 8, '#475569', '#1e293b', '#64748b');
    this.drawSegment(ctx, elbowX, elbowY, handX, handY, 7, '#5c3d1a', '#291706', '#92400e');
  }

  _drawPrisonerRoll(ctx, t, h) {
    const spin = t * 26;
    ctx.save();
    ctx.rotate(spin);
    
    // Tumbling ball of green/cyan energy and rags
    const rollG = ctx.createRadialGradient(0, -15, 0, 0, -15, 26);
    rollG.addColorStop(0, '#34d399'); // Mint highlight
    rollG.addColorStop(0.35, '#10b981'); // Emerald glow
    rollG.addColorStop(0.7, '#0f766e');
    rollG.addColorStop(0.9, '#0f172a');
    rollG.addColorStop(1, 'transparent');
    ctx.fillStyle = rollG;
    ctx.beginPath();
    ctx.arc(0, -15, 26, 0, Math.PI * 2);
    ctx.fill();

    // Spiral motion ribbons
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, -15, 21, i * Math.PI * 0.65, i * Math.PI * 0.65 + 1.3);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Flame head trails with speed
    this._drawPrisonerHead(ctx, -14, -15, t, true);
  }

  _drawPrisonerDownSmash(ctx, t, h) {
    ctx.save();
    ctx.translate(0, 8); // Crushing into the ground
    
    this._drawLeg(ctx, -6, -24, -12, -18, -6, 0, false);
    this._drawLeg(ctx, 6, -24, 12, -18, 6, 0, true);

    this._drawScarf(ctx, -2, -h + 12, t, -1.8); // Violent upward wind

    this._drawPrisonerTorso(ctx, 0, 0, h, 0);
    this._drawPrisonerHead(ctx, 0, -h + 14, t, true);

    // Down-smash kinetic impact aura
    ctx.globalCompositeOperation = 'lighter';
    const aura = ctx.createLinearGradient(-25, -60, 25, 0);
    aura.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
    aura.addColorStop(0.5, 'rgba(52, 211, 153, 0.5)');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(-30, -70);
    ctx.lineTo(30, -70);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  // ── High-Detail Anatomy & Equipment Parts ────────────────────

  _drawLeg(ctx, hipX, hipY, kneeX, kneeY, footX, footY, isFront) {
    const thighG = ctx.createLinearGradient(hipX, hipY, kneeX, kneeY);
    thighG.addColorStop(0, isFront ? '#334155' : '#1e293b');
    thighG.addColorStop(0.5, isFront ? '#1e293b' : '#0f172a');
    thighG.addColorStop(1, isFront ? '#0f172a' : '#020617');
    
    const calfG = ctx.createLinearGradient(kneeX, kneeY, footX, footY);
    calfG.addColorStop(0, isFront ? '#451a03' : '#291706'); // Heavy leather wraps
    calfG.addColorStop(0.6, isFront ? '#78350f' : '#3d1c02');
    calfG.addColorStop(1, isFront ? '#1e293b' : '#0f172a'); // Steel boot heel

    // Thigh segment
    this.drawSegment(ctx, hipX, hipY, kneeX, kneeY, 9.5, thighG, thighG, isFront ? '#64748b' : '#334155');
    
    // Knee Poleyn (Iron knee cap with center spike/ridge)
    ctx.fillStyle = isFront ? '#94a3b8' : '#64748b';
    ctx.beginPath();
    ctx.arc(kneeX, kneeY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isFront ? '#ffffff' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(kneeX + 1, kneeY - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Calf & Greaves segment
    this.drawSegment(ctx, kneeX, kneeY, footX, footY, 7.5, calfG, calfG, isFront ? '#854d0e' : '#3d1c02');
    
    // Boot / Sabaton with tread profile
    ctx.fillStyle = isFront ? '#1e293b' : '#0f172a';
    ctx.beginPath();
    ctx.ellipse(footX + 4, footY + 1, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Iron boot toe cap
    ctx.fillStyle = isFront ? '#64748b' : '#334155';
    ctx.beginPath();
    ctx.arc(footX + 9, footY + 1, 3, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
  }

  _drawPrisonerTorso(ctx, offsetX, offsetY, h, chestExpand = 0) {
    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Layer 1: Dark Leather Undertunic
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10 - chestExpand * 0.5, -h + 16, 20 + chestExpand, 25);

    // Layer 2: Iron Cuirass Plate with Specular Ridge
    const cuirassG = ctx.createLinearGradient(-10, -h + 16, 10, -h + 36);
    cuirassG.addColorStop(0, '#64748b'); // Steel highlight
    cuirassG.addColorStop(0.3, '#475569');
    cuirassG.addColorStop(0.7, '#334155');
    cuirassG.addColorStop(1, '#1e293b');
    
    ctx.fillStyle = cuirassG;
    ctx.beginPath();
    ctx.moveTo(-10 - chestExpand * 0.5, -h + 16);
    ctx.lineTo(10 + chestExpand * 0.5, -h + 16);
    ctx.lineTo(8, -h + 35);
    ctx.lineTo(-8, -h + 35);
    ctx.closePath();
    ctx.fill();

    // Cuirass central ridge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -h + 17);
    ctx.lineTo(0, -h + 34);
    ctx.stroke();

    // Golden Rivets on cuirass corners
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-8, -h + 18, 2, 2);
    ctx.fillRect(6, -h + 18, 2, 2);

    // Layer 3: Cross-chest Leather Harness Strap
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(-10, -h + 18);
    ctx.lineTo(-7, -h + 16);
    ctx.lineTo(7, -h + 34);
    ctx.lineTo(4, -h + 36);
    ctx.closePath();
    ctx.fill();
    
    // Brass buckle
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-2, -h + 24, 4, 4);

    // Layer 4: Heavy Belts
    ctx.fillStyle = '#291706';
    ctx.fillRect(-9, -h + 36, 18, 5);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-3, -h + 37, 6, 3.5);

    // Tattered Royal Red Sash
    const skirtG = ctx.createLinearGradient(-9, -h + 41, 9, -h + 56);
    skirtG.addColorStop(0, '#dc2626');
    skirtG.addColorStop(0.5, '#991b1b');
    skirtG.addColorStop(1, '#450a0a');
    ctx.fillStyle = skirtG;
    ctx.beginPath();
    ctx.moveTo(-9, -h + 41);
    ctx.lineTo(9, -h + 41);
    ctx.lineTo(12, -h + 52);
    ctx.lineTo(5, -h + 48);
    ctx.lineTo(1, -h + 58);
    ctx.lineTo(-3, -h + 50);
    ctx.lineTo(-8, -h + 56);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawScarf(ctx, x, y, t, windSpeed) {
    ctx.save();
    const len = 42 + Math.abs(windSpeed) * 14;
    const wave1 = Math.sin(t * 12) * (10 + Math.abs(windSpeed) * 14);
    const wave2 = Math.cos(t * 15) * (8 + Math.abs(windSpeed) * 10);
    
    // Iconic Dead Cells flowing crimson scarf
    const scarfG = ctx.createLinearGradient(x, y, x - len, y + wave1);
    scarfG.addColorStop(0, '#ef4444');
    scarfG.addColorStop(0.5, '#dc2626');
    scarfG.addColorStop(1, '#7f1d1d');
    
    ctx.fillStyle = scarfG;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - len * 0.5, y - 10 + wave2, x - len, y + wave1);
    ctx.quadraticCurveTo(x - len * 0.5 + 6, y - 2 + wave2, x - 2, y + 8);
    ctx.closePath();
    ctx.fill();

    // Inner shadow fold
    ctx.fillStyle = 'rgba(69, 10, 10, 0.6)';
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 2);
    ctx.quadraticCurveTo(x - len * 0.45, y - 6 + wave2 * 0.8, x - len * 0.85, y + wave1 * 0.8);
    ctx.quadraticCurveTo(x - len * 0.45, y + wave2 * 0.8, x - 2, y + 6);
    ctx.fill();

    ctx.restore();
  }

  _drawPrisonerHead(ctx, x, y, t, isAttacking = false) {
    ctx.save();
    ctx.translate(x, y);

    // 1. Stylized Emerald Teardrop Flame Head
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 1 + Math.sin(t * 9) * 0.08;
    const flicker = Math.sin(t * 16) * 2;
    
    // Core brilliant flame
    const coreG = ctx.createRadialGradient(0, -2, 0, 0, -2, 16 * pulse);
    coreG.addColorStop(0, '#f0fdf4');   // Hot white-mint core
    coreG.addColorStop(0.25, '#6ee7b7'); // Mint green
    coreG.addColorStop(0.65, '#10b981');// Saturated emerald green
    coreG.addColorStop(0.9, '#047857'); // Forest green rim
    coreG.addColorStop(1, 'transparent');
    ctx.fillStyle = coreG;
    ctx.beginPath();
    ctx.arc(0, -2, 16 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Natural flame flickers licking upward
    ctx.fillStyle = 'rgba(52, 211, 153, 0.55)';
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.quadraticCurveTo(-10 + flicker, -18, -14, -10);
    ctx.quadraticCurveTo(-8, -4, -3, 0);
    ctx.fill();

    // 2. The Iconic Glowing Cyclops Eye
    const eyeX = 3;
    const eyeY = -2 + Math.sin(t * 4) * 0.8;
    
    ctx.globalCompositeOperation = 'source-over';
    // Dark eye socket depth
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Brilliant glowing pupil
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + 0.5, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawBackArm(ctx, shoulderX, shoulderY, elbowX, elbowY, handX, handY) {
    this.drawSegment(ctx, shoulderX, shoulderY, elbowX, elbowY, 7.5, '#334155', '#0f172a', '#475569');
    this.drawSegment(ctx, elbowX, elbowY, handX, handY, 6.5, '#3d1c02', '#1a0d02', '#5c3d1a');
  }

  _drawFrontArm(ctx, shoulderX, shoulderY, elbowX, elbowY, handX, handY, t) {
    // Muscular Bicep (Skin with bandage wrap)
    const bicepG = ctx.createLinearGradient(shoulderX, shoulderY, elbowX, elbowY);
    bicepG.addColorStop(0, '#5c3d1a');
    bicepG.addColorStop(1, '#3d2910');
    this.drawSegment(ctx, shoulderX, shoulderY, elbowX, elbowY, 8.5, bicepG, bicepG, '#854d0e');
    
    // Articulated Iron Gauntlet Forearm
    const gauntletG = ctx.createLinearGradient(elbowX, elbowY, handX, handY);
    gauntletG.addColorStop(0, '#64748b');
    gauntletG.addColorStop(0.6, '#475569');
    gauntletG.addColorStop(1, '#334155');
    this.drawSegment(ctx, elbowX, elbowY, handX, handY, 7.5, gauntletG, gauntletG, '#94a3b8');
    
    // Idle weapon resting in hand
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(-0.35 + Math.sin(t * 3.2) * 0.08);
    this._drawDeadCellsWeapon(ctx);
    ctx.restore();
  }

  _drawDeadCellsWeapon(ctx) {
    // Iconic Dead Cells Broadsword
    // Handle & Leather wrap
    ctx.fillStyle = '#3d1c02';
    ctx.fillRect(-3, -2, 6, 12);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    for (let y = 0; y < 11; y += 3) {
      ctx.beginPath(); ctx.moveTo(-3, y); ctx.lineTo(3, y + 2); ctx.stroke();
    }

    // Pommel
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 11, 4, 0, Math.PI * 2);
    ctx.fill();

    // Crossguard (Curved wings)
    const guardG = ctx.createLinearGradient(-10, -5, 10, -5);
    guardG.addColorStop(0, '#d97706');
    guardG.addColorStop(0.5, '#fbbf24');
    guardG.addColorStop(1, '#d97706');
    ctx.fillStyle = guardG;
    ctx.fillRect(-9, -5, 18, 4);
    
    // Central gem
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-1.5, -4.5, 3, 3);
    
    // Tempered Steel Blade
    const bladeG = ctx.createLinearGradient(0, -5, 0, -50);
    bladeG.addColorStop(0, '#cbd5e1');   // Bright steel
    bladeG.addColorStop(0.4, '#94a3b8');
    bladeG.addColorStop(0.8, '#64748b');
    bladeG.addColorStop(1, '#f8fafc');   // Razor sharp tip
    ctx.fillStyle = bladeG;
    
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(-4.5, -44);
    ctx.lineTo(0, -52); // Sharp point
    ctx.lineTo(4.5, -44);
    ctx.lineTo(5, -5);
    ctx.closePath();
    ctx.fill();

    // Central Fuller with Pulsating Ancient Emerald Runes
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-1, -44, 2, 36);
    
    ctx.fillStyle = '#10b981'; // Glowing runes
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, -34, 1.5, 0, Math.PI * 2);
    ctx.arc(0, -24, 1.5, 0, Math.PI * 2);
    ctx.arc(0, -14, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── 2. ENEMIES (DEAD CELLS DETAILED MONSTERS) ───────────────

  drawZombie(ctx, enemy) {
    // The Mutated Leaper: Asymmetrical bone sickle claw, vertebrae spine, throbbing pustules
    const t = enemy.animTime || 0;
    const h = enemy.h;
    const walk = Math.sin(t * 11) * 8;
    const twitch = Math.sin(t * 24) > 0.8 ? 2 : 0;
    
    this.drawDropShadow(ctx, 0, 0, 26, 0.75);

    ctx.save();
    
    // Mutant legs with bone spurs
    this._drawLeg(ctx, -5, -24, -5 - walk, -12 + Math.abs(walk), -5 - walk * 1.5, 0, false);
    this._drawLeg(ctx,  5, -24,  5 + walk, -12 + Math.abs(walk),  5 + walk * 1.5, 0, true);

    // Torso: Hunched forward with visible bony vertebrae column
    ctx.save();
    ctx.translate(2 + twitch, -h + 20 + Math.abs(walk) * 0.5);
    ctx.rotate(0.35); // Heavy hunched posture
    
    const torsoG = ctx.createLinearGradient(-12, -16, 12, 16);
    torsoG.addColorStop(0, '#14532d'); // Mutated slime green
    torsoG.addColorStop(0.5, '#064e3b');
    torsoG.addColorStop(1, '#022c22');
    ctx.fillStyle = torsoG;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bony Vertebrae Protrusions along spine
    ctx.fillStyle = '#cbd5e1';
    for (let i = -12; i <= 8; i += 5) {
      ctx.fillRect(-12, i, 4, 3);
    }
    
    // Throbbing Glowing Pustules
    const pulse = 1 + Math.sin(t * 8) * 0.25;
    ctx.fillStyle = '#84cc16';
    ctx.shadowColor = '#bef264';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(6, -6, 3 * pulse, 0, Math.PI * 2);
    ctx.arc(2, -11, 2.2 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();

    // Head: Deformed skull with razor fangs and glowing acid eye
    ctx.save();
    ctx.translate(7 + twitch, -h + 8 + Math.abs(walk) * 0.5);
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fill();
    // Protruding lower jaw with fangs
    ctx.fillStyle = '#022c22';
    ctx.fillRect(0, 2, 7, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 3, 2, 3); // Fang
    // Acid green glowing eye
    ctx.fillStyle = '#bef264';
    ctx.shadowColor = '#bef264';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(4, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Giant Asymmetrical Mutated Sickle Claw Arm
    ctx.save();
    ctx.translate(2, -h + 22);
    const clawAngle = enemy.windupTimer > 0 ? -1.2 : 0.3 + Math.sin(t * 11) * 0.2;
    ctx.rotate(clawAngle);
    
    // Arm segment
    this.drawSegment(ctx, 0, 0, 18, 8, 7, '#14532d', '#022c22');
    
    // Huge curved chitin sickle blade
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(18, 8);
    ctx.quadraticCurveTo(34, 14, 42, 32); // Blade tip
    ctx.quadraticCurveTo(28, 22, 14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#84cc16'; // Acid-coated edge
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  drawArcher(ctx, enemy) {
    // Undead Archer: Ragged purple cowl, skeletal ribs, composite recurve bow
    const t = enemy.animTime || 0;
    const h = enemy.h;
    
    this.drawDropShadow(ctx, 0, 0, 22, 0.75);

    ctx.save();
    
    // Skeletal Legs
    this._drawLeg(ctx, -4, -22, -4, -10, -4, 0, false);
    this._drawLeg(ctx,  4, -22,  8, -10,  12, 0, true);

    // Torso: Ragged Purple Cloak over skeletal ribs
    const cloakG = ctx.createLinearGradient(-8, -h + 16, 8, -h + 40);
    cloakG.addColorStop(0, '#5b21b6'); // Deep royal purple
    cloakG.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = cloakG;
    ctx.beginPath();
    ctx.moveTo(-6, -h + 16);
    ctx.lineTo(6, -h + 16);
    ctx.lineTo(10, -h + 40);
    ctx.lineTo(-8, -h + 45);
    ctx.closePath();
    ctx.fill();

    // Exposed skeletal ribcage
    ctx.fillStyle = '#cbd5e1';
    for (let r = -h + 20; r < -h + 34; r += 4) {
      ctx.fillRect(-3, r, 6, 1.5);
    }

    // Tattered cowl hood with dark void face
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.arc(0, -h + 10, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#05020a';
    ctx.beginPath();
    ctx.arc(2, -h + 10, 6, 0, Math.PI * 2);
    ctx.fill();
    // Glowing Crimson Eye Slit
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 12;
    ctx.fillRect(2, -h + 9, 4, 2);
    ctx.shadowBlur = 0;

    // Recurve Compound Longbow & Arrow
    ctx.save();
    ctx.translate(6, -h + 20);
    const isAiming = enemy.windupTimer > 0;
    
    if (isAiming) {
      ctx.rotate(0.18);
      // Bow curved limb
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 22, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      
      // Taut tension bowstring drawn back
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(-12, 0); // Pulled back
      ctx.lineTo(0, 22);
      ctx.stroke();

      // Nocked Arrow with glowing tip
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-12, -1.5, 28, 3);
      ctx.fillStyle = '#00f0ff'; // Cyan magical arrow head
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(16, -3); ctx.lineTo(22, 0); ctx.lineTo(16, 3); ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.rotate(0.5);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 22, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, 22);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  drawShieldEnemy(ctx, enemy) {
    // Iron Vanguard: Heavy gothic plate armor, molten furnace visor, massive engraved tower shield
    const t = enemy.animTime || 0;
    const h = enemy.h;
    
    this.drawDropShadow(ctx, 0, 0, 36, 0.9);

    ctx.save();
    
    // Thick Armored Greaves
    this.drawSegment(ctx, -8, -20, -8, 0, 11, '#475569', '#1e293b', '#64748b');
    this.drawSegment(ctx, 12, -20, 12, 0, 11, '#475569', '#1e293b', '#64748b');

    // Bulky Gothic Plate Torso
    const armorG = ctx.createLinearGradient(-16, -h + 15, 16, -h + 50);
    armorG.addColorStop(0, '#94a3b8');
    armorG.addColorStop(0.4, '#475569');
    armorG.addColorStop(0.8, '#1e293b');
    armorG.addColorStop(1, '#0f172a');
    ctx.fillStyle = armorG;
    ctx.fillRect(-16, -h + 15, 32, 36);

    // Spiked Pauldron
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(-16, -h + 14);
    ctx.lineTo(-24, -h + 8); // Spike
    ctx.lineTo(-12, -h + 26);
    ctx.closePath();
    ctx.fill();

    // Gothic Greathelm with Furnace Visor
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(2, -h + 5, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -h + 2, 9, 4.5); // Visor slit
    // Molten orange furnace glow
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.fillRect(4, -h + 3, 7, 2.5);
    ctx.shadowBlur = 0;

    // Massive Reinforced Tower Shield with Embossed Emblem
    ctx.save();
    if (enemy.windupTimer > 0) {
      ctx.translate(14, -h + 22);
      ctx.rotate(0.35); // Shield bash thrust
    } else {
      ctx.translate(20, -h + 28);
    }
    
    // Shield Body (Steel & Riveted Dark Wood)
    const shieldG = ctx.createLinearGradient(-5, -28, 12, 28);
    shieldG.addColorStop(0, '#78350f');
    shieldG.addColorStop(0.5, '#451a03');
    shieldG.addColorStop(1, '#1e293b');
    ctx.fillStyle = shieldG;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(9, -26);
    ctx.lineTo(9, 26);
    ctx.lineTo(0, 36);
    ctx.lineTo(-5, 26);
    ctx.lineTo(-5, -26);
    ctx.closePath();
    ctx.fill();
    
    // Heavy Steel Border & Rivets
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Embossed Golden Lion / Gargoyle Emblem
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(2, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(1, -2, 2, 4);

    ctx.restore();
    ctx.restore();
  }
  
  drawInquisitor(ctx, enemy) {
    // Spectral Cultist: Flowing white & gold robes, occult mask, 3D orbiting focus crystals
    const t = enemy.animTime || 0;
    const h = enemy.h;
    
    this.drawDropShadow(ctx, 0, 0, 22, 0.65);
    
    ctx.save();
    const floatY = Math.sin(t * 3.8) * 5;
    ctx.translate(0, floatY);
    
    // Flowing High-Priest Robes
    const robeG = ctx.createLinearGradient(-12, -h + 10, 12, 0);
    robeG.addColorStop(0, '#f8fafc'); // Pure silk white
    robeG.addColorStop(0.5, '#cbd5e1');
    robeG.addColorStop(0.85, '#6b21a8'); // Royal purple trim
    robeG.addColorStop(1, '#3b0764');
    
    ctx.fillStyle = robeG;
    ctx.beginPath();
    ctx.moveTo(-7, -h + 15);
    ctx.lineTo(7, -h + 15);
    ctx.lineTo(14, -6);
    ctx.lineTo(-14, -6);
    ctx.closePath();
    ctx.fill();

    // Golden Runic Embroidery down the front
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-1.5, -h + 16, 3, h - 22);

    // Mystical Halo Ring floating behind head
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, -h + 6, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Porcelain Occult Mask with Pointed Mitre
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(-6, -h + 15);
    ctx.lineTo(6, -h + 15);
    ctx.lineTo(0, -h - 12); // Pointy top
    ctx.closePath();
    ctx.fill();

    // Cyan glowing eye glyph
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -h + 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3 Orbiting Arcane Focus Crystals rotating in 3D perspective
    for (let i = 0; i < 3; i++) {
      const angle = t * 3 + (i * Math.PI * 2 / 3);
      const cx = Math.cos(angle) * 22;
      const cy = -h + 20 + Math.sin(angle) * 8;
      const cScale = 0.7 + (Math.sin(angle) + 1) * 0.3;

      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6 * cScale);
      ctx.lineTo(cx + 4 * cScale, cy);
      ctx.lineTo(cx, cy + 6 * cScale);
      ctx.lineTo(cx - 4 * cScale, cy);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawBoss(ctx, boss) {
    // Lord Malakor, The Cursed Alchemist King: Obsidian horn crown, bubbling chemical tanks, giant runed cleaver
    const t = boss.animTime || 0;
    const h = boss.h;
    const w = boss.w;
    
    this.drawDropShadow(ctx, 0, 0, 65, 0.95);

    ctx.save();
    
    // Massive armored legs
    this.drawSegment(ctx, -16, -32, -20, 0, 18, '#334155', '#0f172a', '#475569');
    this.drawSegment(ctx,  16, -32,  22, 0, 18, '#334155', '#0f172a', '#475569');

    // Heavy Juggernaut Cuirass
    const torsoG = ctx.createLinearGradient(-32, -h + 20, 32, -30);
    torsoG.addColorStop(0, '#7f1d1d'); // Dried blood iron
    torsoG.addColorStop(0.5, '#450a0a');
    torsoG.addColorStop(1, '#0f172a');
    ctx.fillStyle = torsoG;
    ctx.beginPath();
    ctx.fillRect(-32, -h + 28, 64, h - 48);

    // Chemical Alchemical Tanks on Back (Bubbling green / orange reagent)
    const fluidColor = boss.phase >= 2 ? '#f97316' : '#22c55e';
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-28, -h + 12, 14, 26);
    ctx.fillRect(14, -h + 12, 14, 26);
    
    // Glowing liquid inside glass vats
    ctx.fillStyle = fluidColor;
    ctx.shadowColor = fluidColor;
    ctx.shadowBlur = 14;
    const bubbleY = Math.sin(t * 12) * 3;
    ctx.fillRect(-26, -h + 18 + bubbleY, 10, 18 - bubbleY);
    ctx.fillRect(16, -h + 18 - bubbleY, 10, 18 + bubbleY);
    ctx.shadowBlur = 0;

    // Fiery Chaos Aura in Phase 2 & 3
    if (boss.phase >= 2) {
      ctx.globalCompositeOperation = 'lighter';
      const aura = ctx.createRadialGradient(0, -h / 2, 20, 0, -h / 2, h * 0.9);
      aura.addColorStop(0, boss.phase === 3 ? 'rgba(239, 68, 68, 0.45)' : 'rgba(249, 115, 22, 0.35)');
      aura.addColorStop(1, 'transparent');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -h / 2, h * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // Head with Obsidian Horn Crown
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(6, -h + 20, 19, 0, Math.PI * 2);
    ctx.fill();

    // Obsidian Horns
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.moveTo(0, -h + 18); ctx.lineTo(-14, -h - 6); ctx.lineTo(4, -h + 10); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -h + 18); ctx.lineTo(24, -h - 6); ctx.lineTo(16, -h + 10); ctx.fill();
    
    // Menacing Red Cyclopean Gaze
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(12, -h + 18, 3.5, 0, Math.PI * 2);
    ctx.arc(20, -h + 18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Giant Arm & Serrated Cleaver-Scythe
    ctx.save();
    if (boss.windupTimer > 0) {
      ctx.translate(15, -h + 40);
      ctx.rotate(0.4);
    } else {
      ctx.translate(20, -h + 40);
    }
    
    this.drawSegment(ctx, 0, 0, 30, 20, 20, '#7f1d1d', '#450a0a', '#991b1b');
    
    // Colossal Serrated Blade
    const cleaverG = ctx.createLinearGradient(30, 20, 75, -20);
    cleaverG.addColorStop(0, '#475569');
    cleaverG.addColorStop(0.5, '#7f1d1d');
    cleaverG.addColorStop(1, '#ef4444');
    ctx.fillStyle = cleaverG;
    ctx.beginPath();
    ctx.moveTo(30, 20);
    ctx.lineTo(80, 0);
    ctx.lineTo(85, -25);
    ctx.lineTo(55, -15);
    ctx.lineTo(45, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  // ── 3. MISC / PROPS ────────────────────────────────────────

  drawWoodenDoor(ctx, door, camera) {
    const rx = Math.round(door.x - camera.x);
    const ry = Math.round(door.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);

    if (!door.broken) {
      // Solid wooden door (Golden handles, iron trim)
      const woodG = ctx.createLinearGradient(-15, -64, 15, 0);
      woodG.addColorStop(0, '#5c3d1a');
      woodG.addColorStop(1, '#291706');
      ctx.fillStyle = woodG;
      ctx.fillRect(-15, -64, 30, 64);
      
      // Planks
      ctx.strokeStyle = '#1a0d02';
      ctx.lineWidth = 1;
      for (let i = -10; i <= 10; i += 10) {
        ctx.beginPath(); ctx.moveTo(i, -64); ctx.lineTo(i, 0); ctx.stroke();
      }

      // Iron reinforcements
      ctx.fillStyle = '#475569';
      ctx.fillRect(-15, -54, 30, 6);
      ctx.fillRect(-15, -16, 30, 6);

      // Glowing lock / rune
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -32, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Shattered remnants
      ctx.fillStyle = '#291706';
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-10, -20); ctx.lineTo(-15, -40); ctx.fill();
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(10, -15); ctx.lineTo(15, -30); ctx.fill();
    }
    ctx.restore();
  }

  drawProps(ctx, props, camera) {
    for (const p of props) {
      const rx = p.x - camera.x;
      const ry = p.y - camera.y;
      
      if (rx < -50 || rx > camera.w + 50) continue;

      ctx.save();
      ctx.translate(rx, ry);
      
      if (p.type === 'barrel') {
        const bg = ctx.createLinearGradient(-12, -28, 12, 0);
        bg.addColorStop(0, '#78350f'); bg.addColorStop(1, '#291706');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.ellipse(0, -14, 14, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.fillRect(-14, -20, 28, 3);
        ctx.fillRect(-14, -10, 28, 3);
      } else if (p.type === 'amphora') {
        const ag = ctx.createLinearGradient(-10, -32, 10, 0);
        ag.addColorStop(0, '#b45309'); ag.addColorStop(1, '#451a03');
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.moveTo(-6, -32);
        ctx.bezierCurveTo(-15, -20, -15, -10, -6, 0);
        ctx.lineTo(6, 0);
        ctx.bezierCurveTo(15, -10, 15, -20, 6, -32);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    }
  }
}

window.spriteRenderer = new SpriteRenderer();
