import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import { useIRISStore } from '../../store/irisStore'

export default function DailyReturnsChart() {
  const tearsheet = useIRISStore((s) => s.tearsheet)

  const data = useMemo(() => {
    if (!tearsheet) return []
    const eq = tearsheet.trader.equity_curve
    const returns = []
    for (let i = 1; i < eq.length; i++) {
      returns.push(((eq[i] - eq[i - 1]) / eq[i - 1]) * 100)
    }

    if (returns.length === 0) return []

    // Bin the returns
    const min = Math.min(...returns)
    const max = Math.max(...returns)
    const binCount = 30
    const binSize = (max - min) / binCount
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: min + i * binSize,
      count: 0
    }))

    returns.forEach(r => {
      const bIdx = Math.min(Math.floor((r - min) / binSize), binCount - 1)
      bins[bIdx].count++
    })

    return bins
  }, [tearsheet])

  if (!tearsheet || data.length === 0) return null

  return (
    <div className="iris-card" style={{ padding: '1.25rem' }}>
      <h3 className="font-mono" style={{
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '1rem',
      }}>
        Daily Returns Distribution (%)
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="range"
            tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'DM Mono' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'DM Mono' }}
            axisLine={false}
            tickLine={false}
            hide
          />
          <Tooltip
            cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontFamily: 'DM Mono',
              fontSize: '0.75rem',
            }}
            labelFormatter={(v: any) => `Return: ${Number(v).toFixed(2)}%`}
            formatter={(val: any) => [val, 'Count']}
          />
          <Bar dataKey="count">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.range >= 0 ? '#00e5c380' : '#ff4d6a80'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
