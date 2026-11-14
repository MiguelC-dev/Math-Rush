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
        // Pintura de fundo e paredes de pedra
        ctx.fillStyle = region.wallBase;
        ctx.fillRect(0, 0, w, horizonY);

        ctx.fillStyle = region.floorBase;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        // Elementos arquitetônicos específicos do Santuário Final
        if (region.theme === 'sanctuary') {
            this._drawStainedGlass(ctx, w * 0.14, horizonY * 0.22, 44, 78, true);
            this._drawStainedGlass(ctx, w * 0.86 - 44, horizonY * 0.22, 44, 78, false);
        }
    }

    static _drawStainedGlass(ctx, x, y, w, h, isLeft) {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(x + 5, y + 20, w - 10, h - 20);
        ctx.strokeStyle = '#e5b857';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
    }

    static drawOutdoorVictoryScene(ctx, w, h, timeSec, fireworks = []) {
        // Céu aberto ao amanhecer
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#1e3a8a');
        sky.addColorStop(1, '#93c5fd');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Explosões de fogos de artifício
        fireworks.forEach(fw => {
            if (fw.exploded) {
                fw.particles.forEach(p => {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, 4, 4);
                });
            }
        });
    }
}