class EffectsEngine {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.impacts = []; // Store all impacts to redraw on resize
    this.currentHighlight = null;
  }

  addImpact(x, y, weapon, size = 6) {
    const impact = {
      x,
      y,
      weapon,
      size, // Store the size
      timestamp: Date.now(),
      // Pre-calculate random values for static rendering
      rotation: Math.random() * Math.PI * 2,
      scale: 0.8 + Math.random() * 0.4,
      scaleX: 1 + Math.random() * 0.2,
      scaleY: 1 + Math.random() * 0.2,
      cracks: [],
      debris: [],
      soot: []
    };

    // Generate specific visual data based on weapon
    if (weapon === 'pistol' || weapon === 'shotgun' || weapon === 'rifle') {
      const crackCount = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < crackCount; i++) {
        impact.cracks.push({
          angle: Math.random() * Math.PI * 2,
          length: size * 1.5 + Math.random() * size, // Scale cracks by size
          wobble: Math.random() * 0.5
        });
      }
    }

    if (weapon === 'rpg' || weapon === 'flamethrower') {
      // Generate soot particles
      for (let i = 0; i < 10; i++) {
        impact.soot.push({
          offsetX: (Math.random() - 0.5), // Normalized offset
          offsetY: (Math.random() - 0.5),
          size: 1 + Math.random() * 2
        });
      }
    }

    if (weapon === 'rpg') {
      for (let i = 0; i < 20; i++) {
        impact.debris.push({
          angle: Math.random() * Math.PI * 2,
          length: 30 + Math.random() * 50
        });
      }
    }

    this.impacts.push(impact);
    this.drawImpact(impact);
  }

  drawImpact(impact) {
    const { x, y, weapon, size } = impact;

    switch (weapon) {
      case 'pistol':
        this.drawBulletHole(x, y, size, impact);
        break;
      case 'rifle':
        this.drawBulletHole(x, y, size, impact);
        break;
      case 'shotgun':
        this.drawBulletHole(x, y, size, impact);
        this.drawStaticShotgunScatter(x, y, impact);
        break;
      case 'flamethrower':
        this.drawScorchMark(x, y, impact);
        break;
      case 'rpg':
        this.drawExplosion(x, y, impact);
        break;
      case 'laser':
        this.drawLaserBurn(x, y, impact);
        break;
      default:
        this.drawBulletHole(x, y, size, impact);
    }
  }

  drawStaticShotgunScatter(x, y, impact) {
    // Use the timestamp as a seed for pseudo-randomness if needed, 
    // but better to store offsets. For now, let's generate a few fixed offsets based on the impact props
    const seed = impact.timestamp;
    for (let i = 0; i < 5; i++) {
      const offsetX = Math.sin(seed + i) * 15;
      const offsetY = Math.cos(seed + i * 2) * 15;
      // Don't pass 'impact' here to avoid drawing the main cracks on scattered holes
      this.drawBulletHole(x + offsetX, y + offsetY, 3, null);
    }
  }

  drawBulletHole(x, y, size = 6, impact) {
    const ctx = this.ctx;

    // Outer ring (cracked paint/glass)
    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Inner hole
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Cracks (Static)
    if (impact && impact.cracks) {
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
      ctx.lineWidth = 1;
      impact.cracks.forEach(crack => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(crack.angle) * crack.length, y + Math.sin(crack.angle) * crack.length);
        ctx.stroke();
      });
    }
  }

  drawScorchMark(x, y, impact) {
    const ctx = this.ctx;
    // Safety checks for backward compatibility with old persisted data
    if (!impact) impact = {};
    const radius = 30 * (impact.scale || 1);

    // Irregular shape
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(impact.scaleX || 1, impact.scaleY || 1);
    ctx.rotate(impact.rotation || 0);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(20, 10, 10, 0.9)');
    gradient.addColorStop(0.4, 'rgba(40, 20, 10, 0.7)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Static soot particles
    if (impact.soot) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      impact.soot.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.offsetX * radius, p.offsetY * radius, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  }

  drawHighlight(rect) {
    // We don't want to clear the whole canvas, just update the highlight
    // But since we don't have layers, we need to redraw everything + highlight
    // Optimization: We could have a separate canvas for UI/Highlights, but for now let's just redraw
    this.currentHighlight = rect;
    this.redrawAll();
  }

  clearHighlight() {
    this.currentHighlight = null;
    this.redrawAll();
  }

  redrawAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw impacts
    this.impacts.forEach(impact => this.drawImpact(impact));

    // Draw highlight if exists
    if (this.currentHighlight) {
      const { left, top, width, height } = this.currentHighlight;
      const ctx = this.ctx;

      ctx.save();

      // Blue highlight with white glow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 2;

      // Rounded rect effect
      ctx.beginPath();
      ctx.roundRect(left, top, width, height, 4);
      ctx.stroke();

      // Inner fill (very subtle)
      ctx.fillStyle = 'rgba(0, 170, 255, 0.1)';
      ctx.fill();

      ctx.restore();
    }
  }

  drawExplosion(x, y, impact) {
    const ctx = this.ctx;

    // Big scorch (pass impact for static rotation)
    this.drawScorchMark(x, y, impact);

    // Debris lines (use pre-calculated static debris)
    if (impact && impact.debris) {
      ctx.strokeStyle = 'rgba(30, 30, 30, 0.9)';
      ctx.lineWidth = 2;
      impact.debris.forEach(debris => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(debris.angle) * debris.length, y + Math.sin(debris.angle) * debris.length);
        ctx.stroke();
      });
    }

    // Impact crater center
    ctx.fillStyle = 'rgba(10, 10, 10, 0.95)';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLaserBurn(x, y) {
    const ctx = this.ctx;

    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3333';
    ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hot center
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffffaa';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Burn marks around
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Destruction Effects (triggered when element health reaches 0)
  addDestructionEffect(rect) {
    // Randomly select one of 3 destruction effects
    const effects = [
      () => this.drawShatterEffect(rect),
      () => this.drawExplosionEffect(rect),
      () => this.drawDisintegrationEffect(rect)
    ];

    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    randomEffect();
  }

  drawShatterEffect(rect) {
    // Create particles that fly outward from the center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const particleCount = 20 + Math.floor(Math.random() * 15);
    const particles = [];

    // Generate particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      const size = 3 + Math.random() * 8;

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        life: 1.0,
        color: `hsl(${Math.random() * 60}, 70%, ${30 + Math.random() * 40}%)`
      });
    }

    // Animate particles
    let frame = 0;
    const maxFrames = 40;
    const animate = () => {
      if (frame >= maxFrames) return;

      // Redraw all impacts first
      this.redrawAll();

      const ctx = this.ctx;
      ctx.save();

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.rotation += p.rotationSpeed;
        p.life = 1 - (frame / maxFrames);

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      ctx.restore();
      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }

  drawExplosionEffect(rect) {
    // Create expanding shockwave with particles
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let radius = 0;
    const maxRadius = Math.max(rect.width, rect.height) * 1.5;

    // Create debris particles
    const debrisCount = 15;
    const debris = [];
    for (let i = 0; i < debrisCount; i++) {
      const angle = (Math.PI * 2 * i) / debrisCount + (Math.random() - 0.5);
      const speed = 3 + Math.random() * 5;
      debris.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // Slight upward bias
        size: 2 + Math.random() * 4,
        life: 1.0
      });
    }

    let frame = 0;
    const maxFrames = 35;
    const animate = () => {
      if (frame >= maxFrames) return;

      this.redrawAll();

      const ctx = this.ctx;
      ctx.save();

      // Draw expanding shockwave
      radius += maxRadius / maxFrames * 2;
      const alpha = 1 - (radius / maxRadius);

      if (radius < maxRadius) {
        ctx.strokeStyle = `rgba(255, 150, 50, ${alpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.6);
        gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw debris
      debris.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.2; // Gravity
        d.life = 1 - (frame / maxFrames);

        ctx.globalAlpha = d.life;
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }

  drawDisintegrationEffect(rect) {
    // Elements dissolve into particles that fade away
    const particleCount = 30 + Math.floor(Math.random() * 20);
    const particles = [];

    // Create particles scattered across the element's area
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: rect.left + Math.random() * rect.width,
        y: rect.top + Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2, // Float upward
        size: 2 + Math.random() * 5,
        life: 1.0,
        hue: 0 + Math.random() * 30
      });
    }

    let frame = 0;
    const maxFrames = 50;
    const animate = () => {
      if (frame >= maxFrames) return;

      this.redrawAll();

      const ctx = this.ctx;
      ctx.save();

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98; // Slow down horizontal movement
        p.life = 1 - (frame / maxFrames);

        ctx.globalAlpha = p.life;

        // Gradient particle
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${p.life})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 30%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }

  clear() {
    this.impacts = [];
    this.currentHighlight = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  redrawAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.impacts.forEach(impact => this.drawImpact(impact));
  }
}

// Export for use in content.js (if using modules, but for simple content script we can just load it before)
window.EffectsEngine = EffectsEngine;
