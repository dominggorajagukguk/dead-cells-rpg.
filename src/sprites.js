// ============================================================
// TEKKEN ARCADE HD SPRITE RENDERER
// Ultra-detailed characters with muscle shading, neon rim-light,
// 3D armor panels, cinematic hit-flash, and Tekken-style poses
// ============================================================

class SpriteRenderer {
  constructor() {
    this.cache = {};
    this.frameTime = 0;
  }

  // ── Utilities ──────────────────────────────────────────────

  drawDropShadow(ctx, x, y, w = 36, scale = 1.0) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, w * scale);
    g.addColorStop(0, 'rgba(0,0,0,0.75)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, w * scale, (w * 0.28) * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Rim-light outline (Tekken HD edge-lit look)
  drawRimLight(ctx, color, alpha = 0.9) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.restore();
  }

  // Muscle fiber shading helper
  muscleLine(ctx, x1, y1, x2, y2, bright, dark, width = 1.5) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, bright);
    g.addColorStop(0.5, dark);
    g.addColorStop(1, bright);
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // ── 1. THE BEHEADED (TEKKEN-STYLE HD CHARACTER) ────────────
  drawPlayer(ctx, player) {
    const t = player.animTime || 0;
    const atk = player.isAttacking;
    const combo = player.comboStep || 1;
    const ap = player.attackProgress || 0;
    const grounded = player.grounded;
    const rolling = player.isRolling;
    const downSmash = player.isDownSmashing;
    const vx = player.vx;
    const h = player.h;

    // Drop shadow
    if (grounded) {
      this.drawDropShadow(ctx, 0, 0, 28, 1.0);
    } else {
      this.drawDropShadow(ctx, 0, 12, 22, Math.max(0.35, 1 - Math.abs(player.vy) / 1600));
    }

    ctx.save();

    if (rolling) {
      this._drawRollPose(ctx, t, h);
    } else if (downSmash) {
      this._drawDownSmashPose(ctx, t, h);
    } else if (atk) {
      this._drawAttackPose(ctx, t, h, combo, ap, vx);
    } else if (!grounded) {
      this._drawAirPose(ctx, t, h, player.vy);
    } else if (Math.abs(vx) > 30) {
      this._drawRunPose(ctx, t, h);
    } else {
      this._drawIdlePose(ctx, t, h);
    }

    // Weapon
    ctx.save();
    if (atk) {
      ctx.translate(10, -h + 26);
      let ang = 0;
      if (combo === 1) ang = -0.8 + ap * 2.1;
      else if (combo === 2) ang = -1.9 + ap * 3.2;
      else ang = -Math.PI + ap * Math.PI * 2.6;
      ctx.rotate(ang);
      this._drawTekkenSword(ctx, player.primary, false);
    } else {
      ctx.translate(-6, -h + 22);
      ctx.rotate(-0.28);
      this._drawTekkenSword(ctx, player.primary, true);
    }
    ctx.restore();

    ctx.restore();
  }

  // ── Idle Pose ──
  _drawIdlePose(ctx, t, h) {
    const bob = Math.sin(t * 4.5) * 2.2;
    const breathe = Math.sin(t * 3.5) * 1.5;

    // === LEGS ===
    this._drawHDLeg(ctx, -7, -28 + bob * 0.4, false, 0, h);
    this._drawHDLeg(ctx,  7, -28 + bob * 0.4, true,  0, h);

    // === WAIST BELT ===
    ctx.save();
    ctx.translate(0, breathe);
    const beltG = ctx.createLinearGradient(-13, -h + 46, 13, -h + 53);
    beltG.addColorStop(0, '#7c3aed');
    beltG.addColorStop(0.5, '#5b21b6');
    beltG.addColorStop(1, '#3b0764');
    ctx.fillStyle = beltG;
    ctx.fillRect(-13, -h + 44, 26, 9);
    // Belt buckle
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-5, -h + 46, 10, 5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-3, -h + 47, 6, 3);
    ctx.restore();

    // === TORSO (HD Armored Body) ===
    this._drawHDTorso(ctx, 0, breathe, h);

    // === HEAD (Flaming Dead Cells Head) ===
    this._drawHDHead(ctx, t, h, bob);

    // === CAPE ===
    this._drawHDCape(ctx, t, h, 0);
  }

  // ── Run Pose ──
  _drawRunPose(ctx, t, h) {
    const run = t * 18;
    const legSwing = Math.sin(run);
    const bob = Math.abs(Math.sin(run)) * -3;

    this._drawHDLeg(ctx, -6, -28 + bob, false, legSwing * 0.65, h);
    this._drawHDLeg(ctx,  6, -28 + bob, true, -legSwing * 0.65, h);

    const breathe = Math.sin(t * 18) * 1;
    this._drawHDTorso(ctx, legSwing * 2.5, breathe, h);
    this._drawHDHead(ctx, t, h, bob);
    this._drawHDCape(ctx, t, h, Math.abs(legSwing));
  }

  // ── Air Pose ──
  _drawAirPose(ctx, t, h, vy) {
    const tuck = Math.min(1, Math.abs(vy) / 800);

    // Tucked knees
    ctx.save();
    ctx.translate(-8, -18 - tuck * 4);
    ctx.rotate(-0.5 * tuck);
    this._drawLegSegment(ctx, 0, 0, 8, 14, '#e2e8f0', '#b0c4de');
    this._drawLegSegment(ctx, 0, 12, 7, 11, '#5c3d1a', '#3d2910');
    ctx.restore();

    ctx.save();
    ctx.translate(8, -20 - tuck * 4);
    ctx.rotate(0.5 * tuck);
    this._drawLegSegment(ctx, 0, 0, 8, 14, '#f1f5f9', '#c9d9e8');
    this._drawLegSegment(ctx, 0, 12, 7, 11, '#5c3d1a', '#3d2910');
    ctx.restore();

    this._drawHDTorso(ctx, 0, 0, h);
    this._drawHDHead(ctx, t, h, 0);
    this._drawHDCape(ctx, t, h, 0.5);
  }

  // ── Roll Pose ──
  _drawRollPose(ctx, t, h) {
    // Ball roll
    const spin = t * 25;
    ctx.save();
    ctx.rotate(spin);
    const rollG = ctx.createRadialGradient(-6, -6, 2, 0, 0, 22);
    rollG.addColorStop(0, '#38bdf8');
    rollG.addColorStop(0.5, '#0284c7');
    rollG.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = rollG;
    ctx.beginPath();
    ctx.arc(0, -22, 20, 0, Math.PI * 2);
    ctx.fill();
    // Neon rim
    ctx.strokeStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Head
    this._drawHDHead(ctx, t, h, 0);
  }

  // ── Down Smash ──
  _drawDownSmashPose(ctx, t, h) {
    // Upright body, legs tucked
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-6, -28, 12, 28);
    ctx.fillStyle = '#5c3d1a';
    ctx.fillRect(-7, -12, 14, 12);

    this._drawHDTorso(ctx, 0, 0, h);
    this._drawHDHead(ctx, t, h, 0);

    // Downward motion blur lines
    ctx.save();
    ctx.strokeStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-10 + i * 7, -10 - i * 3);
      ctx.lineTo(-10 + i * 7, -40 - i * 3);
      ctx.lineWidth = 2.5 - i * 0.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Attack Pose ──
  _drawAttackPose(ctx, t, h, combo, ap, vx) {
    const lean = (combo === 3) ? Math.sin(ap * Math.PI) * 8 : ap * 5;

    this._drawHDLeg(ctx, -7, -28, false, -0.2, h);
    this._drawHDLeg(ctx,  7, -28, true,   0.3, h);

    ctx.save();
    ctx.translate(lean, 0);
    this._drawHDTorso(ctx, lean, 0, h);
    this._drawHDHead(ctx, t, h, 0);
    ctx.restore();

    this._drawHDCape(ctx, t, h, 0.8);
  }

  // ── HD Torso with 3D Armor ──
  _drawHDTorso(ctx, leanX, breathe, h) {
    ctx.save();
    ctx.translate(leanX * 0.3, breathe);

    // -- Back pauldron shadow
    const backG = ctx.createLinearGradient(-16, -h + 14, 16, -h + 20);
    backG.addColorStop(0, '#0c4a6e');
    backG.addColorStop(1, '#0369a1');
    ctx.fillStyle = backG;
    ctx.beginPath();
    ctx.ellipse(-8, -h + 17, 10, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // -- Main Chest Plate (3D beveled)
    const chestG = ctx.createLinearGradient(-14, -h + 16, 14, -h + 45);
    chestG.addColorStop(0, '#38bdf8');  // highlight
    chestG.addColorStop(0.2, '#0284c7');
    chestG.addColorStop(0.65, '#075985');
    chestG.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = chestG;
    ctx.beginPath();
    ctx.moveTo(-14, -h + 17);
    ctx.lineTo(14, -h + 17);
    ctx.lineTo(12, -h + 44);
    ctx.lineTo(-12, -h + 44);
    ctx.closePath();
    ctx.fill();

    // Chest plate center ridge
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -h + 18);
    ctx.lineTo(0, -h + 43);
    ctx.stroke();

    // Chest plate upper V-line
    ctx.beginPath();
    ctx.moveTo(-9, -h + 21);
    ctx.lineTo(0, -h + 28);
    ctx.lineTo(9, -h + 21);
    ctx.stroke();

    // Abs segmentation lines (Tekken muscle detail!)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,30,80,0.6)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const yy = -h + 30 + i * 4.5;
      ctx.beginPath();
      ctx.moveTo(-11, yy);
      ctx.lineTo(11, yy);
      ctx.stroke();
    }

    // Left shoulder plate
    const lSholG = ctx.createLinearGradient(-18, -h + 14, -7, -h + 24);
    lSholG.addColorStop(0, '#475569');
    lSholG.addColorStop(0.5, '#1e293b');
    lSholG.addColorStop(1, '#0f172a');
    ctx.fillStyle = lSholG;
    ctx.beginPath();
    ctx.moveTo(-14, -h + 17);
    ctx.lineTo(-20, -h + 20);
    ctx.lineTo(-18, -h + 30);
    ctx.lineTo(-12, -h + 27);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right arm (weapon arm) — bulged
    const rArmG = ctx.createLinearGradient(12, -h + 17, 22, -h + 38);
    rArmG.addColorStop(0, '#475569');
    rArmG.addColorStop(0.4, '#38bdf8');
    rArmG.addColorStop(1, '#0f172a');
    ctx.fillStyle = rArmG;
    ctx.beginPath();
    ctx.moveTo(12, -h + 17);
    ctx.lineTo(20, -h + 20);
    ctx.lineTo(18, -h + 34);
    ctx.lineTo(10, -h + 30);
    ctx.closePath();
    ctx.fill();
    // Rim light on arm
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(19, -h + 21);
    ctx.lineTo(17, -h + 33);
    ctx.stroke();

    // Gold collar strip
    ctx.shadowBlur = 0;
    const collarG = ctx.createLinearGradient(-12, -h + 16, 12, -h + 18);
    collarG.addColorStop(0, '#78350f');
    collarG.addColorStop(0.3, '#fbbf24');
    collarG.addColorStop(0.7, '#fef08a');
    collarG.addColorStop(1, '#b45309');
    ctx.fillStyle = collarG;
    ctx.fillRect(-12, -h + 15, 24, 4);

    // Loincloth / sash
    const sashG = ctx.createLinearGradient(-12, -h + 44, -4, -h + 58);
    sashG.addColorStop(0, '#dc2626');
    sashG.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = sashG;
    ctx.beginPath();
    ctx.moveTo(-12, -h + 44);
    ctx.lineTo(-4, -h + 44);
    ctx.lineTo(-2, -h + 60);
    ctx.lineTo(-8, -h + 60);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ── HD Leg Segment ──
  _drawHDLeg(ctx, baseX, baseY, isBack, angle, h) {
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(angle);

    // Thigh (white cloth with fold shading)
    const thighG = ctx.createLinearGradient(-6, 0, 6, 26);
    thighG.addColorStop(0, isBack ? '#e2e8f0' : '#f8fafc');
    thighG.addColorStop(0.5, isBack ? '#94a3b8' : '#cbd5e1');
    thighG.addColorStop(1, '#475569');
    ctx.fillStyle = thighG;
    ctx.beginPath();
    ctx.roundRect(-5, 0, 10, 22, 3);
    ctx.fill();
    // Cloth fold line
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, 5);
    ctx.lineTo(-1, 18);
    ctx.stroke();

    // Knee guard
    const kneeG = ctx.createLinearGradient(-5, 20, 5, 30);
    kneeG.addColorStop(0, '#374151');
    kneeG.addColorStop(0.5, '#6b7280');
    kneeG.addColorStop(1, '#111827');
    ctx.fillStyle = kneeG;
    ctx.beginPath();
    ctx.ellipse(0, 22, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Boot / shin
    const bootG = ctx.createLinearGradient(-5, 22, 6, 40);
    bootG.addColorStop(0, '#5c3d1a');
    bootG.addColorStop(0.4, '#92400e');
    bootG.addColorStop(1, '#1c0d04');
    ctx.fillStyle = bootG;
    ctx.beginPath();
    ctx.roundRect(-5, 24, 11, 16, [0, 0, 3, 3]);
    ctx.fill();
    // Boot highlight
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, 26);
    ctx.lineTo(-4, 36);
    ctx.stroke();
    // Boot toe
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(1, 40, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawLegSegment(ctx, x, y, w, h, topColor, botColor) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, topColor);
    g.addColorStop(1, botColor);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 3);
    ctx.fill();
  }

  // ── HD Head (Flaming Plasma Head with Tekken Cyclops Eye) ──
  _drawHDHead(ctx, t, h, bob) {
    ctx.save();
    const ft = t * 20;
    const flare = Math.sin(ft) * 3.5;
    const flare2 = Math.cos(ft * 0.7) * 2.5;
    const headY = -h + 9 + bob * 0.4;

    // Outer heat shimmer halo
    const halo = ctx.createRadialGradient(2, headY, 0, 2, headY, 38);
    halo.addColorStop(0, 'rgba(255, 220, 50, 0.85)');
    halo.addColorStop(0.3, 'rgba(255, 120, 20, 0.45)');
    halo.addColorStop(0.7, 'rgba(220, 40, 0, 0.15)');
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(2, headY, 38, 0, Math.PI * 2);
    ctx.fill();

    // Outer flame tendrils (3 layers)
    const flames = [
      { color: '#7f1d1d', scaleX: 1.0, scaleY: 1.0, offset: 0 },
      { color: '#ea580c', scaleX: 0.8, scaleY: 0.88, offset: flare },
      { color: '#fbbf24', scaleX: 0.55, scaleY: 0.7, offset: -flare2 },
    ];
    for (const fl of flames) {
      ctx.fillStyle = fl.color;
      ctx.beginPath();
      ctx.moveTo(-14 * fl.scaleX + fl.offset, headY + 5);
      ctx.bezierCurveTo(
        -18 * fl.scaleX + fl.offset, headY - 14 * fl.scaleY,
        -5 + fl.offset * 0.7, headY - 30 * fl.scaleY,
        2, headY - 34 * fl.scaleY
      );
      ctx.bezierCurveTo(
        9 - fl.offset * 0.7, headY - 28 * fl.scaleY,
        16 * fl.scaleX + fl.offset * 0.3, headY - 12 * fl.scaleY,
        13 * fl.scaleX + fl.offset * 0.3, headY + 5
      );
      ctx.closePath();
      ctx.fill();
    }

    // Head base skull (glowing orb)
    const skullG = ctx.createRadialGradient(-4, headY - 3, 1, 1, headY, 13);
    skullG.addColorStop(0, '#ffffff');
    skullG.addColorStop(0.4, '#fef3c7');
    skullG.addColorStop(0.8, '#f97316');
    skullG.addColorStop(1, '#b45309');
    ctx.fillStyle = skullG;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(1, headY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Skull eye socket (dark)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(5, headY - 2, 5, 4, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Cyclops Eye – glowing teal neon (Tekken style!)
    const eyeG = ctx.createRadialGradient(5, headY - 2, 0, 5, headY - 2, 5);
    eyeG.addColorStop(0, '#ffffff');
    eyeG.addColorStop(0.3, '#00f7ff');
    eyeG.addColorStop(1, '#0891b2');
    ctx.fillStyle = eyeG;
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.ellipse(5, headY - 2, 4, 3, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Eye glint
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(3.5, headY - 3, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── HD Cape ──
  _drawHDCape(ctx, t, h, speedRatio) {
    ctx.save();
    const w1 = Math.sin(t * 14) * (8 * speedRatio + 4);
    const w2 = Math.cos(t * 16 + 1) * (13 * speedRatio + 6);

    const capeG = ctx.createLinearGradient(0, -h + 18, -42, -h + 55);
    capeG.addColorStop(0, '#ff1744');
    capeG.addColorStop(0.45, '#b91c1c');
    capeG.addColorStop(0.8, '#7f1d1d');
    capeG.addColorStop(1, '#450a0a');

    ctx.fillStyle = capeG;
    ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
    ctx.shadowBlur = 14;

    // Main cape
    ctx.beginPath();
    ctx.moveTo(-5, -h + 18);
    ctx.bezierCurveTo(
      -16 - speedRatio * 12 + w1, -h + 24,
      -30 - speedRatio * 18 + w2, -h + 40,
      -44 - speedRatio * 24 + w2, -h + 58
    );
    ctx.bezierCurveTo(
      -30 - speedRatio * 14 + w1, -h + 48,
      -16 - speedRatio * 8, -h + 34,
      2, -h + 24
    );
    ctx.closePath();
    ctx.fill();

    // Cape edge highlight
    ctx.strokeStyle = '#ff6b8a';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(-5, -h + 18);
    ctx.bezierCurveTo(
      -16 - speedRatio * 12 + w1, -h + 24,
      -30 - speedRatio * 18 + w2, -h + 40,
      -44 - speedRatio * 24 + w2, -h + 58
    );
    ctx.stroke();

    ctx.restore();
  }

  // ── HD Tekken-Style Sword ──
  _drawTekkenSword(ctx, weapon, sheathed = false) {
    const wc = weapon.color || '#ff1744';
    const len = sheathed ? 32 : Math.min(58, (weapon.range || 60) * 0.72);

    // Handle wrap
    const handleG = ctx.createLinearGradient(-8, -3, -3, 3);
    handleG.addColorStop(0, '#292524');
    handleG.addColorStop(0.5, '#57534e');
    handleG.addColorStop(1, '#1c1917');
    ctx.fillStyle = handleG;
    ctx.beginPath();
    ctx.roundRect(-14, -5, 10, 10, 2);
    ctx.fill();
    // Handle binding
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#78350f' : '#1c1917';
      ctx.fillRect(-14 + i * 2.5, -4, 2, 8);
    }

    // Pommel
    const pomG = ctx.createRadialGradient(-17, 0, 0, -17, 0, 6);
    pomG.addColorStop(0, '#fef08a');
    pomG.addColorStop(0.5, '#fbbf24');
    pomG.addColorStop(1, '#78350f');
    ctx.fillStyle = pomG;
    ctx.beginPath();
    ctx.arc(-17, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Crossguard (3D beveled)
    const cgG = ctx.createLinearGradient(-6, -12, -1, 12);
    cgG.addColorStop(0, '#fef08a');
    cgG.addColorStop(0.4, '#fbbf24');
    cgG.addColorStop(1, '#78350f');
    ctx.fillStyle = cgG;
    ctx.beginPath();
    ctx.roundRect(-6, -11, 7, 22, 2);
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Blade body
    const bladeG = ctx.createLinearGradient(0, -5, len, 5);
    bladeG.addColorStop(0, '#f8fafc');
    bladeG.addColorStop(0.1, '#ffffff');
    bladeG.addColorStop(0.4, wc);
    bladeG.addColorStop(0.8, '#1e293b');
    bladeG.addColorStop(1, '#0f172a');
    ctx.fillStyle = bladeG;
    ctx.shadowColor = wc;
    ctx.shadowBlur = sheathed ? 6 : 20;

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(len - 10, -5);
    ctx.lineTo(len, 0);
    ctx.lineTo(len - 10, 5);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();

    // Blade fuller (center groove)
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(len - 14, 0);
    ctx.stroke();

    // Blade tip neon glow
    if (!sheathed) {
      const tipG = ctx.createRadialGradient(len, 0, 0, len - 8, 0, 14);
      tipG.addColorStop(0, wc);
      tipG.addColorStop(1, 'transparent');
      ctx.fillStyle = tipG;
      ctx.beginPath();
      ctx.arc(len - 4, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================
  // 2. ENEMIES — TEKKEN ARCADE HD STYLE
  // =========================================================

  drawInquisitor(ctx, enemy) {
    const t = enemy.animTime || 0;
    const h = enemy.h;
    this.drawDropShadow(ctx, 0, 0, 28, 1.0);

    ctx.save();

    // --- Segmented Metal Legs ---
    for (const sx of [-8, 5]) {
      const legG = ctx.createLinearGradient(sx, -22, sx + 8, 0);
      legG.addColorStop(0, '#94a3b8');
      legG.addColorStop(0.5, '#334155');
      legG.addColorStop(1, '#0f172a');
      ctx.fillStyle = legG;
      ctx.fillRect(sx, -22, 8, 22);
      // Knee joint
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx - 1, -11, 10, 4);
      // Foot plate
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx - 1, -2, 11, 5);
    }

    // --- Armored Body ---
    const bodyG = ctx.createLinearGradient(-16, -h + 14, 16, -h + 48);
    bodyG.addColorStop(0, '#1d4ed8');
    bodyG.addColorStop(0.3, '#1e40af');
    bodyG.addColorStop(0.7, '#1e3a8a');
    bodyG.addColorStop(1, '#0c2260');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(-15, -h + 13);
    ctx.lineTo(15, -h + 13);
    ctx.lineTo(13, -h + 48);
    ctx.lineTo(-13, -h + 48);
    ctx.closePath();
    ctx.fill();

    // Chest plate panel lines
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, -h + 15);
    ctx.lineTo(0, -h + 47);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -h + 22);
    ctx.lineTo(10, -h + 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -h + 32);
    ctx.lineTo(10, -h + 32);
    ctx.stroke();

    // Glowing Magenta Energy Orbs (Inquisitor signature!)
    for (const ox of [-7, 7]) {
      const orbPulse = 1 + Math.sin(t * 8) * 0.2;
      const orbG = ctx.createRadialGradient(ox, -h + 30, 0, ox, -h + 30, 9 * orbPulse);
      orbG.addColorStop(0, '#ffffff');
      orbG.addColorStop(0.3, '#f0abfc');
      orbG.addColorStop(0.7, '#a855f7');
      orbG.addColorStop(1, '#581c87');
      ctx.fillStyle = orbG;
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 18 * orbPulse;
      ctx.beginPath();
      ctx.arc(ox, -h + 30, 6 * orbPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shoulder plates
    for (const [sx, mirror] of [[-14, -1], [14, 1]]) {
      const spG = ctx.createLinearGradient(sx, -h + 12, sx + mirror * 8, -h + 24);
      spG.addColorStop(0, '#60a5fa');
      spG.addColorStop(0.5, '#1e40af');
      spG.addColorStop(1, '#0f172a');
      ctx.fillStyle = spG;
      ctx.beginPath();
      ctx.moveTo(sx, -h + 13);
      ctx.lineTo(sx + mirror * 9, -h + 17);
      ctx.lineTo(sx + mirror * 7, -h + 28);
      ctx.lineTo(sx + mirror * 2, -h + 25);
      ctx.closePath();
      ctx.fill();
    }

    // Head — cylindrical visor helmet
    const helmG = ctx.createLinearGradient(-11, -h + 1, 11, -h + 15);
    helmG.addColorStop(0, '#475569');
    helmG.addColorStop(0.4, '#1e293b');
    helmG.addColorStop(1, '#0f172a');
    ctx.fillStyle = helmG;
    ctx.shadowBlur = 0;
    ctx.fillRect(-11, -h + 1, 22, 15);
    // Visor slit
    const visorG = ctx.createLinearGradient(-9, -h + 7, 9, -h + 11);
    visorG.addColorStop(0, '#a855f7');
    visorG.addColorStop(0.5, '#ffffff');
    visorG.addColorStop(1, '#a855f7');
    ctx.fillStyle = visorG;
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 14;
    ctx.fillRect(-9, -h + 7, 18, 4);

    // Charging orb on weapon arm
    if (enemy.windupTimer > 0) {
      ctx.save();
      ctx.translate(16, -h + 28);
      const charge = 1.0 + Math.sin(t * 22) * 0.35;
      const cG = ctx.createRadialGradient(0, 0, 0, 0, 0, 13 * charge);
      cG.addColorStop(0, '#ffffff');
      cG.addColorStop(0.4, '#f0abfc');
      cG.addColorStop(1, 'transparent');
      ctx.fillStyle = cG;
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.arc(0, 0, 12 * charge, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  drawZombie(ctx, enemy) {
    const t = enemy.animTime || 0;
    const walk = Math.sin(t * 13) * 9;
    const h = enemy.h;

    this.drawDropShadow(ctx, 0, 0, 26, 1.0);
    ctx.save();

    // --- Decayed Legs ---
    for (const [lx, angle, col] of [[-7, walk * 0.016, '#365314'], [6, -walk * 0.016, '#3f6212']]) {
      ctx.save();
      ctx.translate(lx, -22);
      ctx.rotate(angle);
      const lg = ctx.createLinearGradient(0, 0, 6, 22);
      lg.addColorStop(0, col);
      lg.addColorStop(1, '#1a2e05');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.roundRect(-4, 0, 9, 22, 2);
      ctx.fill();
      // Tear/decay marks
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-1, 4);
      ctx.lineTo(2, 14);
      ctx.stroke();
      ctx.restore();
    }

    // --- Rotten Torso ---
    const torsoG = ctx.createLinearGradient(-15, -h + 14, 15, -h + 48);
    torsoG.addColorStop(0, '#4d7c0f');
    torsoG.addColorStop(0.4, '#365314');
    torsoG.addColorStop(0.8, '#1a2e05');
    torsoG.addColorStop(1, '#0a1504');
    ctx.fillStyle = torsoG;
    ctx.beginPath();
    ctx.moveTo(-14, -h + 14);
    ctx.lineTo(14, -h + 14);
    ctx.lineTo(12, -h + 48);
    ctx.lineTo(-12, -h + 48);
    ctx.closePath();
    ctx.fill();

    // Rib cage / bone showing through
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const ry = -h + 20 + i * 6;
      ctx.beginPath();
      ctx.moveTo(-9, ry);
      ctx.quadraticCurveTo(-13, ry + 3, -8, ry + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(9, ry);
      ctx.quadraticCurveTo(13, ry + 3, 8, ry + 5);
      ctx.stroke();
    }

    // Gore splatter
    ctx.fillStyle = '#991b1b';
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(-3, -h + 26, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -h + 35, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Shoulder spaulders (dirty bone)
    for (const sx of [-15, 14]) {
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.ellipse(sx, -h + 17, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78716c';
      ctx.fillRect(sx - 4, -h + 18, 8, 3);
    }

    // --- Zombie Head ---
    const headG = ctx.createRadialGradient(-3, -h + 7, 1, 0, -h + 8, 13);
    headG.addColorStop(0, '#78716c');
    headG.addColorStop(0.5, '#4d7c0f');
    headG.addColorStop(1, '#1a2e05');
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.arc(0, -h + 7, 12, 0, Math.PI * 2);
    ctx.fill();

    // Exposed skull crack
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, -h + 0);
    ctx.lineTo(0, -h + 5);
    ctx.lineTo(3, -h + 2);
    ctx.stroke();

    // Glowing red eye
    const eyeG = ctx.createRadialGradient(4, -h + 6, 0, 4, -h + 6, 6);
    eyeG.addColorStop(0, '#fca5a5');
    eyeG.addColorStop(0.4, '#ef4444');
    eyeG.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = eyeG;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(4, -h + 6, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cleaver weapon
    ctx.save();
    if (enemy.windupTimer > 0) {
      ctx.translate(10, -h + 20);
      ctx.rotate(-1.2 + Math.sin(t * 20) * 0.1);
      this._drawCleaver(ctx);
    } else {
      ctx.translate(10, -h + 22);
      ctx.rotate(-0.2);
      this._drawCleaver(ctx, true);
    }
    ctx.restore();

    ctx.restore();
  }

  _drawCleaver(ctx, idle = false) {
    // Blade
    const blG = ctx.createLinearGradient(0, -10, 32, 10);
    blG.addColorStop(0, '#e2e8f0');
    blG.addColorStop(0.4, '#94a3b8');
    blG.addColorStop(0.8, '#475569');
    blG.addColorStop(1, '#0f172a');
    ctx.fillStyle = blG;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = idle ? 4 : 14;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(28, -10);
    ctx.lineTo(30, 0);
    ctx.lineTo(28, 10);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    // Blood edge
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(18, -10, 12, 4);
    // Handle
    const hG = ctx.createLinearGradient(-8, -4, 0, 4);
    hG.addColorStop(0, '#78350f');
    hG.addColorStop(1, '#1c0d04');
    ctx.fillStyle = hG;
    ctx.fillRect(-8, -4, 9, 8);
  }

  drawArcher(ctx, enemy) {
    this.drawInquisitor(ctx, enemy);
  }

  drawShieldKnight(ctx, enemy) {
    const h = enemy.h;
    const t = enemy.animTime || 0;
    this.drawDropShadow(ctx, 0, 0, 30, 1.0);

    ctx.save();

    // Armored legs
    for (const [lx, col] of [[-8, '#334155'], [5, '#475569']]) {
      const lgG = ctx.createLinearGradient(lx, -24, lx + 8, 0);
      lgG.addColorStop(0, col);
      lgG.addColorStop(0.5, '#1e293b');
      lgG.addColorStop(1, '#0f172a');
      ctx.fillStyle = lgG;
      ctx.fillRect(lx, -24, 9, 24);
      // Knee plate
      ctx.fillStyle = '#64748b';
      ctx.fillRect(lx - 1, -10, 11, 5);
    }

    // Heavy plate body
    const bodyG = ctx.createLinearGradient(-16, -h + 14, 16, -h + 50);
    bodyG.addColorStop(0, '#64748b');
    bodyG.addColorStop(0.25, '#334155');
    bodyG.addColorStop(0.6, '#1e293b');
    bodyG.addColorStop(1, '#020617');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(-15, -h + 13);
    ctx.lineTo(15, -h + 13);
    ctx.lineTo(13, -h + 50);
    ctx.lineTo(-13, -h + 50);
    ctx.closePath();
    ctx.fill();

    // Plate ribs / etching
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const ry = -h + 18 + i * 7;
      ctx.beginPath();
      ctx.moveTo(-12, ry);
      ctx.lineTo(12, ry);
      ctx.stroke();
    }

    // Orange visor glow
    ctx.strokeStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, -h + 9);
    ctx.lineTo(10, -h + 9);
    ctx.stroke();

    // Helmet
    const helmG = ctx.createLinearGradient(-12, -h + 0, 12, -h + 14);
    helmG.addColorStop(0, '#475569');
    helmG.addColorStop(0.5, '#334155');
    helmG.addColorStop(1, '#0f172a');
    ctx.fillStyle = helmG;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, -h + 6, 13, Math.PI, 0);
    ctx.fillRect(-13, -h + 6, 26, 10);
    ctx.fill();

    // HD Shield
    ctx.save();
    ctx.translate(16, -h + 8);
    const shG = ctx.createLinearGradient(-6, 0, 18, 50);
    shG.addColorStop(0, '#94a3b8');
    shG.addColorStop(0.3, '#475569');
    shG.addColorStop(0.7, '#1e293b');
    shG.addColorStop(1, '#0f172a');
    ctx.fillStyle = shG;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(16, 38);
    ctx.lineTo(9, 52);
    ctx.lineTo(0, 38);
    ctx.closePath();
    ctx.fill();
    // Shield emblem
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(9, 22, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, 18, 6, 8);
    ctx.fillRect(4, 20, 10, 4);
    ctx.restore();

    ctx.restore();
  }

  drawPhaser(ctx, enemy) {
    const h = enemy.h;
    const t = enemy.animTime || 0;
    this.drawDropShadow(ctx, 0, 0, 24, 0.85);

    ctx.save();

    // Void distortion aura
    const voidG = ctx.createRadialGradient(0, -h / 2, 4, 0, -h / 2, 36);
    voidG.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
    voidG.addColorStop(0.4, 'rgba(109, 40, 217, 0.4)');
    voidG.addColorStop(1, 'transparent');
    ctx.fillStyle = voidG;
    ctx.beginPath();
    ctx.arc(0, -h / 2, 36, 0, Math.PI * 2);
    ctx.fill();

    // Ghostly body segments
    for (let i = 0; i < 3; i++) {
      const phase = t * 12 + i * 2;
      const ghostAlpha = 0.5 + Math.sin(phase) * 0.3;
      ctx.globalAlpha = ghostAlpha;
      const segG = ctx.createLinearGradient(-10, -h + 12 + i * 12, 10, -h + 24 + i * 12);
      segG.addColorStop(0, '#c084fc');
      segG.addColorStop(0.5, '#7c3aed');
      segG.addColorStop(1, 'transparent');
      ctx.fillStyle = segG;
      ctx.beginPath();
      ctx.ellipse(0, -h + 18 + i * 11, 10, 7, Math.sin(phase * 0.5) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Core orb
    const coreG = ctx.createRadialGradient(-3, -h + 8, 1, 0, -h + 10, 13);
    coreG.addColorStop(0, '#ffffff');
    coreG.addColorStop(0.3, '#e879f9');
    coreG.addColorStop(0.7, '#7c3aed');
    coreG.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = coreG;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(0, -h + 10, 12, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(3, -h + 10, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Phase slash energy arms
    ctx.save();
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.translate(side * 12, -h + 25);
      ctx.rotate(side * (Math.sin(t * 8) * 0.4 + 0.5));
      const armG = ctx.createLinearGradient(0, 0, side * 18, 10);
      armG.addColorStop(0, '#c084fc');
      armG.addColorStop(1, 'transparent');
      ctx.fillStyle = armG;
      ctx.fillRect(0, -3, side * 18, 6);
      ctx.restore();
    }
    ctx.restore();

    ctx.restore();
  }

  drawBossMalakor(ctx, boss) {
    const h = boss.h;
    const w = boss.w;
    const phase = boss.phase;
    const t = boss.animTime || 0;
    const phaseColor = phase === 3 ? '#ef4444' : (phase === 2 ? '#f97316' : '#22d3ee');

    this.drawDropShadow(ctx, 0, 0, 56, 1.3);

    ctx.save();

    // Phase aura
    if (phase >= 2) {
      const auraG = ctx.createRadialGradient(0, -h / 2, 12, 0, -h / 2, 100);
      auraG.addColorStop(0, `rgba(${phase === 3 ? '239,68,68' : '249,115,22'}, 0.3)`);
      auraG.addColorStop(0.5, `rgba(${phase === 3 ? '127,29,29' : '124,45,18'}, 0.12)`);
      auraG.addColorStop(1, 'transparent');
      ctx.fillStyle = auraG;
      ctx.beginPath();
      ctx.arc(0, -h / 2, 100, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floor cloak
    const capeSwing = Math.sin(t * 5) * 8;
    const capeG = ctx.createLinearGradient(-28, -h + 18, -50, -h + 90);
    capeG.addColorStop(0, '#3b0764');
    capeG.addColorStop(0.5, '#2d0057');
    capeG.addColorStop(1, '#0f0020');
    ctx.fillStyle = capeG;
    ctx.beginPath();
    ctx.moveTo(-24, -h + 20);
    ctx.bezierCurveTo(-40 + capeSwing, -h + 42, -50 - capeSwing, -h + 72, -40, -h + 92);
    ctx.lineTo(-18, -h + 92);
    ctx.bezierCurveTo(-30, -h + 62, -22, -h + 40, -14, -h + 20);
    ctx.closePath();
    ctx.fill();
    // Cape gold hem
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-40, -h + 92);
    ctx.lineTo(-18, -h + 92);
    ctx.stroke();

    // Main armor body
    const armorG = ctx.createLinearGradient(-w / 2, -h + 16, w / 2, -h + 72);
    armorG.addColorStop(0, '#475569');
    armorG.addColorStop(0.15, '#334155');
    armorG.addColorStop(0.5, '#1e293b');
    armorG.addColorStop(0.85, '#0f172a');
    armorG.addColorStop(1, '#020617');
    ctx.fillStyle = armorG;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h + 16);
    ctx.lineTo(w / 2, -h + 16);
    ctx.lineTo(w / 2 - 6, -h + 72);
    ctx.lineTo(-w / 2 + 6, -h + 72);
    ctx.closePath();
    ctx.fill();

    // Armor panel lines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const ry = -h + 22 + i * 9;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 4, ry);
      ctx.lineTo(w / 2 - 4, ry);
      ctx.stroke();
    }

    // Core gyroscope orb
    const pulse = 1 + Math.sin(t * 12) * 0.12;
    const coreG = ctx.createRadialGradient(-4, -h + 40, 2, 0, -h + 40, 20 * pulse);
    coreG.addColorStop(0, '#ffffff');
    coreG.addColorStop(0.25, phaseColor);
    coreG.addColorStop(0.6, '#1e293b');
    coreG.addColorStop(1, 'transparent');
    ctx.fillStyle = coreG;
    ctx.shadowColor = phaseColor;
    ctx.shadowBlur = 34;
    ctx.beginPath();
    ctx.arc(0, -h + 40, 20 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Gyroscope rings
    ctx.shadowBlur = 12;
    for (let i = 0; i < 2; i++) {
      const ringRot = t * (i % 2 === 0 ? 6 : -4) + i;
      ctx.save();
      ctx.translate(0, -h + 40);
      ctx.rotate(ringRot);
      ctx.strokeStyle = phaseColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + i * 4, 8 + i * 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Gold crown spikes
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 8;
    ctx.fillRect(-w / 2 + 4, -h + 3, w - 8, 16);
    const spikePts = [-24, -10, 4, 18, 32];
    for (let i = 0; i < spikePts.length; i++) {
      const pos = spikePts[i];
      const h2 = 22 + (i === 0 || i === 4 ? 10 : 0) + (i === 2 ? 8 : 0);
      ctx.beginPath();
      ctx.moveTo(pos - 6, -h + 3);
      ctx.lineTo(pos, -h + 3 - h2);
      ctx.lineTo(pos + 6, -h + 3);
      ctx.closePath();
      ctx.fill();
    }

    // Phase indicator eye on helmet
    ctx.fillStyle = phaseColor;
    ctx.shadowColor = phaseColor;
    ctx.shadowBlur = 18;
    ctx.fillRect(8, -h + 10, 10, 5);

    // ── Chaos Zweihänder ──
    ctx.save();
    ctx.translate(32, -h + 18);
    ctx.rotate(0.22 + Math.sin(t * 4) * 0.06);

    const bladeG = ctx.createLinearGradient(0, -10, 100, 10);
    bladeG.addColorStop(0, '#f8fafc');
    bladeG.addColorStop(0.1, '#ffffff');
    bladeG.addColorStop(0.35, phaseColor);
    bladeG.addColorStop(0.7, '#334155');
    bladeG.addColorStop(1, '#0f172a');
    ctx.fillStyle = bladeG;
    ctx.shadowColor = phaseColor;
    ctx.shadowBlur = 26;

    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(88, -9);
    ctx.lineTo(98, 0);
    ctx.lineTo(88, 9);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();

    // Blade fuller
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(80, 0);
    ctx.stroke();

    // Crossguard
    const cgG = ctx.createLinearGradient(-10, -22, 4, 22);
    cgG.addColorStop(0, '#fef08a');
    cgG.addColorStop(0.5, '#fbbf24');
    cgG.addColorStop(1, '#78350f');
    ctx.fillStyle = cgG;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(-10, -22, 14, 44, 3);
    ctx.fill();

    // Tip energy
    const tipG = ctx.createRadialGradient(96, 0, 0, 88, 0, 18);
    tipG.addColorStop(0, phaseColor);
    tipG.addColorStop(1, 'transparent');
    ctx.fillStyle = tipG;
    ctx.beginPath();
    ctx.arc(90, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  // =========================================================
  // 3. PROPS & ENVIRONMENT
  // =========================================================

  drawWoodenDoor(ctx, door, camera) {
    if (door.broken) return;
    const rx = door.x - camera.x;
    const ry = door.y - camera.y;

    ctx.save();
    ctx.translate(rx, ry);

    // Stone door frame
    const frameG = ctx.createLinearGradient(-22, -72, 22, 0);
    frameG.addColorStop(0, '#374151');
    frameG.addColorStop(0.5, '#1f2937');
    frameG.addColorStop(1, '#111827');
    ctx.fillStyle = frameG;
    ctx.fillRect(-22, -72, 44, 72);

    // Wood plank base
    const woodG = ctx.createLinearGradient(-18, -70, 18, 0);
    woodG.addColorStop(0, '#92400e');
    woodG.addColorStop(0.4, '#78350f');
    woodG.addColorStop(1, '#3d1a04');
    ctx.fillStyle = woodG;
    ctx.fillRect(-18, -70, 36, 70);

    // Plank separators with grain
    for (const px of [-6, 6]) {
      ctx.fillStyle = '#2d1108';
      ctx.fillRect(px, -70, 2, 70);
    }
    // Horizontal brace
    ctx.fillStyle = '#3d1a04';
    ctx.fillRect(-18, -40, 36, 5);

    // Heavy iron hinges
    const hingeG = ctx.createLinearGradient(-19, 0, -8, 0);
    hingeG.addColorStop(0, '#374151');
    hingeG.addColorStop(0.5, '#6b7280');
    hingeG.addColorStop(1, '#1f2937');
    ctx.fillStyle = hingeG;
    ctx.fillRect(-19, -60, 38, 8);
    ctx.fillRect(-19, -22, 38, 8);

    // Rivet bolts
    ctx.fillStyle = '#d1d5db';
    for (const [bx, by] of [[-16, -56], [13, -56], [-16, -18], [13, -18]]) {
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Door handle
    const dhG = ctx.createRadialGradient(10, -36, 0, 10, -36, 8);
    dhG.addColorStop(0, '#fef3c7');
    dhG.addColorStop(0.5, '#fbbf24');
    dhG.addColorStop(1, '#78350f');
    ctx.fillStyle = dhG;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(8, -40, 6, 10, 2);
    ctx.fill();

    // Keyhole
    ctx.fillStyle = '#0f172a';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(10, -32, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(8, -32, 4, 5);

    ctx.restore();
  }

  drawProps(ctx, props, camera) {
    for (const prop of props) {
      const rx = prop.x - camera.x;
      const ry = prop.y - camera.y;

      ctx.save();
      ctx.translate(rx, ry);

      if (prop.type === 'barrel') {
        // HD Wooden Barrel
        const bG = ctx.createLinearGradient(-14, -28, 14, 0);
        bG.addColorStop(0, '#b45309');
        bG.addColorStop(0.4, '#92400e');
        bG.addColorStop(1, '#3d1a04');
        ctx.fillStyle = bG;
        ctx.beginPath();
        ctx.roundRect(-13, -28, 26, 28, [6, 6, 3, 3]);
        ctx.fill();
        // Wood stave lines
        ctx.strokeStyle = '#3d1a04';
        ctx.lineWidth = 1;
        for (const lx of [-7, 0, 7]) {
          ctx.beginPath();
          ctx.moveTo(lx, -27);
          ctx.lineTo(lx, -1);
          ctx.stroke();
        }
        // Iron hoops (3D bevel)
        for (const hy of [-22, -10, 2]) {
          const hoopG = ctx.createLinearGradient(-14, hy, 14, hy + 4);
          hoopG.addColorStop(0, '#374151');
          hoopG.addColorStop(0.5, '#6b7280');
          hoopG.addColorStop(1, '#111827');
          ctx.fillStyle = hoopG;
          ctx.fillRect(-14, hy, 28, 4);
        }
        // Top
        const topG = ctx.createRadialGradient(-3, -28, 0, 0, -28, 13);
        topG.addColorStop(0, '#b45309');
        topG.addColorStop(1, '#78350f');
        ctx.fillStyle = topG;
        ctx.beginPath();
        ctx.ellipse(0, -28, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (prop.type === 'amphora') {
        // HD Clay Amphora
        const clayG = ctx.createLinearGradient(-11, -36, 11, 0);
        clayG.addColorStop(0, '#ea580c');
        clayG.addColorStop(0.5, '#c2410c');
        clayG.addColorStop(1, '#7c2d12');
        ctx.fillStyle = clayG;
        // Body
        ctx.beginPath();
        ctx.ellipse(0, -15, 11, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        // Neck
        ctx.fillRect(-4, -34, 8, 10);
        // Rim
        const rimG = ctx.createLinearGradient(-7, -37, 7, -34);
        rimG.addColorStop(0, '#fdba74');
        rimG.addColorStop(0.5, '#ea580c');
        rimG.addColorStop(1, '#7c2d12');
        ctx.fillStyle = rimG;
        ctx.fillRect(-7, -37, 14, 4);
        // Pattern bands
        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(0, -18, 10, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Handles
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 3;
        for (const hx of [-11, 11]) {
          ctx.beginPath();
          ctx.arc(hx, -22, 6, Math.PI * 0.8, Math.PI * 1.6);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }
}

window.spriteRenderer = new SpriteRenderer();
