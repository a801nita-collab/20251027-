let circles = [];
let particles = []; // 新增粒子陣列

// 新增：音效變數與備援旗標
let popSound = null;
let useSynth = false;

const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
const NUM_CIRCLES = 20;

// 新增：分數變數
let score = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 嘗試依序載入音檔（非阻塞）
  tryLoadExternalPop([
    'pop.mp3',
    'pop.wav',
    'libraries/pop.mp3',
    'libraries/pop.wav'
  ]);

  // 解鎖瀏覽器音訊（第一次點擊）
  const c = document.getElementsByTagName('canvas')[0];
  if (c) {
    c.addEventListener('click', () => {
      if (typeof userStartAudio === 'function') {
        userStartAudio().then(() => console.log('Audio unlocked'));
      }
    }, { once: true });
  }

  // 初始化圓（改為同時儲存 hex 字串以便比對）
  circles = [];
  for (let i = 0; i < NUM_CIRCLES; i++) {
    const hex = random(COLORS);
    circles.push({
      x: random(width),
      y: random(height),
      r: random(50, 200),
      hex: hex,
      color: color(hex),
      alpha: random(80, 255),
      speed: random(1, 5),
      exploded: false // 新增爆炸狀態
    });
  }
}

function draw() {
  background('#fcf6bd');
  noStroke();
  
  // 更新和繪製粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();
    if (p.isDead()) {
      particles.splice(i, 1);
    }
  }

  for (let c of circles) {
    if (!c.exploded) {
      c.y -= c.speed;
      
      // 移除隨機爆炸：改為由使用者點擊觸發 explode(c)
      if (c.y + c.r / 2 < 0) { // 如果圓完全移出畫面頂端
        resetCircle(c);
      }
      
      c.color.setAlpha(c.alpha);
      fill(c.color);
      circle(c.x, c.y, c.r);

      // 在圓的右上方1/4圓的中間產生方形
      let squareSize = c.r / 6;
      let angle = -PI / 4;
      let distance = c.r / 2 * 0.65;
      let squareCenterX = c.x + cos(angle) * distance;
      let squareCenterY = c.y + sin(angle) * distance;
      fill(255, 255, 255, 120);
      noStroke();
      rectMode(CENTER);
      rect(squareCenterX, squareCenterY, squareSize, squareSize);
    }
  }

  // 左上角固定文字
  noStroke();
  fill('#9d4edd');
  textSize(32);
  textAlign(LEFT, TOP);
  text('414730589', 10, 10);

  textAlign(RIGHT, TOP);
  text('Score: ' + score, width - 10, 10);
}

// 重置圓形（同步設定 hex 與 color）
function resetCircle(c) {
  c.y = height + c.r / 2;
  c.x = random(width);
  c.r = random(50, 200);
  const hex = random(COLORS);
  c.hex = hex;
  c.color = color(hex);
  c.alpha = random(80, 255);
  c.speed = random(1, 5);
  c.exploded = false;
}

// 更新：點擊才爆破（explode 現在會標記並在短延遲後重置）
function explode(circle) {
  let numParticles = 50;
  for (let i = 0; i < numParticles; i++) {
    let angle = random(TWO_PI);
    let speed = random(2, 8);
    let r = random(5, 15);
    particles.push(new Particle(
      circle.x,
      circle.y,
      speed * cos(angle),
      speed * sin(angle),
      r,
      circle.color
    ));
  }

  // 播放 pop 音效（若無檔案則用合成器備援）
  playPopSound();

  // 標記為已爆炸並在短延遲後重置（讓粒子能播放）
  circle.exploded = true;
  setTimeout(() => {
    resetCircle(circle);
  }, 800); // 0.8s 後重生，可依需求調整
}

// 新增：非同步嘗試載入多個路徑
function loadSoundAsync(url) {
  return new Promise((resolve, reject) => {
    if (typeof loadSound !== 'function') {
      reject(new Error('p5.sound not available'));
      return;
    }
    loadSound(url, (s) => resolve(s), (err) => reject(err));
  });
}

async function tryLoadExternalPop(list) {
  if (typeof loadSound !== 'function') {
    console.warn('p5.sound not found — using synth fallback');
    useSynth = true;
    return;
  }
  for (const url of list) {
    try {
      const s = await loadSoundAsync(url);
      popSound = s;
      useSynth = false;
      console.log('Loaded pop sound from:', url);
      return;
    } catch (err) {
      console.warn('Failed to load pop from', url);
    }
  }
  console.warn('All pop loads failed — using synth fallback');
  useSynth = true;
}

// 新增：播放音效，若檔案未載入則用 p5 合成器
function playPopSound() {
  try {
    if (!useSynth && popSound && typeof popSound.isLoaded === 'function' && popSound.isLoaded()) {
      popSound.play();
      return;
    }
  } catch (e) {
    console.warn('popSound play failed, using synth', e);
  }

  // synth fallback
  if (typeof p5 !== 'undefined' && typeof p5.Oscillator === 'function') {
    let osc = new p5.Oscillator('triangle');
    let noise = new p5.Noise('white');
    let env = new p5.Envelope();
    env.setADSR(0.001, 0.06, 0.0, 0.12);
    env.setRange(0.7, 0);

    osc.freq(random(700, 1200));
    osc.amp(0);
    osc.start();

    noise.amp(0);
    noise.start();

    let noiseEnv = new p5.Envelope();
    noiseEnv.setADSR(0.001, 0.05, 0.0, 0.08);
    noiseEnv.setRange(0.25, 0);

    env.play(osc);
    noiseEnv.play(noise);

    setTimeout(() => {
      try { osc.stop(); } catch (e) {}
      try { noise.stop(); } catch (e) {}
    }, 300);
  }
}

// 粒子類別
class Particle {
  constructor(x, y, vx, vy, r, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;
    this.color = color;
    this.life = 255;
    this.decay = random(2, 4);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // 重力效果
    this.life -= this.decay;
  }

  display() {
    noStroke();
    this.color.setAlpha(this.life);
    fill(this.color);
    circle(this.x, this.y, this.r);
  }

  isDead() {
    return this.life < 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for (let c of circles) {
    c.x = random(width);
    c.y = random(height);
  }
}

// 點擊氣球才會產生爆炸與加分
function mousePressed() {
  // 檢查最上層（由後往前）
  for (let i = circles.length - 1; i >= 0; i--) {
    const c = circles[i];
    if (!c.exploded) {
      const d = dist(mouseX, mouseY, c.x, c.y);
      // c.r 在此程式代表直徑，半徑用 c.r/2
      if (d <= c.r / 2) {
        // 播放爆炸、產生粒子（explode 會標記並在稍後重置）
        explode(c);

        // 加分規則：按到 #6a4c93 顏色加 1，其他顏色扣 1
        if ((c.hex || '').toLowerCase() === '#6a4c93') {
          score += 1;
        } else {
          score -= 1;
        }

        break; // 一次只處理一個氣球
      }
    }
  }
}

