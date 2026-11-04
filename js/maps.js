import * as THREE from 'three';
import { canvasTex, speckle, box, rand } from './util.js';

// ---------------------------------------------------------------------------
// Themed maps. Every map shares the same arena footprint and cover layout (so
// every training mode plays identically) but has its own sky, light, fog,
// surfaces, cover materials, props and weather.
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2;
const H_ = (x) => x;

// ---------- sky ------------------------------------------------------------
// Equirectangular canvas on an inverted sphere. u=0.75 is straight ahead (-Z),
// v=0.5 is the horizon (canvas y = h/2).
function skyTexture({ stops, sun, stars = 0, skyline, clouds }) {
  return canvasTex(2048, 1024, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    for (const [o, c] of stops) g.addColorStop(o, c);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < stars; i++) {
      const sy = Math.random() * h * 0.42;
      x.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
      const s = Math.random() < 0.08 ? 2.2 : 1.1;
      x.fillRect(Math.random() * w, sy, s, s);
    }
    if (sun) {
      const sx = sun.u * w, sy = sun.v * h;
      const glow = x.createRadialGradient(sx, sy, 0, sx, sy, sun.glow);
      glow.addColorStop(0, sun.halo); glow.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = glow; x.fillRect(sx - sun.glow, sy - sun.glow, sun.glow * 2, sun.glow * 2);
      x.fillStyle = sun.color; x.beginPath(); x.ellipse(sx, sy, sun.r * 0.9, sun.r, 0, 0, TAU); x.fill();
    }
    if (clouds) {
      for (let i = 0; i < clouds.n; i++) {
        const cy = h * (0.2 + Math.random() * 0.26), cx = Math.random() * w, cw = 80 + Math.random() * 260;
        x.fillStyle = clouds.color; x.globalAlpha = 0.25 + Math.random() * 0.35;
        x.beginPath(); x.ellipse(cx, cy, cw, cw * 0.12, 0, 0, TAU); x.fill();
      }
      x.globalAlpha = 1;
    }
    if (skyline) skyline(x, w, h);
  });
}

function ridge(x, w, h, color, base, amp, freqs, seed = 0) {
  x.fillStyle = color; x.beginPath(); x.moveTo(0, h);
  for (let px = 0; px <= w; px += 4) {
    let y = 0;
    freqs.forEach(([f, a], i) => { y += Math.sin((px / w) * TAU * f + seed * (i + 1)) * a; });
    x.lineTo(px, h * base - amp * (0.6 + y));
  }
  x.lineTo(w, h); x.closePath(); x.fill();
}

