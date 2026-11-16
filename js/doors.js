/**
 * Arquivo responsável pelas portas
 * Gerencia o layout responsivo das portas (adaptado para telas largas e
 * celulares), placas numéricas, animações de abertura/quebra e detecção de toque.
 */
class DoorSystem {
    constructor() {
        this.doors = [];
    }

    // Posiciona 3 ou 5 portas centralizadas na tela conforme a largura disponível
    setup(options, canvasW, horizonY) {
        this.doors = [];
        const count = options.length;
        const maxTotalW = canvasW * 0.86;
        const gap = count === 5 ? Math.max(10, canvasW * 0.022) : Math.max(18, canvasW * 0.045);
        const rawDoorW = (maxTotalW - gap * (count - 1)) / count;
        const doorW = Math.max(54, Math.min(118, rawDoorW));
        const doorH = Math.max(105, Math.min(185, doorW * 1.58));

        const totalSpan = doorW * count + gap * (count - 1);
        const startX = (canvasW - totalSpan) / 2;
        const doorY = horizonY - doorH + 6;

        options.forEach((val, idx) => {
            this.doors.push({
                index: idx,
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

    // Atualiza a animação de abertura e tremor das portas a cada frame
    update(dt) {
        this.doors.forEach(d => {
            if (d.targetOpen && d.openProgress < 1) {
                d.openProgress = Math.min(1, d.openProgress + dt * 2.8);
            }
            if (d.shakeTimer > 0) {
                d.shakeTimer = Math.max(0, d.shakeTimer - dt);
            }
        });
    }

    // Desenha cada porta, seu arco de pedra, folha de madeira e placa numérica
    draw(ctx, region) {
        this.doors.forEach(d => {
            ctx.save();
            const shakeX = d.shakeTimer > 0 ? Math.sin(d.shakeTimer * 55) * 7 : 0;
            const x = d.x + shakeX;
            const y = d.y;
            const w = d.w;
            const h = d.h;

            // 1. Arco de pedra ao redor da porta
            const framePad = Math.max(7, w * 0.09);
            ctx.fillStyle = region ? region.archStone : '#443d47';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + w * 0.25, w / 2 + framePad, Math.PI, 0);
            ctx.lineTo(x + w + framePad, y + h);
            ctx.lineTo(x - framePad, y + h);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#120f14';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 2. Interior escuro atrás da porta
            ctx.fillStyle = '#09070a';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + w * 0.25, w / 2, Math.PI, 0);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
            ctx.fill();

            if (d.openProgress > 0.1) {
                const glow = ctx.createLinearGradient(x, y, x, y + h);
                glow.addColorStop(0, 'rgba(255, 215, 120, 0.22)');
                glow.addColorStop(1, 'rgba(255, 180, 80, 0.05)');
                ctx.fillStyle = glow;
                ctx.fillRect(x + 4, y + 10, w - 8, h - 10);
            }

            // 3. Folha de madeira da porta
            if (d.openProgress < 0.98) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(x + w / 2, y + w * 0.25, w / 2, Math.PI, 0);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                ctx.clip();

                const leafScale = Math.max(0.04, 1 - d.openProgress * 0.92);
                ctx.translate(x, y);
                ctx.scale(leafScale, 1);

                ctx.fillStyle = d.broken ? '#4a1c17' : '#5e391e';
                ctx.fillRect(0, 0, w, h);

                ctx.fillStyle = '#38200f';
                const planks = 4;
                for (let p = 1; p < planks; p++) {
                    ctx.fillRect((w / planks) * p - 1, 0, 2, h);
                }

                ctx.fillStyle = '#2d2d33';
                ctx.fillRect(0, h * 0.28, w, Math.max(6, h * 0.055));
                ctx.fillRect(0, h * 0.74, w, Math.max(6, h * 0.055));

                ctx.strokeStyle = '#b4b4be';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(w * 0.78, h * 0.56, Math.max(4, w * 0.065), 0, Math.PI * 2);
                ctx.stroke();

                if (d.broken) {
                    ctx.strokeStyle = '#120807';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(w * 0.2, h * 0.2);
                    ctx.lineTo(w * 0.55, h * 0.52);
                    ctx.lineTo(w * 0.35, h * 0.85);
                    ctx.moveTo(w * 0.55, h * 0.52);
                    ctx.lineTo(w * 0.82, h * 0.65);
                    ctx.stroke();
                }

                ctx.restore();
            }

            // 4. Placa com o número da resposta
            if (d.value !== null && d.value !== undefined && d.openProgress < 0.85) {
                const plaqueW = Math.min(w * 0.86, 84);
                const plaqueH = Math.max(26, Math.min(38, h * 0.23));
                const px = x + (w - plaqueW) / 2;
                const py = y + h * 0.36;

                ctx.fillStyle = '#1d140e';
                ctx.fillRect(px, py, plaqueW, plaqueH);
                ctx.strokeStyle = '#d4a84f';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(px, py, plaqueW, plaqueH);

                ctx.fillStyle = '#ffe7a3';
                const fontSize = Math.max(14, Math.min(22, Math.floor(plaqueH * 0.62)));
                ctx.font = `900 ${fontSize}px Cinzel, serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(d.value), px + plaqueW / 2, py + plaqueH / 2 + 1);
            }

            ctx.restore();
        });
    }

    // Verifica se o clique ou toque acertou alguma porta
    getDoorAt(mx, my) {
        for (const d of this.doors) {
            if (mx >= d.x - 8 && mx <= d.x + d.w + 8 && my >= d.y - 10 && my <= d.y + d.h + 10) {
                return d;
            }
        }
        return null;
    }
}