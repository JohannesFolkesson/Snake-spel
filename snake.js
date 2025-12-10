export class Snake {
  constructor({ id, startPosition, direction = "RIGHT", color = "lime" }) {
    this.id = id;
    
    // Skapa andra segmentet baserat på riktning (bakom huvudet)
    let secondSegment = { ...startPosition };
    if (direction === "RIGHT") secondSegment.x -= 1;
    if (direction === "LEFT") secondSegment.x += 1;
    if (direction === "DOWN") secondSegment.y -= 1;
    if (direction === "UP") secondSegment.y += 1;
    
    this.segments = [
      { ...startPosition },
      secondSegment
    ];
    this.direction = direction;
    this.nextDirection = direction;
    this.alive = true;
    this.color = color;
    this.growSegments = 0;
  }

  setDirection(newDir) {
    const opposite = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT"
    };

    // Tillåt bara om det inte är motsatt riktning
    if (newDir !== opposite[this.direction]) {
      this.nextDirection = newDir;
    }
  }


  getNextHeadPosition() {
    const head = this.segments[0];
    const dir = this.nextDirection;

    let x = head.x;
    let y = head.y;

    if (dir === "UP") y--;
    if (dir === "DOWN") y++;
    if (dir === "LEFT") x--;
    if (dir === "RIGHT") x++;

    return { x, y };
  }


  move(newHead = null) {
    this.direction = this.nextDirection;
    if (!newHead) {
      newHead = this.getNextHeadPosition();
    }
    this.segments.unshift(newHead);

    if (this.growSegments > 0) {
      this.growSegments--;
    } else {
      this.segments.pop();
    }
  }

 
  grow(amount = 1) {
    this.growSegments += amount;
  }

  
  hasSelfCollision() {
    const [head, ...body] = this.segments;
    return body.some(seg => seg.x === head.x && seg.y === head.y);
  }

  reset(startPosition) {
    this.segments = [
      { ...startPosition },
      { x: startPosition.x - 1, y: startPosition.y }
    ];
    this.direction = "RIGHT";
    this.nextDirection = "RIGHT";
    this.growSegments = 0;
    this.alive = true;
  }

  getHead() {
    return this.segments[0];
  }

  getLength() {
    return this.segments.length;
  }
}