// ---------- surface textures ----------------------------------------------
const T = {
  sand: () => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#c99a63'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(120,80,40,${0.05 + Math.random() * 0.08})`; x.lineWidth = 2 + Math.random() * 3; x.beginPath(); const y0 = Math.random() * h; x.moveTo(0, y0); x.bezierCurveTo(w * .3, y0 - 20, w * .6, y0 + 20, w, y0); x.stroke(); }
    speckle(x, w, h, 9000, 0.18); speckle(x, w, h, 6000, 0.16, true);
  }, { repeat: [10, 22] }),
  sandstone: (rx, ry) => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#b88458'; x.fillRect(0, 0, w, h);
    speckle(x, w, h, 7000, 0.16); speckle(x, w, h, 4000, 0.12, true);
    x.strokeStyle = 'rgba(80,50,30,.55)'; x.lineWidth = 4;
    for (let r = 0; r < 8; r++) { const y = r * 64; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); for (let c = 0; c < 5; c++) { const bx = c * 128 + (r % 2) * 64; x.beginPath(); x.moveTo(bx, y); x.lineTo(bx, y + 64); x.stroke(); } }
  }, { repeat: [rx, ry] }),
  snow: () => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#e9eff5'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { const g = x.createRadialGradient(Math.random() * w, Math.random() * h, 0, Math.random() * w, Math.random() * h, 120); g.addColorStop(0, 'rgba(160,185,210,.18)'); g.addColorStop(1, 'rgba(160,185,210,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
    speckle(x, w, h, 5000, 0.08); speckle(x, w, h, 3000, 0.4, true);
    x.strokeStyle = 'rgba(120,140,160,.12)'; x.lineWidth = 3;
    for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(w * .5 + i * 10, 0); x.lineTo(w * .5 + i * 6, h); x.stroke(); }
  }, { repeat: [9, 20] }),
  iceConcrete: (rx, ry) => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#8f9fae'; x.fillRect(0, 0, w, h);
    speckle(x, w, h, 8000, 0.15); speckle(x, w, h, 6000, 0.22, true);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.25, 'rgba(255,255,255,0)'); g.addColorStop(.85, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.45)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(40,50,60,.5)'; x.lineWidth = 3; x.strokeRect(1, 1, w - 2, h - 2);
  }, { repeat: [rx, ry] }),
  asphalt: () => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#16151b'; x.fillRect(0, 0, w, h);
    speckle(x, w, h, 12000, 0.25, true); speckle(x, w, h, 6000, 0.4);
    for (let i = 0; i < 6; i++) { const g = x.createRadialGradient(Math.random() * w, Math.random() * h, 0, Math.random() * w, Math.random() * h, 90); g.addColorStop(0, 'rgba(40,30,70,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
    x.fillStyle = 'rgba(255,255,255,.22)'; for (let y = 0; y < h; y += 128) x.fillRect(w / 2 - 4, y, 8, 64);
  }, { repeat: [6, 14] }),
  brick: (rx, ry) => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#2a2026'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 16; r++) for (let c = 0; c < 9; c++) {
      const bx = c * 64 + (r % 2) * 32 - 32, by = r * 32;
      x.fillStyle = `rgb(${50 + Math.random() * 30},${32 + Math.random() * 14},${38 + Math.random() * 16})`;
      x.fillRect(bx + 2, by + 2, 60, 28);
    }
    speckle(x, w, h, 6000, 0.3);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }, { repeat: [rx, ry] }),
  jungleFloor: () => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#4b5a2c'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(${90 + Math.random() * 40},${80 + Math.random() * 30},${50},.35)`; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 20 + Math.random() * 40, Math.random() * 3, 0, TAU); x.fill(); }
    // old flagstones
    x.strokeStyle = 'rgba(30,35,20,.55)'; x.lineWidth = 5;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (Math.random() < 0.55) { x.fillStyle = 'rgba(120,120,100,.35)'; x.fillRect(i * 128 + 6, j * 128 + 6, 116, 116); x.strokeRect(i * 128 + 6, j * 128 + 6, 116, 116); }
    for (let i = 0; i < 4000; i++) { x.strokeStyle = `rgba(${60 + Math.random() * 60},${110 + Math.random() * 60},${30},.6)`; x.lineWidth = 1; const gx = Math.random() * w, gy = Math.random() * h; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + rand(-2, 2), gy - rand(3, 8)); x.stroke(); }
  }, { repeat: [9, 20] }),
  mossStone: (rx, ry) => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#6a6c5c'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const bx = c * 180 + (r % 2) * 90 - 90, by = r * 128;
      x.fillStyle = `rgb(${95 + Math.random() * 25},${96 + Math.random() * 22},${82 + Math.random() * 16})`;
      x.fillRect(bx + 4, by + 4, 172, 120);
    }
    speckle(x, w, h, 8000, 0.2);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${50 + Math.random() * 30},${100 + Math.random() * 50},${30},${.25 + Math.random() * .35})`; x.beginPath(); x.ellipse(Math.random() * w, h * (0.6 + Math.random() * 0.4), 20 + Math.random() * 60, 10 + Math.random() * 30, 0, 0, TAU); x.fill(); }
  }, { repeat: [rx, ry] }),
  portConcrete: () => canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#4c4b4a'; x.fillRect(0, 0, w, h);
    speckle(x, w, h, 9000, 0.2); speckle(x, w, h, 5000, 0.14, true);
    for (let i = 0; i < 5; i++) { const g = x.createRadialGradient(Math.random() * w, Math.random() * h, 0, Math.random() * w, Math.random() * h, 70); g.addColorStop(0, 'rgba(10,10,10,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
    x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 4; x.strokeRect(0, 0, w, h);
    x.fillStyle = 'rgba(240,190,20,.7)'; x.fillRect(40, 0, 10, h);
  }, { repeat: [8, 18] }),
  corrugated: (rx, ry) => canvasTex(512, 512, (x, w, h) => {
    for (let i = 0; i < w; i += 16) { const g = x.createLinearGradient(i, 0, i + 16, 0); g.addColorStop(0, '#5a3626'); g.addColorStop(.5, '#8a5236'); g.addColorStop(1, '#4a2c20'); x.fillStyle = g; x.fillRect(i, 0, 16, h); }
    for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(${140 + Math.random() * 60},${70 + Math.random() * 30},20,${.15 + Math.random() * .25})`; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 50, 30 + Math.random() * 90, 0, 0, TAU); x.fill(); }
    speckle(x, w, h, 6000, 0.25);
  }, { repeat: [rx, ry] }),
  sandbag: () => canvasTex(256, 128, (x, w, h) => {
    x.fillStyle = '#8a7650'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const bx = c * 64 + (r % 2) * 32 - 32, by = r * 43; const g = x.createRadialGradient(bx + 32, by + 20, 4, bx + 32, by + 20, 40); g.addColorStop(0, '#b39d6c'); g.addColorStop(1, '#5e4f34'); x.fillStyle = g; x.beginPath(); x.ellipse(bx + 32, by + 21, 31, 20, 0, 0, TAU); x.fill(); }
    speckle(x, w, h, 2000, 0.2);
  }),
  ribbed: (base) => canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 12) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i, 0, 4, h); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(i + 5, 0, 3, h); }
    speckle(x, w, h, 2500, 0.25);
    x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 10; x.strokeRect(0, 0, w, h);
  }),
  flightcase: () => canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#23232a'; x.fillRect(0, 0, w, h); speckle(x, w, h, 2000, 0.2, true);
    x.fillStyle = '#c9c9cf'; for (const [a, b] of [[0, 0], [w - 40, 0], [0, h - 40], [w - 40, h - 40]]) x.fillRect(a, b, 40, 40);
    x.fillStyle = '#ffd400'; x.font = 'bold 30px monospace'; x.fillText('FRAGILE', 66, 140);
  }),
  stoneBlock: () => canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#7d7a68'; x.fillRect(0, 0, w, h); speckle(x, w, h, 4000, 0.25);
    x.strokeStyle = 'rgba(40,40,30,.6)'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
    x.beginPath(); x.arc(w / 2, h / 2, 50, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(w / 2, 80); x.lineTo(w / 2, 176); x.moveTo(80, h / 2); x.lineTo(176, h / 2); x.stroke();
    x.fillStyle = 'rgba(70,120,40,.45)'; x.fillRect(0, h - 40, w, 40);
  }),
  hazard: () => canvasTex(256, 128, (x, w, h) => {
    x.fillStyle = '#e8b010'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#161616'; for (let i = -4; i < 12; i++) { x.save(); x.translate(i * 40, 0); x.transform(1, 0, -0.7, 1, 0, 0); x.fillRect(0, 0, 20, h); x.restore(); }
    speckle(x, w, h, 1500, 0.3);
  }),
  windows: (lit) => canvasTex(128, 256, (x, w, h) => {
    x.fillStyle = '#0b0a12'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 24; r++) for (let c = 0; c < 6; c++) if (Math.random() < lit) { x.fillStyle = ['#ffd27a', '#7ff2ff', '#ff7ad9', '#fff4d0'][Math.floor(Math.random() * 4)]; x.globalAlpha = 0.5 + Math.random() * 0.5; x.fillRect(c * 20 + 5, r * 10 + 2, 12, 6); }
    x.globalAlpha = 1;
  }),
  billboard: (title, sub, c1, c2) => canvasTex(512, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    x.fillStyle = '#07050c'; x.fillRect(0, 0, w, h);
    x.strokeStyle = c1; x.lineWidth = 10; x.shadowColor = c1; x.shadowBlur = 24; x.strokeRect(12, 12, w - 24, h - 24);
    x.fillStyle = g; x.font = '900 92px "Oxanium", sans-serif'; x.textAlign = 'center'; x.fillText(title, w / 2, 140);
    x.shadowBlur = 0; x.fillStyle = '#ffffff'; x.font = '600 30px "Oxanium", sans-serif'; x.fillText(sub, w / 2, 200);
  }),
};

