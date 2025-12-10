import { Board } from "./board.js"
import { Snake } from "./snake.js"


export class Game {
    constructor({
        width = 20,
        height = 20,
        tickRate = 120,
        onRender = null
    } = {}) {
        this.board = new Board(width, height)
        this.onRender = onRender;
        this.tickRate = tickRate;
        this.interValid = null;

        this.state = "idle"

        this.snakes = [
            new Snake({
                id: "player1",
                startPosition: {x: 5, y: 5}
            })
        ]

        this.food = this.board.getRandomEmptyCell(this.snakes);
        this.score = 0;
    }

    start() {
        if(this.interValid) return;

        this.state = "running";
        this.interValid = setInterval(() => {
            this.tick();

        }, this.tickRate)
    }

    stop() {
        clearInterval(this.interValid)
        this.interValid = null;
    }

    reset() {
        const startPos = this.board.getRandomEmptyCell()
        this.snakes[0].reset(startPos)

        this.food = this.board.getRandomEmptyCell(this.snakes)
        this.score = 0;
        this.state = "idle";
    }

    tick() {
        if(this.state !== "running") return;

        const snake = this.snakes[0];

        snake.move();

        const head = snake.getHead()

        if(!this.board.isInside(head)) {

            this.handleDeath();
            return; 
        }

      if (snake.hasSelfCollision()) {
      this.handleDeath();                  // Hantera död
      return;
    }

    if (head.x === this.food.x && head.y === this.food.y) {
      snake.grow();                        
      this.score = snake.getLength();  

      this.food = this.board.getRandomEmptyCell(this.snakes);
    }

    if (this.onRender) {
      this.onRender(this.getState());
    }
  }

  handleDeath() {
    this.state = "gameover"; 
    this.stop();

    const newStart = this.board.getRandomEmptyCell();
    this.snakes[0].reset(newStart);

    if (this.onRender) {
      this.onRender(this.getState());
    }
  }

  getState() {
    return {
      state: this.state, 
      snakes: this.snakes.map(s => s.segments),
      food: this.food,
      score: this.score
    };
  }
}
