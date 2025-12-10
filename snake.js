export class Snake {
    constructor({id, startPosition, direction = "RIGHT", color = "lime"}) {
        this.id = id;
        this.segments = [
            {...startPosition},
            { x: startPosition.x -1, y: startPosition.y }
        ]

        this.direction = direction;
        this.color = color;
        this.alive = true;
        this.growSegments = 0;
    }
}