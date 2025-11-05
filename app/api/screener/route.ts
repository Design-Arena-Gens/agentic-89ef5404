import { NextResponse } from 'next/server';
import { fetchDailyCandles } from '@/lib/yahoo';
import { TICKERS } from '@/lib/universe';
import { macd, rsi, simpleMovingAverage, recentCrossUp, slope } from '@/lib/indicators';

export const dynamic = 'force-dynamic';

function scoreSymbol(closes: number[]) {
  const rsiSeries = rsi(closes, 14);
  const rsiNow = rsiSeries[rsiSeries.length - 1];

  const sma20 = simpleMovingAverage(closes, 20);
  const sma50 = simpleMovingAverage(closes, 50);
  const priceNow = closes[closes.length - 1];
  const sma20Now = sma20[sma20.length - 1];
  const sma50Now = sma50[sma50.length - 1];

  const { macdLine, signalLine, histogram } = macd(closes);
  const macdNow = macdLine[macdLine.length - 1];
  const signalNow = signalLine[signalLine.length - 1];
  const histNow = histogram[histogram.length - 1];

  // Signals
  const rsiScore = !isFinite(rsiNow) ? 0 : (rsiNow >= 30 && rsiNow <= 55 ? 1 : rsiNow > 55 && rsiNow <= 65 ? 0.4 : rsiNow < 30 ? 0.2 : 0);
  const trendUp = priceNow > sma50Now && slope(sma50, 5) > 0 ? 1 : 0;
  const macdCross = recentCrossUp(macdLine, signalLine, 10) ? 1 : 0;
  const momentum = isFinite(histNow) && histNow > 0 ? 0.5 : 0;
  const nearSma20 = isFinite(sma20Now) ? Math.max(0, 1 - Math.abs((priceNow - sma20Now) / priceNow) * 20) : 0; // closer better

  const score = rsiScore * 2 + trendUp * 2 + macdCross * 2 + momentum * 1 + nearSma20 * 1;
  return {
    score,
    metrics: {
      rsi: isFinite(rsiNow) ? Number(rsiNow.toFixed(1)) : null,
      price: Number(priceNow.toFixed(2)),
      sma20: isFinite(sma20Now) ? Number(sma20Now.toFixed(2)) : null,
      sma50: isFinite(sma50Now) ? Number(sma50Now.toFixed(2)) : null,
      macd: isFinite(macdNow) ? Number(macdNow.toFixed(3)) : null,
      signal: isFinite(signalNow) ? Number(signalNow.toFixed(3)) : null,
      hist: isFinite(histNow) ? Number(histNow.toFixed(3)) : null,
    },
  };
}

export async function GET() {
  const results: any[] = [];
  const errors: Record<string, string> = {};

  // Fetch in small parallel batches to be polite
  const batchSize = 5;
  for (let i = 0; i < TICKERS.length; i += batchSize) {
    const batch = TICKERS.slice(i, i + batchSize);
    const fetched = await Promise.all(batch.map(async (symbol) => {
      try {
        const candles = await fetchDailyCandles(symbol, '6mo');
        const closes = candles.map(c => c.close);
        if (closes.length < 60) throw new Error('insufficient data');
        const { score, metrics } = scoreSymbol(closes);
        return { symbol, score: Number(score.toFixed(3)), ...metrics };
      } catch (e: any) {
        errors[symbol] = e?.message ?? 'fetch error';
        return null;
      }
    }));
    results.push(...fetched.filter(Boolean));
  }

  results.sort((a, b) => b.score - a.score);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    horizonDays: 10,
    candidates: results.slice(0, 20),
    errors,
    disclaimer: 'Informational only. Not financial advice. Markets carry risk.'
  }, { status: 200 });
}
