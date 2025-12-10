export class Board {
    constructor(width = 20, height = 20) {
        this.width = width;
        this.height = height;

        
    }

    isInside(position) {
        return (
            position.x >= 0 &&
            position.x < this.width && 
            position.y >= 0 && 
            position.y < this.height
        )
    }

    getRandomEmptyCell( snakes = [], foodPosition = null) {
        const occupied = new Set();

        snakes.forEach(snake => {
            snake.segments.forEach(seg => {
                occupied.add(`${seg.x},${seg.y}`)
            })
        })

        if(foodPosition) {
            occupied.add(`${foodPosition.x},${foodPosition.y}`)
        }

        let position;
        let attempts = 0;

        do {
            position = {
                x: Math.floor(Math.random() * this.width),
                y: Math.floor(Math.random() * this.height)
            }
            attempts++;

            if (attempts > 1000) break;
        } while(occupied.has(`${position.x},${position.y}`));

        return position;


    }
}