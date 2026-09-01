// High-Definition Dead Cells Level Generator & Atmospheric Parallax Renderer

class LevelManager {
  constructor() {
    this.tileSize = 40;
    this.currentLevelIndex = 1;
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.tiles = [];
    this.checkpoints = [];
    this.exitDoor = null;
    this.npcs = [];
    this.chests = [];
    this.scrolls = [];
    this.doors = [];
    this.props = [];
    this.torches = [];
    this.bgDecorations = [];
    this.animTimer = 0;
  }

  loadLevel(stageNum, game) {
    this.currentLevelIndex = stageNum;
    this.checkpoints = [];
    this.npcs = [];
    this.chests = [];
    this.scrolls = [];
    this.doors = [];
    this.props = [];
    this.torches = [];
    this.bgDecorations = [];
    this.exitDoor = null;

    if (stageNum === 1) {
      this.buildPromenade();
    } else if (stageNum === 2) {
      this.buildRamparts();
    } else {
      this.buildBossCrypt();
    }

    this.generateAtmosphere();

    const stageTitles = [
      '',
      "THE PROMENADE OF THE CONDEMNED",
      "THE RAMPARTS",
      "THE THRONE ROOM OF THE ALCHEMIST KING"
    ];
    const badge = document.getElementById('stage-badge');
    if (badge) badge.innerText = stageTitles[stageNum] || 'DUNGEON';

    window.soundEngine.playBGM(stageNum);
  }

  isSolid(x, y) {
    const tx = Math.floor(x / this.tileSize);
    const ty = Math.floor(y / this.tileSize);
    if (tx < 0 || tx >= this.mapWidth || ty < 0 || ty >= this.mapHeight) return true;
    if (!this.tiles[ty]) return true;
    return this.tiles[ty][tx] === 1;
  }

  isSpike(x, y) {
    const tx = Math.floor(x / this.tileSize);
    const ty = Math.floor(y / this.tileSize);
    if (tx < 0 || tx >= this.mapWidth || ty < 0 || ty >= this.mapHeight) return false;
    if (!this.tiles[ty]) return false;
    return this.tiles[ty][tx] === 3;
  }

  generateAtmosphere() {
    // Green Brazier Wall Torches
    for (let x = 4; x < this.mapWidth - 4; x += 6) {
      this.torches.push({
        x: x * this.tileSize + 20,
        y: 6 * this.tileSize,
        flicker: Math.random() * Math.PI * 2
      });
    }

    // Hanging chains & background arches
    for (let x = 6; x < this.mapWidth - 6; x += 8) {
      this.bgDecorations.push({
        x: x * this.tileSize,
        y: 40,
        type: 'chain',
        length: 120 + Math.random() * 80
      });
    }
  }

  // ==========================================
  // STAGE 1: THE PROMENADE OF THE CONDEMNED (Sunset, Pine Trees, Doors & Barrels)
  // ==========================================
  buildPromenade() {
    this.mapWidth = 76;
    this.mapHeight = 18;
    this.tiles = Array(this.mapHeight).fill(0).map(() => Array(this.mapWidth).fill(0));

    // Floor & Ceiling
    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[0][x] = 1;
      this.tiles[this.mapHeight - 1][x] = 1;
    }
    for (let y = 0; y < this.mapHeight; y++) {
      this.tiles[y][0] = 1;
      this.tiles[y][this.mapWidth - 1] = 1;
    }

    // Platforms with overhangs
    for (let x = 6; x <= 14; x++) this.tiles[12][x] = 1;
    for (let x = 16; x <= 22; x++) this.tiles[9][x] = 1;
    for (let x = 20; x <= 24; x++) this.tiles[17][x] = 3; // Spikes

    for (let x = 28; x <= 44; x++) this.tiles[13][x] = 1;
    for (let x = 32; x <= 38; x++) this.tiles[8][x] = 1;

    for (let x = 48; x <= 58; x++) this.tiles[11][x] = 1;
    for (let x = 60; x <= 72; x++) this.tiles[14][x] = 1;
    for (let x = 52; x <= 56; x++) this.tiles[17][x] = 3; // Spikes

