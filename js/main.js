/**
 * Arquivo responsável pelo pricipal do jogo como controles e loops
 * Integra Áudio, Perguntas, Cenários, Portas e Jogador, além de tratar
 * eventos de mouse e toque na tela (Mobile) e o loop principal de quadros.
 */
class MathRushGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new MedievalAudio();
        this.doors = new DoorSystem();
        this.player = new Adventurer(400, 500);

        // Recorde salvo no navegador
        this.highScore = parseInt(localStorage.getItem('math_rush_best_score') || '0', 10);

        // Estado atual da partida
        this.mode = 'menu'; // 'menu', 'playing', 'animating', 'test_map', 'victory_seq', 'gameover', 'victory_end'
        this.score = 0;
        this.lives = 3;
        this.timeLeft = 15;
        this.timerAccum = 0;
        this.currentQuestion = null;
        this.testRegionIndex = 0;
        this.elapsedTime = 0;
        this.lastFrameTime = performance.now();

        // Efeitos visuais de dano e fogos de artifício
        this.damageFlash = 0;
        this.fireworks = [];
        this.fireworkTimer = 0;

        this.bindUI();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.updateHighScoreUI();
        requestAnimationFrame((t) => this.loop(t));
    }

    // Recalcula proporções do cenário e posição do painel de perguntas ao redimensionar ou girar o celular
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const w = this.canvas.width;
        const h = this.canvas.height;

        this.horizonY = Math.max(210, Math.min(h * 0.44, 340));
        this.playerStartY = h - Math.max(55, h * 0.09);

        const qBanner = document.getElementById('question-banner');
        const safeQTop = this.horizonY + Math.max(18, (this.playerStartY - this.horizonY) * 0.22);
        qBanner.style.top = `${Math.round(safeQTop)}px`;

        if (this.mode === 'menu' || this.mode === 'test_map') {
            this.doors.setup([null, null, null], w, this.horizonY);
            this.player.resetPosition(w * 0.5, this.playerStartY);
        } else if (this.mode === 'playing') {
            const currentVals = this.doors.doors.map(d => d.value);
            if (currentVals.length > 0) {
                this.doors.setup(currentVals, w, this.horizonY);
            }
            this.player.resetPosition(w * 0.5, this.playerStartY);
        }
    }

    // Conecta os botões da interface e os controles de clique / toque (Mobile)
    bindUI() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.audio.init();
            this.startNewGame();
        });

        document.getElementById('btn-open-test').addEventListener('click', () => {
            this.audio.init();
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('test-menu').classList.remove('hidden');
        });

        document.getElementById('btn-test-menu-back').addEventListener('click', () => {
            document.getElementById('test-menu').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        });

        document.querySelectorAll('[data-test]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.audio.init();
                const val = e.currentTarget.getAttribute('data-test');
                document.getElementById('test-menu').classList.add('hidden');
                if (val === 'victory') {
                    this.startVictorySequence(true);
                } else {
                    this.enterMapTest(parseInt(val, 10));
                }
            });
        });

        document.getElementById('btn-test-back').addEventListener('click', () => {
            this.returnToMainMenu();
        });

        document.getElementById('btn-end-menu').addEventListener('click', () => {
            this.returnToMainMenu();
        });

        document.getElementById('btn-audio-toggle').addEventListener('click', () => {
            const isMuted = this.audio.toggleMute();
            document.getElementById('btn-audio-toggle').textContent = isMuted ? '🔇 Mudo' : '🔊 Som';
        });

        // Função unificada para processar clique de mouse ou toque na tela do celular
        const handleCanvasPointer = (clientX, clientY) => {
            if (this.mode !== 'playing') return;
            this.audio.init(); // Garante desbloqueio de áudio no mobile
            const rect = this.canvas.getBoundingClientRect();
            const mx = clientX - rect.left;
            const my = clientY - rect.top;

            const clicked = this.doors.getDoorAt(mx, my);
            if (clicked) {
                this.handleDoorSelection(clicked);
            }
        };

        // Evento de clique (Desktop)
        this.canvas.addEventListener('click', (e) => {
            handleCanvasPointer(e.clientX, e.clientY);
        });

        // Evento de toque imediato (Mobile / Tablet)
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                e.preventDefault();
                const touch = e.touches[0];
                handleCanvasPointer(touch.clientX, touch.clientY);
            }
        }, { passive: false });
    }

    updateHighScoreUI() {
        document.getElementById('menu-highscore').textContent = `🏆 Recorde Pessoal: ${this.highScore.toLocaleString('pt-BR')} pts`;
    }

    saveHighScoreIfBetter(newScore) {
        if (newScore > this.highScore) {
            this.highScore = newScore;
            localStorage.setItem('math_rush_best_score', String(this.highScore));
            this.updateHighScoreUI();
        }
    }

    returnToMainMenu() {
        this.mode = 'menu';
        this.audio.stopMusic();
        document.getElementById('hud-layer').classList.add('hidden');
        document.getElementById('test-controls').classList.add('hidden');
        document.getElementById('end-screen').classList.add('hidden');
        document.getElementById('test-menu').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');

        this.doors.setup([null, null, null], this.canvas.width, this.horizonY);
        this.player.resetPosition(this.canvas.width * 0.5, this.playerStartY);
        this.updateHighScoreUI();
    }

    startNewGame() {
        this.score = 0;
        this.lives = 3;
        this.mode = 'playing';

        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('end-screen').classList.add('hidden');
        document.getElementById('test-controls').classList.add('hidden');
        document.getElementById('hud-layer').classList.remove('hidden');

        this.audio.startMusic('dungeon', 0);
        this.loadNextQuestion();
    }

    isSpecialChallengeScore(score) {
        return score === 900 || score === 1900 || score === 2900 || score === 3900 || score === 4900;
    }

    // Carrega a próxima pergunta e configura as portas da rodada
    loadNextQuestion() {
        const region = DungeonRenderer.getRegionForScore(this.score);
        const isSpecial = this.isSpecialChallengeScore(this.score);
        const doorCount = isSpecial ? 5 : 3;

        this.timeLeft = region.timeLimit;
        this.timerAccum = 0;

        this.currentQuestion = MathQuestionGenerator.createQuestion(this.score);
        const options = MathQuestionGenerator.createOptions(this.currentQuestion.answer, doorCount);

        this.doors.setup(options, this.canvas.width, this.horizonY);
        this.player.resetPosition(this.canvas.width * 0.5, this.playerStartY);

        document.getElementById('hud-region').textContent = region.name;
        document.getElementById('question-text').textContent = this.currentQuestion.text;
        const badge = document.getElementById('challenge-indicator');
        if (isSpecial) {
            badge.classList.remove('hidden');
            badge.textContent = this.score === 4900
                ? '👑 Desafio Final — 5 Portas'
                : '⚠️ Desafio Especial — 5 Portas';
        } else {
            badge.classList.add('hidden');
        }

        document.getElementById('question-banner').style.opacity = '1';
        this.updateHUD();
        this.audio.startMusic('dungeon', region.id);
    }

    updateHUD() {
        document.getElementById('hud-score').textContent = `⚔️ Pontos: ${this.score.toLocaleString('pt-BR')}`;
        document.getElementById('hud-lives').textContent = this.lives > 0 ? '❤️'.repeat(this.lives) : '💀';

        const timerEl = document.getElementById('hud-timer');
        timerEl.textContent = `⏳ ${Math.ceil(this.timeLeft)}s`;
        if (this.timeLeft <= 3) {
            timerEl.classList.add('timer-urgent');
            this.audio.setUrgentTempo(true);
        } else {
            timerEl.classList.remove('timer-urgent');
            this.audio.setUrgentTempo(false);
        }
    }

    // Processa a escolha de uma porta pelo jogador
    handleDoorSelection(door) {
        this.mode = 'animating';
        const doorCenterX = door.x + door.w / 2;
        const doorThresholdY = door.y + door.h + 14;

        this.player.walkTo(doorCenterX, doorThresholdY, () => {
            if (door.value === this.currentQuestion.answer) {
                door.targetOpen = true;
                this.audio.playDoorOpen();
                this.audio.playCorrect();

                setTimeout(() => {
                    this.player.state = 'entering';
                    this.player.walkTo(doorCenterX, door.y + door.h * 0.65, () => {
                        this.score += 100;
                        this.saveHighScoreIfBetter(this.score);
                        this.updateHUD();

                        if (this.score >= 5000) {
                            this.startVictorySequence(false);
                        } else {
                            this.mode = 'playing';
                            this.loadNextQuestion();
                        }
                    }, 190);
                }, 280);
            } else {
                door.broken = true;
                door.shakeTimer = 0.45;
                this.damageFlash = 0.45;
                this.audio.playDoorBreak();
                this.audio.playWrong();
                this.player.state = 'impact';

                this.lives--;
                this.updateHUD();

                setTimeout(() => {
                    if (this.lives <= 0) {
                        this.triggerGameOver();
                    } else {
                        door.broken = false;
                        this.mode = 'playing';
                        this.loadNextQuestion();
                    }
                }, 850);
            }
        });
    }

    handleTimeExpired() {
        this.mode = 'animating';
        this.damageFlash = 0.45;
        this.audio.playWrong();
        this.lives--;
        this.updateHUD();

        setTimeout(() => {
            if (this.lives <= 0) {
                this.triggerGameOver();
            } else {
                this.mode = 'playing';
                this.loadNextQuestion();
            }
        }, 700);
    }

    triggerGameOver() {
        this.mode = 'gameover';
        this.player.state = 'falling';
        this.audio.stopMusic();

        setTimeout(() => {
            document.getElementById('hud-layer').classList.add('hidden');
            document.getElementById('end-title').textContent = 'GAME OVER';
            document.getElementById('end-subtitle').textContent = 'Você perdeu todas as suas vidas nas masmorras.';
            document.getElementById('end-score').textContent = `${this.score.toLocaleString('pt-BR')} PONTOS`;
            document.getElementById('end-screen').classList.remove('hidden');
        }, 950);
    }

    enterMapTest(regionIndex) {
        this.mode = 'test_map';
        this.testRegionIndex = regionIndex;
        const region = REGIONS[regionIndex];

        document.getElementById('hud-layer').classList.add('hidden');
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('test-controls').classList.remove('hidden');
        document.getElementById('test-region-label').textContent = `Mapa ${regionIndex + 1}: ${region.name}`;

        this.doors.setup([null, null, null], this.canvas.width, this.horizonY);
        this.player.resetPosition(this.canvas.width * 0.5, this.playerStartY);
        this.audio.startMusic('dungeon', regionIndex);
    }

    startVictorySequence(isTest = false) {
        this.mode = 'victory_seq';
        this.isVictoryTest = isTest;
        this.fireworks = [];
        this.fireworkTimer = 0.1;
        document.getElementById('hud-layer').classList.add('hidden');
        document.getElementById('test-controls').classList.add('hidden');
        this.audio.startMusic('victory', 4);

        const w = this.canvas.width;
        const h = this.canvas.height;

        this.player.resetPosition(w * 0.5, h * 0.61, 'front');

        this.player.walkTo(w * 0.5, h * 0.79, () => {
            this.player.state = 'celebrate';
            this._performTwoCelebrationJumps(() => {
                this.mode = 'victory_end';
                document.getElementById('end-title').textContent = 'PARABÉNS POR TER COMPLETADO O MATH RUSH!';
                document.getElementById('end-subtitle').textContent = isTest
                    ? 'Demonstração da Sequência Final Concluída'
                    : 'Você conquistou todas as masmorras e alcançou a liberdade!';
                document.getElementById('end-score').textContent = '5.000 PONTOS';
                document.getElementById('end-screen').classList.remove('hidden');
            });
        }, 165);
    }

    _spawnFirework() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const colors = ['#fde047', '#f87171', '#60a5fa', '#4ade80', '#c084fc', '#fb923c'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        this.fireworks.push({
            x: w * (0.15 + Math.random() * 0.7),
            y: h * 0.52,
            targetY: h * (0.12 + Math.random() * 0.24),
            vy: -(280 + Math.random() * 90),
            color: color,
            exploded: false,
            particles: []
        });
    }

    _updateFireworks(dt) {
        this.fireworkTimer -= dt;
        if (this.fireworkTimer <= 0) {
            this._spawnFirework();
            this.fireworkTimer = 0.45 + Math.random() * 0.45;
        }

        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const fw = this.fireworks[i];
            if (!fw.exploded) {
                fw.y += fw.vy * dt;
                if (fw.y <= fw.targetY) {
                    fw.exploded = true;
                    this.audio.playFirework();
                    const count = 26;
                    for (let p = 0; p < count; p++) {
                        const angle = (Math.PI * 2 * p) / count + (Math.random() - 0.5) * 0.2;
                        const speed = 60 + Math.random() * 120;
                        fw.particles.push({
                            x: fw.x,
                            y: fw.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            alpha: 1.0,
                            color: fw.color
                        });
                    }
                }
            } else {
                let anyAlive = false;
                fw.particles.forEach(p => {
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vy += 95 * dt;
                    p.alpha -= dt * 1.15;
                    if (p.alpha > 0) anyAlive = true;
                });
                if (!anyAlive) {
                    this.fireworks.splice(i, 1);
                }
            }
        }
    }

    _performTwoCelebrationJumps(onFinished) {
        let jumpNum = 0;
        const doSingleJump = () => {
            if (jumpNum >= 2) {
                this.player.jumpY = 0;
                setTimeout(onFinished, 350);
                return;
            }
            jumpNum++;
            this.audio.playJump();
            let t = 0;
            const duration = 0.42;
            const jumpStep = () => {
                t += 0.016;
                const progress = Math.min(1, t / duration);
                this.player.jumpY = -Math.sin(progress * Math.PI) * 44;
                if (progress < 1) {
                    requestAnimationFrame(jumpStep);
                } else {
                    this.player.jumpY = 0;
                    setTimeout(doSingleJump, 180);
                }
            };
            requestAnimationFrame(jumpStep);
        };
        setTimeout(doSingleJump, 250);
    }

    // Loop principal de atualização e renderização (60 FPS)
    loop(now) {
        const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
        this.lastFrameTime = now;
        this.elapsedTime += dt;

        if (this.mode === 'playing') {
            this.timeLeft -= dt;
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.updateHUD();
                this.handleTimeExpired();
            } else {
                this.timerAccum += dt;
                if (this.timerAccum >= 0.2) {
                    this.timerAccum = 0;
                    this.updateHUD();
                }
            }
        }

        if (this.damageFlash > 0) {
            this.damageFlash = Math.max(0, this.damageFlash - dt);
        }

        this.doors.update(dt);
        this.player.update(dt, this.audio, this.horizonY, this.playerStartY);

        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        if (this.mode === 'victory_seq' || this.mode === 'victory_end') {
            this._updateFireworks(dt);
            DungeonRenderer.drawOutdoorVictoryScene(this.ctx, w, h, this.elapsedTime, this.fireworks);
            this.player.draw(this.ctx);
        } else {
            let activeRegion;
            if (this.mode === 'menu') {
                activeRegion = REGIONS[0];
            } else if (this.mode === 'test_map') {
                activeRegion = REGIONS[this.testRegionIndex];
            } else {
                activeRegion = DungeonRenderer.getRegionForScore(this.score);
            }

            DungeonRenderer.drawScene(this.ctx, w, h, activeRegion, this.elapsedTime, this.horizonY);
            this.doors.draw(this.ctx, activeRegion);
            this.player.draw(this.ctx);
        }

        if (this.damageFlash > 0) {
            this.ctx.fillStyle = `rgba(180, 20, 20, ${this.damageFlash * 0.55})`;
            this.ctx.fillRect(0, 0, w, h);
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Inicia o jogo ao carregar a página
window.addEventListener('load', () => {
    window.mathRush = new MathRushGame();
});