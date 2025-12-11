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

        this.state = "Waiting"

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

        this.state = "Playing";
        this.interValid = setInterval(() => {
            this.tick();

        }, this.tickRate)
    }

    stop() {
        clearInterval(this.interValid)
        this.interValid = null;
    }

    reset() {
        this.stop();
        const startPos = this.board.getRandomEmptyCell()
        this.snakes[0].reset(startPos)

        this.food = this.board.getRandomEmptyCell(this.snakes)
        this.score = 0;
        this.state = "Waiting";
    }

    tick() {
        if(this.state !== "Playing") return;

        const snake = this.snakes[0];

        const nextHead = snake.getNextHeadPosition();

                // Debug: show movement and control flow
                console.debug("tick:", {
                    direction: snake.direction,
                    nextDirection: snake.nextDirection,
                    head: snake.getHead(),
                    nextHead,
                    growSegments: snake.growSegments,
                    segments: snake.segments
                });

        if(!this.board.isInside(nextHead)) {
            console.warn("Death: out-of-bounds", { nextHead, board: { w: this.board.width, h: this.board.height } });
            this.handleDeath();
            return; 
        }

        // If the snake doesn't grow this tick, the tail will be removed.
        // Allow moving into the tail's current cell in this case.
        const bodyToCheck = (snake.growSegments > 0)
            ? snake.segments
            : snake.segments.slice(0, snake.segments.length - 1);

        if (bodyToCheck.some(seg => seg.x === nextHead.x && seg.y === nextHead.y)) {
            console.warn("Death: self-collision", { nextHead, bodyToCheck });
            this.handleDeath();
            return;
        }

        snake.move(nextHead);

        const head = snake.getHead();

        if (head.x === this.food.x && head.y === this.food.y) {
            snake.grow();                        
            this.score = snake.getLength();  

            this.food = this.board.getRandomEmptyCell(this.snakes);
        }

        if (this.onRender) {
            this.onRender();
        }
    }

  handleDeath() {
    this.snakes[0].alive = false;
    this.state = "gameover"; 
    this.stop();

    if (this.onRender) {
      this.onRender();
    }
  }

  getState() {
    return {
      state: this.state, 
      snakes: this.snakes,
      food: this.food,
      score: this.score
    };
  }
}
