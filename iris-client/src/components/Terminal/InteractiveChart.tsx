'use client'

import React, { useRef, useEffect } from 'react'
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi,
  LineSeries,
  AreaSeries
} from 'lightweight-charts'
import { EquityPoint, DrawdownPoint } from '@/types'

interface InteractiveChartProps {
  data: any[]
  mcPaths?: number[][]
  type: 'equity' | 'drawdown' | 'volume' | 'price' | 'montecarlo' | 'rolling'
  height?: number
  className?: string
  showTrader?: boolean
  showExpert?: boolean
  showSpy?: boolean
}

export function InteractiveChart({ 
  data, 
  mcPaths = [],
  type, 
  height = 300, 
  className,
  showTrader = true,
  showExpert = true,
  showSpy = true
}: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)
  const expertSeriesRef = useRef<ISeriesApi<any> | null>(null)
  const spySeriesRef = useRef<ISeriesApi<any> | null>(null)
  const mcSeriesRefs = useRef<ISeriesApi<any>[]>([])

  useEffect(() => {
    if (!chartContainerRef.current) return

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth })
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#000000' },
        textColor: '#FFFFFF',
        fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: '#111111' },
        horzLines: { color: '#111111' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height || 300,
      timeScale: {
        borderColor: '#222222',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#222222',
      },
    })

    chartRef.current = chart

    if (type === 'drawdown') {
      seriesRef.current = chart.addSeries(AreaSeries, {
        lineColor: '#FF4466',
        topColor: 'rgba(255, 68, 102, 0.2)',
        bottomColor: 'rgba(255, 68, 102, 0.0)',
        lineWidth: 1,
        title: 'TRADER DD',
      })
    } else if (type === 'montecarlo') {
      // Add background paths
      for (let i = 0; i < 20; i++) {
        const s = chart.addSeries(LineSeries, {
          color: 'rgba(0, 229, 195, 0.05)',
          lineWidth: 1,
          lastValueVisible: false,
          priceLineVisible: false,
        })
        mcSeriesRefs.current.push(s)
      }
      // Add median line
      seriesRef.current = chart.addSeries(LineSeries, {
        color: '#00E5C3',
        lineWidth: 2,
        title: 'P50 MEDIAN',
      })
    } else if (type === 'rolling') {
      seriesRef.current = chart.addSeries(AreaSeries, {
        lineColor: '#A78BFA',
        topColor: 'rgba(167, 139, 250, 0.2)',
        bottomColor: 'rgba(167, 139, 250, 0.0)',
        lineWidth: 2,
        title: 'ROLLING SHARPE',
      })
    } else {
      seriesRef.current = chart.addSeries(LineSeries, {
        color: '#00E5C3',
        lineWidth: 2,
        title: 'TRADER',
        visible: showTrader,
      })
      
      expertSeriesRef.current = chart.addSeries(LineSeries, {
        color: '#F0A500',
        lineWidth: 2,
        title: 'EXPERT',
        visible: showExpert,
      })

      spySeriesRef.current = chart.addSeries(LineSeries, {
        color: '#2E4A60',
        lineWidth: 1,
        lineStyle: 2,
        title: 'SPY',
        visible: showSpy,
      })
    }

    chart.timeScale().fitContent()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      mcSeriesRefs.current = []
    }
  }, [height, type, showTrader, showExpert, showSpy])

  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return

    const baseTimes = data.map(pt => Math.floor(new Date(pt.date).getTime() / 1000)).sort((a,b) => a-b)
    const uniqueTimes = Array.from(new Set(baseTimes))

    const formatData = (key: string) => {
      return data.map(pt => ({
        time: Math.floor(new Date(pt.date).getTime() / 1000) as any,
        value: pt[key] || 0
      })).sort((a,b) => a.time - b.time).filter((pt, idx, self) => 
        idx === 0 || pt.time !== self[idx-1].time
      )
    }

    if (type === 'montecarlo' && mcPaths.length > 0) {
      // Plot sample paths
      mcPaths.slice(0, 20).forEach((path, i) => {
        if (mcSeriesRefs.current[i]) {
          const pathData = path.map((val, idx) => ({
            time: uniqueTimes[idx] as any,
            value: val
          }))
          mcSeriesRefs.current[i].setData(pathData)
        }
      })
      // Compute and plot median
      const medianPath = formatData('trader') // Fallback to trader if no median calculated
      seriesRef.current.setData(medianPath)
    } else {
      seriesRef.current.setData(formatData(type === 'drawdown' ? 'trader' : (type === 'rolling' ? 'value' : 'trader')))
      
      if ((type === 'equity' || type === 'price') && expertSeriesRef.current && spySeriesRef.current) {
        expertSeriesRef.current.setData(formatData('expert'))
        spySeriesRef.current.setData(formatData('spy'))
      }
    }

    chartRef.current?.timeScale().fitContent()
  }, [data, mcPaths, type])

  return (
    <div className={className}>
      <div ref={chartContainerRef} className="w-full border border-[#222]" />
    </div>
  )
}
