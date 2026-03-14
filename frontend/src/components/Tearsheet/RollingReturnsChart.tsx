import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useIRISStore } from '../../store/irisStore'

export default function RollingReturnsChart() {
  const tearsheet = useIRISStore((s) => s.tearsheet)
  const window = 20 // 20-day rolling

  const data = useMemo(() => {
    if (!tearsheet) return []
    const dates = tearsheet.trader.dates
    const eq = tearsheet.trader.equity_curve

    return dates.map((date, i) => {
      if (i < window) return { date, rolling: 0 }
      const startVal = eq[i - window]
      const endVal = eq[i]
      const ret = (endVal - startVal) / startVal
      return {
        date,
        rolling: ret * 100
      }
    }).slice(window)
  }, [tearsheet])

  if (!tearsheet || data.length === 0) return null

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  return (
    <div className="iris-card" style={{ padding: '1.25rem' }}>
      <h3 className="font-mono" style={{
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '1rem',
      }}>
        20-Day Rolling Returns (%)
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'DM Mono' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'DM Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontFamily: 'DM Mono',
              fontSize: '0.75rem',
            }}
            formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Rolling Return']}
          />
          <Line
            type="monotone"
            dataKey="rolling"
            stroke="var(--accent-indigo)"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
