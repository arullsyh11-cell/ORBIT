import { useState } from 'react'
import { Check, Flag, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { AddButton, Button, EmptyState, PageHeading, ProgressBar } from '../components/Primitives.jsx'
import { GoalForm } from '../components/Forms.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { addDays, formatDate, mondayOf, todayISO } from '../utils/dates.js'

export default function Goals() {
  const data = useWorkspace()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [view, setView] = useState('active')
  const today = todayISO()
  const start = mondayOf(today)
  const end = addDays(start, 6)
  const currentGoals = data.goals.filter(goal => goal.endDate >= start && goal.startDate <= end)
  const visible = view === 'active' ? currentGoals.filter(goal => !goal.completed) : view === 'complete' ? currentGoals.filter(goal => goal.completed) : currentGoals

  const save = value => {
    if (editing) {
      data.updateGoal(editing.id, value)
      data.notify('Target diperbarui.')
    } else {
      data.createGoal(value)
      data.notify('Target ditambahkan.')
    }
    setModal(false); setEditing(null)
  }
  const adjust = (goal, amount) => {
    const current = Math.max(0, Math.min(Number(goal.target), Number(goal.current ?? 0) + amount))
    data.updateGoal(goal.id, { current, completed: current >= goal.target })
    if (current >= goal.target && !goal.completed) data.notify('Target tercapai.')
  }
  const markComplete = goal => {
    data.updateGoal(goal.id, { current: Number(goal.target), completed: true })
    data.notify('Target ditandai tercapai.')
  }
  const remove = goal => {
    if (!window.confirm(`Hapus target “${goal.title}”? Tindakan ini tidak dapat dibatalkan.`)) return
    data.deleteGoal(goal.id)
    data.notify('Target dihapus.')
  }
  const doneCount = currentGoals.filter(goal => goal.completed).length

  return (
    <>
      <PageHeading eyebrow="TARGET / MINGGUAN" title="Arah yang ingin dituju." description="Pilih hasil yang cukup jelas untuk diperiksa di akhir minggu." action={<AddButton onClick={() => { setEditing(null); setModal(true) }}>Target baru</AddButton>} />
      <section className="goals-week-summary"><div><p className="eyebrow">MINGGU BERJALAN</p><h2>{formatDate(start, { day: 'numeric', month: 'long' })} sampai {formatDate(end, { day: 'numeric', month: 'long' })}</h2><p>{doneCount} dari {currentGoals.length} target selesai</p></div><div className="goals-summary-mark"><strong>{currentGoals.length ? Math.round(doneCount / currentGoals.length * 100) : 0}%</strong><span>target tercapai</span></div></section>
      <div className="goals-tabs" role="tablist" aria-label="Filter target"><button role="tab" aria-selected={view === 'active'} className={view === 'active' ? 'active' : ''} type="button" onClick={() => setView('active')}>Belum selesai <span>{currentGoals.filter(goal => !goal.completed).length}</span></button><button role="tab" aria-selected={view === 'complete'} className={view === 'complete' ? 'active' : ''} type="button" onClick={() => setView('complete')}>Selesai <span>{doneCount}</span></button><button role="tab" aria-selected={view === 'all'} className={view === 'all' ? 'active' : ''} type="button" onClick={() => setView('all')}>Semua <span>{currentGoals.length}</span></button></div>
      {visible.length ? <section className="goal-list-page">
        {visible.map(goal => {
          const current = Number(goal.current ?? 0)
          const target = Math.max(1, Number(goal.target) || 1)
          const progress = Math.min(100, Math.round(current / target * 100))
          return <article className={`goal-row${goal.completed ? ' goal-row-complete' : ''}`} key={goal.id}>
            <div className="goal-row-main"><span className={`goal-mark${goal.completed ? ' done' : ''}`} aria-hidden="true">{goal.completed ? <Check size={17} /> : <Flag size={17} />}</span><div className="goal-row-copy"><div className="goal-title-line"><h2>{goal.title}</h2>{goal.completed && <span className="complete-label">Tercapai</span>}</div>{goal.description && <p>{goal.description}</p>}<span className="goal-meta">{goal.category} · {formatDate(goal.startDate, { day: 'numeric', month: 'short' })} sampai {formatDate(goal.endDate, { day: 'numeric', month: 'short' })}</span><ProgressBar value={progress} label={`Progres target ${goal.title}`} /></div></div>
            <div className="goal-count-control"><button type="button" className="icon-button" aria-label={`Kurangi progres ${goal.title}`} disabled={current <= 0} onClick={() => adjust(goal, -1)}><Minus size={16} /></button><strong>{current}<span> / {target}</span></strong><button type="button" className="icon-button" aria-label={`Tambah progres ${goal.title}`} disabled={current >= target} onClick={() => adjust(goal, 1)}><Plus size={16} /></button></div>
            <div className="row-actions"><button type="button" className="icon-button" aria-label={`Ubah target ${goal.title}`} onClick={() => { setEditing(goal); setModal(true) }}><Pencil size={16} /></button><button type="button" className="icon-button danger-hover" aria-label={`Hapus target ${goal.title}`} onClick={() => remove(goal)}><Trash2 size={16} /></button>{!goal.completed && <button type="button" className="icon-button" aria-label={`Tandai ${goal.title} tercapai`} onClick={() => markComplete(goal)}><Check size={16} /></button>}</div>
          </article>
        })}
      </section> : <EmptyState icon={Flag} title={view === 'complete' ? 'Belum ada target tercapai' : 'Minggu ini belum punya target'} detail={view === 'complete' ? 'Target yang ditandai selesai akan muncul di sini.' : 'Tentukan hasil yang ingin dicapai. Progres bisa diperbarui kapan saja.'} action={<AddButton onClick={() => { setEditing(null); setModal(true) }}>Buat target</AddButton>} />}
      {modal && <GoalForm goal={editing} categories={data.settings.goalCategories} onSave={save} onClose={() => { setModal(false); setEditing(null) }} />}
    </>
  )
}
