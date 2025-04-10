// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const shootSound = document.getElementById('shootSound');
const hitSound = document.getElementById('hitSound');
const gameoverSound = document.getElementById('gameoverSound');

let player = { x: 100, y: 100, width: 50, height: 50, speed: 4 };
let enemies = [];
let bullet = null;
let level = 1;
let isGameOver = false;
let gameRunning = false;
let lastDir = { x: 0, y: 0 };
let isPaused = false;
let welcomeShown = false;

const taunts = [
  'Tu noob hai',
  'Tujhe dhoond ke game over kardunga',
  'Mujhse bachke kaha jaayega?',
  'Aaya kya tujhme dum?'
];

function drawPlayer() {
  ctx.fillStyle = 'blue';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    if (enemy.taunt && Date.now() - enemy.tauntTime < 2000) {
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText(enemy.taunt, enemy.x, enemy.y - 10);
    }
  });
}

function spawnEnemies(num) {
  enemies = [];
  for (let i = 0; i < num; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: Math.random() * (canvas.height - 40),
      width: 40,
      height: 40,
      speed: 1 + Math.random(),
      taunt: '',
      tauntTime: 0,
      tauntCooldown: Date.now() + Math.random() * 3000 + 2000
    });
  }
}

function moveEnemies() {
  enemies.forEach(enemy => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    }
    if (Date.now() > enemy.tauntCooldown) {
      enemy.taunt = taunts[Math.floor(Math.random() * taunts.length)];
      enemy.tauntTime = Date.now();
      enemy.tauntCooldown = Date.now() + Math.random() * 3000 + 2000;
    }
  });
}

function drawBullet() {
  if (bullet) {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateBullet() {
  if (!bullet) return;
  bullet.x += bullet.vx;
  bullet.y += bullet.vy;

  if (bullet.x <= 0 || bullet.x >= canvas.width) bullet.vx *= -1;
  if (bullet.y <= 0 || bullet.y >= canvas.height) bullet.vy *= -1;

  enemies.forEach((enemy, index) => {
    if (
      bullet.x > enemy.x &&
      bullet.x < enemy.x + enemy.width &&
      bullet.y > enemy.y &&
      bullet.y < enemy.y + enemy.height
    ) {
      enemies.splice(index, 1);
      hitSound.play();
    }
  });
}

function checkGameOver() {
  for (const enemy of enemies) {
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      endGame();
      return;
    }
  }
  if (enemies.length === 0) {
    level++;
    document.getElementById('levelDisplay').innerText = `Level: ${level}`;
    spawnEnemies(level);
    bullet = null;
  }
}

function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawEnemies();
  drawBullet();
}

function update() {
  if (!gameRunning || isPaused) return;
  moveEnemies();
  updateBullet();
  checkGameOver();
  draw();
  requestAnimationFrame(update);
}

function shoot() {
  if (bullet) return;
  bullet = {
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
    vx: lastDir.x * 10,
    vy: lastDir.y * 10
  };
  shootSound.play();
}

function endGame() {
  gameRunning = false;
  isGameOver = true;
  gameoverSound.play();
  document.getElementById('gameOverScreen').style.display = 'flex';
}

function retryGame() {
  document.getElementById('gameOverScreen').style.display = 'none';
  startGame(true);
}

function startGame(newGame) {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('levelDisplay').style.display = 'block';
  document.getElementById('gameOverScreen').style.display = 'none';
  gameRunning = true;
  isGameOver = false;
  bullet = null;
  isPaused = false;
  document.getElementById('pauseButton').innerText = 'Pause';
  if (newGame) {
    level = 1;
    player.x = 100;
    player.y = 100;
  }
  document.getElementById('levelDisplay').innerText = `Level: ${level}`;
  spawnEnemies(level);
  update();
}

function togglePause() {
  if (!gameRunning) return;
  isPaused = !isPaused;
  document.getElementById('pauseButton').innerText = isPaused ? 'Resume' : 'Pause';
  if (!isPaused) update();
}

function showWelcomeScreen() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Asdyfair', canvas.width / 2, canvas.height / 2);
  setTimeout(() => {
    document.getElementById('menu').style.display = 'flex';
    welcomeShown = true;
  }, 3000);
}

// Joystick controls
const joystick = document.getElementById('joystick');
const stick = joystick.querySelector('.stick');
let dragging = false, offsetX = 0, offsetY = 0;

stick.addEventListener('touchstart', e => {
  dragging = true;
  const touch = e.touches[0];
  offsetX = touch.clientX - stick.offsetLeft;
  offsetY = touch.clientY - stick.offsetTop;
});

document.addEventListener('touchmove', e => {
  if (!dragging) return;
  const touch = e.touches[0];
  const x = touch.clientX - offsetX;
  const y = touch.clientY - offsetY;
  stick.style.left = `${x}px`;
  stick.style.top = `${y}px`;
  lastDir = { x: (x - 20) / 40, y: (y - 20) / 40 };
  player.x += lastDir.x * player.speed;
  player.y += lastDir.y * player.speed;
});

document.addEventListener('touchend', () => {
  dragging = false;
  stick.style.left = '20px';
  stick.style.top = '20px';
  lastDir = { x: 0, y: 0 };
});

document.addEventListener('click', shoot);

// Start with welcome screen
showWelcomeScreen();
