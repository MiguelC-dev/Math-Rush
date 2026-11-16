/**
 * Arquivo responsável por gerar as questões de matemática do jogo
 * Cria contas progressivas (adição, subtração, multiplicação, divisão)
 * e desafios especiais de 5 portas nos marcos de pontuação (900, 1900, etc.).
 */
class MathQuestionGenerator {
    // Verifica se a pontuação atual corresponde a um Desafio Especial (5 portas)
    static isSpecialScore(score) {
        return score === 900 || score === 1900 || score === 2900 || score === 3900 || score === 4900;
    }

    // Gera a pergunta e a resposta correta com base na pontuação atual
    static createQuestion(score) {
        const tier = Math.floor(score / 1000); // 0: Catacumbas, 1: Templo, 2: Caverna, 3: Vulcão, 4: Santuário

        // Desafios Especiais de 5 Portas
        if (this.isSpecialScore(score)) {
            if (score <= 1900) {
                const isMult = Math.random() < 0.5;
                if (isMult) {
                    const a = tier === 0 ? this.randInt(5, 9) : this.randInt(7, 12);
                    const b = tier === 0 ? this.randInt(4, 8) : this.randInt(6, 9);
                    return { text: `${a} × ${b} = ?`, answer: a * b };
                } else {
                    const divisor = tier === 0 ? this.randInt(3, 7) : this.randInt(5, 9);
                    const quotient = tier === 0 ? this.randInt(4, 9) : this.randInt(6, 11);
                    const dividend = divisor * quotient;
                    return { text: `${dividend} ÷ ${divisor} = ?`, answer: quotient };
                }
            } else {
                const multA = tier === 2 ? this.randInt(6, 10) : tier === 3 ? this.randInt(8, 12) : this.randInt(9, 14);
                const multB = tier === 2 ? this.randInt(4, 7) : tier === 3 ? this.randInt(5, 8) : this.randInt(6, 9);
                const product = multA * multB;
                const useAdd = Math.random() < 0.5;

                if (useAdd) {
                    const extra = tier === 2 ? this.randInt(6, 16) : tier === 3 ? this.randInt(11, 24) : this.randInt(15, 32);
                    return { text: `${multA} × ${multB} + ${extra} = ?`, answer: product + extra };
                } else {
                    const maxSub = Math.min(product - 3, tier === 2 ? 19 : tier === 3 ? 28 : 38);
                    const sub = this.randInt(6, Math.max(7, maxSub));
                    return { text: `${multA} × ${multB} − ${sub} = ?`, answer: product - sub };
                }
            }
        }

        // Perguntas Normais — Libera operações conforme a pontuação sobe
        let pool = ['+', '-'];
        if (score >= 300) pool.push('*');
        if (score >= 600) pool.push('/');

        const op = pool[Math.floor(Math.random() * pool.length)];
        let a, b, answer, symbol;

        if (op === '+') {
            symbol = '+';
            if (tier === 0) { a = this.randInt(6, 19); b = this.randInt(4, 15); }
            else if (tier === 1) { a = this.randInt(18, 45); b = this.randInt(12, 38); }
            else if (tier === 2) { a = this.randInt(32, 74); b = this.randInt(24, 65); }
            else if (tier === 3) { a = this.randInt(48, 110); b = this.randInt(35, 95); }
            else { a = this.randInt(65, 145); b = this.randInt(45, 125); }
            answer = a + b;
        } else if (op === '-') {
            symbol = '−';
            if (tier === 0) { a = this.randInt(12, 28); b = this.randInt(3, a - 2); }
            else if (tier === 1) { a = this.randInt(28, 62); b = this.randInt(11, a - 5); }
            else if (tier === 2) { a = this.randInt(45, 92); b = this.randInt(18, a - 8); }
            else if (tier === 3) { a = this.randInt(65, 130); b = this.randInt(24, a - 12); }
            else { a = this.randInt(85, 165); b = this.randInt(32, a - 15); }
            answer = a - b;
        } else if (op === '*') {
            symbol = '×';
            if (tier === 0) { a = this.randInt(3, 6); b = this.randInt(2, 5); }
            else if (tier === 1) { a = this.randInt(4, 8); b = this.randInt(3, 7); }
            else if (tier === 2) { a = this.randInt(6, 11); b = this.randInt(4, 9); }
            else if (tier === 3) { a = this.randInt(7, 13); b = this.randInt(5, 11); }
            else { a = this.randInt(8, 15); b = this.randInt(6, 12); }
            answer = a * b;
        } else {
            symbol = '÷';
            if (tier === 0) { b = this.randInt(2, 5); const q = this.randInt(3, 6); a = b * q; answer = q; }
            else if (tier === 1) { b = this.randInt(3, 7); const q = this.randInt(4, 8); a = b * q; answer = q; }
            else if (tier === 2) { b = this.randInt(4, 9); const q = this.randInt(5, 10); a = b * q; answer = q; }
            else if (tier === 3) { b = this.randInt(5, 11); const q = this.randInt(6, 12); a = b * q; answer = q; }
            else { b = this.randInt(6, 13); const q = this.randInt(7, 14); a = b * q; answer = q; }
        }

        return {
            text: `${a} ${symbol} ${b} = ?`,
            answer: answer
        };
    }

    // Cria as opções embaralhadas para as portas (1 correta + distratores próximos)
    static createOptions(correctAnswer, doorCount) {
        const options = new Set([correctAnswer]);
        let safety = 0;
        while (options.size < doorCount && safety < 200) {
            safety++;
            const strategy = Math.random();
            let candidate;
            if (strategy < 0.65) {
                const delta = this.randInt(1, Math.max(6, Math.ceil(correctAnswer * 0.22)));
                candidate = correctAnswer + (Math.random() < 0.5 ? delta : -delta);
            } else if (strategy < 0.88) {
                candidate = correctAnswer + (Math.random() < 0.5 ? 10 : -10);
            } else {
                candidate = correctAnswer + this.randInt(-3, 3);
            }
            if (candidate >= 0 && candidate !== correctAnswer) {
                options.add(candidate);
            }
        }
        let fallback = 1;
        while (options.size < doorCount) {
            if (!options.has(correctAnswer + fallback)) options.add(correctAnswer + fallback);
            fallback++;
        }

        const arr = Array.from(options);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Utilitário para gerar número inteiro aleatório entre min e max
    static randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}