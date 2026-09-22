// ============================================================
// DEAD CELLS HD LEVEL GENERATOR & RAMPARTS ATMOSPHERE RENDERER
// Multi-layer 2.5D Parallax with authentic high-res pixel art,
// ancient mossy stone masonry, glowing cyan crystals, and torches.
// ============================================================

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
    this.crystals = [];
    this.bgDecorations = [];
    this.animTimer = 0;
    
    // Load high-resolution Ramparts pixel art background asset
    this.rampartsBg = new Image();
    this.rampartsBg.src = 'assets/ramparts_bg.jpg';
    this.rampartsBgLoaded = false;
    this.rampartsBg.onload = () => {
      this.rampartsBgLoaded = true;
    };
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
    this.crystals = [];
    this.bgDecorations = [];
    this.exitDoor = null;

    if (stageNum === 1) {
      this.buildRampartsStage1();
    } else if (stageNum === 2) {
      this.buildRampartsStage2();
    } else {
      this.buildBossCrypt();
    }

    this.generateAtmosphere();

    const stageTitles = [
      '',
      "THE RAMPARTS - OUTER BASTION",
      "THE RAMPARTS - UPPER BATTLEMENTS",
      "THE THRONE ROOM OF THE ALCHEMIST KING"
    ];
    const badge = document.getElementById('stage-badge');
    if (badge) badge.innerText = stageTitles[stageNum] || 'THE RAMPARTS';

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
    // 1. Wall Torches along the fortress
    for (let x = 4; x < this.mapWidth - 4; x += 5) {
      this.torches.push({
        x: x * this.tileSize + 20,
        y: 6 * this.tileSize + 10,
        flicker: Math.random() * Math.PI * 2
      });
    }

    // 2. Glowing Cyan Crystal Clusters (matching the approved artwork)
    for (let x = 3; x < this.mapWidth - 3; x += 4) {
      // Find top solid ground
      for (let y = 3; y < this.mapHeight - 1; y++) {
        if (this.tiles[y][x] === 1 && this.tiles[y-1][x] === 0) {
          if (Math.random() < 0.6) {
            this.crystals.push({
              x: x * this.tileSize + (Math.random() * 20 + 10),
              y: y * this.tileSize,
              size: 16 + Math.random() * 10
            });
          }
          break;
        }
      }
    }

    // 3. Hanging Chains and Vines from ceilings & towers
    for (let x = 2; x < this.mapWidth - 2; x += 3) {
      if (Math.random() > 0.35) {
        this.bgDecorations.push({
          x: x * this.tileSize,
          y: 40,
          type: Math.random() > 0.5 ? 'chain' : 'vine',
          length: 70 + Math.random() * 110
        });
      }
    }
  }

  // ==========================================
  // STAGE 1: THE RAMPARTS (OUTER BASTION)
  // ==========================================
  buildRampartsStage1() {
    this.mapWidth = 78;
    this.mapHeight = 18;
    this.tiles = Array(this.mapHeight).fill(0).map(() => Array(this.mapWidth).fill(0));

    // Floor & Ceiling borders
    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[0][x] = 1;
      this.tiles[this.mapHeight - 1][x] = 1;
    }
    for (let y = 0; y < this.mapHeight; y++) {
      this.tiles[y][0] = 1;
      this.tiles[y][this.mapWidth - 1] = 1;
    }

    // Castle Battlements & Ramparts platforms
    for (let x = 4; x <= 14; x++) this.tiles[13][x] = 1;
    for (let x = 16; x <= 24; x++) this.tiles[10][x] = 1;
    for (let x = 20; x <= 26; x++) this.tiles[17][x] = 3; // Spikes in pit

    // Middle Ramparts Bridge & Towers
    for (let x = 28; x <= 46; x++) this.tiles[13][x] = 1;
    for (let x = 32; x <= 40; x++) this.tiles[8][x] = 1;

    // Tower climb
    for (let y = 7; y <= 16; y++) {
      this.tiles[y][48] = 1;
    }
    for (let x = 50; x <= 62; x++) this.tiles[11][x] = 1;
    for (let x = 64; x <= 74; x++) this.tiles[14][x] = 1;
    for (let x = 54; x <= 58; x++) this.tiles[17][x] = 3; // Spikes

    // Breakable Wooden Doors
    this.doors.push({ x: 560, y: 520, w: 30, h: 64, broken: false });
    this.doors.push({ x: 1920, y: 440, w: 30, h: 64, broken: false });

    // Props: Barrels and Amphoras
    this.props.push({ x: 380, y: 520, type: 'barrel' });
    this.props.push({ x: 410, y: 520, type: 'amphora' });
    this.props.push({ x: 800, y: 400, type: 'barrel' });
    this.props.push({ x: 1460, y: 520, type: 'amphora' });

    // Checkpoints & Loot
    this.checkpoints.push({ x: 200, y: 520, activated: true, id: 'cp1_1' });
    this.checkpoints.push({ x: 1400, y: 520, activated: false, id: 'cp1_2' });

    this.scrolls.push({ x: 750, y: 360, collected: false });
    this.chests.push({ x: 500, y: 480, opened: false, reward: 'gold' });
    this.chests.push({ x: 2300, y: 400, opened: false, reward: 'weapon' });

    this.npcs.push({ x: 1520, y: 520, type: 'merchant', name: 'Goblin Merchant' });
    this.exitDoor = { x: 2900, y: 560, nextStage: 2 };
  }

  // ==========================================
  // STAGE 2: THE RAMPARTS (UPPER BATTLEMENTS)
  // ==========================================
  buildRampartsStage2() {
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

    // Giant Stone Keep Tower
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

    this.checkpoints.push({ x: 160, y: 600, activated: true, id: 'cp2_1' });
    this.checkpoints.push({ x: 1640, y: 280, activated: false, id: 'cp2_2' });

    this.scrolls.push({ x: 1000, y: 440, collected: false });
    this.chests.push({ x: 2500, y: 520, opened: false, reward: 'weapon' });

    this.npcs.push({ x: 1640, y: 280, type: 'collector', name: 'The Collector' });
    this.exitDoor = { x: 3200, y: 640, nextStage: 3 };
  }

  // ==========================================
  // STAGE 3: THRONE ROOM
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
  }

  // ==========================================
  // RENDERING PIPELINE
  // ==========================================
  // RENDERING PIPELINE: MULTI-LAYER DEPTH
  // ==========================================
  draw(ctx, camera) {
    this.animTimer += 0.016;
    this.drawSkyAndParallax(ctx, camera);
    this.drawMidground(ctx, camera);
    this.drawDecorations(ctx, camera);
    for (const door of this.doors) {
      window.spriteRenderer.drawWoodenDoor(ctx, door, camera);
    }
    window.spriteRenderer.drawProps(ctx, this.props, camera);
    this.drawTiles(ctx, camera);
    this.drawInteractions(ctx, camera);
  }

  drawTiles(ctx, camera) {
    const ts = this.tileSize;
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
          this.drawDetailedTile(ctx, rx, ry, x, y);
        } else if (tile === 3) {
          this.drawSpikeTile(ctx, rx, ry);
        }
      }
    }
  }

  drawInteractions(ctx, camera) {
    // Glowing Cyan Crystals on Stone Platforms
    for (const crystal of this.crystals) {
      const rx = crystal.x - camera.x;
      const ry = crystal.y - camera.y;
      if (rx > -50 && rx < camera.w + 50) {
        this.drawCrystalCluster(ctx, rx, ry, crystal.size, this.animTimer);
      }
    }

    // Checkpoints, Scrolls, Chests, Portals
    for (const cp of this.checkpoints) {
      this.drawCheckpointCrystal(ctx, cp, camera);
    }
    for (const scr of this.scrolls) {
      if (!scr.collected) {
        const rx = scr.x - camera.x;
        const ry = scr.y - camera.y + Math.sin(this.animTimer * 4) * 6;
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📜', rx, ry);
        ctx.restore();
      }
    }
    for (const ch of this.chests) {
      this.drawChest(ctx, ch, camera);
    }
    if (this.exitDoor) {
      this.drawExitPortal(ctx, this.exitDoor, camera);
    }
  }

  // ── Authentic High-Res Ramparts Parallax Backdrop ───────────
  drawSkyAndParallax(ctx, camera) {
    const w = camera.w;
    const h = camera.h;

    // Authentic Dead Cells Ramparts Pixel Art Artwork
    if (this.rampartsBgLoaded && this.rampartsBg.naturalWidth > 0) {
      const img = this.rampartsBg;
      const scale = Math.max(h / img.naturalHeight, 1.0);
      const bgW = img.naturalWidth * scale;
      const bgH = img.naturalHeight * scale;

      // Smooth horizontal parallax panning
      const px = (camera.x * 0.18) % bgW;
      const py = Math.max(0, camera.y * 0.08);

      for (let x = -px - bgW; x < w + bgW; x += bgW) {
        ctx.drawImage(img, Math.floor(x), Math.floor(-py), Math.ceil(bgW), Math.ceil(bgH));
      }

      // Very subtle twilight atmospheric vignette
      const atmo = ctx.createLinearGradient(0, 0, 0, h);
      atmo.addColorStop(0, 'rgba(46, 16, 101, 0.12)');
      atmo.addColorStop(0.4, 'rgba(0, 0, 0, 0)');
      atmo.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
      atmo.addColorStop(1, 'rgba(15, 23, 42, 0.25)');
      ctx.fillStyle = atmo;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Fallback: Rich sunset gradient sky
      const skyG = ctx.createLinearGradient(0, 0, 0, h);
      skyG.addColorStop(0, '#0f172a');
      skyG.addColorStop(0.3, '#4c1d95');
      skyG.addColorStop(0.65, '#9f1239');
      skyG.addColorStop(1, '#ea580c');
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, w, h);

      // Crescent Moon
      ctx.save();
      const moonX = w * 0.22 - camera.x * 0.02;
      const moonY = h * 0.18 - camera.y * 0.02;
      ctx.fillStyle = '#e2e8f0';
      ctx.shadowColor = '#c4b5fd';
      ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(moonX, moonY, 32, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(moonX + 12, moonY - 8, 28, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // ── Midground Architecture ──────────────────────────────────
  drawMidground(ctx, camera) {
    const w = camera.w;
    const h = camera.h;
    ctx.save();

    const midPx = (camera.x * 0.35) % 600;

    // Gothic fortress pillars & bridge arches
    for (let ax = -midPx - 300; ax < w + 600; ax += 420) {
      // Semi-transparent stone bridge pillar
      const pillarG = ctx.createLinearGradient(ax, 0, ax + 90, 0);
      pillarG.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
      pillarG.addColorStop(0.5, 'rgba(30, 41, 59, 0.85)');
      pillarG.addColorStop(1, 'rgba(10, 15, 30, 0.7)');
      ctx.fillStyle = pillarG;
      ctx.fillRect(ax, h * 0.25, 90, h * 0.75);

      // Mortar seams
      ctx.fillStyle = 'rgba(2, 6, 23, 0.5)';
      for (let by = h * 0.25; by < h; by += 22) {
        ctx.fillRect(ax, by, 90, 2);
        ctx.fillRect(ax + 30, by, 2, 22);
        ctx.fillRect(ax + 60, by, 2, 22);
      }

      // Connecting bridge arch
      ctx.beginPath();
      ctx.moveTo(ax + 90, h * 0.42);
      ctx.quadraticCurveTo(ax + 250, h * 0.25, ax + 420, h * 0.42);
      ctx.lineTo(ax + 420, h * 0.49);
      ctx.quadraticCurveTo(ax + 250, h * 0.32, ax + 90, h * 0.49);
      ctx.fill();

      // Swaying Tattered Red Banners
      const wind = Math.sin(this.animTimer * 4 + ax * 0.01) * 12;
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(ax + 20, h * 0.32);
      ctx.lineTo(ax + 55, h * 0.32);
      ctx.lineTo(ax + 55 + wind * 0.6, h * 0.58);
      ctx.lineTo(ax + 38 + wind, h * 0.52); // Torn bottom
      ctx.lineTo(ax + 20 + wind * 0.6, h * 0.58);
      ctx.closePath();
      ctx.fill();

      // Golden symbol on banner
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ax + 37 + wind * 0.3, h * 0.4, 4, 0, Math.PI * 2);
      ctx.fill();

      // Moss streak on pillar
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.fillRect(ax, h * 0.25, 20, h * 0.5);
    }

    ctx.restore();
  }

  // ── Decorations & Weather Effects ───────────────────────────
  drawDecorations(ctx, camera) {
    const w = camera.w;
    const h = camera.h;
    ctx.save();

    // Floating embers and wind dust particles (Leaves/Sparks)
    for (let i = 0; i < 35; i++) {
      const pX = (i * 75 - camera.x * 0.85 + this.animTimer * 120) % (w + 200) - 100;
      const pY = (Math.sin(this.animTimer * 1.5 + i) * 160 + h * 0.5) % h;
      if (pX > 0 && pX < w) {
        ctx.fillStyle = i % 3 === 0 ? '#34d399' : '#fb923c'; // Emerald or fiery orange
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pX, pY, 1.5 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    // Hanging chains & green vines
    for (const dec of this.bgDecorations) {
      const rx = dec.x - camera.x * 0.6;
      if (rx < -100 || rx > w + 100) continue;

      if (dec.type === 'chain') {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, dec.length); ctx.stroke();
        ctx.fillStyle = '#1e293b';
        for (let i = 10; i < dec.length; i += 12) {
          ctx.beginPath(); ctx.ellipse(rx, i, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#64748b'; ctx.stroke();
        }
      } else if (dec.type === 'vine') {
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        for (let i = 10; i < dec.length; i += 18) {
          ctx.lineTo(rx + Math.sin(i * 0.12 + this.animTimer * 2) * 8, i);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ── Cyan Crystal Clusters (Matching Mockup) ─────────────────
  drawCrystalCluster(ctx, rx, ry, size, animTimer) {
    ctx.save();
    ctx.translate(rx, ry);

    const glow = 0.65 + Math.sin(animTimer * 3 + rx * 0.1) * 0.35;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14 * glow;

    // Cluster of 4 sharp angular crystal shards
    const shards = [
      { dx: 0, dy: 0, w: size * 0.35, h: size, rot: -0.08 },
      { dx: -size * 0.32, dy: size * 0.15, w: size * 0.26, h: size * 0.72, rot: -0.32 },
      { dx: size * 0.3, dy: size * 0.25, w: size * 0.28, h: size * 0.65, rot: 0.28 },
      { dx: size * 0.12, dy: size * 0.35, w: size * 0.2, h: size * 0.5, rot: 0.12 }
    ];

    for (const s of shards) {
      ctx.save();
      ctx.translate(s.dx, -s.dy);
      ctx.rotate(s.rot);

      const grad = ctx.createLinearGradient(-s.w / 2, -s.h, s.w / 2, 0);
      grad.addColorStop(0, '#e0f7fa');
      grad.addColorStop(0.3, '#00e5ff');
      grad.addColorStop(0.8, '#0891b2');
      grad.addColorStop(1, '#0e7490');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(0, -s.h);
      ctx.lineTo(s.w / 2, -s.h * 0.35);
      ctx.lineTo(s.w / 2, 0);
      ctx.lineTo(-s.w / 2, 0);
      ctx.lineTo(-s.w / 2, -s.h * 0.35);
      ctx.closePath();
      ctx.fill();

      // Specular highlight facet
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -s.h);
      ctx.lineTo(-s.w / 2, -s.h * 0.35);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  // ── Authentic Dead Cells Mossy Stone Masonry ───────────────
  drawDetailedTile(ctx, rx, ry, x, y) {
    const ts = this.tileSize;
    const seed = (x * 73856093 ^ y * 19349663) >>> 0;

    // 1. Base Dark Slate Castle Stone
    const blockG = ctx.createLinearGradient(rx, ry, rx + ts, ry + ts);
    blockG.addColorStop(0, '#2d3748'); // Dark slate grey
    blockG.addColorStop(0.5, '#1e293b');
    blockG.addColorStop(1, '#0f172a');
    ctx.fillStyle = blockG;
    ctx.fillRect(rx, ry, ts, ts);

    // 2. Brick Seams / Mortar (2 courses of stone per tile)
    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    ctx.fillRect(rx, ry + ts / 2, ts, 2); // Horizontal seam
    if ((y % 2 === 0)) {
      ctx.fillRect(rx + ts * 0.5, ry, 2, ts / 2);
      ctx.fillRect(rx + ts * 0.25, ry + ts / 2, 2, ts / 2);
      ctx.fillRect(rx + ts * 0.75, ry + ts / 2, 2, ts / 2);
    } else {
      ctx.fillRect(rx + ts * 0.3, ry, 2, ts / 2);
      ctx.fillRect(rx + ts * 0.8, ry, 2, ts / 2);
      ctx.fillRect(rx + ts * 0.5, ry + ts / 2, 2, ts / 2);
    }

    // 3. Bevel Highlights & Deep Shadows
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(rx, ry, ts, 2); // Top edge highlight
    ctx.fillRect(rx, ry, 2, ts); // Left edge highlight

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(rx, ry + ts - 3, ts, 3); // Bottom shadow
    ctx.fillRect(rx + ts - 3, ry, 3, ts); // Right shadow

    // 4. Random Stone Cracks
    if (seed % 3 === 0) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx + 6, ry + 12);
      ctx.lineTo(rx + 16, ry + 18);
      ctx.lineTo(rx + 22, ry + 28);
      ctx.stroke();
    }

    // 5. Lush Neon Green Moss on Top Surface (matching Ramparts artwork)
    if (!this.isSolid(x * ts, (y - 1) * ts)) {
      const mossG = ctx.createLinearGradient(rx, ry, rx, ry + 10);
      mossG.addColorStop(0, '#4ade80'); // Bright vivid lime-green
      mossG.addColorStop(0.5, '#22c55e'); // Emerald
      mossG.addColorStop(1, '#15803d'); // Deep moss green
      ctx.fillStyle = mossG;
      ctx.fillRect(rx, ry, ts, 7);

      // Hanging moss droplets/tendrils
      ctx.beginPath();
      ctx.moveTo(rx + 4, ry + 7);
      ctx.lineTo(rx + 9, ry + 15 + (seed % 6));
      ctx.lineTo(rx + 14, ry + 7);

      ctx.moveTo(rx + 22, ry + 7);
      ctx.lineTo(rx + 27, ry + 13 + (seed % 5));
      ctx.lineTo(rx + 32, ry + 7);
      ctx.fill();
    }
  }

  drawSpikeTile(ctx, rx, ry) {
    const ts = this.tileSize;
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const sx = rx + i * 10;
      const spikeGrad = ctx.createLinearGradient(sx, ry + ts, sx + 5, ry + 10);
      spikeGrad.addColorStop(0, '#1e293b');
      spikeGrad.addColorStop(1, '#94a3b8');

      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(sx, ry + ts);
      ctx.lineTo(sx + 5, ry + 8);
      ctx.lineTo(sx + 10, ry + ts);
      ctx.closePath();
      ctx.fill();

      // Dripping Blood tip
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(sx + 3, ry + 16);
      ctx.lineTo(sx + 5, ry + 8);
      ctx.lineTo(sx + 7, ry + 16);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Interactive Elements ───────────────────────────────────
  drawCheckpointCrystal(ctx, cp, camera) {
    const rx = cp.x - camera.x;
    const ry = cp.y - camera.y;
    const floatY = Math.sin(this.animTimer * 3) * 6;

    ctx.save();
    ctx.translate(rx, ry);

    // Stone Pedestal
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-22, 0, 44, 12);
    ctx.strokeStyle = '#64748b';
    ctx.strokeRect(-22, 0, 44, 12);

    // Giant Glowing Teleport Crystal
    const color = cp.activated ? '#00f0ff' : '#64748b';
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = color;
    ctx.shadowBlur = cp.activated ? 30 : 5;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -48 + floatY);
    ctx.lineTo(16, -24 + floatY);
    ctx.lineTo(0, 0 + floatY);
    ctx.lineTo(-16, -24 + floatY);
    ctx.closePath();
    ctx.fill();

    if (cp.activated) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -36 + floatY);
      ctx.lineTo(8, -24 + floatY);
      ctx.lineTo(0, -12 + floatY);
      ctx.lineTo(-8, -24 + floatY);
      ctx.fill();
    }

    ctx.restore();
  }

  drawChest(ctx, ch, camera) {
    const rx = ch.x - camera.x;
    const ry = ch.y - camera.y;

    ctx.save();
    ctx.translate(rx, ry);

    if (!ch.opened) {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-20, -20, 40, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-22, -22, 44, 5);
      ctx.fillRect(-4, -18, 8, 8);
    } else {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-20, -15, 40, 15);
      ctx.save();
      ctx.translate(-20, -15);
      ctx.rotate(-2.5);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, 40, 5);
      ctx.restore();
    }
    ctx.restore();
  }

  drawExitPortal(ctx, portal, camera) {
    const rx = portal.x - camera.x;
    const ry = portal.y - camera.y;

    ctx.save();
    ctx.translate(rx, ry);

    const spin = this.animTimer * 2.2;

    // Stone Archway
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(-42, -64);
    ctx.arc(0, -64, 42, Math.PI, 0);
    ctx.lineTo(42, 0);
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Swirling Void Vortex
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      ctx.rotate(spin + i);
      const vG = ctx.createRadialGradient(0, -42, 0, 0, -42, 38);
      vG.addColorStop(0, '#a855f7');
      vG.addColorStop(0.5, '#00e5ff');
      vG.addColorStop(1, 'transparent');
      ctx.fillStyle = vG;
      ctx.beginPath();
      ctx.ellipse(0, -42, 38, 12 + Math.sin(spin) * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.LevelManager = LevelManager;
