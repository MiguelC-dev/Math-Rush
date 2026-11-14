class MathQuestionGenerator {
    static isSpecialScore(score) {
        return score === 900 || score === 1900 || score === 2900 || score === 3900 || score === 4900;
    }

    static createQuestion(score) {
        const tier = Math.floor(score / 1000);

        // Desafios Especiais de 5 Portas nos Marcos de Transição
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
                    return { text: `${divisor * quotient} ÷ ${divisor} = ?`, answer: quotient };
                }
            } else {
                // Expressões combinadas nas fases avançadas
                const multA = tier === 2 ? this.randInt(6, 10) : tier === 3 ? this.randInt(8, 12) : this.randInt(9, 14);
                const multB = tier === 2 ? this.randInt(4, 7) : tier === 3 ? this.randInt(5, 8) : this.randInt(6, 9);
                const product = multA * multB;
                const useAdd = Math.random() < 0.5;

                if (useAdd) {
                    const extra = tier === 2 ? this.randInt(6, 16) : tier === 3 ? this.randInt(11, 24) : this.randInt(15, 32);
                    return { text: `${multA} × ${multB} + ${extra} = ?`, answer: product + extra };
                } else {
                    const sub = this.randInt(6, Math.min(product - 3, 25));
                    return { text: `${multA} × ${multB} − ${sub} = ?`, answer: product - sub };
                }
            }
        }

        // Perguntas Padrão (3 Portas) com Dificuldade Progressiva
        let pool = ['+', '-'];
        if (score >= 300) pool.push('*');
        if (score >= 600) pool.push('/');

        const op = pool[Math.floor(Math.random() * pool.length)];
        let a, b, answer, symbol;

        if (op === '+') {
            symbol = '+';
            a = this.randInt(6 + tier * 6, 25 + tier * 25);
            b = this.randInt(4 + tier * 5, 20 + tier * 20);
            answer = a + b;
        } else if (op === '-') {
            symbol = '−';
            a = this.randInt(15 + tier * 10, 35 + tier * 25);
            b = this.randInt(4, Math.max(5, a - 5));
            answer = a - b;
        } else if (op === '*') {
            symbol = '×';
            a = this.randInt(3 + tier, 6 + tier * 2);
            b = this.randInt(2 + tier, 5 + tier * 2);
            answer = a * b;
        } else {
            symbol = '÷';
            b = this.randInt(2 + tier, 5 + tier);
            const q = this.randInt(3 + tier, 6 + tier);
            a = b * q;
            answer = q;
        }

        return { text: `${a} ${symbol} ${b} = ?`, answer: answer };
    }

    static createOptions(correctAnswer, doorCount) {
        const options = new Set([correctAnswer]);
        while (options.size < doorCount) {
            const delta = this.randInt(1, 8);
            const candidate = correctAnswer + (Math.random() < 0.5 ? delta : -delta);
            if (candidate >= 0 && candidate !== correctAnswer) {
                options.add(candidate);
            }
        }
        return Array.from(options).sort(() => Math.random() - 0.5);
    }

    static randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}