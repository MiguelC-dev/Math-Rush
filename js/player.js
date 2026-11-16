/**
 * Arquivo responsável pelo personagem principal o aventureiro
 * Controla a posição, escala de profundidade, caminhada até as portas,
 * animação de derrota e desenho detalhado (visão de costas e de frente).
 */
class Adventurer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = x;
        this.targetY = y;
        this.scale = 1.0;
        this.alpha = 1.0;
        this.facing = 'back'; // 'back' nas masmorras, 'front' na vitória
        this.state = 'idle'; // 'idle', 'walking', 'entering', 'impact', 'falling', 'celebrate'
        this.walkPhase = 0;
        this.stepSoundTimer = 0;
        this.jumpY = 0;
        this.fallAngle = 0;
        this.onArrive = null;
    }

    // Reposiciona o personagem para o início da rodada
    resetPosition(x, y, facing = 'back') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = x;
        this.targetY = y;
        this.scale = 1.0;
        this.alpha = 1.0;
        this.facing = facing;
        this.state = 'idle';
        this.jumpY = 0;
        this.fallAngle = 0;
        this.onArrive = null;
    }

    // Inicia a caminhada até uma coordenada alvo e dispara um callback ao chegar
    walkTo(tx, ty, onArrive, speed = 340) {
        this.targetX = tx;
        this.targetY = ty;
        this.moveSpeed = speed;
        this.state = 'walking';
        this.onArrive = onArrive;
    }

    // Atualiza movimento, escala de perspectiva e sons de passos
    update(dt, audio, horizonY, baseBottomY) {
        const spanY = Math.max(1, baseBottomY - horizonY);
        const depthRatio = Math.max(0, Math.min(1, (this.y - horizonY) / spanY));
        this.scale = 0.56 + depthRatio * 0.46;

        if (this.state === 'walking' || this.state === 'entering') {
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
                const spd = this.moveSpeed || 340;
                this.x += (dx / dist) * spd * dt;
                this.y += (dy / dist) * spd * dt;
                this.walkPhase += dt * 13;

                this.stepSoundTimer -= dt;
                if (this.stepSoundTimer <= 0) {
                    audio.playStep();
                    this.stepSoundTimer = 0.24;
                }
            }

            if (this.state === 'entering') {
                this.alpha = Math.max(0, this.alpha - dt * 2.4);
            }
        } else if (this.state === 'idle') {
            this.walkPhase += dt * 2.2;
        } else if (this.state === 'falling') {
            this.fallAngle = Math.min(Math.PI / 2, this.fallAngle + dt * 4.2);
        }
    }

    // Renderiza o personagem no Canvas
    draw(ctx) {
        if (this.alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y + this.jumpY);
        ctx.scale(this.scale, this.scale);

        if (this.state === 'falling') {
            ctx.rotate(this.fallAngle);
        }

        const isWalking = this.state === 'walking' || this.state === 'entering';
        const bobY = isWalking ? Math.abs(Math.sin(this.walkPhase)) * -5 : Math.sin(this.walkPhase) * 1.5;
        const leftLegY = isWalking ? Math.sin(this.walkPhase) * 7 : 0;
        const rightLegY = isWalking ? -Math.sin(this.walkPhase) * 7 : 0;
        const cloakSway = isWalking ? Math.cos(this.walkPhase) * 3 : 0;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.beginPath();
        ctx.ellipse(0, 6 - this.jumpY * 0.4, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(0, bobY);

        if (this.facing === 'front') {
            this._drawFrontView(ctx, leftLegY, rightLegY, cloakSway);
        } else {
            this._drawBackView(ctx, leftLegY, rightLegY, cloakSway);
        }

        ctx.restore();
    }

    // Desenho do aventureiro de frente (usado na cena de vitória)
    _drawFrontView(ctx, leftLegY, rightLegY, cloakSway) {
        const armRaise = this.state === 'celebrate' ? -18 : 0;

        ctx.fillStyle = '#6e1616';
        ctx.beginPath();
        ctx.moveTo(-18, -46);
        ctx.lineTo(18, -46);
        ctx.lineTo(24 + cloakSway, -6);
        ctx.lineTo(-24 + cloakSway, -6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3b2313';
        ctx.fillRect(-12, -16 + leftLegY, 9, 20);
        ctx.fillRect(3, -16 + rightLegY, 9, 20);
        ctx.fillStyle = '#5c3820';
        ctx.fillRect(-13, -16 + leftLegY, 11, 5);
        ctx.fillRect(2, -16 + rightLegY, 11, 5);

        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(-13, -46, 26, 30);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.strokeRect(-13, -46, 26, 30);

        ctx.fillStyle = '#d4a84f';
        ctx.fillRect(-2, -41, 4, 14);
        ctx.fillRect(-6, -37, 12, 4);

        ctx.fillStyle = '#4a2c18';
        ctx.fillRect(-14, -22, 28, 6);
        ctx.fillStyle = '#f7d98c';
        ctx.fillRect(-4, -23, 8, 8);

        ctx.fillStyle = '#71717a';
        ctx.fillRect(-20, -44 + armRaise, 7, 18);
        ctx.fillRect(13, -44 + armRaise, 7, 18);
        ctx.fillStyle = '#d4a84f';
        ctx.fillRect(-20, -30 + armRaise, 7, 5);
        ctx.fillRect(13, -30 + armRaise, 7, 5);

        ctx.fillStyle = '#82828c';
        ctx.beginPath();
        ctx.arc(-16, -45, 8, 0, Math.PI * 2);
        ctx.arc(16, -45, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f2c6a0';
        ctx.fillRect(-11, -69, 22, 21);

        ctx.fillStyle = '#5c3820';
        ctx.fillRect(-12, -73, 24, 7);
        ctx.fillRect(-12, -68, 3, 10);
        ctx.fillRect(9, -68, 3, 10);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-3, -81, 6, 9);

        ctx.fillStyle = '#18181b';
        ctx.fillRect(-7, -62, 3, 4);
        ctx.fillRect(4, -62, 3, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-7, -62, 1.5, 1.5);
        ctx.fillRect(4, -62, 1.5, 1.5);

        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(-5, -54, 10, 2);
        ctx.fillRect(-6, -55, 2, 2);
        ctx.fillRect(4, -55, 2, 2);
    }

    // Desenho do aventureiro de costas (usado durante a exploração das masmorras)
    _drawBackView(ctx, leftLegY, rightLegY, cloakSway) {
        ctx.fillStyle = '#3b2313';
        ctx.fillRect(-12, -16 + leftLegY, 9, 20);
        ctx.fillRect(3, -16 + rightLegY, 9, 20);
        ctx.fillStyle = '#5c3820';
        ctx.fillRect(-13, -16 + leftLegY, 11, 5);
        ctx.fillRect(2, -16 + rightLegY, 11, 5);

        ctx.fillStyle = '#7a1c1c';
        ctx.beginPath();
        ctx.moveTo(-16, -48);
        ctx.lineTo(16, -48);
        ctx.lineTo(22 + cloakSway, -6);
        ctx.lineTo(-22 + cloakSway, -6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#541111';
        ctx.fillRect(-6 + cloakSway * 0.5, -46, 12, 38);
        ctx.fillStyle = '#c89d4c';
        ctx.fillRect(-21 + cloakSway, -9, 42, 3);

        ctx.fillStyle = '#71717a';
        ctx.beginPath();
        ctx.arc(-17, -45, 8, 0, Math.PI * 2);
        ctx.arc(17, -45, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#6e4526';
        ctx.fillRect(-11, -44, 22, 16);
        ctx.strokeStyle = '#362010';
        ctx.strokeRect(-11, -44, 22, 16);
        ctx.fillStyle = '#9c7a54';
        ctx.fillRect(-13, -49, 26, 6);

        ctx.save();
        ctx.rotate(-0.48);
        ctx.fillStyle = '#2b1b10';
        ctx.fillRect(-3, -46, 6, 54);
        ctx.fillStyle = '#d4a84f';
        ctx.fillRect(-4, -46, 8, 4);
        ctx.fillRect(-4, 4, 8, 4);
        ctx.fillStyle = '#c89d4c';
        ctx.fillRect(-11, -50, 22, 4);
        ctx.fillStyle = '#4a2c18';
        ctx.fillRect(-2.5, -62, 5, 12);
        ctx.fillStyle = '#f7d98c';
        ctx.beginPath();
        ctx.arc(0, -64, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#82828c';
        ctx.beginPath();
        ctx.arc(0, -61, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#52525b';
        ctx.fillRect(-12, -55, 24, 6);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-2.5, -79, 5, 16);
    }
}