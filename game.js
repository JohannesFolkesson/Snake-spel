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
        this.snakes = [];
        this.snakesById = {};

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
        for (const snake of this.snakes) {
            const startPos = this.board.getRandomEmptyCell(this.snakes, this.food)
            snake.reset(startPos)
        }

        this.food = this.board.getRandomEmptyCell(this.snakes)
        this.score = 0;
        this.state = "Waiting";
    }

    addPlayer(id, color = 'lime') {
        // Prevent duplicates
        if (this.snakesById[id]) {
            return this.snakesById[id];
        }
        // Cap to max 2 players (host + one joiner)
        if (this.snakes.length >= 2) {
            return this.snakes[0];
        }
        const start = this.board.getRandomEmptyCell(this.snakes, this.food);
        const snake = new Snake({ id, startPosition: start, color });
        this.snakes.push(snake);
        this.snakesById[id] = snake;
        return snake;
    }

    removePlayer(id) {
        const s = this.snakesById[id];
        if (!s) return;
        this.snakes = this.snakes.filter(sn => sn !== s);
        delete this.snakesById[id];
    }

    tick() {
        if(this.state !== "Playing") return;
        for (const snake of this.snakes) {

        const nextHead = snake.getNextHeadPosition();
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
            this.handleDeath(snake);
            return; 
        }

        const bodyToCheck = (snake.growSegments > 0)
            ? snake.segments
            : snake.segments.slice(0, snake.segments.length - 1);

        if (bodyToCheck.some(seg => seg.x === nextHead.x && seg.y === nextHead.y)) {
            console.warn("Death: self-collision", { nextHead, bodyToCheck });
            this.handleDeath(snake);
            return;
        }

        snake.move(nextHead);

        const head = snake.getHead();

        if (head.x === this.food.x && head.y === this.food.y) {
            snake.grow();                        
            this.score = snake.getLength();  

            this.food = this.board.getRandomEmptyCell(this.snakes);
        }

        }

        if (this.onRender) {
            this.onRender();
        }
    }

    handleDeath(deadSnake) {
        if (!deadSnake) return;
        deadSnake.alive = false;

        // Do NOT remove snakes; keep roster for restart
        // End the game only if ALL snakes are dead
        const anyAlive = this.snakes.some(s => s.alive !== false);
        if (!anyAlive) {
            this.state = "gameover";
            this.stop();
        }

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
