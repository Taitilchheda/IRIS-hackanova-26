import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useIRISStore } from '../../store/irisStore'

export default function DrawdownChart() {
  const tearsheet = useIRISStore((s) => s.tearsheet)

  const data = useMemo(() => {
    if (!tearsheet) return []
    const dates = tearsheet.trader.dates
    const traderEq = tearsheet.trader.equity_curve
    const expertEq = tearsheet.expert.equity_curve

    let traderPeak = -Infinity
    let expertPeak = -Infinity

    return dates.map((date, i) => {
      const tVal = traderEq[i]
      const eVal = expertEq[i]

      if (tVal > traderPeak) traderPeak = tVal
      if (eVal > expertPeak) expertPeak = eVal

      const tDD = traderPeak > 0 ? (tVal - traderPeak) / traderPeak : 0
      const eDD = expertPeak > 0 ? (eVal - expertPeak) / expertPeak : 0

      return {
        date,
        trader: tDD * 100,
        expert: eDD * 100,
      }
    })
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
        Drawdown (%)
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
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
            tickFormatter={(v) => `${v.toFixed(0)}%`}
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
            formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Drawdown']}
          />
          <Area
            type="monotone"
            dataKey="trader"
            stroke="var(--accent-teal)"
            fill="var(--accent-teal)"
            fillOpacity={0.15}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="expert"
            stroke="var(--accent-amber)"
            fill="var(--accent-amber)"
            fillOpacity={0.08}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
