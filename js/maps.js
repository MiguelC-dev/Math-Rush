const REGIONS = [
    { id: 0, name: 'Catacumbas', timeLimit: 15, wallBase: '#231e24', stoneLight: '#332c36', stoneDark: '#161217', floorBase: '#1d191e', floorTile: '#29232b', archStone: '#3c3440', torchColor: '#ff8822', theme: 'catacombs' },
    { id: 1, name: 'Templo Abandonado', timeLimit: 12, wallBase: '#2e2b24', stoneLight: '#423e33', stoneDark: '#1c1a15', floorBase: '#26231c', floorTile: '#343026', archStone: '#4d483b', torchColor: '#ff9d3b', theme: 'temple' },
    { id: 2, name: 'Caverna dos Cristais', timeLimit: 10, wallBase: '#1a232e', stoneLight: '#263445', stoneDark: '#10161d', floorBase: '#151d26', floorTile: '#1f2b38', archStone: '#2e3f52', torchColor: '#66b8d9', theme: 'crystals' },
    { id: 3, name: 'Fortaleza Vulcânica', timeLimit: 8, wallBase: '#291815', stoneLight: '#3d231e', stoneDark: '#170c0a', floorBase: '#1f1210', floorTile: '#2e1b18', archStone: '#472822', torchColor: '#ff4d1a', theme: 'volcano' },
    { id: 4, name: 'Santuário Final', timeLimit: 6, wallBase: '#2e271a', stoneLight: '#473c26', stoneDark: '#1c170e', floorBase: '#241e14', floorTile: '#362d1e', archStone: '#594b30', torchColor: '#ffd452', theme: 'sanctuary' }
];

class DungeonRenderer {
    static getRegionForScore(score) {
        if (score < 1000) return REGIONS[0];
        if (score < 2000) return REGIONS[1];
        if (score < 3000) return REGIONS[2];
        if (score < 4000) return REGIONS[3];
        return REGIONS[4];
    }

    static drawScene(ctx, w, h, region, timeSec, horizonY) {
        ctx.fillStyle = region.wallBase;
        ctx.fillRect(0, 0, w, horizonY);

        ctx.fillStyle = region.stoneLight;
        const tileSize = 60;
        for (let x = 0; x < w; x += tileSize) {
            for (let y = 0; y < horizonY; y += tileSize) {
                if ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0) {
                    ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
                }
            }
        }

        ctx.fillStyle = region.floorBase;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        ctx.fillStyle = region.floorTile;
        for (let x = 0; x < w; x += 80) {
            ctx.fillRect(x, horizonY, 76, h - horizonY);
        }

        if (region.theme === 'sanctuary') {
            this._drawStainedGlass(ctx, w * 0.12, horizonY * 0.18, 55, 110, true);
            this._drawStainedGlass(ctx, w * 0.88 - 55, horizonY * 0.18, 55, 110, false);
            this._drawOrnatePillar(ctx, w * 0.28, horizonY, 34);
            this._drawOrnatePillar(ctx, w * 0.72, horizonY, 34);
        } else if (region.theme === 'temple') {
            this._drawVines(ctx, w * 0.15, 0, 40, horizonY);
            this._drawVines(ctx, w * 0.82, 0, 50, horizonY);
            this._drawInscriptionTablet(ctx, w * 0.5 - 70, horizonY * 0.35, 140, 65);
        } else if (region.theme === 'crystals') {
            this._drawCrystalCluster(ctx, 45, horizonY - 40, 35, '#38bdf8');
            this._drawCrystalCluster(ctx, w - 80, horizonY - 45, 40, '#818cf8');
        } else if (region.theme === 'volcano') {
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(0, h - 24, w, 24);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(0, h - 10, w, 6);
        } else if (region.theme === 'catacombs') {
            this._drawSarcophagus(ctx, 50, horizonY - 35, 75, 30);
            this._drawSarcophagus(ctx, w - 125, horizonY - 35, 75, 30);
        }

        this._drawTorch(ctx, 45, horizonY * 0.55, region.torchColor, timeSec);
        this._drawTorch(ctx, w - 45, horizonY * 0.55, region.torchColor, timeSec);
    }

    static _drawStainedGlass(ctx, x, y, w, h, isRosette) {
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0, false);
        ctx.fill();
        ctx.fillRect(x, y + w / 2, w, h - w / 2);

        ctx.strokeStyle = '#e5b857';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y + w / 2, w, h - w / 2);
        ctx.beginPath();
        ctx.arc(x + w / 2, y + w / 2, w / 2, 0, Math.PI * 2);
        ctx.stroke();

        const grad = ctx.createLinearGradient(x, y + h, x + w * 2, y + h + 250);
        grad.addColorStop(0, 'rgba(255, 230, 150, 0.22)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w * 2.5, y + h + 300);
        ctx.lineTo(x - w * 0.5, y + h + 300);
        ctx.fill();
    }

    static _drawOrnatePillar(ctx, x, horizonY, width) {
        ctx.fillStyle = '#473d31';
        ctx.fillRect(x - width / 2, 0, width, horizonY);
        ctx.fillStyle = '#e5b857';
        ctx.fillRect(x - width / 2 - 4, 0, width + 8, 16);
        ctx.fillRect(x - width / 2 - 4, horizonY - 18, width + 8, 18);
    }

    static _drawVines(ctx, x, y, w, h) {
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 20, y + h * 0.3, x - 15, y + h * 0.7, x + 5, y + h);
        ctx.stroke();
    }

    static _drawInscriptionTablet(ctx, x, y, w, h) {
        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 3;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#a8a29e';
        ctx.font = '11px Cinzel';
        ctx.textAlign = 'center';
        ctx.fillText('ANCIENT LORE', x + w / 2, y + h / 2);
    }

    static _drawCrystalCluster(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - size * 0.4, y + size);
        ctx.lineTo(x + size * 0.4, y + size);
        ctx.closePath();
        ctx.fill();
    }

    static _drawSarcophagus(ctx, x, y, w, h) {
        ctx.fillStyle = '#292524';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    }

    static _drawTorch(ctx, x, y, color, timeSec) {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(x - 5, y, 10, 22);

        const flicker = Math.sin(timeSec * 16) * 6;
        const grad = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 35 + flicker);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y - 6, 35 + flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(x, y - 4, 6 + flicker * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    static drawOutdoorVictoryScene(ctx, w, h, timeSec, fireworks = []) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#1e3a8a');
        sky.addColorStop(0.5, '#60a5fa');
        sky.addColorStop(1, '#fef08a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);

        ctx.fillStyle = '#22c55e';
        for (let i = 0; i < w; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, h * 0.55);
            ctx.lineTo(i + 20, h * 0.55 - 20);
            ctx.lineTo(i + 40, h * 0.55);
            ctx.fill();
        }

        fireworks.forEach(fw => {
            if (fw.exploded) {
                fw.particles.forEach(p => {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, 5, 5);
                });
            }
        });
    }
}