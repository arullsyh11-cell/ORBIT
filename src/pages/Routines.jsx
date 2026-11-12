import { useMemo, useState } from 'react'
import { Check, CircleDot, Pencil, Trash2 } from 'lucide-react'
import { AddButton, Button, EmptyState, PageHeading, ProgressBar } from '../components/Primitives.jsx'
import { RoutineForm } from '../components/Forms.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { addDays, formatDate, mondayOf, todayISO } from '../utils/dates.js'

const days = [
  { value: 1, short: 'S', label: 'Senin' }, { value: 2, short: 'S', label: 'Selasa' }, { value: 3, short: 'R', label: 'Rabu' },
  { value: 4, short: 'K', label: 'Kamis' }, { value: 5, short: 'J', label: 'Jumat' }, { value: 6, short: 'S', label: 'Sabtu' }, { value: 0, short: 'M', label: 'Minggu' },
]

export default function Routines() {
  const data = useWorkspace()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const today = todayISO()
  const weekStart = mondayOf(today)
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const todayDay = new Date(`${today}T12:00:00`).getDay()
  const todayRoutines = data.routines.filter(item => (item.days ?? []).includes(todayDay))
  const todayDone = todayRoutines.filter(item => (item.completedDates ?? []).includes(today)).length

  const weekly = useMemo(() => {
    let expected = 0
    let complete = 0
    for (const routine of data.routines) {
      for (const date of weekDates) {
        const day = new Date(`${date}T12:00:00`).getDay()
        if ((routine.days ?? []).includes(day)) {
          expected += 1
          if ((routine.completedDates ?? []).includes(date)) complete += 1
        }
      }
    }
    return { expected, complete, percent: expected ? Math.round(complete / expected * 100) : 0 }
  }, [data.routines, weekDates.join(',')])

  const save = value => {
    if (editing) {
      data.updateRoutine(editing.id, value)
      data.notify('Rutinitas diperbarui.')
    } else {
      data.createRoutine({ ...value, completedDates: [] })
      data.notify('Rutinitas ditambahkan.')
    }
    setEditing(null); setModal(false)
  }
  const toggle = (routine, date) => {
    const dates = routine.completedDates ?? []
    const completedDates = dates.includes(date) ? dates.filter(item => item !== date) : [...dates, date]
    data.updateRoutine(routine.id, { completedDates })
  }
  const remove = routine => {
    if (!window.confirm(`Hapus rutinitas “${routine.title}”? Catatan penyelesaiannya juga akan dihapus.`)) return
    data.deleteRoutine(routine.id)
    data.notify('Rutinitas dihapus.')
  }

  return (
    <>
      <PageHeading eyebrow="RUTINITAS / KEBIASAAN" title="Hal kecil yang berulang." description="Tentukan ritme sendiri. Tandai setiap langkah saat sudah dilakukan." action={<AddButton onClick={() => { setEditing(null); setModal(true) }}>Rutinitas baru</AddButton>} />
      <section className="routine-overview">
        <div className="routine-overview-copy"><span className="overview-icon"><CircleDot size={19} /></span><div><p className="eyebrow">RITME MINGGU INI</p><h2>{weekly.complete} dari {weekly.expected} langkah selesai</h2><p>{formatDate(weekStart, { day: 'numeric', month: 'short' })} sampai {formatDate(addDays(weekStart, 6), { day: 'numeric', month: 'short' })}</p></div></div>
        <div className="routine-overview-progress"><strong>{weekly.percent}%</strong><ProgressBar value={weekly.percent} label="Persentase rutinitas minggu ini" showValue={false} /></div>
      </section>
      <div className="section-heading-line"><div><p className="eyebrow">DAFTAR RUTINITAS</p><h2>Jalani dengan caramu</h2></div><span>{data.routines.length} rutinitas</span></div>
      {data.routines.length ? <section className="routine-list">
        <div className="routine-week-head"><span>Rutinitas</span>{days.map((day, index) => <span key={`${day.label}-${index}`} title={day.label}>{day.short}</span>)}<span>Aksi</span></div>
        {data.routines.map(routine => <article className="routine-row" key={routine.id}>
          <div className="routine-row-title"><strong>{routine.title}</strong><span>{routine.category}{routine.time ? ` · ${routine.time}` : ''}</span>{routine.description && <p>{routine.description}</p>}</div>
          {days.map(day => {
            const date = weekDates[(day.value + 6) % 7]
            const scheduled = (routine.days ?? []).includes(day.value)
            const complete = (routine.completedDates ?? []).includes(date)
            return <button type="button" key={day.label} className={`routine-day-toggle${scheduled ? '' : ' not-scheduled'}${complete ? ' completed' : ''}`} disabled={!scheduled} aria-label={`${routine.title}, ${day.label}${complete ? ', selesai' : scheduled ? ', belum selesai' : ', tidak terjadwal'}`} aria-pressed={complete} onClick={() => toggle(routine, date)}>{complete ? <Check size={13} /> : scheduled ? <span /> : <span className="routine-day-off">·</span>}</button>
          })}
          <div className="row-actions"><button type="button" className="icon-button" aria-label={`Ubah rutinitas ${routine.title}`} onClick={() => { setEditing(routine); setModal(true) }}><Pencil size={16} /></button><button type="button" className="icon-button danger-hover" aria-label={`Hapus rutinitas ${routine.title}`} onClick={() => remove(routine)}><Trash2 size={16} /></button></div>
        </article>)}
      </section> : <EmptyState icon={CircleDot} title="Mulai dengan satu kebiasaan" detail="Pilih hari dan waktu yang cocok. Rutinitas bisa diubah kapan saja." action={<AddButton onClick={() => setModal(true)}>Buat rutinitas</AddButton>} />}
      <section className="today-routine-summary"><div><p className="eyebrow">HARI INI</p><h2>{todayDone} dari {todayRoutines.length} rutinitas selesai</h2></div><ProgressBar value={todayRoutines.length ? Math.round(todayDone / todayRoutines.length * 100) : 0} label="Rutinitas selesai hari ini" /></section>
      {modal && <RoutineForm routine={editing} categories={data.settings.routineCategories} onSave={save} onClose={() => { setModal(false); setEditing(null) }} />}
    </>
  )
}
