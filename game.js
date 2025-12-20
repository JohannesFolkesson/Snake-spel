import { Board } from "./board.js"
import { Snake } from "./snake.js"


export class Game {
    constructor({
        width = 20,
        height = 20,
        tickRate = 120,
        onRender = null,
        onSound = null
    } = {}) {
        this.board = new Board(width, height)
        this.onRender = onRender;
        this.onSound = onSound;
        this.tickRate = tickRate;
        this.baseTickRate = tickRate;
        // Speed-up configuration
        this.minTickRate = 30; // fastest allowed (ms)
        this.speedStepMultiplier = 0.8; // reduce interval by this factor per threshold
        this.nextSpeedThreshold = 10; // score at which to speed up
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
            let startPos;
            if (snake.color === 'lime') {
                startPos = { x: 5, y: 10 };
            } else if (snake.color === 'blue') {
                startPos = { x: 15, y: 10 };
            } else {
                startPos = this.board.getRandomEmptyCell(this.snakes, this.food);
            }
            snake.reset(startPos)
        }

        this.food = this.board.getRandomEmptyCell(this.snakes)
        this.score = 0;
        // restore speed settings
        this.tickRate = this.baseTickRate;
        this.nextSpeedThreshold = 10;
        this.state = "Waiting";
    }

    addPlayer(id, color = 'lime') {
        // Prevent duplicates
        if (this.snakesById[id]) {
            console.log("Player already exists:", id);
            return this.snakesById[id];
        }
        // Cap to max 2 players (host + one joiner)
        if (this.snakes.length >= 2) {
            console.log("Max players reached, returning first player:", id);
        }
        let start;
        let dir;
        if (color === 'lime') {
            start = { x: 5, y: 10 };
            dir = 'UP';
        } else if (color === 'blue') {
            start = { x: 15, y: 10 };
            dir = 'DOWN';
        } else {
            start = this.board.getRandomEmptyCell(this.snakes, this.food);
            dir = 'RIGHT';
        }
        const snake = new Snake({ id, startPosition: start, color, direction: dir });
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

        // Check collision with other snakes
        for (const otherSnake of this.snakes) {
            if (otherSnake !== snake) {
                if (otherSnake.segments.some(seg => seg.x === nextHead.x && seg.y === nextHead.y)) {
                    console.warn("Death: collision with other snake", { nextHead, otherSnakeId: otherSnake.id });
                    this.handleDeath(snake);
                    return;
                }
            }
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
            // Possibly increase game speed when reaching thresholds
            this.maybeIncreaseSpeed();
        }

        }

        if (this.onRender) {
            this.onRender();
        }
    }

    maybeIncreaseSpeed() {
        // Increase speed (decrease tickRate) whenever score crosses the next threshold.
        if (typeof this.score !== 'number') return;
        while (this.score >= this.nextSpeedThreshold) {
            const newRate = Math.max(this.minTickRate, Math.floor(this.tickRate * this.speedStepMultiplier));
            if (newRate < this.tickRate) {
                this.tickRate = newRate;
                // if running, restart interval with new rate
                if (this.interValid) {
                    clearInterval(this.interValid);
                    this.interValid = setInterval(() => { this.tick(); }, this.tickRate);
                }
            }
            this.nextSpeedThreshold += 10;
        }
    }

    handleDeath(deadSnake) {
        if (!deadSnake) return;
        deadSnake.alive = false;

        // Play death / collision sound if callback provided
        try {
            if (this.onSound) this.onSound('death', deadSnake);
        } catch (e) {
            // ignore sound errors
        }

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
