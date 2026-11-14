class DoorSystem {
    constructor() {
        this.doors = [];
    }

    setup(options, canvasW, horizonY) {
        this.doors = [];
        const count = options.length;
        const doorW = 90;
        const doorH = 150;
        const gap = 20;
        const totalSpan = doorW * count + gap * (count - 1);
        const startX = (canvasW - totalSpan) / 2;
        const doorY = horizonY - doorH + 10;

        options.forEach((val, idx) => {
            this.doors.push({
                value: val,
                x: startX + idx * (doorW + gap),
                y: doorY,
                w: doorW,
                h: doorH,
                openProgress: 0,
                targetOpen: false,
                broken: false,
                shakeTimer: 0
            });
        });
    }

    update(dt) {
        this.doors.forEach(d => {
            if (d.targetOpen && d.openProgress < 1) {
                d.openProgress += dt * 3;
            }
            if (d.shakeTimer > 0) {
                d.shakeTimer -= dt;
            }
        });
    }

    draw(ctx, region) {
        this.doors.forEach(d => {
            ctx.save();
            const sx = d.shakeTimer > 0 ? Math.sin(d.shakeTimer * 50) * 6 : 0;
            
            ctx.fillStyle = d.broken ? '#7f1d1d' : '#3f3f46';
            ctx.fillRect(d.x + sx, d.y, d.w, d.h);

            if (d.value !== null) {
                ctx.fillStyle = '#f3d57f';
                ctx.font = 'bold 20px Cinzel';
                ctx.textAlign = 'center';
                ctx.fillText(d.value, d.x + sx + d.w / 2, d.y + d.h / 2);
            }
            ctx.restore();
        });
    }

    getDoorAt(mx, my) {
        return this.doors.find(d => mx >= d.x && mx <= d.x + d.w && my >= d.y && my <= d.y + d.h) || null;
    }
}