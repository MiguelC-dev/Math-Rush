/**
 * Arquivo responsável pela renderização das regiões
 * Define as paletas de cores e tempos de cada fase, além de desenhar todos
 * os cenários arquitetônicos das masmorras e a paisagem de vitória no Canvas.
 */
const REGIONS = [
    {
        id: 0,
        name: 'Catacumbas',
        minScore: 0,
        maxScore: 899,
        timeLimit: 15,
        wallBase: '#231e24',
        stoneLight: '#332c36',
        stoneDark: '#161217',
        floorBase: '#1d191e',
        floorTile: '#29232b',
        archStone: '#3c3440',
        torchColor: '#ff8822',
        theme: 'catacombs'
    },
    {
        id: 1,
        name: 'Templo Abandonado',
        minScore: 1000,
        maxScore: 1899,
        timeLimit: 12,
        wallBase: '#2e2b24',
        stoneLight: '#423e33',
        stoneDark: '#1c1a15',
        floorBase: '#26231c',
        floorTile: '#343026',
        archStone: '#4d483b',
        torchColor: '#ff9d3b',
        theme: 'temple'
    },
    {
        id: 2,
        name: 'Caverna dos Cristais',
        minScore: 2000,
        maxScore: 2899,
        timeLimit: 10,
        wallBase: '#1a232e',
        stoneLight: '#263445',
        stoneDark: '#10161d',
        floorBase: '#151d26',
        floorTile: '#1f2b38',
        archStone: '#2e3f52',
        torchColor: '#66b8d9',
        theme: 'crystals'
    },
    {
        id: 3,
        name: 'Fortaleza Vulcânica',
        minScore: 3000,
        maxScore: 3899,
        timeLimit: 8,
        wallBase: '#291815',
        stoneLight: '#3d231e',
        stoneDark: '#170c0a',
        floorBase: '#1f1210',
        floorTile: '#2e1b18',
        archStone: '#472822',
        torchColor: '#ff4d1a',
        theme: 'volcano'
    },
    {
        id: 4,
        name: 'Santuário Final',
        minScore: 4000,
        maxScore: 4899,
        timeLimit: 6,
        wallBase: '#2e271a',
        stoneLight: '#473c26',
        stoneDark: '#1c170e',
        floorBase: '#241e14',
        floorTile: '#362d1e',
        archStone: '#594b30',
        torchColor: '#ffd452',
        theme: 'sanctuary'
    }
];

class DungeonRenderer {
    // Retorna os dados da região correspondente à pontuação do jogador
    static getRegionForScore(score) {
        if (score < 1000) return REGIONS[0];
        if (score < 2000) return REGIONS[1];
        if (score < 3000) return REGIONS[2];
        if (score < 4000) return REGIONS[3];
        return REGIONS[4];
    }

    // Desenha o cenário completo da masmorra atual
    static drawScene(ctx, w, h, region, timeSec, horizonY) {
        // 1. Parede de pedra ao fundo
        ctx.fillStyle = region.wallBase;
        ctx.fillRect(0, 0, w, horizonY);

        const blockW = 48;
        const blockH = 26;
        for (let row = 0; row * blockH < horizonY; row++) {
            const offsetX = (row % 2) * (blockW / 2);
            for (let col = -1; col * blockW < w + blockW; col++) {
                const bx = col * blockW + offsetX;
                const by = row * blockH;
                const hash = ((row * 31 + col * 17) & 7);
                ctx.fillStyle = hash < 2 ? region.stoneDark : hash > 5 ? region.stoneLight : region.wallBase;
                ctx.fillRect(bx + 1, by + 1, blockW - 2, blockH - 2);
            }
        }

        // 2. Piso em perspectiva
        ctx.fillStyle = region.floorBase;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        const floorH = h - horizonY;
        const rows = 9;
        for (let r = 0; r < rows; r++) {
            const t1 = r / rows;
            const t2 = (r + 1) / rows;
            const y1 = horizonY + Math.pow(t1, 1.35) * floorH;
            const y2 = horizonY + Math.pow(t2, 1.35) * floorH;

            ctx.fillStyle = r % 2 === 0 ? region.floorTile : region.floorBase;
            ctx.fillRect(0, y1, w, y2 - y1 + 1);

            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(0, y1, w, 2);

            const cols = 10;
            for (let c = 0; c <= cols; c++) {
                const normX = (c / cols) - 0.5;
                const topX = w * 0.5 + normX * w * 0.72;
                const botX = w * 0.5 + normX * w * 1.45;
                const x1 = topX + (botX - topX) * Math.pow(t1, 1.35);
                const x2 = topX + (botX - topX) * Math.pow(t2, 1.35);

                ctx.strokeStyle = 'rgba(0,0,0,0.38)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }

        // 3. Elementos decorativos específicos de cada mapa
        this._drawRegionalProps(ctx, w, h, region, horizonY, timeSec);

        // 4. Tochas animadas nas paredes
        const torchPositions = [w * 0.07, w * 0.93];
        if (w > 700) {
            torchPositions.push(w * 0.5);
        }
        torchPositions.forEach((tx, idx) => {
            this._drawTorch(ctx, tx, horizonY * 0.44, region.torchColor, timeSec + idx * 1.7);
        });

        // Sombra de vinheta nas bordas da tela
        const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.52)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);
    }

