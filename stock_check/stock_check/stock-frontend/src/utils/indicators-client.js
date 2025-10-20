// ===== Helpers =====
const toNum = (x) => (x == null ? NaN : Number(x));

/** Simple Moving Average */
export function SMA(values, period) {
    const out = [];
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        const v = toNum(values[i]);
        sum += v;
        if (i >= period) sum -= toNum(values[i - period]);
        if (i >= period - 1) out.push(sum / period);
    }
    return out;
}

/** Exponential Moving Average (Wilder/Trading view style α = 2/(n+1)) */
export function EMA(values, period) {
    const out = [];
    let ema;
    const alpha = 2 / (period + 1);
    for (let i = 0; i < values.length; i++) {
        const v = toNum(values[i]);
        if (i === period - 1) {
            // seed bằng SMA đầu
            let seed = 0;
            for (let j = 0; j < period; j++) seed += toNum(values[j]);
            ema = seed / period;
            out.push(ema);
        } else if (i >= period) {
            ema = alpha * v + (1 - alpha) * ema;
            out.push(ema);
        }
    }
    return out;
}

/** RSI (Wilder's) */
export function RSI(values, period = 14) {
    if (!values || values.length < period + 1) return [];
    const gains = [], losses = [];
    for (let i = 1; i < values.length; i++) {
        const ch = toNum(values[i]) - toNum(values[i - 1]);
        gains.push(Math.max(ch, 0));
        losses.push(Math.max(-ch, 0));
    }
    const avg = (arr, start, len) =>
        arr.slice(start, start + len).reduce((a, b) => a + b, 0) / len;

    let avgGain = avg(gains, 0, period);
    let avgLoss = avg(losses, 0, period);
    const rsi = [100 - 100 / (1 + avgGain / (avgLoss || 1e-9))];

    for (let i = period; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        const rs = avgGain / (avgLoss || 1e-9);
        rsi.push(100 - 100 / (1 + rs));
    }
    return rsi;
}

/** Bollinger Bands: trả về {middle[], upper[], lower[]} */
export function Bollinger(values, period = 20, stdev = 2) {
    if (!values || values.length < period) return { middle: [], upper: [], lower: [] };
    const middle = SMA(values, period);
    const upper = [];
    const lower = [];
    for (let i = period - 1; i < values.length; i++) {
        const window = values.slice(i - period + 1, i + 1).map(toNum);
        const mean = middle[i - (period - 1)];
        const variance = window.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
        const sd = Math.sqrt(variance);
        upper.push(mean + stdev * sd);
        lower.push(mean - stdev * sd);
    }
    return { middle, upper, lower };
}

/** MACD: trả về { macd[], signal[], hist[] } */
export function MACD(values, fast = 12, slow = 26, signal = 9) {
    if (!values || values.length < slow + signal) return { macd: [], signal: [], hist: [] };
    const emaFast = EMA(values, fast);
    const emaSlow = EMA(values, slow);
    // căn lề: emaFast dài hơn emaSlow (vì period nhỏ hơn)
    const offset = emaFast.length - emaSlow.length;
    const macd = emaFast.slice(offset).map((v, i) => v - emaSlow[i]);
    const signalLine = EMA(macd, signal);
    const hist = macd.slice(macd.length - signalLine.length).map((v, i) => v - signalLine[i]);
    // cắt macd cho trùng độ dài với signal/hist
    const macdAligned = macd.slice(macd.length - signalLine.length);
    return { macd: macdAligned, signal: signalLine, hist };
}