    // Wooden Breakable Doors (Dead Cells Door Kick Mechanic!)
    this.doors.push({ x: 560, y: 480, w: 30, h: 64, broken: false });
    this.doors.push({ x: 1920, y: 440, w: 30, h: 64, broken: false });

    // Props: Barrels & Amphoras
    this.props.push({ x: 380, y: 480, type: 'barrel' });
    this.props.push({ x: 410, y: 480, type: 'amphora' });
    this.props.push({ x: 800, y: 360, type: 'barrel' });
    this.props.push({ x: 830, y: 360, type: 'barrel' });
    this.props.push({ x: 1460, y: 520, type: 'amphora' });
    this.props.push({ x: 2240, y: 440, type: 'barrel' });

    // Checkpoints & Portals
    this.checkpoints.push({ x: 140, y: 640, activated: true, id: 'cp1_1' });
    this.checkpoints.push({ x: 1400, y: 480, activated: false, id: 'cp1_2' });

    this.scrolls.push({ x: 750, y: 320, collected: false });
    this.scrolls.push({ x: 2100, y: 300, collected: false });

    this.chests.push({ x: 500, y: 440, opened: false, reward: 'gold' });
    this.chests.push({ x: 2300, y: 400, opened: false, reward: 'weapon' });

    this.npcs.push({ x: 1520, y: 480, type: 'merchant', name: 'Goblin Merchant' });
    this.exitDoor = { x: 2850, y: 520, nextStage: 2 };
  }

  // ==========================================
  // STAGE 2: THE RAMPARTS (High Castle Towers & Battlements)
  // ==========================================
  buildRamparts() {
    this.mapWidth = 86;
    this.mapHeight = 22;
    this.tiles = Array(this.mapHeight).fill(0).map(() => Array(this.mapWidth).fill(0));

    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[0][x] = 1;
      this.tiles[this.mapHeight - 1][x] = 1;
    }
    for (let y = 0; y < this.mapHeight; y++) {
      this.tiles[y][0] = 1;
      this.tiles[y][this.mapWidth - 1] = 1;
    }

    for (let x = 4; x <= 18; x++) this.tiles[16][x] = 1;
    for (let x = 20; x <= 30; x++) this.tiles[12][x] = 1;
    for (let x = 14; x <= 22; x++) this.tiles[21][x] = 3;

    // Giant Tower center
    for (let y = 6; y <= 21; y++) {
      this.tiles[y][34] = 1;
      this.tiles[y][48] = 1;
    }
    for (let x = 34; x <= 48; x++) {
      this.tiles[18][x] = 1;
      this.tiles[13][x] = 1;
      this.tiles[8][x] = 1;
    }

    for (let x = 52; x <= 64; x++) this.tiles[14][x] = 1;
    for (let x = 66; x <= 80; x++) this.tiles[17][x] = 1;

    this.doors.push({ x: 1350, y: 520, w: 30, h: 64, broken: false });

    this.props.push({ x: 280, y: 640, type: 'barrel' });
    this.props.push({ x: 310, y: 640, type: 'amphora' });
    this.props.push({ x: 2100, y: 560, type: 'barrel' });

    this.checkpoints.push({ x: 160, y: 600, activated: true, id: 'cp2_1' });
    this.checkpoints.push({ x: 1640, y: 280, activated: false, id: 'cp2_2' });

    this.scrolls.push({ x: 1000, y: 440, collected: false });
    this.scrolls.push({ x: 1640, y: 480, collected: false });
    this.chests.push({ x: 2500, y: 520, opened: false, reward: 'weapon' });

    this.npcs.push({ x: 1640, y: 280, type: 'collector', name: 'The Collector' });
    this.exitDoor = { x: 3200, y: 640, nextStage: 3 };
  }

  // ==========================================
  // STAGE 3: CRYPT OF THE ALCHEMIST KING (Boss Arena)
  // ==========================================
  buildBossCrypt() {
    this.mapWidth = 56;
    this.mapHeight = 18;
    this.tiles = Array(this.mapHeight).fill(0).map(() => Array(this.mapWidth).fill(0));

    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[0][x] = 1;
      this.tiles[this.mapHeight - 1][x] = 1;
    }
    for (let y = 0; y < this.mapHeight; y++) {
      this.tiles[y][0] = 1;
      this.tiles[y][this.mapWidth - 1] = 1;
    }

    for (let x = 4; x <= 12; x++) this.tiles[11][x] = 1;
    for (let x = 44; x <= 52; x++) this.tiles[11][x] = 1;

    this.checkpoints.push({ x: 140, y: 640, activated: true, id: 'cp3_1' });
    this.scrolls.push({ x: 260, y: 400, collected: false });
  }

  draw(ctx, camera) {
    this.animTimer += 0.016;
    const ts = this.tileSize;

    // 1. Dead Cells Atmospheric Sunset Sky, Sun, Arches & Diamond Windows
    this.drawDeadCellsAtmosphere(ctx, camera);

    // 2. Breakable Wooden Doors
    for (const door of this.doors) {
      window.spriteRenderer.drawWoodenDoor(ctx, door, camera);
    }

    // 3. Props (Barrels, Urns)
    window.spriteRenderer.drawProps(ctx, this.props, camera);

    // 4. Tiles (Textured Bricks + Overgrown Hanging Roots)
    const startX = Math.max(0, Math.floor(camera.x / ts));
    const endX = Math.min(this.mapWidth, Math.ceil((camera.x + camera.w) / ts) + 1);
    const startY = Math.max(0, Math.floor(camera.y / ts));
    const endY = Math.min(this.mapHeight, Math.ceil((camera.y + camera.h) / ts) + 1);

    for (let y = startY; y < endY; y++) {
      if (!this.tiles[y]) continue;
      for (let x = startX; x < endX; x++) {
        const tile = this.tiles[y][x];
        const rx = Math.round(x * ts - camera.x);
        const ry = Math.round(y * ts - camera.y);

        if (tile === 1) {
          this.drawDeadCellsTile(ctx, rx, ry, x, y);
        } else if (tile === 3) {
          this.drawSpikeTile(ctx, rx, ry);
        }
      }
    }

    // 5. Checkpoints (Glowing Teleport Crystals)
    for (const cp of this.checkpoints) {
      this.drawCheckpointCrystal(ctx, cp, camera);
    }

    // 6. Scrolls of Power
    for (const scr of this.scrolls) {
      if (!scr.collected) {
        const rx = scr.x - camera.x;
        const ry = scr.y - camera.y + Math.sin(this.animTimer * 4) * 6;
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.font = '34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📜', rx, ry);
        ctx.restore();
      }
    }

    // 7. Chests
    for (const ch of this.chests) {
      this.drawChest(ctx, ch, camera);
    }

    // 8. Exit Portal
    if (this.exitDoor) {
      this.drawExitPortal(ctx, this.exitDoor, camera);
    }
  }

  drawDeadCellsAtmosphere(ctx, camera) {
    const w = camera.w;
    const h = camera.h;
    const t = this.animTimer;

    // ── 1. TEKKEN ARCADE HD SKY ────────────────────────────────
    if (this.currentLevelIndex === 1) {
      // Stage 1: Dead Sunset — deep purple → blood red → blazing amber
      const skyG = ctx.createLinearGradient(0, 0, 0, h);
      skyG.addColorStop(0.00, '#1a0533');
      skyG.addColorStop(0.20, '#4a0e2e');
      skyG.addColorStop(0.45, '#881a1a');
      skyG.addColorStop(0.70, '#d45a10');
      skyG.addColorStop(0.88, '#f28c0a');
      skyG.addColorStop(1.00, '#fbe68a');
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, w, h);

      // Horizon glow band
      const horizG = ctx.createLinearGradient(0, h * 0.72, 0, h);
      horizG.addColorStop(0, 'transparent');
      horizG.addColorStop(0.5, 'rgba(255, 160, 30, 0.28)');
      horizG.addColorStop(1, 'rgba(255, 200, 60, 0.14)');
      ctx.fillStyle = horizG;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);

    } else if (this.currentLevelIndex === 2) {
      // Stage 2: Neon-lit ramparts — deep indigo with electric purple
      const skyG = ctx.createLinearGradient(0, 0, 0, h);
      skyG.addColorStop(0.00, '#05001a');
      skyG.addColorStop(0.25, '#10003e');
      skyG.addColorStop(0.55, '#380080');
      skyG.addColorStop(0.80, '#6a0097');
      skyG.addColorStop(1.00, '#440060');
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, w, h);

      // Atmospheric electric shimmer
      const shimmer = Math.sin(t * 2.4) * 0.06 + 0.12;
      const shG = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      shG.addColorStop(0, `rgba(180, 80, 255, ${shimmer})`);
      shG.addColorStop(1, 'transparent');
      ctx.fillStyle = shG;
      ctx.fillRect(0, 0, w, h * 0.5);

    } else {
      // Stage 3: Hellfire crypt — deep black to burning crimson
      const skyG = ctx.createLinearGradient(0, 0, 0, h);
      skyG.addColorStop(0.00, '#050000');
      skyG.addColorStop(0.30, '#1a0000');
      skyG.addColorStop(0.60, '#3d0505');
      skyG.addColorStop(0.85, '#6b0808');
      skyG.addColorStop(1.00, '#1a0000');
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, w, h);

      // Hellfire floor glow
      const hellG = ctx.createLinearGradient(0, h * 0.75, 0, h);
      hellG.addColorStop(0, 'transparent');
      hellG.addColorStop(0.6, 'rgba(200, 20, 0, 0.22)');
      hellG.addColorStop(1, 'rgba(255, 80, 0, 0.35)');
      ctx.fillStyle = hellG;
      ctx.fillRect(0, h * 0.75, w, h * 0.25);
    }

    // ── 2. TEKKEN HD GIANT SUN / MOON ─────────────────────────
    if (this.currentLevelIndex === 1) {
      ctx.save();
      const sunX = w * 0.22 - camera.x * 0.04;
      const sunY = h * 0.42 - camera.y * 0.04;

      // Multi-ring halo
      for (let ring = 3; ring >= 0; ring--) {
        const rAlpha = (4 - ring) * 0.11;
        const rRadius = 70 + ring * 55;
        const rG = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, rRadius);
        rG.addColorStop(0, `rgba(255, 240, 100, ${rAlpha * 2})`);
        rG.addColorStop(0.5, `rgba(251, 150, 20, ${rAlpha})`);
        rG.addColorStop(1, 'transparent');
        ctx.fillStyle = rG;
        ctx.beginPath();
        ctx.arc(sunX, sunY, rRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      // Sun disc with limb darkening
      const sunDisc = ctx.createRadialGradient(sunX - 12, sunY - 12, 0, sunX, sunY, 68);
      sunDisc.addColorStop(0, '#fffde7');
      sunDisc.addColorStop(0.5, '#fde68a');
      sunDisc.addColorStop(0.85, '#fbbf24');
      sunDisc.addColorStop(1, '#d97706');
      ctx.fillStyle = sunDisc;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 68, 0, Math.PI * 2);
      ctx.fill();

      // Sun corona rays
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(t * 0.08);
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#fef08a';
      for (let i = 0; i < 12; i++) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 70);
        ctx.lineTo(0, 130);
        ctx.stroke();
        ctx.rotate(Math.PI / 6);
      }
      ctx.restore();

      // Silhouette tree (multi-layer bonsai)
      ctx.fillStyle = '#12082a';
      // Trunk
      ctx.beginPath();
      ctx.moveTo(sunX - 28, sunY + 68);
      ctx.quadraticCurveTo(sunX - 5, sunY + 15, sunX + 18, sunY - 12);
      ctx.lineTo(sunX + 26, sunY - 8);
      ctx.quadraticCurveTo(sunX + 2, sunY + 20, sunX - 18, sunY + 68);
      ctx.closePath();
      ctx.fill();
      // Large foliage blobs
      const blobPts = [[-22, -20, 22], [10, -28, 18], [32, -12, 15], [-2, -38, 14], [18, -42, 10]];
      for (const [bx, by, br] of blobPts) {
        ctx.beginPath();
        ctx.arc(sunX + bx, sunY + by, br, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

    } else if (this.currentLevelIndex === 2) {
      // Full moon with neon aura
      ctx.save();
      const moonX = w * 0.78 - camera.x * 0.03;
      const moonY = h * 0.22 - camera.y * 0.03;
      // Purple moon glow rings
      for (let ring = 3; ring >= 0; ring--) {
        const rA = (4 - ring) * 0.09;
        const rR = 45 + ring * 40;
        const rG = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, rR);
        rG.addColorStop(0, `rgba(180, 80, 255, ${rA * 2})`);
        rG.addColorStop(1, 'transparent');
        ctx.fillStyle = rG;
        ctx.beginPath();
        ctx.arc(moonX, moonY, rR, 0, Math.PI * 2);
        ctx.fill();
      }
      const moonD = ctx.createRadialGradient(moonX - 8, moonY - 8, 0, moonX, moonY, 44);
      moonD.addColorStop(0, '#f0e7ff');
      moonD.addColorStop(0.6, '#c4b5fd');
      moonD.addColorStop(1, '#7c3aed');
      ctx.fillStyle = moonD;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 44, 0, Math.PI * 2);
      ctx.fill();
      // Moon craters
      ctx.fillStyle = 'rgba(76, 29, 149, 0.4)';
      for (const [cx, cy, cr] of [[-14, 8, 6], [10, -12, 4], [18, 14, 5], [-6, -18, 3]]) {
        ctx.beginPath();
        ctx.arc(moonX + cx, moonY + cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ── 3. FAR PARALLAX — Castle Skyline / Towers ─────────────
    ctx.save();
    const farPx = (camera.x * 0.08) % 480;
    const towerColor = this.currentLevelIndex === 3 ? '#1a0000' : '#10081e';
    ctx.fillStyle = towerColor;
    for (let sx = -farPx - 480; sx < w + 480; sx += 420) {
      // Main tower body
      ctx.fillRect(sx + 10, h * 0.15, 60, h * 0.85);
      // Merlon battlements
      for (let m = 0; m < 5; m++) {
        ctx.fillRect(sx + 10 + m * 13, h * 0.10, 9, h * 0.07);
      }
      // Tower needle spire
      ctx.beginPath();
      ctx.moveTo(sx + 30, h * 0.02);
      ctx.lineTo(sx + 40, h * 0.15);
      ctx.lineTo(sx + 20, h * 0.15);
      ctx.closePath();
      ctx.fill();
      // Narrow side turrets
      ctx.fillRect(sx - 8, h * 0.28, 20, h * 0.72);
      ctx.fillRect(sx + 68, h * 0.32, 18, h * 0.68);
    }
    ctx.restore();

    // ── 4. MIDGROUND — Gothic Arched Walls with Neon Windows ──
    ctx.save();
    const midPx = (camera.x * 0.28) % 360;
    const wallColor = this.currentLevelIndex === 3 ? '#110000' : '#0e0c1a';
    ctx.fillStyle = wallColor;
    for (let ax = -midPx - 360; ax < w + 360; ax += 320) {
      ctx.fillRect(ax, h * 0.18, 200, h * 0.82);
      // Gothic pointed arch opening
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(ax + 60, h * 0.26);
      ctx.quadraticCurveTo(ax + 60, h * 0.19, ax + 100, h * 0.19);
      ctx.quadraticCurveTo(ax + 140, h * 0.19, ax + 140, h * 0.26);
      ctx.lineTo(ax + 140, h * 0.52);
      ctx.lineTo(ax + 60, h * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Diamond window above arch
      const winColor = this.currentLevelIndex === 1 ? 'rgba(255, 180, 40, 0.35)' :
                        this.currentLevelIndex === 2 ? 'rgba(180, 80, 255, 0.45)' :
                        'rgba(255, 40, 20, 0.45)';
      ctx.fillStyle = winColor;
      ctx.shadowColor = this.currentLevelIndex === 2 ? '#b050ff' : '#ff8820';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(ax + 100, h * 0.20);
      ctx.lineTo(ax + 122, h * 0.26);
      ctx.lineTo(ax + 100, h * 0.32);
      ctx.lineTo(ax + 78, h * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = wallColor;
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // ── 5. NEON HANGING CHAINS (Tekken Stage Detail) ───────────
    ctx.save();
    const chainPx = (camera.x * 0.5) % 220;
    const chainColor = this.currentLevelIndex === 2 ? '#7c3aed' :
                        this.currentLevelIndex === 3 ? '#991b1b' : '#374151';
    for (let cx = -chainPx - 220; cx < w + 220; cx += 180) {
      ctx.strokeStyle = chainColor;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.65;
      ctx.shadowColor = chainColor;
      ctx.shadowBlur = 8;
      // Hanging chain catenary
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      const sag = 80 + Math.sin(t * 1.2 + cx) * 6;
      ctx.quadraticCurveTo(cx + 45, sag, cx + 90, sag * 0.5);
      ctx.stroke();
      // Chain link dots
      ctx.fillStyle = chainColor;
      for (let li = 0; li < 5; li++) {
        const lp = li / 4;
        const lx = cx + lp * 90;
        const ly = (1 - Math.pow(lp * 2 - 1, 2)) * sag * (lp < 0.5 ? 1 : 0.5);
        ctx.beginPath();
        ctx.ellipse(lx, ly, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // ── 6. HD TORCH SCONCES ────────────────────────────────────
    for (const torch of this.torches) {
      const rx = torch.x - camera.x;
      const ry = torch.y - camera.y;
      if (rx < -180 || rx > w + 180) continue;

      const fw = Math.sin(t * 14 + torch.flicker);
      const fw2 = Math.cos(t * 19 + torch.flicker * 1.3);

      // Ambient floor light pool
      const torchColor = this.currentLevelIndex === 3 ? 'rgba(220,50,0,' : 'rgba(34,197,94,';
      const poolG = ctx.createRadialGradient(rx, ry + 80, 5, rx, ry + 80, 120);
      poolG.addColorStop(0, torchColor + '0.25)');
      poolG.addColorStop(1, 'transparent');
      ctx.fillStyle = poolG;
      ctx.beginPath();
      ctx.ellipse(rx, ry + 80, 120, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wall glow aura
      const auraG = ctx.createRadialGradient(rx, ry - 12, 4, rx, ry - 12, 140);
      if (this.currentLevelIndex === 3) {
        auraG.addColorStop(0, 'rgba(255,80,0,0.5)');
        auraG.addColorStop(0.4, 'rgba(200,30,0,0.15)');
      } else {
        auraG.addColorStop(0, 'rgba(52,211,153,0.55)');
        auraG.addColorStop(0.4, 'rgba(16,185,129,0.18)');
      }
      auraG.addColorStop(1, 'transparent');
      ctx.fillStyle = auraG;
      ctx.beginPath();
      ctx.arc(rx, ry - 12, 140, 0, Math.PI * 2);
      ctx.fill();

      // Iron bracket
      const brG = ctx.createLinearGradient(rx - 10, ry - 6, rx + 10, ry + 6);
      brG.addColorStop(0, '#374151');
      brG.addColorStop(0.5, '#6b7280');
      brG.addColorStop(1, '#111827');
      ctx.fillStyle = brG;
      ctx.fillRect(rx - 10, ry - 4, 20, 7);
      ctx.fillRect(rx - 3, ry, 6, 22);

      // Flame (3 layers)
      const fColors = this.currentLevelIndex === 3
        ? ['#7f1d1d', '#dc2626', '#ff6b35']
        : ['#065f46', '#10b981', '#6ee7b7'];
      for (let fi = 0; fi < 3; fi++) {
        const fScale = 1 - fi * 0.25;
        const fOff = fw * (3 + fi) + fw2 * (2 + fi);
        ctx.fillStyle = fColors[fi];
        ctx.shadowColor = fColors[2];
        ctx.shadowBlur = 14 - fi * 4;
        ctx.beginPath();
        ctx.moveTo(rx - 8 * fScale + fOff, ry - 2);
        ctx.bezierCurveTo(
          rx - 10 * fScale + fOff, ry - 14 * fScale,
          rx + fOff * 0.5, ry - 22 * fScale,
          rx + fOff, ry - 26 * fScale
        );
        ctx.bezierCurveTo(
          rx + 10 * fScale + fOff * 0.3, ry - 20 * fScale,
          rx + 8 * fScale + fOff * 0.3, ry - 10 * fScale,
          rx + 7 * fScale + fOff * 0.3, ry - 2
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // ── 7. ATMOSPHERIC VOLUMETRIC FOG ─────────────────────────
    ctx.save();
    const fogScroll = (t * 18) % w;
    const fogAlpha = this.currentLevelIndex === 3 ? 0.12 : 0.07;
    const fogColor = this.currentLevelIndex === 3
      ? `rgba(150, 10, 0, ${fogAlpha})`
      : this.currentLevelIndex === 2
      ? `rgba(80, 0, 160, ${fogAlpha})`
      : `rgba(200, 80, 10, ${fogAlpha})`;
    for (let fi = 0; fi < 4; fi++) {
      const fx = ((fi * 380 - fogScroll * (0.6 + fi * 0.15)) % (w + 400)) - 200;
      const fogG = ctx.createRadialGradient(fx, h * 0.65, 0, fx, h * 0.65, 250);
      fogG.addColorStop(0, fogColor);
      fogG.addColorStop(1, 'transparent');
      ctx.fillStyle = fogG;
      ctx.beginPath();
      ctx.ellipse(fx, h * 0.65, 250, 60, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDeadCellsTile(ctx, rx, ry, x, y) {
    const ts = this.tileSize;
    const seed = (x * 2654435761 ^ y * 2246822519) >>> 0;
    const variation = seed % 4;

    // ── BASE STONE (3 color variations for visual richness) ──
    const stoneColors = [
      ['#1e293b', '#253549', '#0f172a'],
      ['#1c2738', '#243248', '#0e1625'],
      ['#1f2d40', '#26374d', '#0f1a28'],
      ['#1b2535', '#223047', '#0d1422'],
    ];
    const [baseCol, midCol, darkCol] = stoneColors[variation];

    const stoneG = ctx.createLinearGradient(rx, ry, rx + ts, ry + ts);
    stoneG.addColorStop(0, midCol);
    stoneG.addColorStop(0.4, baseCol);
    stoneG.addColorStop(1, darkCol);
    ctx.fillStyle = stoneG;
    ctx.fillRect(rx, ry, ts, ts);

    // ── STONE FACE DETAIL (chiseled marks) ──
    if (variation === 0 || variation === 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(rx + 8, ry + 10, 14, 2);
      ctx.fillRect(rx + 18, ry + 20, 10, 1.5);
    }

    // ── TOP BEVEL (highlight) ──
    const topBevel = ctx.createLinearGradient(rx, ry, rx, ry + 4);
    topBevel.addColorStop(0, 'rgba(100,140,180,0.4)');
    topBevel.addColorStop(1, 'transparent');
    ctx.fillStyle = topBevel;
    ctx.fillRect(rx, ry, ts, 4);

    // Left bevel
    const leftBevel = ctx.createLinearGradient(rx, ry, rx + 3, ry);
    leftBevel.addColorStop(0, 'rgba(80,120,160,0.3)');
    leftBevel.addColorStop(1, 'transparent');
    ctx.fillStyle = leftBevel;
    ctx.fillRect(rx, ry, 3, ts);

    // Bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(rx, ry + ts - 3, ts, 3);
    // Right shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(rx + ts - 3, ry, 3, ts);

    // Mortar joint
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(rx, ry + Math.floor(ts / 2), ts, 1.5);
    ctx.fillRect(rx + Math.floor(ts / 2), ry, 1.5, ts);

    // ── MOSS TOP SURFACE (Tekken HD wet stone look) ──
    if (!this.isSolid(x * ts + 10, (y - 1) * ts + 10)) {
      // Moss base
      const mossG = ctx.createLinearGradient(rx, ry, rx + ts, ry + 6);
      mossG.addColorStop(0, '#15803d');
      mossG.addColorStop(0.5, '#22c55e');
      mossG.addColorStop(1, '#166534');
      ctx.fillStyle = mossG;
      ctx.fillRect(rx, ry, ts, 5);
      // Moss highlight
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(rx + 2, ry, ts - 4, 1.5);
      // Moss tufts
      ctx.fillStyle = '#16a34a';
      for (let mi = 0; mi < 3; mi++) {
        const mx = rx + (seed % 6 + mi * 12);
        ctx.beginPath();
        ctx.ellipse(mx, ry + 1, 3, 2, 0, 0, Math.PI);
        ctx.fill();
      }
    }

    // ── DRAPING ROOTS (HD organic hanging roots) ──
    if (!this.isSolid(x * ts + 10, (y + 1) * ts + 10)) {
      const rootSeed = seed % 5;
      ctx.strokeStyle = '#0a1604';
      ctx.lineWidth = 2;
      if (rootSeed <= 1) {
        const rootX = rx + 8 + (seed % 18);
        ctx.beginPath();
        ctx.moveTo(rootX, ry + ts);
        ctx.bezierCurveTo(
          rootX - 4, ry + ts + 10,
          rootX + 6, ry + ts + 18,
          rootX + 2, ry + ts + 28
        );
        ctx.stroke();
        // Secondary thinner root
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#14290a';
        ctx.beginPath();
        ctx.moveTo(rootX + 5, ry + ts);
        ctx.bezierCurveTo(rootX + 9, ry + ts + 8, rootX + 2, ry + ts + 16, rootX + 4, ry + ts + 22);
        ctx.stroke();
      } else if (rootSeed === 2) {
        const rootX2 = rx + 22;
        ctx.beginPath();
        ctx.moveTo(rootX2, ry + ts);
        ctx.bezierCurveTo(rootX2 + 6, ry + ts + 14, rootX2 - 2, ry + ts + 24, rootX2 + 1, ry + ts + 32);
        ctx.stroke();
      }
    }
  }

  drawSpikeTile(ctx, rx, ry) {
    const ts = this.tileSize;
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const sx = rx + i * 10;
      const spikeGrad = ctx.createLinearGradient(sx, ry + ts, sx + 5, ry + 8);
      spikeGrad.addColorStop(0, '#1e293b');
      spikeGrad.addColorStop(0.5, '#64748b');
      spikeGrad.addColorStop(1, '#f1f5f9');

      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(sx, ry + ts);
      ctx.lineTo(sx + 5, ry + 6);
      ctx.lineTo(sx + 10, ry + ts);
      ctx.closePath();
      ctx.fill();

      // Blood tip
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(sx + 3, ry + 16);
      ctx.lineTo(sx + 5, ry + 6);
      ctx.lineTo(sx + 7, ry + 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawCheckpointCrystal(ctx, cp, camera) {
    const rx = cp.x - camera.x;
    const ry = cp.y - camera.y;
    const floatY = Math.sin(this.animTimer * 3) * 6;

    ctx.save();
    ctx.translate(rx, ry);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-18, 0, 36, 12);

    ctx.strokeStyle = cp.activated ? '#00f0ff' : '#475569';
    ctx.shadowColor = cp.activated ? '#00f0ff' : '#000';
    ctx.shadowBlur = cp.activated ? 24 : 0;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = cp.activated ? '#00f0ff' : '#64748b';
    ctx.beginPath();
    ctx.moveTo(0, -48 + floatY);
    ctx.lineTo(18, -26 + floatY);
    ctx.lineTo(0, -4 + floatY);
    ctx.lineTo(-18, -26 + floatY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -40 + floatY);
    ctx.lineTo(9, -26 + floatY);
    ctx.lineTo(0, -12 + floatY);
    ctx.lineTo(-9, -26 + floatY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawChest(ctx, ch, camera) {
    const rx = ch.x - camera.x;
    const ry = ch.y - camera.y;

    ctx.save();
    ctx.translate(rx, ry);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-18, -22, 36, 22);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-18, -22, 36, 5);
    ctx.fillRect(-18, -6, 36, 3);
    ctx.fillRect(-4, -15, 8, 9);

    if (ch.opened) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-18, -32, 36, 8);
    }
    ctx.restore();
  }

  drawExitPortal(ctx, door, camera) {
    const rx = door.x - camera.x;
    const ry = door.y - camera.y;

    ctx.save();
    ctx.translate(rx, ry);

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-28, -75, 56, 75);
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 4;
    ctx.strokeRect(-28, -75, 56, 75);

    ctx.fillStyle = '#581c87';
    ctx.shadowColor = '#d8b4fe';
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.ellipse(0, -38, 20, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -38, 7 + Math.sin(this.animTimer * 6) * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.LevelManager = LevelManager;
