import { headers } from 'next/headers';

async function getCandidates() {
  const hdrs = headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? 'https';
  const base = host ? `${proto}://${host}` : '';
  const res = await fetch(`${base}/api/screener`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch candidates');
  return res.json();
}

export default async function Page() {
  const data = await getCandidates();
  const items = data.candidates as Array<any>;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">Top swing candidates (10?14 day horizon)</h2>
            <p className="text-sm text-slate-600">Generated {new Date(data.generatedAt).toLocaleString()} ? Not financial advice.</p>
          </div>
          <span className="badge bg-slate-100 text-slate-700">Universe: {items.length} shown</span>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 border-b">
                <th className="py-2 pr-4">Symbol</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">RSI(14)</th>
                <th className="py-2 pr-4">SMA20</th>
                <th className="py-2 pr-4">SMA50</th>
                <th className="py-2 pr-4">MACD</th>
                <th className="py-2 pr-4">Signal</th>
                <th className="py-2 pr-4">Hist</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c: any) => (
                <tr key={c.symbol} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">
                    <a className="text-blue-600 hover:underline" href={`https://finance.yahoo.com/quote/${c.symbol}`} target="_blank" rel="noreferrer">{c.symbol}</a>
                  </td>
                  <td className="py-2 pr-4">{c.score}</td>
                  <td className="py-2 pr-4">${c.price}</td>
                  <td className="py-2 pr-4">{c.rsi ?? '-'}</td>
                  <td className="py-2 pr-4">{c.sma20 ?? '-'}</td>
                  <td className="py-2 pr-4">{c.sma50 ?? '-'}</td>
                  <td className="py-2 pr-4">{c.macd ?? '-'}</td>
                  <td className="py-2 pr-4">{c.signal ?? '-'}</td>
                  <td className="py-2 pr-4">{c.hist ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 text-sm text-slate-700 space-y-2">
        <p><strong>Methodology</strong>: Ranked by combination of RSI(14) in the 30?55 zone, recent MACD signal-line cross up, positive SMA50 trend, and proximity to SMA20 for potential low-risk entries. This is a simple technical screen and may miss many considerations.</p>
        <p><strong>Disclaimer</strong>: This is educational information, not financial advice. Always do your own research. Trading involves risk and can result in loss of capital.</p>
      </div>
    </div>
  );
}