const mat = (o) => new THREE.MeshStandardMaterial(o);
const basic = (o) => new THREE.MeshBasicMaterial({ toneMapped: false, ...o });

// ---------- weather --------------------------------------------------------
function makeWeather(kind, quality) {
  if (!kind) return null;
  const hi = quality === 'high';
  const n = { snow: hi ? 2200 : 900, rain: hi ? 1600 : 700, dust: hi ? 700 : 300, fireflies: 140 }[kind];
  const R = 22, HY = 14;
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = rand(-R, R); pos[i * 3 + 1] = rand(0, HY); pos[i * 3 + 2] = rand(-R, R); seed[i] = Math.random() * 100; }
  let obj;
  if (kind === 'rain') {
    const seg = new Float32Array(n * 6);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(seg, 3));
    obj = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x9fb8ff, transparent: true, opacity: 0.35, depthWrite: false }));
  } else {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
    const spr = canvasTex(64, 64, (x, w) => { const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); });
    const color = { snow: 0xffffff, dust: 0xffd2a0, fireflies: 0xd8ff6a }[kind];
    const size = { snow: 0.13, dust: 0.06, fireflies: 0.22 }[kind];
    obj = new THREE.Points(g, new THREE.PointsMaterial({ map: spr, color, size, transparent: true, opacity: kind === 'dust' ? 0.55 : 0.9, depthWrite: false, blending: kind === 'fireflies' ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true }));
  }
  obj.frustumCulled = false;
  const center = new THREE.Vector3();
  return {
    obj,
    update(dt, cam, t) {
      center.set(cam.x, 0, cam.z);
      const fall = { snow: 1.3, rain: 19, dust: -0.05, fireflies: 0 }[kind];
      for (let i = 0; i < n; i++) {
        let x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        const s = seed[i];
        y -= fall * dt * (0.7 + (s % 1) * 0.6);
        if (kind === 'snow') { x += Math.sin(t * 0.8 + s) * 0.4 * dt; z += Math.cos(t * 0.6 + s) * 0.3 * dt; }
        if (kind === 'dust') { x += (0.6 + Math.sin(t * 0.3 + s) * 0.4) * dt; z += Math.cos(t * 0.4 + s) * 0.2 * dt; }
        if (kind === 'fireflies') { x += Math.sin(t * 0.7 + s) * 0.5 * dt; y += Math.sin(t * 1.3 + s * 2) * 0.35 * dt; z += Math.cos(t * 0.5 + s) * 0.5 * dt; }
        if (y < 0) y += HY; if (y > HY) y -= HY;
        // wrap horizontally around the camera
        const wx = x - center.x, wz = z - center.z;
        if (wx > R) x -= 2 * R; if (wx < -R) x += 2 * R;
        if (wz > R) z -= 2 * R; if (wz < -R) z += 2 * R;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      }
      const a = obj.geometry.attributes.position;
      if (kind === 'rain') {
        for (let i = 0; i < n; i++) {
          a.setXYZ(i * 2, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          a.setXYZ(i * 2 + 1, pos[i * 3] + 0.04, pos[i * 3 + 1] + 0.55, pos[i * 3 + 2]);
        }
      } else {
        a.array.set(pos);
        if (kind === 'fireflies') obj.material.opacity = 0.6 + Math.sin(t * 3) * 0.3;
      }
      a.needsUpdate = true;
    },
  };
}

