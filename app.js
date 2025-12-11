import { Game } from "./game.js"

const canvas =  document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

const CELL_SIZE = 20;

const statusDiv = document.getElementById("status")

const scoreDiv = document.getElementById("score")
const startBtn = document.getElementById("startBtn")

const resetBtn = document.getElementById('resetBtn')

// Derive board dimensions from canvas and cell size
const GRID_WIDTH = Math.floor(canvas.width / CELL_SIZE);
const GRID_HEIGHT = Math.floor(canvas.height / CELL_SIZE);

const game = new Game({
  width: GRID_WIDTH,
  height: GRID_HEIGHT,
  tickRate: 120,
  onRender: render
})

function render() {
    const state = game.getState();
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#111";

    ctx.fillRect(0, 0, canvas.width, canvas.height); 

    ctx.fillStyle = "red";

    drawCell(state.food.x, state.food.y)

     ctx.fillStyle = "lime";             

  state.snakes[0].segments.forEach(seg => {    
    drawCell(seg.x, seg.y);           

  });

    statusDiv.innerText = `Status: ${state.state}`; 
    scoreDiv.innerText = `Score: ${state.score}`;   

  if (state.state === "gameover") {   
    showGameOver(state.score);
  }
}

function drawCell(x, y) {

  ctx.fillRect(
    x * CELL_SIZE,    
    y * CELL_SIZE,    
    CELL_SIZE - 2,    
    CELL_SIZE - 2     
  );
}


window.addEventListener("keydown", e => {
  const snake = game.snakes[0];

  // Start the game on first direction input when the game is waiting
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
