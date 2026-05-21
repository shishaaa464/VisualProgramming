export const evaluateFormula = (formula: string, data: Record<string, string>): string => {
    if (!formula.startsWith('=')) return formula;

    try {
        let expression = formula.slice(1).toUpperCase();

        const funcRegex = /(SUM|AVERAGE)\(([A-Z])(\d+):([A-Z])(\d+)\)/g;
        expression = expression.replace(funcRegex, (_, func, colS, rowS, colE, rowE) => {
            const vals: number[] = [];
            const rStart = parseInt(rowS);
            const rEnd = parseInt(rowE);
            const cStart = colS.charCodeAt(0);
            const cEnd = colE.charCodeAt(0);

            for (let c = cStart; c <= cEnd; c++) {
                for (let r = rStart; r <= rEnd; r++) {
                    const val = data[`${String.fromCharCode(c)}${r}`] || '0';
                    vals.push(Number(val) || 0);
                }
            }

            if (func === 'SUM') return String(vals.reduce((a, b) => a + b, 0));
            if (func === 'AVERAGE') return String(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
            return '0';
        });

        expression = expression.replace(/[A-Z]\d+/g, (m) => {
            const val = data[m] || '0';
            return isNaN(Number(val)) ? '0' : val;
        });

        const result = new Function(`return ${expression}`)();
        return String(result ?? '');
    } catch {
        return "#ERROR!";
    }
};