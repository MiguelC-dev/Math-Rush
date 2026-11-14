class Adventurer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.facing = 'back'; // 'back' nas masmorras, 'front' na vitória
        this.state = 'idle';
        this.jumpY = 0;
        this.onArrive = null;
    }

    resetPosition(x, y, facing = 'back') {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.facing = facing;
        this.state = 'idle';
        this.jumpY = 0;
        this.onArrive = null;
    }

    walkTo(tx, ty, onArrive, speed = 300) {
        this.targetX = tx;
        this.targetY = ty;
        this.moveSpeed = speed;
        this.state = 'walking';
        this.onArrive = onArrive;
    }

    update(dt) {
        if (this.state === 'walking') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 4) {
                this.x = this.targetX;
                this.y = this.targetY;
                if (this.onArrive) {
                    const cb = this.onArrive;
                    this.onArrive = null;
                    cb();
                }
            } else {
                this.x += (dx / dist) * this.moveSpeed * dt;
                this.y += (dy / dist) * this.moveSpeed * dt;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.jumpY);

        // Desenho básico representativo do herói aventureiro
        ctx.fillStyle = '#52525b';
        ctx.fillRect(-15, -45, 30, 45);
        ctx.fillStyle = '#71717a';
        ctx.beginPath();
        ctx.arc(0, -55, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}