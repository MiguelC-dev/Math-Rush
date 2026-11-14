class MathRushGame {
    constructor() {
        // Inicialização de canvas e subsistemas do jogo
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new MedievalAudio();
        this.doors = new DoorSystem();
        this.player = new Adventurer(400, 500);

        // Carregamento de recorde salvo localmente
        this.highScore = parseInt(localStorage.getItem('math_rush_best_score') || '0', 10);
        
        // Estados e variáveis de progresso da partida
        this.mode = 'menu'; // menu, playing, animating, gameover, victory, test_map, test_victory
        this.score = 0;
        this.lives = 3;
        this.timeLeft = 15;
        this.currentQuestion = null;
        this.lastFrame = performance.now();
        this.fireworks = [];

        // Configuração de eventos e inicialização
        this.bindUI();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        requestAnimationFrame((t) => this.loop(t));
    }

    /* ------------------------------------------------------------------------
       1. REDIMENSIONAMENTO E RESPONSIVIDADE DE TELA
       ------------------------------------------------------------------------ */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Posição do horizonte e da base onde o jogador se movimenta
        this.horizonY = this.canvas.height * 0.44;
        this.playerStartY = this.canvas.height - 80;
        this.doors.setup([10, 20, 30], this.canvas.width, this.horizonY);
    }

    /* ------------------------------------------------------------------------
       2. LIGUAGEM DE EVENTOS DA INTERFACE (UI) E BOTÕES
       ------------------------------------------------------------------------ */
    bindUI() {
        // Botão Iniciar Aventura
        document.getElementById('btn-start').addEventListener('click', () => {
            this.audio.init();
            this.startNewGame();
        });

        // Botão Abrir Menu de Testes
        document.getElementById('btn-open-test').addEventListener('click', () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('test-menu').classList.remove('hidden');
        });

        // Voltar do menu de testes para o menu principal
        document.getElementById('btn-test-menu-back').addEventListener('click', () => {
            document.getElementById('test-menu').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        });

        // Voltar ao menu a partir da tela de jogo / teste / fim de jogo
        document.getElementById('btn-test-back').addEventListener('click', () => this.returnToMenu());
        document.getElementById('btn-end-menu').addEventListener('click', () => this.returnToMenu());

        // Botão de alternar áudio ON/OFF
        document.getElementById('btn-audio-toggle').addEventListener('click', () => {
            const muted = this.audio.toggleMute();
            document.getElementById('btn-audio-toggle').textContent = muted ? '🔇 Mudo' : '🔊 Som';
        });

        // Eventos dos botões de teste de mapas individuais e final
        document.querySelectorAll('[data-test]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.currentTarget.getAttribute('data-test');
                document.getElementById('test-menu').classList.add('hidden');
                if (val === 'victory') {
                    this.startVictorySequence();
                } else {
                    this.enterMapTest(parseInt(val, 10));
                }
            });
        });

        // Clique nas portas no Canvas principal
        this.canvas.addEventListener('click', (e) => {
            if (this.mode !== 'playing') return;
            const rect = this.canvas.getBoundingClientRect();
            const clicked = this.doors.getDoorAt(e.clientX - rect.left, e.clientY - rect.top);
            if (clicked) {
                this.handleDoorSelection(clicked);
            }
        });
    }

    /* ------------------------------------------------------------------------
       3. FLUXO DE PARTIDA E GERENCIAMENTO DE ESTADOS
       ------------------------------------------------------------------------ */
    returnToMenu() {
        this.mode = 'menu';
        this.audio.stopMusic();
        document.getElementById('hud-layer').classList.add('hidden');
        document.getElementById('test-controls').classList.add('hidden');
        document.getElementById('end-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('menu-highscore').textContent = `🏆 Recorde Pessoal: ${this.highScore} pts`;
    }

    startNewGame() {
        this.score = 0;
        this.lives = 3;
        this.mode = 'playing';
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud-layer').classList.remove('hidden');
        
        const region = DungeonRenderer.getRegionForScore(this.score);
        this.audio.startMusic('dungeon', region.id);
        this.loadNextQuestion();
    }

    loadNextQuestion() {
        const region = DungeonRenderer.getRegionForScore(this.score);
        this.timeLeft = region.timeLimit;
        
        // Gerar pergunta matemática e definir número de portas (3 normais ou 5 especiais)
        this.currentQuestion = MathQuestionGenerator.createQuestion(this.score);
        const isSpecial = MathQuestionGenerator.isSpecialScore(this.score);
        const doorCount = isSpecial ? 5 : 3;
        const options = MathQuestionGenerator.createOptions(this.currentQuestion.answer, doorCount);

        this.doors.setup(options, this.canvas.width, this.horizonY);
        this.player.resetPosition(this.canvas.width * 0.5, this.playerStartY, 'back');

        // Atualizar elementos visuais do HUD
        document.getElementById('hud-region').textContent = region.name;
        document.getElementById('question-text').textContent = this.currentQuestion.text;
        
        const badge = document.getElementById('challenge-indicator');
        if (isSpecial) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }

    /* ------------------------------------------------------------------------
       4. TRATAMENTO DE ESCOLHA DE PORTAS (RESPOSTA CERTA / ERRADA)
       ------------------------------------------------------------------------ */
    handleDoorSelection(door) {
        this.mode = 'animating';
        this.player.walkTo(door.x + door.w / 2, door.y + door.h, () => {
            if (door.value === this.currentQuestion.answer) {
                // Resposta Correta
                door.targetOpen = true;
                this.audio.playDoorOpen();
                this.audio.playCorrect();
                
                setTimeout(() => {
                    const oldRegionId = DungeonRenderer.getRegionForScore(this.score).id;
                    this.score += 100;
                    const newRegion = DungeonRenderer.getRegionForScore(this.score);

                    if (newRegion.id !== oldRegionId) {
                        this.audio.startMusic('dungeon', newRegion.id);
                    }

                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('math_rush_best_score', this.highScore);
                    }

                    if (this.score >= 5000) {
                        this.startVictorySequence();
                    } else {
                        this.mode = 'playing';
                        this.loadNextQuestion();
                    }
                }, 650);
            } else {
                // Resposta Incorreta
                door.broken = true;
                door.shakeTimer = 0.35;
                this.audio.playDoorBreak();
                this.audio.playWrong();
                this.lives--;

                setTimeout(() => {
                    if (this.lives <= 0) {
                        this.mode = 'gameover';
                        this.audio.stopMusic();
                        document.getElementById('hud-layer').classList.add('hidden');
                        document.getElementById('end-title').textContent = 'FIM DE JOGO';
                        document.getElementById('end-subtitle').textContent = 'Sua jornada nas masmorras chegou ao fim.';
                        document.getElementById('end-score').textContent = `${this.score} PONTOS`;
                        document.getElementById('end-screen').classList.remove('hidden');
                    } else {
                        door.broken = false;
                        this.mode = 'playing';
                        this.loadNextQuestion();
                    }
                }, 850);
            }
        });
    }

    /* ------------------------------------------------------------------------
       5. MODO DE TESTE E SEQUÊNCIA FINAL DE VITÓRIA
       ------------------------------------------------------------------------ */
    enterMapTest(mapIndex) {
        this.mode = 'test_map';
        this.score = mapIndex * 1000;
        document.getElementById('test-controls').classList.remove('hidden');
        document.getElementById('test-region-label').textContent = `Visualizando: ${REGIONS[mapIndex].name}`;
        
        this.doors.setup([10, 20, 30], this.canvas.width, this.horizonY);
        this.player.resetPosition(this.canvas.width * 0.5, this.playerStartY, 'back');
    }

    startVictorySequence() {
        this.mode = 'victory';
        this.audio.startMusic('victory');
        document.getElementById('hud-layer').classList.add('hidden');
        document.getElementById('test-controls').classList.add('hidden');

        // Posicionar herói de frente no campo aberto
        this.player.resetPosition(this.canvas.width * 0.5, this.canvas.height * 0.65, 'front');
        this.fireworks = [];

        // Disparar fogos de artifício com intervalos regulares
        const fwInterval = setInterval(() => {
            if (this.mode !== 'victory') {
                clearInterval(fwInterval);
                return;
            }
            this.audio.playFirework();
            this.fireworks.push({
                x: Math.random() * (this.canvas.width - 200) + 100,
                y: Math.random() * (this.canvas.height * 0.4) + 80,
                exploded: true,
                particles: Array.from({ length: 22 }, () => ({
                    x: 0, y: 0,
                    vx: (Math.random() - 0.5) * 7,
                    vy: (Math.random() - 0.5) * 7,
                    color: ['#ff4d4d', '#ffd700', '#60a5fa', '#34d399', '#f472b6'][Math.floor(Math.random() * 5)]
                }))
            });
        }, 750);

        // Exibir tela final após a comemoração
        setTimeout(() => {
            document.getElementById('end-title').textContent = 'PARABÉNS!';
            document.getElementById('end-subtitle').textContent = 'Você completou o Math Rush com maestria!';
            document.getElementById('end-score').textContent = '5.000 PONTOS';
            document.getElementById('end-screen').classList.remove('hidden');
        }, 3800);
    }

    /* ------------------------------------------------------------------------
       6. LOOP PRINCIPAL DE RENDERIZAÇÃO E ATUALIZAÇÃO
       ------------------------------------------------------------------------ */
    loop(now) {
        const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
        this.lastFrame = now;

        // Atualizar cronômetro se estiver jogando
        if (this.mode === 'playing') {
            this.timeLeft -= dt;
            const timerEl = document.getElementById('hud-timer');
            timerEl.textContent = `⏳ ${Math.ceil(this.timeLeft)}s`;

            if (this.timeLeft <= 3.5) {
                timerEl.classList.add('timer-urgent');
                this.audio.setUrgentTempo(true);
            } else {
                timerEl.classList.remove('timer-urgent');
                this.audio.setUrgentTempo(false);
            }

            if (this.timeLeft <= 0) {
                this.lives--;
                this.audio.playWrong();
                if (this.lives <= 0) {
                    this.mode = 'gameover';
                    this.audio.stopMusic();
                    document.getElementById('hud-layer').classList.add('hidden');
                    document.getElementById('end-title').textContent = 'FIM DE JOGO';
                    document.getElementById('end-subtitle').textContent = 'O tempo esgotou e você perdeu todas as vidas.';
                    document.getElementById('end-score').textContent = `${this.score} PONTOS`;
                    document.getElementById('end-screen').classList.remove('hidden');
                } else {
                    this.loadNextQuestion();
                }
            }
        }

        // Atualizar entidades
        this.doors.update(dt);
        this.player.update(dt);

        // Atualizar partículas de fogos de artifício na vitória
        if (this.mode === 'victory') {
            this.fireworks.forEach(fw => {
                fw.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.12; // gravidade
                });
            });
        }

        // Limpeza e desenho no Canvas 2D
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.mode === 'victory') {
            DungeonRenderer.drawOutdoorVictoryScene(this.ctx, this.canvas.width, this.canvas.height, now / 1000, this.fireworks);
        } else {
            const region = DungeonRenderer.getRegionForScore(this.score);
            DungeonRenderer.drawScene(this.ctx, this.canvas.width, this.canvas.height, region, now / 1000, this.horizonY);
            this.doors.draw(this.ctx, region);
        }
        
        this.player.draw(this.ctx);

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Inicializar instância global do jogo ao carregar a página
window.addEventListener('load', () => {
    window.mathRush = new MathRushGame();
});