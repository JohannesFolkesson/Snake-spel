import { Game } from "./game.js"

const canvas =  document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

const CELL_SIZE = 20;

let tongueOut = false;
let tongueTimer = 0;
const TONGUE_INTERVAL = 20;
const TONGUE_DURATION = 8; 

const statusDiv = document.getElementById("status")

const scoreDiv = document.getElementById("score")
const startBtn = document.getElementById("startBtn")

const resetBtn = document.getElementById('resetBtn')

const GRID_WIDTH = Math.floor(canvas.width / CELL_SIZE);
const GRID_HEIGHT = Math.floor(canvas.height / CELL_SIZE);

const game = new Game({
  width: GRID_WIDTH,
  height: GRID_HEIGHT,
  tickRate: 80,
  onRender: render
})

function render() {
    const state = game.getState();

    // Update tongue animation
    if (state.state === "Playing") {
      tongueTimer++;
      if (tongueTimer >= TONGUE_INTERVAL && tongueTimer < TONGUE_INTERVAL + TONGUE_DURATION) {
        tongueOut = true;
      } else if (tongueTimer >= TONGUE_INTERVAL + TONGUE_DURATION) {
        tongueOut = false;
        tongueTimer = 0;
      } else {
        tongueOut = false;
      }
    } else {
      tongueOut = false;
      tongueTimer = 0;
    }

    // Clear with background color (faster than clearRect + fillRect)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height); 

   
    drawFood(state.food.x, state.food.y);

    const snake = state.snakes[0];
    drawConnectedSnake(snake);

    statusDiv.innerText = `Status: ${state.state}`; 
    scoreDiv.innerText = `Score: ${state.score}`;   

    if (state.state === "gameover") {   
      showGameOver(state.score);
    }
}