// ---------- prop helpers ---------------------------------------------------
function palm(g, x, z, h = 7) {
  const trunk = mat({ color: 0x6a4a30, roughness: 0.9 });
  const leaf = mat({ color: 0x4f7a2a, roughness: 0.8, side: THREE.DoubleSide });
  let px = x, pz = z;
  for (let i = 0; i < 8; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.18 - i * 0.01, 0.22 - i * 0.01, h / 8, 8), trunk); seg.position.set(px, h / 16 + i * h / 8, pz); seg.rotation.z = 0.04 * i; px += 0.06; seg.castShadow = true; g.add(seg); }
  for (let k = 0; k < 7; k++) {
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.2), leaf);
    fr.position.set(px, h + 0.1, pz); fr.rotation.set(-1.1, (k / 7) * TAU, 0, 'YXZ'); fr.translateY(1.4); fr.castShadow = true; g.add(fr);
  }
}
function pine(g, x, z, h = 6, snow = true) {
  const trunk = mat({ color: 0x3a2a1e }); const green = mat({ color: 0x1f3b2a, roughness: 0.9 }); const white = mat({ color: 0xf2f6fa, roughness: 0.8 });
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, h * 0.3, 6), trunk); t.position.set(x, h * 0.15, z); g.add(t);
  for (let i = 0; i < 4; i++) {
    const r = 1.6 - i * 0.32, y = h * 0.25 + i * h * 0.19;
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.32, 9), green); c.position.set(x, y + h * 0.16, z); c.castShadow = true; g.add(c);
    if (snow) { const s = new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, h * 0.12, 9), white); s.position.set(x, y + h * 0.27, z); g.add(s); }
  }
}
function jungleTree(g, x, z, h = 8) {
  const trunk = mat({ color: 0x4a3a28, roughness: 0.95 }); const leafs = [0x2f5a22, 0x3b6e28, 0x264a1c].map(c => mat({ color: c, roughness: 0.85, flatShading: true }));
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, h, 8), trunk); t.position.set(x, h / 2, z); t.castShadow = true; g.add(t);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.6, 2.6), 0), leafs[i % 3]); b.position.set(x + rand(-1.6, 1.6), h + rand(-1, 1.2), z + rand(-1.6, 1.6)); b.castShadow = true; g.add(b); }
}

