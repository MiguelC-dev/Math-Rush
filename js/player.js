class Adventurer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.facing = 'back';
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

    walkTo(tx, ty, onArrive, speed = 320) {
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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.facing === 'back') {
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.moveTo(-14, -22);
            ctx.lineTo(14, -22);
            ctx.lineTo(18, 16);
            ctx.lineTo(-18, 16);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#52525b';
            ctx.fillRect(-12, -26, 24, 32);

            ctx.fillStyle = '#71717a';
            ctx.beginPath();
            ctx.arc(0, -36, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#b45309';
            ctx.fillRect(-12, 2, 24, 6);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-3, 2, 6, 6);
        } else {
            ctx.fillStyle = '#b91c1c';
            ctx.beginPath();
            ctx.moveTo(-16, -24);
            ctx.lineTo(16, -24);
            ctx.lineTo(24, 18);
            ctx.lineTo(-24, 18);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#52525b';
            ctx.fillRect(-12, -26, 24, 32);

            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-4, -14, 8, 8);

            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(0, -36, 11, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#71717a';
            ctx.beginPath();
            ctx.arc(0, -42, 11, Math.PI, 0, false);
            ctx.fill();
        }

        ctx.restore();
    }
}