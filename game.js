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
        this.boost = null;
        this.boostDuration = 8000;
        this.boostMultiplier = 0.6;
        this.boostTimeout = null;
        this.boostRespawnTimeout = null;
        this._prevTickRate = null;
    }

    start() {
        if(this.interValid) return;

        this.state = "Playing";
        try {
            if (this.onSound) this.onSound('start');
        } catch (e) {}

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
        // clear any active boost and timers
        if (this.boostTimeout) {
            clearTimeout(this.boostTimeout);
            this.boostTimeout = null;
        }
        if (this.boostRespawnTimeout) {
            clearTimeout(this.boostRespawnTimeout);
            this.boostRespawnTimeout = null;
        }
        this.boost = null;
        this._prevTickRate = null;
        this.state = "Waiting";
    }

    spawnBoost() {
        // Place boost on a random empty cell, avoid food and snakes
        // clear any pending respawn since we're spawning now
        if (this.boostRespawnTimeout) {
            clearTimeout(this.boostRespawnTimeout);
            this.boostRespawnTimeout = null;
        }
        const cell = this.board.getRandomEmptyCell(this.snakes, this.food);
        if (cell) {
            this.boost = { x: cell.x, y: cell.y };
        }
    }

    applySpeedBoost() {
        this.boost = null;
        if (!this._prevTickRate) this._prevTickRate = this.tickRate;
        const newRate = Math.max(this.minTickRate, Math.floor(this.tickRate * this.boostMultiplier));
        if (newRate < this.tickRate) {
            this.tickRate = newRate;
            if (this.interValid) {
                clearInterval(this.interValid);
                this.interValid = setInterval(() => { this.tick(); }, this.tickRate);
            }
        }

        if (this.boostTimeout) clearTimeout(this.boostTimeout);
        this.boostTimeout = setTimeout(() => {
            this._restoreSpeed();
        }, this.boostDuration);
    
        if (this.boostRespawnTimeout) clearTimeout(this.boostRespawnTimeout);
        this.boostRespawnTimeout = setTimeout(() => {
            this.spawnBoost();
            this.boostRespawnTimeout = null;
        }, 20000);
    }

    _restoreSpeed() {
        if (this._prevTickRate) {
            this.tickRate = this._prevTickRate;
            this._prevTickRate = null;
            if (this.interValid) {
                clearInterval(this.interValid);
                this.interValid = setInterval(() => { this.tick(); }, this.tickRate);
            }
        }
        if (this.boostTimeout) {
            clearTimeout(this.boostTimeout);
            this.boostTimeout = null;
        }
    }

    addPlayer(id, color = 'lime') {
        if (this.snakesById[id]) {
            console.log("Player already exists:", id);
            return this.snakesById[id];
        }
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

        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            const prevLen = snake.getLength();
            snake.grow();
            const afterLen = snake.getLength();
            this.score += 1;

            try {
                if (this.onSound) this.onSound('eat', snake);
            } catch (e) { }

            if (afterLen - prevLen > 1) {
                console.warn('[FOOD] Unexpected length jump on eat', { snakeId: snake.id, prevLen, afterLen, growSegments: snake.growSegments });
            }
            console.log(`[FOOD] Snake ${snake.id} ate food at ${head.x},${head.y} prevLen=${prevLen} afterLen=${afterLen} score=${this.score}`);

            this.food = this.board.getRandomEmptyCell(this.snakes);
            this.maybeIncreaseSpeed();

            if (!this.boost && Math.random() < 0.25) {
                this.spawnBoost();
            }
        }

        if (this.boost && head.x === this.boost.x && head.y === this.boost.y) {
            this.applySpeedBoost();
        }

        }

        if (this.onRender) {
            this.onRender();
        }
    }

    maybeIncreaseSpeed() {
        if (typeof this.score !== 'number') return;
        while (this.score >= this.nextSpeedThreshold) {
            const newRate = Math.max(this.minTickRate, Math.floor(this.tickRate * this.speedStepMultiplier));
            if (newRate < this.tickRate) {
                this.tickRate = newRate;
                
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
            score: this.score,
            boost: this.boost
    };
  }
}