// ---------- the themes -----------------------------------------------------
export const THEMES = {
  range: {
    name: 'Training Facility', tag: 'Night · Floodlit range', sub: 'TRAINING FACILITY  ·  RANGE 01',
    thumb: 'linear-gradient(180deg,#05070c,#0e1622 50%,#2a2f3a 70%,#1c1f24)',
    sky: () => skyTexture({ stops: [[0, '#05070c'], [0.35, '#0e1622'], [0.5, '#2a2f3a'], [0.53, '#3b2a24'], [1, '#0b0c10']], stars: 500 }),
    fog: [0x0d1118, 60, 160], hemi: [0xbcd4ff, 0x2a2018, 0.9], sun: [0xfff1dc, 2.2, [-20, 40, 15]], exposure: 1.05,
    floor: { tex: () => floorTexRange(), rough: 0.85, metal: 0.1 }, wall: { tex: 'concrete' }, ground: 0x15171b,
    trim: 'accent', poles: true, lamps: 0xffe7c4, weather: null,
  },
  sunscorch: {
    name: 'Sunscorch', tag: 'Desert outpost · Sunset', sub: 'SUNSCORCH  ·  OUTPOST 02',
    thumb: 'linear-gradient(180deg,#3b2a5a,#c0567a 30%,#ff8a4c 48%,#ffc27a 55%,#8a5a3a 62%,#c99a63)',
    sky: () => skyTexture({
      stops: [[0, '#3b2a5a'], [0.3, '#c0567a'], [0.43, '#ff8a4c'], [0.5, '#ffc27a'], [0.52, '#a8683e'], [1, '#3a2618']],
      sun: { u: 0.77, v: 0.465, r: 42, glow: 360, color: '#fff1c8', halo: 'rgba(255,200,120,.75)' },
      clouds: { n: 26, color: '#ff9a6a' },
      skyline: (x, w, h) => { ridge(x, w, h, '#7a4a35', 0.5, 26, [[3, .6], [7, .3], [13, .15]], 1); ridge(x, w, h, '#5a3424', 0.505, 14, [[5, .7], [11, .3]], 2);
        x.fillStyle = '#4a2a1e'; for (const [u, wd, ht] of [[0.62, 40, 70], [0.86, 70, 50], [0.95, 30, 90]]) x.fillRect(u * w, h * 0.5 - ht, wd, ht); },
    }),
    fog: [0xd98a5a, 40, 170], hemi: [0xffc9a0, 0x6b4a2e, 1.15], sun: [0xffb36b, 2.8, [14, 16, -110]], exposure: 1.0,
    floor: { tex: T.sand, rough: 0.95, metal: 0 }, wall: { tex: (rx, ry) => T.sandstone(rx, ry) }, ground: 0xb8875a,
    trim: { color: 0x6b4423, emissive: false }, poles: false, weather: 'dust',
    cover: { crate: 'wood', barrier: () => mat({ map: T.sandbag(), roughness: 1 }), container: [0x9a6a42, 0x7a5236] },
    deco(ctx) {
      const { g, A } = ctx;
      for (const [x, z] of [[-16.5, -22], [16.6, -33], [-16.6, -48], [16.5, -54], [-16.4, -66]]) palm(g, x, z, rand(6.5, 8.5));
      // striped banners hung flat against the walls
      const stripes = (c1, c2) => canvasTex(128, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? c1 : c2; x.fillRect(0, i * 32, w, 32); } speckle(x, w, h, 900, 0.2); });
      [[-1, -14, '#b8322a', '#e8d6b0'], [1, -40, '#2e6e8e', '#e8d6b0'], [-1, -60, '#c8902a', '#5a2a1a']].forEach(([side, z, c1, c2]) => {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.2), mat({ map: stripes(c1, c2), roughness: 1, side: THREE.DoubleSide }));
        b.position.set(side * 17.93, 4.4, z); b.rotation.y = -side * Math.PI / 2; g.add(b);
        box(0.12, 0.12, 2.6, mat({ color: 0x5a3a20 }), side * 17.9, 6.55, z, g);
      });
      const adobe = mat({ color: 0xa8744a, roughness: 1 });
      for (const [x, z, w, h, d] of [[-27, -78, 12, 17, 10], [26, -84, 10, 22, 10], [0, -95, 18, 13, 8], [-34, -40, 8, 14, 12], [33, -20, 9, 12, 9]]) { const b = box(w, h, d, adobe, x, h / 2, z, g); for (let i = 0; i < 4; i++) box(1.2, 1.6, 0.2, mat({ color: 0x2a1a12 }), x - w / 3 + i * (w / 4), h * 0.6, z + d / 2 + 0.05, g); }
      const tower = mat({ color: 0x6b4a30 }); for (const [x, z] of [[24, -66], [-24, -12]]) { for (const dx of [-1, 1]) for (const dz of [-1, 1]) box(0.3, 9, 0.3, tower, x + dx, 4.5, z + dz, g); box(3.4, 2.4, 3.4, mat({ color: 0x8a6440 }), x, 10, z, g); }
    },
  },
  frostbite: {
    name: 'Frostbite', tag: 'Arctic station · Snowfall', sub: 'FROSTBITE  ·  STATION 03',
    thumb: 'linear-gradient(180deg,#8aa0b8,#cfdbe6 45%,#e8eef3 55%,#9fb0c0 62%,#e9eff5)',
    sky: () => skyTexture({
      stops: [[0, '#7d93ab'], [0.42, '#c6d3df'], [0.5, '#e6edf3'], [0.52, '#9fb0c0'], [1, '#56667a']],
      sun: { u: 0.8, v: 0.36, r: 26, glow: 220, color: 'rgba(255,255,255,.85)', halo: 'rgba(255,255,255,.35)' },
      clouds: { n: 40, color: '#ffffff' },
      skyline: (x, w, h) => {
        ridge(x, w, h, '#a9b8c8', 0.5, 70, [[2, .6], [5, .35], [11, .2]], 3);
        ridge(x, w, h, '#eaf1f7', 0.5, 50, [[2, .6], [5, .35], [11, .2]], 3.2);
        ridge(x, w, h, '#7d8fa3', 0.505, 22, [[6, .6], [15, .3]], 4);
      },
    }),
    fog: [0xc8d4e0, 22, 115], hemi: [0xe6f0ff, 0x8090a0, 1.45], sun: [0xf0f6ff, 1.5, [-30, 40, -40]], exposure: 1.0,
    floor: { tex: T.snow, rough: 0.9, metal: 0 }, wall: { tex: (rx, ry) => T.iceConcrete(rx, ry) }, ground: 0xe6edf3,
    trim: { color: 0x7fe3ff, emissive: true }, poles: true, lamps: 0xdff6ff, weather: 'snow',
    cover: { crate: () => mat({ map: T.ribbed('#5d6b78'), roughness: 0.6, metalness: 0.4 }), barrier: 'concrete', container: [0xc8501e, 0x2f5f8f], snowCap: true },
    deco(ctx) {
      const { g } = ctx;
      for (const [x, z] of [[-16.3, -20], [16.4, -30], [-16.5, -43], [16.3, -50], [-16.2, -62], [16.6, -14]]) pine(g, x, z, rand(5.5, 8));
      const white = mat({ color: 0xf2f6fa, roughness: 0.9 });
      for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), white); const side = i % 2 ? -1 : 1; d.scale.set(rand(1.5, 3), rand(0.4, 0.9), rand(2, 4)); d.position.set(side * 17.6, 0, -4 - i * 4.8); g.add(d); }
      for (const [x, z, s] of [[-30, -60, 18], [32, -45, 24], [-36, -20, 14]]) pine(g, x, z, s, true);
      const dishMat = mat({ color: 0xdfe6ee, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide });
      const mast = box(0.6, 16, 0.6, mat({ color: 0xb03a2a }), 24, 8, -78, g);
      const dish = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 10, 0, TAU, 0, 1.0), dishMat); dish.position.set(24, 17, -78); dish.rotation.x = -1.2; g.add(dish);
      for (let i = 0; i < 4; i++) box(0.12, 0.5, 0.12, basic({ color: 0xff3030 }), 24, 4 + i * 4, -77.6, g);
    },
  },
  neon: {
    name: 'Neon District', tag: 'Rooftop city · Night rain', sub: 'NEON DISTRICT  ·  BLOCK 04',
    thumb: 'linear-gradient(180deg,#05030c,#1a0b2e 40%,#3a1a4a 50%,#ff2bd6 52%,#120a1a 56%,#16151b)',
    sky: () => skyTexture({
      stops: [[0, '#04020a'], [0.38, '#170a2a'], [0.5, '#45205a'], [0.52, '#120a1a'], [1, '#050308']], stars: 160,
      skyline: (x, w, h) => {
        for (let layer = 0; layer < 2; layer++) {
          let px = 0;
          while (px < w) {
            const bw = rand(30, 90), bh = rand(40, layer ? 110 : 200);
            x.fillStyle = layer ? '#0d0816' : '#1a1028'; x.fillRect(px, h * 0.5 - bh, bw, bh + 4);
            for (let wy = h * 0.5 - bh + 6; wy < h * 0.5; wy += 8) for (let wx = px + 4; wx < px + bw - 4; wx += 7) if (Math.random() < 0.18) { x.fillStyle = ['#ffd27a', '#7ff2ff', '#ff7ad9'][Math.floor(Math.random() * 3)]; x.globalAlpha = 0.7; x.fillRect(wx, wy, 3, 3); }
            x.globalAlpha = 1; px += bw + rand(2, 18);
          }
        }
      },
    }),
    fog: [0x1a0d26, 30, 140], hemi: [0x6a4aa0, 0x10081a, 0.75], sun: [0x9fb0ff, 0.9, [20, 40, -20]], exposure: 1.12,
    floor: { tex: T.asphalt, rough: 0.28, metal: 0.45 }, wall: { tex: (rx, ry) => T.brick(rx, ry) }, ground: 0x0c0a12,
    trim: { color: 0xff2bd6, emissive: true }, trim2: 0x2be6ff, poles: false, weather: 'rain',
    cover: { crate: () => mat({ map: T.flightcase(), roughness: 0.5, metalness: 0.5 }), barrier: () => mat({ map: T.hazard(), roughness: 0.6 }), container: [0x1a1a24, 0x24121e] },
    deco(ctx) {
      const { g, scene, quality } = ctx;
      const ads = [['KAIJU', 'NOODLE BAR · OPEN LATE', '#ff2bd6', '#ff8a2b'], ['VOLT', 'ENERGY · ZERO SUGAR', '#2be6ff', '#7a2bff'], ['NEXUS', 'MARKET 24/7', '#ffd400', '#ff2b5a'], ['ZERO PING', 'FIBRE · 10 GBPS', '#2bff8a', '#2be6ff']];
      ads.forEach(([t, s, c1, c2], i) => {
        const side = i % 2 ? 1 : -1;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), basic({ map: T.billboard(t, s, c1, c2) }));
        m.position.set(side * 17.95, 4.6, -16 - i * 13); m.rotation.y = -side * Math.PI / 2; g.add(m);
        box(0.15, 3.7, 7.2, mat({ color: 0x111111 }), side * 17.98, 4.6, -16 - i * 13, g);
      });
      for (let i = 0; i < 7; i++) { const side = i % 2 ? 1 : -1; box(1.2, 0.8, 1.0, mat({ color: 0x6a6a72, metalness: 0.6, roughness: 0.5 }), side * 17.4, 7.4, -8 - i * 9, g); }
      for (const [x, z, w, h] of [[-32, -30, 10, 46], [-40, -70, 14, 60], [36, -50, 12, 52], [30, -92, 16, 70], [-14, -110, 14, 40], [12, -120, 12, 80], [44, -14, 10, 34]]) {
        const tm = mat({ map: T.windows(0.35), emissive: 0xffffff, emissiveMap: T.windows(0.35), emissiveIntensity: 0.8, roughness: 0.6 });
        box(w, h, w, tm, x, h / 2, z, g);
      }
      const puddle = mat({ color: 0x0a0812, metalness: 1, roughness: 0.05 });
      for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(rand(1, 2.4), 20), puddle); p.rotation.x = -Math.PI / 2; p.scale.x = rand(1, 2); p.position.set(rand(-12, 12), 0.006, -rand(6, 60)); g.add(p); }
      if (quality === 'high') for (const [c, x, z] of [[0xff2bd6, -14, -20], [0x2be6ff, 14, -32], [0xff2bd6, 14, -46], [0x2be6ff, -14, -58]]) { const l = new THREE.PointLight(c, 40, 22, 1.8); l.position.set(x, 5, z); scene.add(l); ctx.extra.push(l); }
    },
  },
  overgrowth: {
    name: 'Overgrowth', tag: 'Jungle ruins · Fireflies', sub: 'OVERGROWTH  ·  RUINS 05',
    thumb: 'linear-gradient(180deg,#5f8fb0,#b9d6c4 40%,#e8e6c0 50%,#2f5a22 56%,#4b5a2c)',
    sky: () => skyTexture({
      stops: [[0, '#4f86ad'], [0.38, '#a9cfc0'], [0.5, '#e6e4bc'], [0.52, '#3a4a2a'], [1, '#1a2414']],
      sun: { u: 0.73, v: 0.24, r: 30, glow: 300, color: '#fffbe6', halo: 'rgba(255,250,210,.6)' },
      clouds: { n: 30, color: '#ffffff' },
      skyline: (x, w, h) => {
        for (let px = 0; px < w; px += rand(10, 26)) { x.fillStyle = Math.random() < .5 ? '#22401c' : '#2c5222'; x.beginPath(); x.arc(px, h * 0.5 - rand(10, 40), rand(18, 46), 0, TAU); x.fill(); }
        x.fillStyle = '#26401c'; x.fillRect(0, h * 0.5 - 14, w, 16);
        x.fillStyle = '#4a4a38'; const sx = 0.76 * w; for (let i = 0; i < 6; i++) x.fillRect(sx - 90 + i * 15, h * 0.5 - 30 - i * 14, 180 - i * 30, 14);
      },
    }),
    fog: [0x9fb89a, 18, 110], hemi: [0xe0f0d0, 0x2a3a20, 1.2], sun: [0xfff0c8, 2.3, [-20, 50, -30]], exposure: 1.0,
    floor: { tex: T.jungleFloor, rough: 0.95, metal: 0 }, wall: { tex: (rx, ry) => T.mossStone(rx, ry) }, ground: 0x3a4a22,
    trim: null, poles: false, weather: 'fireflies',
    cover: { crate: () => mat({ map: T.stoneBlock(), roughness: 0.95 }), barrier: 'stone', container: [0x6a6c5c, 0x5a5c4c] },
    deco(ctx) {
      const { g } = ctx;
      for (const [x, z] of [[-16.2, -20], [16.3, -28], [-16.4, -44], [16.2, -52], [-16.3, -64], [16.4, -12]]) jungleTree(g, x, z, rand(7, 10));
      for (const [x, z, s] of [[-30, -50, 16], [30, -30, 14], [-26, -90, 18], [34, -80, 20]]) jungleTree(g, x, z, s);
      const stone = mat({ color: 0x8a8a74, roughness: 0.95 });
      for (const [x, z, h] of [[-12, -8, 3.2], [11, -15, 1.6], [-9, -52, 4.2], [12, -58, 2.4]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, h, 10), stone); p.position.set(x, h / 2, z); p.castShadow = true; g.add(p); ctx.addSolidMesh(p); }
      const vine = mat({ color: 0x2f5a1e, roughness: 1 });
      for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1; const len = rand(2, 5.5); box(0.06, len, rand(0.15, 0.35), vine, side * 17.95, 7 - len / 2, -3 - i * 2.6, g); }
      const fern = mat({ color: 0x3e7a2c, roughness: 0.9, flatShading: true });
      for (let i = 0; i < 24; i++) { const side = i % 2 ? 1 : -1; const f = new THREE.Mesh(new THREE.ConeGeometry(rand(0.6, 1.1), rand(0.6, 1.2), 6), fern); f.position.set(side * rand(15.5, 17.4), 0.4, -rand(3, 70)); g.add(f); }
      const temple = mat({ color: 0x6e6c58, roughness: 1 });
      for (let i = 0; i < 6; i++) box(30 - i * 4.4, 3, 18 - i * 2.4, temple, 0, 1.5 + i * 3, -96, g);
    },
  },
  rustyard: {
    name: 'Rust Yard', tag: 'Container port · Dusk', sub: 'RUST YARD  ·  DOCK 06',
    thumb: 'linear-gradient(180deg,#1c2440,#4a4a6a 35%,#c8704a 45%,#ffb070 50%,#2a2a30 55%,#4c4b4a)',
    sky: () => skyTexture({
      stops: [[0, '#1a2240'], [0.33, '#4a4a6a'], [0.45, '#c8704a'], [0.5, '#ffb070'], [0.52, '#2a2a30'], [1, '#121214']],
      sun: { u: 0.71, v: 0.5, r: 54, glow: 380, color: '#ff8a4a', halo: 'rgba(255,140,80,.7)' },
      clouds: { n: 22, color: '#3a2a3a' },
      skyline: (x, w, h) => {
        x.fillStyle = '#16161c';
        for (const u of [0.6, 0.7, 0.84, 0.95, 0.15, 0.35]) { const cx = u * w; x.fillRect(cx - 4, h * 0.5 - 150, 8, 150); x.fillRect(cx + 30, h * 0.5 - 150, 8, 150); x.fillRect(cx - 60, h * 0.5 - 158, 190, 10); x.fillRect(cx - 60, h * 0.5 - 158, 6, 40);
          x.strokeStyle = '#16161c'; x.lineWidth = 2; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(cx, h * 0.5 - k * 25); x.lineTo(cx + 34, h * 0.5 - (k + 1) * 25); x.stroke(); } }
        for (const [u, wd] of [[0.78, 260], [0.25, 200]]) { x.fillRect(u * w - wd / 2, h * 0.5 - 30, wd, 30); x.fillRect(u * w - 20, h * 0.5 - 60, 50, 30); }
      },
    }),
    fog: [0x6a5a5a, 35, 150], hemi: [0xffc8a8, 0x2a2520, 0.95], sun: [0xff9a5a, 2.1, [30, 10, -100]], exposure: 1.05,
    floor: { tex: T.portConcrete, rough: 0.8, metal: 0.1 }, wall: { tex: (rx, ry) => T.corrugated(rx, ry) }, ground: 0x2a2826,
    trim: { color: 0xffc21a, emissive: true }, poles: true, lamps: 0xffd8a0, weather: 'dust',
    cover: { crate: () => mat({ map: T.ribbed('#2f6b8a'), roughness: 0.6, metalness: 0.4 }), barrier: () => mat({ map: T.hazard(), roughness: 0.6 }), container: [0xb8401e, 0x2a6a4a] },
    deco(ctx) {
      const { g } = ctx;
      const cols = ['#b8401e', '#2a6a4a', '#2f5a8a', '#c89a1e', '#7a2a2a', '#4a4a52'];
      for (let i = 0; i < 9; i++) for (const side of [-1, 1]) {
        if ((side < 0 && i === 1) || (side > 0 && i === 7)) continue;
        const c = cols[(i * 2 + (side > 0 ? 1 : 0)) % cols.length];
        const m = mat({ map: T.ribbed(c), roughness: 0.6, metalness: 0.4 });
        const z = -4 - i * 7.6;
        if (Math.random() < 0.7) box(2.4, 2.6, 6, m, side * 16.6, 5.3 + 1.3, z, g);
      }
      const drum = [0x2a5a9a, 0xb8401e, 0x3a3a3a].map(c => mat({ color: c, roughness: 0.5, metalness: 0.5 }));
      for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 14), drum[i % 3]); const side = i % 2 ? 1 : -1; d.position.set(side * rand(14.8, 15.6), 0.45, -rand(4, 68)); d.castShadow = true; g.add(d); ctx.addSolidMesh(d); }
      const crane = mat({ color: 0xc89a1e, roughness: 0.6, metalness: 0.4 });
      for (const [x, z] of [[-30, -40], [32, -70]]) {
        for (const dx of [-3, 3]) box(0.8, 26, 0.8, crane, x + dx, 13, z, g);
        box(7, 1, 1, crane, x, 26, z, g); const arm = box(1, 1, 40, crane, x, 27, z + 6, g);
        for (let k = 0; k < 6; k++) { const br = box(0.3, 4.2, 0.3, crane, x - 3, 4 + k * 4, z, g); br.rotation.z = 0.8; }
      }
    },
  },
};
export const MAP_IDS = Object.keys(THEMES);

function floorTexRange() {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#1c1f24'; x.fillRect(0, 0, w, h);
    speckle(x, w, h, 6000, 0.12, true);
    speckle(x, w, h, 4000, 0.25);
    x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 6; x.strokeRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,0.07)'; x.lineWidth = 2; x.strokeRect(4, 4, w - 8, h - 8);
    x.strokeStyle = 'rgba(255,255,255,0.04)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
  }, { repeat: [18, 40.5] });
}

export { makeWeather, skyTexture, T as TEX, mat, basic };