    // Desenha os detalhes exclusivos de cada uma das 5 regiões
    static _drawRegionalProps(ctx, w, h, region, horizonY, timeSec) {
        if (region.theme === 'catacombs') {
            this._drawWallNiche(ctx, w * 0.14, horizonY * 0.38, 36, 56);
            this._drawWallNiche(ctx, w * 0.86, horizonY * 0.38, 36, 56);
            this._drawChain(ctx, w * 0.22, 0, horizonY * 0.52);
            this._drawChain(ctx, w * 0.78, 0, horizonY * 0.52);
            this._drawSarcophagus(ctx, 18, horizonY + (h - horizonY) * 0.25, 58, 95);
            this._drawSarcophagus(ctx, w - 76, horizonY + (h - horizonY) * 0.25, 58, 95);
        } else if (region.theme === 'temple') {
            this._drawPillar(ctx, w * 0.06, 0, horizonY, 34, '#4a4538');
            this._drawPillar(ctx, w * 0.94 - 34, 0, horizonY, 34, '#4a4538');
            this._drawInscriptionTablet(ctx, w * 0.16, horizonY * 0.35, 42, 54);
            this._drawInscriptionTablet(ctx, w * 0.84 - 42, horizonY * 0.35, 42, 54);
            this._drawVines(ctx, w * 0.11, 0, horizonY * 0.78);
            this._drawVines(ctx, w * 0.89, 0, horizonY * 0.72);
            this._drawVines(ctx, w * 0.48, 0, horizonY * 0.32);
        } else if (region.theme === 'crystals') {
            const stalactites = [0.05, 0.15, 0.32, 0.5, 0.68, 0.85, 0.95];
            stalactites.forEach((sx, i) => {
                const len = 38 + (i % 3) * 24;
                ctx.fillStyle = '#253547';
                ctx.beginPath();
                ctx.moveTo(w * sx - 16, 0);
                ctx.lineTo(w * sx + 16, 0);
                ctx.lineTo(w * sx, len);
                ctx.closePath();
                ctx.fill();
            });
            this._drawCrystalCluster(ctx, 22, horizonY - 12, '#4a89a8', '#7bb7d4');
            this._drawCrystalCluster(ctx, w - 62, horizonY - 12, '#4a89a8', '#7bb7d4');
            this._drawCrystalCluster(ctx, 28, horizonY + (h - horizonY) * 0.45, '#3d7491', '#6ba3bf');
            this._drawCrystalCluster(ctx, w - 68, horizonY + (h - horizonY) * 0.45, '#3d7491', '#6ba3bf');
        } else if (region.theme === 'volcano') {
            this._drawPillar(ctx, w * 0.05, 0, horizonY, 38, '#2b1916');
            this._drawPillar(ctx, w * 0.95 - 38, 0, horizonY, 38, '#2b1916');
            this._drawChain(ctx, w * 0.16, 0, horizonY * 0.85);
            this._drawChain(ctx, w * 0.84, 0, horizonY * 0.85);

            const pulse = 0.85 + Math.sin(timeSec * 4) * 0.15;
            ctx.fillStyle = `rgba(235, 75, 18, ${pulse})`;
            ctx.beginPath();
            ctx.moveTo(w * 0.08, horizonY);
            ctx.lineTo(w * 0.13, horizonY);
            ctx.lineTo(w * 0.04, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(w * 0.87, horizonY);
            ctx.lineTo(w * 0.92, horizonY);
            ctx.lineTo(w, h);
            ctx.lineTo(w * 0.96, h);
            ctx.closePath();
            ctx.fill();
        } else if (region.theme === 'sanctuary') {
            this._drawOrnatePillar(ctx, w * 0.05, 0, horizonY, 40);
            this._drawOrnatePillar(ctx, w * 0.95 - 40, 0, horizonY, 40);
            if (w > 780) {
                this._drawOrnatePillar(ctx, w * 0.25 - 16, 0, horizonY, 32);
                this._drawOrnatePillar(ctx, w * 0.75 - 16, 0, horizonY, 32);
            }
            this._drawStainedGlass(ctx, w * 0.14, horizonY * 0.22, 44, 78, true);
            this._drawStainedGlass(ctx, w * 0.86 - 44, horizonY * 0.22, 44, 78, false);

            ctx.fillStyle = '#5c1818';
            ctx.beginPath();
            ctx.moveTo(w * 0.43, horizonY);
            ctx.lineTo(w * 0.57, horizonY);
            ctx.lineTo(w * 0.65, h);
            ctx.lineTo(w * 0.35, h);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#d4a84f';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    static _drawTorch(ctx, x, y, color, t) {
        const flicker = Math.sin(t * 14) * 3 + Math.cos(t * 23) * 2;
        const radius = 85 + flicker * 3;

        const grad = ctx.createRadialGradient(x, y - 10, 4, x, y - 10, radius);
        grad.addColorStop(0, color + '88');
        grad.addColorStop(0.5, color + '28');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y - 10, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#27272a';
        ctx.fillRect(x - 4, y, 8, 22);
        ctx.fillStyle = '#52525b';
        ctx.fillRect(x - 7, y - 2, 14, 5);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 2);
        ctx.lineTo(x + 6, y - 2);
        ctx.lineTo(x + flicker * 0.3, y - 20 - Math.abs(flicker));
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(x - 2, y - 10, 4, 7);
    }

    static _drawWallNiche(ctx, x, y, w, h) {
        ctx.fillStyle = '#0e0b10';
        ctx.beginPath();
        ctx.arc(x, y, w / 2, Math.PI, 0);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x - w / 2, y + h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#b8ad9e';
        ctx.fillRect(x - 6, y + h - 16, 12, 10);
        ctx.fillStyle = '#18141a';
        ctx.fillRect(x - 4, y + h - 13, 3, 3);
        ctx.fillRect(x + 1, y + h - 13, 3, 3);
    }

    static _drawChain(ctx, x, y1, y2) {
        ctx.fillStyle = '#4a4a52';
        for (let y = y1; y < y2; y += 10) {
            ctx.fillRect(x - 2, y, 4, 6);
            ctx.fillRect(x - 4, y + 5, 8, 3);
        }
    }

    static _drawSarcophagus(ctx, x, y, w, h) {
        ctx.fillStyle = '#38323b';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#1a161c';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
        ctx.fillStyle = '#524957';
        ctx.fillRect(x + w / 2 - 3, y + 16, 6, h - 32);
        ctx.fillRect(x + 14, y + 32, w - 28, 6);
    }

    static _drawPillar(ctx, x, y1, y2, w, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y1, w, y2 - y1);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x + 6, y1, 4, y2 - y1);
        ctx.fillRect(x + w - 10, y1, 4, y2 - y1);
        ctx.fillStyle = '#635c4d';
        ctx.fillRect(x - 5, y2 - 14, w + 10, 14);
        ctx.fillRect(x - 5, y1, w + 10, 14);
    }

    static _drawInscriptionTablet(ctx, x, y, w, h) {
        ctx.fillStyle = '#3b372c';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#1f1c16';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

        ctx.fillStyle = '#6b6352';
        for (let row = 0; row < 4; row++) {
            const ly = y + 11 + row * 10;
            ctx.fillRect(x + 8, ly, w - 16 - (row % 2) * 6, 3);
        }
    }

    static _drawVines(ctx, x, y1, y2) {
        ctx.strokeStyle = '#2d5a27';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y1);
        for (let y = y1; y <= y2; y += 16) {
            const wave = Math.sin(y * 0.08) * 6;
            ctx.lineTo(x + wave, y);
        }
        ctx.stroke();

        ctx.fillStyle = '#3f7d36';
        for (let y = y1 + 12; y < y2; y += 22) {
            const wave = Math.sin(y * 0.08) * 6;
            ctx.fillRect(x + wave - 5, y, 5, 4);
            ctx.fillRect(x + wave + 2, y + 8, 5, 4);
        }
    }

    static _drawCrystalCluster(ctx, x, y, darkColor, lightColor) {
        const shards = [
            { dx: 0, h: 38, w: 12, tilt: -0.22 },
            { dx: 12, h: 52, w: 14, tilt: 0.05 },
            { dx: 24, h: 32, w: 11, tilt: 0.28 }
        ];
        shards.forEach(s => {
            ctx.save();
            ctx.translate(x + s.dx, y);
            ctx.rotate(s.tilt);
            ctx.fillStyle = darkColor;
            ctx.beginPath();
            ctx.moveTo(-s.w / 2, 0);
            ctx.lineTo(0, -s.h);
            ctx.lineTo(s.w / 2, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = lightColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -s.h);
            ctx.lineTo(s.w / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }

    static _drawOrnatePillar(ctx, x, y1, y2, w) {
        ctx.fillStyle = '#5c4e36';
        ctx.fillRect(x, y1, w, y2 - y1);
        ctx.fillStyle = '#756447';
        ctx.fillRect(x + 6, y1, 5, y2 - y1);
        ctx.fillRect(x + w - 11, y1, 5, y2 - y1);
        ctx.fillStyle = '#d4a84f';
        ctx.fillRect(x - 6, y1, w + 12, 12);
        ctx.fillRect(x - 6, y2 - 14, w + 12, 14);
        ctx.fillRect(x - 2, y1 + (y2 - y1) * 0.45, w + 4, 6);
    }

    static _drawStainedGlass(ctx, x, y, w, h, isLeft) {
        ctx.save();
        const beamGrad = ctx.createLinearGradient(x + w / 2, y + h * 0.5, x + (isLeft ? 130 : -130), y + h + 170);
        beamGrad.addColorStop(0, 'rgba(255, 224, 130, 0.22)');
        beamGrad.addColorStop(1, 'rgba(255, 224, 130, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + h);
        ctx.lineTo(x + w - 4, y + h);
        ctx.lineTo(x + w + (isLeft ? 145 : -65), y + h + 175);
        ctx.lineTo(x + (isLeft ? 65 : -145), y + h + 175);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#1b264a';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#e0a938';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + w * 0.48, w * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + w * 0.48, w * 0.13, 0, Math.PI * 2);
        ctx.fill();

        const paneTop = y + w * 0.85;
        const paneH = h - w * 0.85 - 4;
        const halfW = (w - 12) / 2;
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(x + 5, paneTop, halfW, paneH * 0.52);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(x + 7 + halfW, paneTop, halfW, paneH * 0.52);
        ctx.fillStyle = '#047857';
        ctx.fillRect(x + 5, paneTop + paneH * 0.52 + 2, halfW, paneH * 0.46);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(x + 7 + halfW, paneTop + paneH * 0.52 + 2, halfW, paneH * 0.46);

        ctx.strokeStyle = '#e5b857';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.stroke();
    }

    // Desenha o cenário externo de vitória ao ar livre (céu, arco da saída, campo e fogos)
    static drawOutdoorVictoryScene(ctx, w, h, timeSec, fireworks = []) {
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
        sky.addColorStop(0, '#1e3a8a');
        sky.addColorStop(0.45, '#3b82f6');
        sky.addColorStop(0.82, '#93c5fd');
        sky.addColorStop(1, '#fef08a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h * 0.62);

        ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx.beginPath();
        ctx.arc(w * 0.82, h * 0.18, 72, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(w * 0.82, h * 0.18, 40, 0, Math.PI * 2);
        ctx.fill();

        fireworks.forEach(fw => {
            if (!fw.exploded) {
                ctx.fillStyle = fw.color;
                ctx.fillRect(fw.x - 2, fw.y - 6, 4, 12);
            } else {
                fw.particles.forEach(p => {
                    if (p.alpha <= 0) return;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
                    ctx.restore();
                });
            }
        });

        ctx.fillStyle = '#2e6f40';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.62);
        ctx.quadraticCurveTo(w * 0.25, h * 0.48, w * 0.55, h * 0.62);
        ctx.quadraticCurveTo(w * 0.8, h * 0.5, w, h * 0.62);
        ctx.closePath();
        ctx.fill();

        const archX = w * 0.5;
        const archY = h * 0.60;
        ctx.fillStyle = '#3f3b42';
        ctx.beginPath();
        ctx.arc(archX, archY - 45, 48, Math.PI, 0);
        ctx.lineTo(archX + 48, archY + 8);
        ctx.lineTo(archX - 48, archY + 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#141117';
        ctx.beginPath();
        ctx.arc(archX, archY - 42, 32, Math.PI, 0);
        ctx.lineTo(archX + 32, archY + 8);
        ctx.lineTo(archX - 32, archY + 8);
        ctx.closePath();
        ctx.fill();

        const grass = ctx.createLinearGradient(0, h * 0.6, 0, h);
        grass.addColorStop(0, '#3f8f47');
        grass.addColorStop(1, '#235c2b');
        ctx.fillStyle = grass;
        ctx.fillRect(0, h * 0.6, w, h * 0.4);

        for (let i = 0; i < 36; i++) {
            const gx = ((i * 197) % Math.max(1, Math.floor(w)));
            const gy = h * 0.63 + ((i * 89) % Math.max(1, Math.floor(h * 0.34)));
            ctx.fillStyle = '#1b4721';
            ctx.fillRect(gx, gy, 4, 8);
            ctx.fillRect(gx + 5, gy + 2, 4, 6);
            if (i % 4 === 0) {
                ctx.fillStyle = i % 8 === 0 ? '#fde047' : '#ffffff';
                ctx.fillRect(gx + 2, gy - 2, 4, 4);
            }
        }
    }
}