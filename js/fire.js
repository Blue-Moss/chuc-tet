window.initFireworks = function () {
  const canvas = document.getElementById("fireCanvas");
  const ctx = canvas.getContext("2d");

  const TEXTS = ["Thao", "2026","LOVE","H&T","Yeu Em",];
  const GRAVITY = 0.04;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();


  class Firework {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height;
      this.targetY = Math.random() * canvas.height * 0.6;
      this.speed = Math.random() * 3 + 5;
      this.exploded = false;
      this.particles = [];
      this.type = Math.random() < 0.2 ? "shape" : "normal";
    }

    update() {
      if (!this.exploded) {
        this.y -= this.speed;
        if (this.y <= this.targetY) this.explode();
      } else {
        this.particles.forEach(p => p.update());
      }
    }

    draw() {
      if (!this.exploded) {
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, 2, 10);
      } else {
        this.particles.forEach(p => p.draw());
      }
    }

    explode() {
      this.exploded = true;

      if (this.type === "shape") {
        if (Math.random() < 0.5) {
          createHeart(this.x, this.y, this.particles);
        } else {
          const text = TEXTS[Math.floor(Math.random() * TEXTS.length)];
          createText(text, this.x, this.y, this.particles);
        }
      } else {
        for (let i = 0; i < 60; i++) {
          this.particles.push(new Particle(this.x, this.y));
        }
      }
    }
  }

  /* ---------- PARTICLE (Đã sửa) ---------- */
  class Particle {
    constructor(x, y, vx, vy, color, life) {
      this.x = x;
      this.y = y;
      this.vx = vx ?? (Math.random() - 0.5) * 6;
      this.vy = vy ?? (Math.random() - 0.5) * 6;
      
      // Tăng thời gian sống lên (mặc định 150 thay vì 80)
      this.life = life ?? 150; 
      this.color = color ?? `hsl(${Math.random() * 360},100%,60%)`;
      
      // Thêm ma sát: Nếu là chữ (có truyền life > 100) thì ma sát lớn để giữ hình
      this.friction = this.life > 100 ? 0.95 : 1; 
    }

    update() {
      // Làm chậm tốc độ hạt theo ma sát (để chữ không bị toè ra nhanh quá)
      this.vx *= this.friction;
      this.vy *= this.friction;

      this.x += this.vx;
      this.y += this.vy;
      this.vy += GRAVITY;
      this.life--;
    }

    draw() {
      if (this.life <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      
      // Làm mờ dần khi sắp biến mất cho mượt
      ctx.globalAlpha = Math.max(0, this.life / 150); 
      ctx.fill();
      ctx.globalAlpha = 1; // Reset lại alpha
    }
  }
  /* ---------- SHAPES ---------- */
  function createHeart(x, y, arr) {
    for (let t = 0; t < Math.PI * 2; t += 0.15) {
      const px = 16 * Math.pow(Math.sin(t), 3);
      const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      arr.push(new Particle(x, y, px * 0.15, py * 0.15, "hotpink"));
    }
  }

  function createText(text, x, y, arr) {
    const off = document.createElement("canvas");
    off.width = 300;
    off.height = 150;
    const octx = off.getContext("2d");

    octx.fillStyle = "white";
    octx.font = "bold 80px Arial";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(text, off.width / 2, off.height / 2);

    const img = octx.getImageData(0, 0, off.width, off.height).data;

    for (let i = 0; i < off.width; i += 6) {
      for (let j = 0; j < off.height; j += 6) {
        const idx = (j * off.width + i) * 4;
        if (img[idx + 3] > 150) {
          arr.push(
            new Particle(
              x,
              y,
              (i - off.width / 2) * 0.05,
              (j - off.height / 2) * 0.05,
              "white"
            )
          );
        }
      }
    }
  }

  /* ---------- LOOP ---------- */
  let fireworks = [];

  function loop() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.05) fireworks.push(new Firework());

    fireworks.forEach(fw => {
      fw.update();
      fw.draw();
    });

    fireworks = fireworks.filter(
      fw => !fw.exploded || fw.particles.some(p => p.life > 0)
    );

    requestAnimationFrame(loop);
  }

  loop();
};

