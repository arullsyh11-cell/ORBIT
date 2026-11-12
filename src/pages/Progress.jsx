import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, CheckCheck, CircleDot, Flag, ListTodo } from 'lucide-react'
import { EmptyState, PageHeading, ProgressBar } from '../components/Primitives.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { addDays, formatDate, todayISO } from '../utils/dates.js'

function dayLabel(date, length) {
  const options = length === 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }
  return formatDate(date, options)
}

export default function Progress() {
  const data = useWorkspace()
  const [period, setPeriod] = useState(7)
  const today = todayISO()
  const firstDate = addDays(today, -(period - 1))

  const chartData = useMemo(() => Array.from({ length: period }, (_, index) => {
    const date = addDays(firstDate, index)
    const tasks = data.tasks.filter(task => task.status === 'Completed' && task.completedAt?.slice(0, 10) === date).length
    const routines = data.routines.reduce((count, routine) => count + Number((routine.completedDates ?? []).includes(date)), 0)
    return { date, label: dayLabel(date, period), tasks, routines }
  }), [data.tasks, data.routines, period, firstDate])

  const periodTaskCount = data.tasks.filter(task => task.status === 'Completed' && task.completedAt?.slice(0, 10) >= firstDate && task.completedAt?.slice(0, 10) <= today).length
  let routineExpected = 0
  let routineComplete = 0
  for (const routine of data.routines) {
    for (let offset = 0; offset < period; offset += 1) {
      const date = addDays(firstDate, offset)
      const routineCreated = routine.createdAt?.slice(0, 10)
      if (routineCreated && date < routineCreated) continue
      const weekday = new Date(`${date}T12:00:00`).getDay()
      if ((routine.days ?? []).includes(weekday)) {
        routineExpected += 1
        if ((routine.completedDates ?? []).includes(date)) routineComplete += 1
      }
    }
  }
  const totalTasks = data.tasks.length
  const completedTasks = data.tasks.filter(task => task.status === 'Completed').length
  const pendingTasks = totalTasks - completedTasks
  const taskRate = totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0
  const currentWeek = new Date(`${today}T12:00:00`)
  const mondayOffset = (currentWeek.getDay() + 6) % 7
  const weekStart = addDays(today, -mondayOffset)
  const weekEnd = addDays(weekStart, 6)
  const weeklyGoals = data.goals.filter(goal => goal.endDate >= weekStart && goal.startDate <= weekEnd)
  const achievedGoals = weeklyGoals.filter(goal => goal.completed).length
  const goalRate = weeklyGoals.length ? Math.round(achievedGoals / weeklyGoals.length * 100) : 0
  const hasChartData = chartData.some(item => item.tasks || item.routines)

  const cards = [
    { label: 'Tugas selesai', value: completedTasks, note: 'sepanjang waktu', icon: CheckCheck },
    { label: 'Tugas menunggu', value: pendingTasks, note: 'belum ditandai selesai', icon: ListTodo },
    { label: 'Penyelesaian tugas', value: `${taskRate}%`, note: `${completedTasks} dari ${totalTasks} tugas`, icon: BarChart3 },
    { label: 'Rutinitas', value: routineExpected ? `${Math.round(routineComplete / routineExpected * 100)}%` : 'Belum ada', note: `${routineComplete} dari ${routineExpected} jadwal`, icon: CircleDot },
  ]

  return (
    <>
      <PageHeading eyebrow="PROGRES / CATATAN" title="Lihat yang sudah bergerak." description="Ringkasan ini mengikuti data yang Anda simpan di DayFlow." />
      <div className="period-switch" role="group" aria-label="Periode progres">{[[7, '7 hari'], [30, '30 hari'], [90, '90 hari']].map(([value, label]) => <button type="button" key={value} aria-pressed={period === value} className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{label}</button>)}</div>
      <section className="progress-metrics">{cards.map(({ label, value, note, icon: Icon }) => <article className="progress-metric" key={label}><span className="metric-icon"><Icon size={18} /></span><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span></article>)}</section>
      <section className="panel progress-chart-panel">
        <div className="panel-heading"><div><p className="eyebrow">AKTIVITAS HARIAN</p><h2>Tugas dan rutinitas yang ditandai selesai</h2><p>Jumlah penyelesaian per hari selama {period} hari terakhir.</p></div><span className="chart-period">{formatDate(firstDate, { day: 'numeric', month: 'short' })} sampai {formatDate(today, { day: 'numeric', month: 'short' })}</span></div>
        {hasChartData ? <div className="chart-wrap" role="img" aria-label={`Grafik tugas dan rutinitas selesai selama ${period} hari`}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }} barGap={3}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 5" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} interval={period === 90 ? 13 : period === 30 ? 4 : 0} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <Tooltip cursor={{ fill: 'var(--hover)' }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text)' }} labelStyle={{ color: 'var(--text)' }} />
          <Bar dataKey="tasks" name="Tugas selesai" fill="var(--accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="routines" name="Rutinitas selesai" fill="var(--charcoal)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart></ResponsiveContainer></div> : <EmptyState icon={BarChart3} title="Belum ada aktivitas pada periode ini" detail="Tandai tugas atau rutinitas sebagai selesai. Grafik akan mulai terisi dari catatan itu." compact />}
        <div className="chart-legend"><span><i className="legend-swatch task-swatch" />Tugas</span><span><i className="legend-swatch charcoal-swatch" />Rutinitas</span></div>
      </section>
      <section className="progress-lower-grid">
        <article className="panel progress-detail"><div className="panel-heading"><div><p className="eyebrow">TARGET MINGGU INI</p><h2>Pencapaian target</h2></div><Flag size={18} aria-hidden="true" /></div><div className="progress-detail-number"><strong>{achievedGoals}</strong><span>dari {weeklyGoals.length} target tercapai</span></div><ProgressBar value={goalRate} label="Target mingguan tercapai" /></article>
        <article className="panel progress-detail"><div className="panel-heading"><div><p className="eyebrow">PERIODE TERPILIH</p><h2>Aktivitas tercatat</h2></div><CheckCheck size={18} aria-hidden="true" /></div><div className="progress-detail-number"><strong>{periodTaskCount + routineComplete}</strong><span>penyelesaian tugas dan rutinitas</span></div><p className="field-hint">Tugas selesai: {periodTaskCount} · Rutinitas selesai: {routineComplete}</p></article>
      </section>
    </>
  )
}