function drawFood(x, y) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE / 2 - 2;

  // Draw shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + radius * 0.9, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw apple body with gradient
  const gradient = ctx.createRadialGradient(
    centerX - radius * 0.4,
    centerY - radius * 0.4,
    0,
    centerX,
    centerY,
    radius * 1.2
  );
  gradient.addColorStop(0, "#ff8a8a");
  gradient.addColorStop(0.5, "#ef4444");
  gradient.addColorStop(1, "#b91c1c");
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(220, 38, 38, 0.3)";
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i;
    const speckX = centerX + Math.cos(angle) * radius * 0.4;
    const speckY = centerY + Math.sin(angle) * radius * 0.4;
    ctx.beginPath();
    ctx.arc(speckX, speckY, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw stem (more detailed)
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius * 0.9);
  ctx.quadraticCurveTo(
    centerX + radius * 0.1,
    centerY - radius * 1.2,
    centerX + radius * 0.25,
    centerY - radius * 1.3
  );
  ctx.stroke();

  // Draw leaf with vein
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.ellipse(
    centerX + radius * 0.5,
    centerY - radius * 1.2,
    radius * 0.5,
    radius * 0.3,
    Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Leaf vein
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX + radius * 0.35, centerY - radius * 1.2);
  ctx.lineTo(centerX + radius * 0.65, centerY - radius * 1.2);
  ctx.stroke();

  const highlightGradient = ctx.createRadialGradient(
    centerX - radius * 0.4,
    centerY - radius * 0.4,
    0,
    centerX - radius * 0.4,
    centerY - radius * 0.4,
    radius * 0.5
  );
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  
  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawConnectedSnake(snake) {
  const segments = snake.segments;
  const radius = CELL_SIZE / 2;

  // Draw body line with gradient
  const bodyGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bodyGradient.addColorStop(0, "#4ade80");
  bodyGradient.addColorStop(1, "#16a34a");
  
  ctx.strokeStyle = bodyGradient;
  ctx.lineWidth = CELL_SIZE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  segments.forEach((seg, index) => {
    const x = seg.x * CELL_SIZE + CELL_SIZE / 2;
    const y = seg.y * CELL_SIZE + CELL_SIZE / 2;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw body segments with gradients and pattern
  segments.forEach((seg, index) => {
    if (index === 0) return; // Skip head
    
    const centerX = seg.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = seg.y * CELL_SIZE + CELL_SIZE / 2;
    
    // Gradient for each segment
    const segGradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX,
      centerY,
      radius
    );
    segGradient.addColorStop(0, "#86efac");
    segGradient.addColorStop(1, "#22c55e");
    
    ctx.fillStyle = segGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add scale pattern every other segment
    if (index % 2 === 0) {
      ctx.strokeStyle = "rgba(21, 128, 61, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Draw head
  const head = segments[0];
  const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
  const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
  
  ctx.fillStyle = "#16a34a";
  ctx.beginPath();
  ctx.arc(headX, headY, radius * 1.1, 0, Math.PI * 2);
  ctx.fill();

  const direction = snake.direction;
  let eye1X, eye1Y, eye2X, eye2Y;
  const eyeOffset = radius * 0.5;
  const eyeDistance = radius * 0.6;

  if (direction === "UP") {
    eye1X = headX - eyeDistance; eye1Y = headY - eyeOffset;
    eye2X = headX + eyeDistance; eye2Y = headY - eyeOffset;
  } else if (direction === "DOWN") {
    eye1X = headX - eyeDistance; eye1Y = headY + eyeOffset;
    eye2X = headX + eyeDistance; eye2Y = headY + eyeOffset;
  } else if (direction === "LEFT") {
    eye1X = headX - eyeOffset; eye1Y = headY - eyeDistance;
    eye2X = headX - eyeOffset; eye2Y = headY + eyeDistance;
  } else {
    eye1X = headX + eyeOffset; eye1Y = headY - eyeDistance;
    eye2X = headX + eyeOffset; eye2Y = headY + eyeDistance;
  }

  // Draw eyes (optimized - removed outline for performance)
  const eyeRadius = radius * 0.35;
  const pupilRadius = radius * 0.18;
  const shineRadius = radius * 0.08;
  const shineOffset = radius * 0.08;

  // Eye whites
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
  ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, pupilRadius, 0, Math.PI * 2);
  ctx.arc(eye2X, eye2Y, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(eye1X - shineOffset, eye1Y - shineOffset, shineRadius, 0, Math.PI * 2);
  ctx.arc(eye2X - shineOffset, eye2Y - shineOffset, shineRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw tongue if it's out (draw after eyes so it's on top)
  if (tongueOut) {
    drawTongue(headX, headY, radius, direction);
  }
}

function drawTongue(headX, headY, radius, direction) {
  const tongueLength = radius * 1.5;
  const tongueWidth = radius * 0.15;
  let tongueX, tongueY, forkX1, forkY1, forkX2, forkY2;

  // Position tongue based on direction
  if (direction === "UP") {
    tongueX = headX;
    tongueY = headY - radius * 1.1 - tongueLength;
    forkX1 = tongueX - tongueWidth * 2;
    forkY1 = tongueY - tongueWidth * 2;
    forkX2 = tongueX + tongueWidth * 2;
    forkY2 = tongueY - tongueWidth * 2;
  } else if (direction === "DOWN") {
    tongueX = headX;
    tongueY = headY + radius * 1.1 + tongueLength;
    forkX1 = tongueX - tongueWidth * 2;
    forkY1 = tongueY + tongueWidth * 2;
    forkX2 = tongueX + tongueWidth * 2;
    forkY2 = tongueY + tongueWidth * 2;
  } else if (direction === "LEFT") {
    tongueX = headX - radius * 1.1 - tongueLength;
    tongueY = headY;
    forkX1 = tongueX - tongueWidth * 2;
    forkY1 = tongueY - tongueWidth * 2;
    forkX2 = tongueX - tongueWidth * 2;
    forkY2 = tongueY + tongueWidth * 2;
  } else { // RIGHT
    tongueX = headX + radius * 1.1 + tongueLength;
    tongueY = headY;
    forkX1 = tongueX + tongueWidth * 2;
    forkY1 = tongueY - tongueWidth * 2;
    forkX2 = tongueX + tongueWidth * 2;
    forkY2 = tongueY + tongueWidth * 2;
  }

  // Draw tongue line
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = tongueWidth * 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  
  if (direction === "UP" || direction === "DOWN") {
    ctx.moveTo(headX, headY + (direction === "UP" ? -radius * 1.1 : radius * 1.1));
    ctx.lineTo(tongueX, tongueY);
  } else {
    ctx.moveTo(headX + (direction === "LEFT" ? -radius * 1.1 : radius * 1.1), headY);
    ctx.lineTo(tongueX, tongueY);
  }
  ctx.stroke();

  ctx.lineWidth = tongueWidth * 1.5;
  ctx.beginPath();
  ctx.moveTo(tongueX, tongueY);
  ctx.lineTo(forkX1, forkY1);
  ctx.moveTo(tongueX, tongueY);
  ctx.lineTo(forkX2, forkY2);
  ctx.stroke();
}


window.addEventListener("keydown", e => {
  const snake = game.snakes[0];


  const wasIdle = game.state === "Waiting";

  if (e.key === "ArrowUp") snake.setDirection("UP");
  if (e.key === "ArrowDown") snake.setDirection("DOWN");
  if (e.key === "ArrowLeft") snake.setDirection("LEFT");
  if (e.key === "ArrowRight") snake.setDirection("RIGHT");

  if (wasIdle && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
    game.start();
  }
});


const gameOverPopup = document.getElementById("gameOverPopup");
const finalScoreDiv = document.getElementById("finalScore");
const playAgainBtn = document.getElementById("playAgainBtn");

function showGameOver(score) {
  finalScoreDiv.innerText = `Final Score: ${score}`;
  gameOverPopup.style.display = "flex";
}

function hideGameOver() {
  gameOverPopup.style.display = "none";
}

startBtn.addEventListener("click", () => game.start());  
resetBtn.addEventListener("click", () => {
  game.reset();                     
  hideGameOver();
  render();          
});

playAgainBtn.addEventListener("click", () => {
  game.reset();
  hideGameOver();
  render();
  game.start();
});

render();             
