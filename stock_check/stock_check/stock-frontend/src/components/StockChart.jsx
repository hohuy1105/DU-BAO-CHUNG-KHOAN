import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

/**
 * props:
 *  - data: [{time, open, high, low, close, volume}]
 *  - indicators: [
 *      { name:'SMA-20'|'SMA-50'|'EMA-..', data:[{time,value}], color },
 *      { name:'RSI-14', data:[{time,value}], color },
 *      { name:'MACD-12-26-9', data:[{time,macd,signal,hist}], color }
 *    ]
 *  - height?: number
 *  - theme?: 'light' | 'dark'
 */

export default function StockChartApex({
    data = [],
    indicators = [],
    height = 460,
    theme = 'light',
}) {
    const palette =
        theme === 'dark'
            ? { bg: '#0f1218', text: '#d9d9d9', grid: '#2a2e39', up: '#26a69a', down: '#ef5350' }
            : { bg: '#ffffff', text: '#1f1f1f', grid: '#eaecef', up: '#26a69a', down: '#ef5350' };

    // === Force remount keys (khi timeframe/data thay đổi) ===
    const chartKey = useMemo(() => {
        const len = Array.isArray(data) ? data.length : 0;
        const first = len ? (typeof data[0]?.time === 'number' ? data[0]?.time : new Date(data[0]?.time).getTime()) : 0;
        const last = len ? (typeof data[len - 1]?.time === 'number' ? data[len - 1]?.time : new Date(data[len - 1]?.time).getTime()) : 0;
        const indLen = Array.isArray(indicators) ? indicators.length : 0;
        return `k-${len}-${first}-${last}-${indLen}`;
    }, [data, indicators]);

    const { candleSeries, overlayLines, rsiLine, macdLine, macdSignal, macdHist } = useMemo(() => {
        const toDate = (t) => (typeof t === 'number' ? new Date(t) : new Date(String(t)));

        const candle = (data || []).map((c) => ({
            x: toDate(c.time),
            y: [Number(c.open), Number(c.high), Number(c.low), Number(c.close)],
        }));

        const overlay = (indicators || [])
            .filter((ind) => !/RSI|MACD/i.test(ind?.name || ''))
            .map((ind) => ({
                name: ind.name,
                type: 'line',
                data: (ind.data || []).map((d) => ({ x: toDate(d.time), y: Number(d.value) })),
                color: ind.color || undefined,
            }));

        const rsi = (indicators || []).find((i) => /RSI/i.test(i?.name || ''));
        const macd = (indicators || []).find((i) => /MACD/i.test(i?.name || ''));

        return {
            candleSeries: [{ name: 'Price', type: 'candlestick', data: candle }],
            overlayLines: overlay,
            rsiLine: rsi
                ? [
                    {
                        name: rsi.name,
                        type: 'line',
                        data: (rsi.data || []).map((d) => ({ x: toDate(d.time), y: Number(d.value) })),
                    },
                ]
                : [],
            macdLine: macd
                ? [
                    {
                        name: 'MACD',
                        type: 'line',
                        data: (macd.data || []).map((d) => ({ x: toDate(d.time), y: Number(d.macd) })),
                    },
                ]
                : [],
            macdSignal: macd
                ? [
                    {
                        name: 'Signal',
                        type: 'line',
                        data: (macd.data || []).map((d) => ({ x: toDate(d.time), y: Number(d.signal) })),
                    },
                ]
                : [],
            macdHist: macd
                ? [
                    {
                        name: 'Histogram',
                        type: 'bar',
                        data: (macd.data || []).map((d) => ({ x: toDate(d.time), y: Number(d.hist) })),
                    },
                ]
                : [],
        };
    }, [data, indicators, theme]);

    const priceOptions = {
        chart: { type: 'candlestick', background: palette.bg, foreColor: palette.text, toolbar: { show: true } },
        grid: { borderColor: palette.grid },
        xaxis: { type: 'datetime' },
        yaxis: [
            {
                tooltip: { enabled: true },
                labels: { formatter: (val) => Number(val).toFixed(2) },
            },
        ],
        plotOptions: { candlestick: { colors: { upward: palette.up, downward: palette.down } } },
        stroke: { width: [1, 2, 2, 2] },
        legend: { show: true },
    };

    const rsiOptions = {
        chart: { type: 'line', background: palette.bg, foreColor: palette.text, toolbar: { show: false } },
        grid: { borderColor: palette.grid },
        xaxis: { type: 'datetime' },
        yaxis: [
            {
                min: 0,
                max: 100,
                tickAmount: 5,
                labels: { formatter: (v) => Math.round(v) },
            },
        ],
        annotations: {
            yaxis: [
                { y: 30, borderColor: '#aaa', label: { text: '30', style: { color: '#666' } } },
                { y: 70, borderColor: '#aaa', label: { text: '70', style: { color: '#666' } } },
            ],
        },
        stroke: { width: 2 },
    };

    const macdOptions = {
        chart: { background: palette.bg, foreColor: palette.text, toolbar: { show: false } },
        grid: { borderColor: palette.grid },
        xaxis: { type: 'datetime' },
        yaxis: [{ labels: { formatter: (v) => Number(v).toFixed(2) } }],
        stroke: { width: [2, 2, 0] },
    };

    priceOptions.chart.animations = { enabled: false };
    rsiOptions.chart.animations = { enabled: false };
    macdOptions.chart.animations = { enabled: false };

    return (
        <div>
            {/* Chart giá + overlay MA/EMA */}
            <Chart
                key={`price-${chartKey}`}
                options={priceOptions}
                series={[...candleSeries, ...overlayLines]}
                type="candlestick"
                height={height}
            />

            {/* RSI (nếu có) */}
            {rsiLine.length > 0 && (
                <div style={{ marginTop: 12 }}>
                    <Chart key={`rsi-${chartKey}`} options={rsiOptions} series={rsiLine} type="line" height={180} />
                </div>
            )}

            {/* MACD (nếu có) */}
            {(macdLine.length > 0 || macdHist.length > 0) && (
                <div style={{ marginTop: 12 }}>
                    <Chart
                        key={`macd-${chartKey}`}
                        options={macdOptions}
                        series={[...macdLine, ...macdSignal, ...macdHist]} // histogram vẽ dạng bar
                        type="line"
                        height={220}
                    />
                </div>
            )}
        </div>
    );
}
