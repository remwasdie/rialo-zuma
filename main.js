// === Setup dasar ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

const CENTER = { x: canvas.width / 2, y: canvas.height / 2 };



// === Data bola utama ===
const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
const balls = [];
const totalBalls = 30;
const radiusPath = 260;
let angleOffset = 0;
let score = 0;

for (let i = 0; i < totalBalls; i++) {
  balls.push({
    angle: (i / totalBalls) * Math.PI * 2,
    color: colors[i % colors.length],
  });
}

// === Logo & shooter ===
const logo = new Image();
logo.src = "rialobg.png";

const mouse = { x: CENTER.x, y: CENTER.y };
const bullets = [];

let currentBall = colors[Math.floor(Math.random() * colors.length)];
let nextBall = colors[Math.floor(Math.random() * colors.length)];

// === Input mouse ===
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("click", () => {
  const dx = mouse.x - CENTER.x;
  const dy = mouse.y - CENTER.y;
  const ang = Math.atan2(dy, dx);

  bullets.push({
    x: CENTER.x,
    y: CENTER.y,
    vx: Math.cos(ang) * 7,
    vy: Math.sin(ang) * 7,
    color: currentBall,
    active: true,
  });

  currentBall = nextBall;
  nextBall = colors[Math.floor(Math.random() * colors.length)];
});

// === Gambar bola ===
function drawBall(ball, x, y, size = 20) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();

  if (logo.complete && logo.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, x - size * 0.7, y - size * 0.7, size * 1.4, size * 1.4);
    ctx.restore();
  }
}

// === Gambar shooter ===
function drawShooter() {
  const dx = mouse.x - CENTER.x;
  const dy = mouse.y - CENTER.y;
  const ang = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(CENTER.x, CENTER.y);
  ctx.rotate(ang);

  // efek glow
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 215, 0, 0.1)";
  ctx.fill();

  // body emas
  const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
  gradient.addColorStop(0, "#fff8dc");
  gradient.addColorStop(0.4, "#ffd700");
  gradient.addColorStop(1, "#8b7500");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();

  // laras
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.moveTo(10, -6);
  ctx.lineTo(45, 0);
  ctx.lineTo(10, 6);
  ctx.closePath();
  ctx.fill();

  // bola aktif & preview
  drawBall({ color: currentBall }, 0, 0, 18);
  drawBall({ color: nextBall }, -45, 0, 14);

  ctx.restore();
}

// === Cek tabrakan dan warna ===
function checkCollision(bullet) {
  for (let i = 0; i < balls.length; i++) {
    const bx = CENTER.x + Math.cos(balls[i].angle + angleOffset) * radiusPath;
    const by = CENTER.y + Math.sin(balls[i].angle + angleOffset) * radiusPath;
    const dist = Math.hypot(bullet.x - bx, bullet.y - by);

    if (dist < 28) {
      const newAngle = balls[i].angle + (Math.PI / totalBalls) * 0.6;
      balls.splice(i + 1, 0, { angle: newAngle, color: bullet.color });
      bullet.active = false;
      checkMatch(i + 1);
      score += 10;
      return true;
    }
  }
  return false;
}

// === Cek 3 warna sama ===
function checkMatch(index) {
  const color = balls[index].color;
  let left = index;
  let right = index;

  while (left > 0 && balls[left - 1].color === color) left--;
  while (right < balls.length - 1 && balls[right + 1].color === color) right++;

  const count = right - left + 1;
  if (count >= 3) {
    balls.splice(left, count);
    score += count * 50;
    for (let i = 0; i < count; i++) {
      const a = (left + i) / totalBalls * Math.PI * 2;
      const x = CENTER.x + Math.cos(a + angleOffset) * radiusPath;
      const y = CENTER.y + Math.sin(a + angleOffset) * radiusPath;
      particleExplosion(x, y, color);
    }
  }
}

// === Efek partikel kecil ===
const particles = [];
function particleExplosion(x, y, color) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30,
      color,
    });
  }
}

// === Update ===
function update() {
  angleOffset += 0.0025; // kecepatan rotasi normal

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b.active) {
      bullets.splice(i, 1);
      continue;
    }

    b.x += b.vx;
    b.y += b.vy;

    if (checkCollision(b)) continue;

    if (
      b.x < -20 ||
      b.x > canvas.width + 20 ||
      b.y < -20 ||
      b.y > canvas.height + 20
    ) {
      bullets.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// === UI header ===
function drawUI() {
  ctx.save();
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 10;

  // Judul kiri
  ctx.font = "bold 42px Poppins, sans-serif";
  ctx.fillStyle = "#ffdd33";
  ctx.textAlign = "left";
  ctx.fillText("Rialo Zuma", 40, 70);

  ctx.restore();

  // Score kanan
  ctx.font = "22px Poppins, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText("Score: " + score, canvas.width - 40, 70);

  // Garis emas tipis
  ctx.beginPath();
  ctx.moveTo(30, 90);
  ctx.lineTo(canvas.width - 30, 90);
  const grad = ctx.createLinearGradient(30, 90, canvas.width - 30, 90);
  grad.addColorStop(0, "rgba(255,215,0,0.3)");
  grad.addColorStop(0.5, "rgba(255,215,0,0.8)");
  grad.addColorStop(1, "rgba(255,215,0,0.3)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// === Gambar semua ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, "#0f172a");
  bgGrad.addColorStop(1, "#1e293b");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let ball of balls) {
    const bx = CENTER.x + Math.cos(ball.angle + angleOffset) * radiusPath;
    const by = CENTER.y + Math.sin(ball.angle + angleOffset) * radiusPath;
    drawBall(ball, bx, by, 22);
  }

  for (let b of bullets) if (b.active) drawBall(b, b.x, b.y, 14);

  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawShooter();
  drawUI();
}

// === Loop utama ===
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
