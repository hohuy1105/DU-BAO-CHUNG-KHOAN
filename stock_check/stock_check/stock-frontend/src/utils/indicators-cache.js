const cache = new Map();

export function memoCalc(key, depsHash, fn) {
    const k = `${key}|${depsHash}`;
    if (cache.has(k)) return cache.get(k);
    const val = fn();
    cache.set(k, val);
    return val;
}
export const hashArr = (arr) => `${arr.length}:${arr[0]}:${arr[arr.length - 1]}`;
