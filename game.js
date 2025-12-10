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

        const nextHead = snake.getNextHeadPosition();

                // Debug: visa rörelse och kontrollflöde
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

        // Om ormen inte växer denna tick kommer svansen att tas bort.
        // Tillåt att flytta in på svansens nuvarande cell i detta fall.
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
