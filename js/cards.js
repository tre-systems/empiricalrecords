/**
 * Generative art cards for empirical records homepage.
 * Each artist gets a unique canvas-based animation matching their musical vibe.
 *
 * CSU — Heavy Industrial: aggressive glitch noise, metallic, harsh
 * Multivibrator — Minimal Experimental Electronic: clean oscilloscope waves, precise
 * UV — Guitar/Organic: warm, flowing, laid-back organic forms
 * DSB — Disco/Trance: hypnotic pulsing disco lights with blood-red trails
 */
(function () {
  'use strict';

  var CARDS = {
    csu: { draw: drawCSU },
    multivibrator: { draw: drawMultivibrator },
    uv: { draw: drawUV },
    dsb: { draw: drawDSB },
  };

  var canvases = [];

  function init() {
    document.querySelectorAll('.artist-card-img[data-artist], .artist-hero[data-artist]').forEach(function (el) {
      var key = el.dataset.artist;
      var cfg = CARDS[key];
      if (!cfg) return;

      var canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:100%;height:100%;display:block;';
      el.appendChild(canvas);

      var ctx = canvas.getContext('2d');
      var state = { t: 0, w: 0, h: 0, init: false, mx: -1, my: -1, hover: 0 };
      var item = { canvas: canvas, ctx: ctx, cfg: cfg, state: state, el: el, visible: true };

      // Mouse interaction
      el.addEventListener('mouseenter', function () { state.hover = 1; });
      el.addEventListener('mouseleave', function () { state.hover = 0; state.mx = -1; state.my = -1; });
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        state.mx = e.clientX - rect.left;
        state.my = e.clientY - rect.top;
      });

      canvases.push(item);
    });

    if (!canvases.length) return;

    resize();
    window.addEventListener('resize', debounce(resize, 200));

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            var item = canvases.find(function (c) { return c.el === e.target; });
            if (item) item.visible = e.isIntersecting;
          });
        },
        { threshold: 0.1 }
      );
      canvases.forEach(function (c) { obs.observe(c.el); });
    }

    var last = 0;
    (function loop(ts) {
      requestAnimationFrame(loop);
      if (ts - last < 33) return;
      last = ts;
      var audio = getAudioMetrics();
      canvases.forEach(function (c) {
        if (!c.visible) return;
        c.state.t += 0.016;
        // Smooth hover transition (gradual ease in/out)
        c.state.hoverSmooth = (c.state.hoverSmooth || 0) * 0.96 + c.state.hover * 0.04;
        c.state.audio = audio;
        c.cfg.draw(c.ctx, c.state);
      });
    })(0);
  }

  function resize() {
    canvases.forEach(function (c) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = c.el.getBoundingClientRect();
      c.canvas.width = rect.width * dpr;
      c.canvas.height = rect.height * dpr;
      c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.state.w = rect.width;
      c.state.h = rect.height;
      c.state.init = false;
    });
  }

  /* =========================================================
   * CSU — Heavy Industrial
   * Aggressive glitch noise field with harsh metallic tones,
   * heavy scan lines, and blocky distortion artifacts.
   * Hover: noise density increases, glitch blocks go crazy
   * ========================================================= */
  function drawCSU(ctx, s) {
    var w = s.w, h = s.h, t = s.t;
    var hv = s.hoverSmooth || 0;
    var au = s.audio || { bass: 0, mid: 0, treble: 0, energy: 0 };
    ctx.fillStyle = '#1c1e18';
    ctx.fillRect(0, 0, w, h);

    var seed = Math.floor(t * (10 + hv * 15 + au.energy * 10));
    var cols = Math.floor(w / 5);
    var rows = Math.floor(h / 5);
    var threshold = 25 + hv * 20 + au.energy * 25;

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var v = hash(x + seed * 137, y + seed * 251) % 100;
        if (v < threshold) {
          var b = 0.2 + (v / threshold) * 0.6;
          // Mouse proximity boost
          if (s.mx >= 0) {
            var dx = x * 5 - s.mx, dy = y * 5 - s.my;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) b = Math.min(1, b + (1 - dist / 80) * 0.5);
          }
          var r = Math.floor(80 + b * 50);
          var g = Math.floor(90 + b * 60);
          ctx.fillStyle = 'rgba(' + r + ',' + g + ',70,' + b + ')';
          ctx.fillRect(x * 5, y * 5, 4, 4);
        }
      }
    }

    // Scan lines — bass drives speed and brightness
    for (var i = 0; i < 3 + Math.floor(hv * 3 + au.bass * 3); i++) {
      var scanY = ((t * (25 + i * 15 + au.bass * 30) + i * 80) % (h + 40)) - 20;
      var grad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
      grad.addColorStop(0, 'rgba(140, 160, 100, 0)');
      grad.addColorStop(0.5, 'rgba(140, 160, 100, ' + (0.2 + hv * 0.15 + au.energy * 0.2) + ')');
      grad.addColorStop(1, 'rgba(140, 160, 100, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 10, w, 20);
    }

    // Glitch blocks — energy drives intensity
    var glitchCount = hash(seed, 77) % (5 + Math.floor(hv * 8 + au.energy * 10));
    for (var j = 0; j < glitchCount; j++) {
      var gy = hash(seed, j * 13 + 44) % h;
      var gh = 2 + hash(seed, j * 17 + 55) % (6 + Math.floor(hv * 10 + au.bass * 8));
      var shift = (hash(seed, j * 23 + 66) % 30) - 15;
      ctx.fillStyle = 'rgba(120, 140, 80, ' + (0.15 + hv * 0.1 + au.energy * 0.15) + ')';
      ctx.fillRect(shift, gy, w, gh);
    }

    if (hash(seed, 99) % 100 < 5 + hv * 20 + au.bass * 30) {
      var fx = hash(seed, 111) % (w * 0.6);
      var fy = hash(seed, 222) % (h * 0.8);
      ctx.fillStyle = 'rgba(180, 200, 140, ' + (0.08 + hv * 0.08 + au.energy * 0.1) + ')';
      ctx.fillRect(fx, fy, 40 + hash(seed, 333) % 80, 20 + hash(seed, 444) % 30);
    }
  }

  /* =========================================================
   * Multivibrator — Minimal Experimental Electronic
   * Clean oscilloscope sine waves, precise, mathematical.
   * Hover: waves react — amplitude increases, frequency shifts
   * ========================================================= */
  function drawMultivibrator(ctx, s) {
    var w = s.w, h = s.h, t = s.t;
    var hv = s.hoverSmooth || 0;
    var au = s.audio || { bass: 0, mid: 0, treble: 0, energy: 0 };
    ctx.fillStyle = '#141712';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(168, 184, 138, 0.04)';
    ctx.lineWidth = 0.5;
    for (var gy = 0; gy < h; gy += 25) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
    for (var gx = 0; gx < w; gx += 25) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(168, 184, 138, 0.08)';
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

    var waves = [
      { yOff: 0.5, freq: 0.012, amp: 35, speed: 0.6, alpha: 0.7, width: 1.5 },
      { yOff: 0.5, freq: 0.008, amp: 25, speed: 0.45, alpha: 0.4, width: 1.2 },
      { yOff: 0.5, freq: 0.018, amp: 15, speed: 0.8, alpha: 0.3, width: 1.0 },
      { yOff: 0.5, freq: 0.005, amp: 50, speed: 0.3, alpha: 0.2, width: 0.8 },
    ];

    waves.forEach(function (wave) {
      var phase = t * wave.speed * (1 + hv * 0.5 + au.mid * 0.4);
      var ampMult = 1 + hv * 0.6 + au.energy * 1.2;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 184, 138, ' + (wave.alpha + hv * 0.2 + au.energy * 0.3) + ')';
      ctx.lineWidth = wave.width + hv * 0.5 + au.bass * 1.5;

      for (var x = 0; x <= w; x += 2) {
        // Mouse proximity distortion
        var localAmp = wave.amp * ampMult;
        if (s.mx >= 0) {
          var dx = Math.abs(x - s.mx);
          if (dx < 100) localAmp += (1 - dx / 100) * 20 * hv;
        }
        var y = h * wave.yOff +
          Math.sin(x * wave.freq + phase) * localAmp +
          Math.sin(x * wave.freq * 2.5 + phase * 0.7) * (localAmp * 0.2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Glow
    ctx.shadowColor = 'rgba(168, 184, 138, ' + (0.3 + hv * 0.3 + au.energy * 0.3) + ')';
    ctx.shadowBlur = 8 + hv * 8 + au.bass * 12;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(168, 184, 138, ' + (0.15 + hv * 0.15) + ')';
    ctx.lineWidth = 3;
    var phase0 = t * 0.6 * (1 + hv * 0.5 + au.mid * 0.3);
    for (var x2 = 0; x2 <= w; x2 += 2) {
      var amp0 = 35 * (1 + hv * 0.6 + au.energy * 1.2);
      if (s.mx >= 0) {
        var dx2 = Math.abs(x2 - s.mx);
        if (dx2 < 100) amp0 += (1 - dx2 / 100) * 20;
      }
      var y2 = h * 0.5 + Math.sin(x2 * 0.012 + phase0) * amp0 +
        Math.sin(x2 * 0.03 + phase0 * 0.7) * 7;
      if (x2 === 0) ctx.moveTo(x2, y2);
      else ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /* =========================================================
   * UV — Guitar Compositions, Organic, Laid-back
   * Warm flowing forms, gentle undulating shapes,
   * earthy amber/green tones. Brighter, more visible.
   * Hover: glow intensifies, layers shift more
   * ========================================================= */
  function drawUV(ctx, s) {
    var w = s.w, h = s.h, t = s.t;
    var hv = s.hoverSmooth || 0;
    var au = s.audio || { bass: 0, mid: 0, treble: 0, energy: 0 };

    // Warmer, slightly lighter background
    ctx.fillStyle = '#25211a';
    ctx.fillRect(0, 0, w, h);

    // Flowing organic layers — bass drives amplitude, mid drives speed
    var layers = [
      { yBase: 0.7,  color: [130, 110, 60],  amp: 40, freq: 0.006, speed: 0.25, alpha: 0.35 },
      { yBase: 0.58, color: [100, 120, 65],  amp: 35, freq: 0.008, speed: 0.35, alpha: 0.3 },
      { yBase: 0.46, color: [150, 115, 55],  amp: 30, freq: 0.01,  speed: 0.2,  alpha: 0.25 },
      { yBase: 0.78, color: [115, 100, 70],  amp: 25, freq: 0.007, speed: 0.3,  alpha: 0.2 },
    ];

    layers.forEach(function (layer) {
      var phase = t * layer.speed * (1 + hv * 0.3 + au.mid * 0.4);
      var ampBoost = 1 + au.bass * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, h);

      for (var x = 0; x <= w; x += 3) {
        var yOff = 0;
        // Mouse attracts the layers toward it
        if (s.mx >= 0 && hv > 0.01) {
          var dx = x - s.mx;
          var distFactor = Math.exp(-(dx * dx) / (15000));
          yOff = (s.my - h * layer.yBase) * distFactor * 0.15 * hv;
        }
        var y = h * layer.yBase + yOff +
          Math.sin(x * layer.freq + phase) * layer.amp * ampBoost +
          Math.sin(x * layer.freq * 1.8 + phase * 1.3) * (layer.amp * 0.4) * ampBoost +
          Math.cos(x * layer.freq * 0.5 + phase * 0.6) * (layer.amp * 0.25);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + layer.color[0] + ',' + layer.color[1] + ',' + layer.color[2] + ',' + (layer.alpha + hv * 0.15 + au.energy * 0.15) + ')';
      ctx.fill();
    });

    // Warm glow spots — pulse with mid frequencies
    var glows = [
      { cx: 0.3, cy: 0.35, r: 0.25, speed: 0.2,  color: [160, 130, 60] },
      { cx: 0.7, cy: 0.45, r: 0.22, speed: 0.15, color: [130, 140, 70] },
      { cx: 0.5, cy: 0.3,  r: 0.18, speed: 0.25, color: [150, 120, 55] },
    ];

    glows.forEach(function (g) {
      var pulse = 1 + Math.sin(t * g.speed) * 0.2 + hv * 0.3 + au.mid * 0.5;
      var drift = Math.sin(t * g.speed * 0.5) * 0.03;
      var x = (g.cx + drift) * w;
      var y = (g.cy + Math.cos(t * g.speed * 0.7) * 0.02) * h;

      // Move glow toward mouse on hover
      if (s.mx >= 0 && hv > 0.01) {
        x += (s.mx - x) * 0.1 * hv;
        y += (s.my - y) * 0.1 * hv;
      }

      var r = g.r * Math.min(w, h) * pulse;
      var glowAlpha = 0.25 + hv * 0.15 + au.energy * 0.2;
      var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(' + g.color[0] + ',' + g.color[1] + ',' + g.color[2] + ', ' + glowAlpha + ')');
      grad.addColorStop(0.5, 'rgba(' + g.color[0] + ',' + g.color[1] + ',' + g.color[2] + ', ' + (glowAlpha * 0.32) + ')');
      grad.addColorStop(1, 'rgba(37, 33, 26, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    // Guitar strings — treble drives vibration amplitude
    ctx.lineWidth = 0.5 + hv * 0.5 + au.energy * 0.5;
    for (var i = 0; i < 6; i++) {
      var stringY = h * (0.2 + i * 0.1);
      var vibAmp = (2 + Math.sin(t * (0.5 + i * 0.15)) * 3) * (1 + hv * 1.5 + au.treble * 4);
      var vibFreq = 0.02 + i * 0.005;
      var stringPhase = t * (1 + i * 0.2) * (1 + hv * 0.3 + au.mid * 0.3);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(180, 155, 85, ' + (0.12 + i * 0.02 + hv * 0.1 + au.treble * 0.2) + ')';
      for (var x3 = 0; x3 <= w; x3 += 3) {
        var y3 = stringY + Math.sin(x3 * vibFreq + stringPhase) * vibAmp;
        if (x3 === 0) ctx.moveTo(x3, y3);
        else ctx.lineTo(x3, y3);
      }
      ctx.stroke();
    }
  }

  /* =========================================================
   * DSB — Disco/Trance Covers, Experimental
   * Hypnotic pulsing disco reflections in blood-red,
   * concentric trance rings, dripping trails.
   * Hover: spots orbit faster, more sparkles, brighter
   * ========================================================= */
  function drawDSB(ctx, s) {
    var w = s.w, h = s.h, t = s.t;
    var hv = s.hoverSmooth || 0;
    var au = s.audio || { bass: 0, mid: 0, treble: 0, energy: 0 };

    // First frame: solid fill. After that, fade for trails
    if (!s.init) {
      ctx.fillStyle = '#140808';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = 'rgba(20, 8, 8, ' + (0.12 - hv * 0.04) + ')';
      ctx.fillRect(0, 0, w, h);
    }

    if (!s.init) {
      s.init = true;
      s.spots = [];
      s.drips = [];
      // Disco colours: reds, pinks, golds, magentas
      var colors = [
        [220, 30, 40],   // red
        [200, 20, 80],   // crimson-pink
        [220, 160, 30],  // gold
        [200, 40, 120],  // magenta
        [180, 30, 30],   // dark red
        [230, 80, 60],   // coral
        [200, 180, 40],  // amber
      ];
      for (var i = 0; i < 16; i++) {
        s.spots.push({
          angle: (Math.PI * 2 * i) / 16,
          speed: 0.2 + Math.random() * 0.6,
          dist: 0.12 + Math.random() * 0.25,
          size: 3 + Math.random() * 7,
          brightness: 0.5 + Math.random() * 0.5,
          color: colors[i % colors.length],
        });
      }
      for (var j = 0; j < 25; j++) {
        s.drips.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.3,
          vy: 0.2 + Math.random() * 0.6,
          size: 1 + Math.random() * 1.5,
          life: Math.random(),
        });
      }
    }

    // Trance rings — center follows mouse on hover
    var cx = w * 0.5;
    var cy = h * 0.45;
    if (s.mx >= 0 && hv > 0.01) {
      cx += (s.mx - cx) * 0.3 * hv;
      cy += (s.my - cy) * 0.3 * hv;
    }

    var ringColors = [[200, 30, 50], [220, 160, 30], [200, 40, 120], [230, 80, 60]];
    for (var r = 0; r < 4 + Math.floor(hv * 3); r++) {
      var radius = 20 + r * 30 + Math.sin(t * 1.5 + r) * 10 + au.mid * 15;
      var ringAlpha = 0.08 + Math.sin(t * 2 + r * 0.8) * 0.05 + hv * 0.05 + au.mid * 0.1;
      var rc = ringColors[r % ringColors.length];
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + rc[0] + ',' + rc[1] + ',' + rc[2] + ',' + Math.max(0, ringAlpha) + ')';
      ctx.lineWidth = 1 + hv;
      ctx.stroke();
    }

    // Disco spots — multi-coloured, bass drives size
    var speedMult = 1 + hv * 1.5 + au.energy * 0.5;
    s.spots.forEach(function (spot) {
      var a = spot.angle + t * spot.speed * speedMult;
      var x = cx + Math.cos(a) * w * spot.dist;
      var y = cy + Math.sin(a * 0.8) * h * spot.dist * 0.7;
      var pulse = 0.5 + Math.sin(t * 3.5 * speedMult + spot.angle * 2) * 0.5;
      var sz = spot.size * pulse * (1 + hv * 0.4 + au.bass * 1.0);
      var c = spot.color;

      var grad = ctx.createRadialGradient(x, y, 0, x, y, sz * 4);
      var alpha = spot.brightness * pulse * (0.65 + hv * 0.3 + au.bass * 0.4);
      grad.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')');
      grad.addColorStop(0.3, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha * 0.3) + ')');
      grad.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - sz * 4, y - sz * 4, sz * 8, sz * 8);

      // Bright white-ish center
      ctx.beginPath();
      ctx.arc(x, y, sz * 0.4, 0, Math.PI * 2);
      var lightR = Math.min(255, c[0] + 80);
      var lightG = Math.min(255, c[1] + 80);
      var lightB = Math.min(255, c[2] + 80);
      ctx.fillStyle = 'rgba(' + lightR + ',' + lightG + ',' + lightB + ',' + (alpha * 0.9) + ')';
      ctx.fill();
    });

    // Drips
    s.drips.forEach(function (p) {
      p.y += p.vy * (1 + hv * 0.5);
      p.life -= 0.002;
      if (p.y > h || p.life <= 0) {
        p.x = Math.random() * w;
        p.y = -5;
        p.life = 0.5 + Math.random() * 0.5;
        p.vy = 0.2 + Math.random() * 0.6;
      }
      ctx.fillStyle = 'rgba(150, 10, 10, ' + (p.life * 0.5) + ')';
      ctx.fillRect(p.x, p.y, p.size, p.size * 3);
    });

    // Sparkles — treble drives sparkle intensity
    var sparkleCount = 4 + Math.floor(hv * 8 + au.treble * 12);
    for (var k = 0; k < sparkleCount; k++) {
      var sx = hash(Math.floor(t * 12), k * 31) % w;
      var sy = hash(Math.floor(t * 12), k * 47 + 100) % h;
      var sparkle = Math.sin(t * 10 + k * 1.7) * 0.5 + 0.5;
      if (sparkle > (0.65 - hv * 0.2 - au.treble * 0.3)) {
        ctx.fillStyle = 'rgba(255, 210, 210, ' + (sparkle * (0.4 + hv * 0.3 + au.treble * 0.3)) + ')';
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }
    }
  }

  /* =========================================================
   * Audio-reactive helpers
   * ========================================================= */
  var smoothAudio = { bass: 0, mid: 0, treble: 0, energy: 0 };

  function getAudioMetrics() {
    if (!window.empiricalAudio) return smoothAudio;
    var data = window.empiricalAudio.getFrequencyData();
    var bc = window.empiricalAudio.binCount;
    var bassEnd = Math.floor(bc * 0.08);
    var midEnd = Math.floor(bc * 0.35);
    var trebleEnd = Math.floor(bc * 0.65);

    var raw = {
      bass: avgRange(data, 0, bassEnd),
      mid: avgRange(data, bassEnd, midEnd),
      treble: avgRange(data, midEnd, trebleEnd),
      energy: avgRange(data, 0, trebleEnd)
    };

    // Smooth to avoid jitter
    var ease = 0.25;
    smoothAudio.bass += (raw.bass - smoothAudio.bass) * ease;
    smoothAudio.mid += (raw.mid - smoothAudio.mid) * ease;
    smoothAudio.treble += (raw.treble - smoothAudio.treble) * ease;
    smoothAudio.energy += (raw.energy - smoothAudio.energy) * ease;

    return smoothAudio;
  }

  function avgRange(data, start, end) {
    if (end <= start) return 0;
    var sum = 0;
    for (var i = start; i < end; i++) sum += data[i];
    return sum / ((end - start) * 255);
  }

  /* =========================================================
   * Utilities
   * ========================================================= */
  function hash(a, b) {
    var h = (a * 2654435761) ^ (b * 340573321);
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    return ((h >>> 16) ^ h) >>> 0;
  }

  function debounce(fn, ms) {
    var id;
    return function () {
      clearTimeout(id);
      id = setTimeout(fn, ms);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
