import { Game } from "./game.js"

const canvas =  document.getElementById(gameCanvas)
const ctx = canvas.getContext("2d")

const CELL_SIZE = 20;

const statusDiv = document.getElementById("status")

const scoreDiv = document.getElementById("score")
const startBtn = document.getElementById("startBtn")

const resetBtn = document.getElementById('resetBtn')

const game = new Game({
    width: 20,
    height: 20,
    tickrate: 120,
    onRender: render
})

function render(state) {
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
    scoreDiv.innerText = `Poäng: ${state.score}`;   

  if (state.state === "gameover") {   
    ctx.fillStyle = "white";          
    ctx.font = "30px Arial";          

    ctx.fillText("GAME OVER", 90, 200); 
  }
}

function drawCell(x, y) {

  ctx.fillRect(
    x * CELL_SIZE,    
    // X-position i pixlar

    y * CELL_SIZE,    
    // Y-position i pixlar

    CELL_SIZE - 2,    
    // Bredd på rutan (lite mellanrum)

    CELL_SIZE - 2     
    // Höjd på rutan (lite mellanrum)
  );
}

// ----- Tangentbord -----
window.addEventListener("keydown", e => {
// Lyssnar på tangenttryckningar

  const snake = game.snakes[0]; 
  // Hämtar ormen

  if (e.key === "ArrowUp") snake.setDirection("UP");     
  // Om pil upp trycks

  if (e.key === "ArrowDown") snake.setDirection("DOWN"); 
  // Om pil ner trycks

  if (e.key === "ArrowLeft") snake.setDirection("LEFT"); 
  // Om pil vänster trycks

  if (e.key === "ArrowRight") snake.setDirection("RIGHT");
  // Om pil höger trycks
});

// ----- Knappar -----
startBtn.addEventListener("click", () => game.start());  
// När du klickar "Starta", startar spelet

resetBtn.addEventListener("click", () => {
  game.reset();                     
  // Återställer spelet

  render(game.getState());          
  // Ritar om direkt
});

// Första render så något syns direkt
render(game.getState());             
// Ritar startläget direkt när sidan laddas
