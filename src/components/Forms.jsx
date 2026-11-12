import { useState } from 'react'
import { Button, Field } from './Primitives.jsx'
import Modal, { ModalCancelButton } from './Modal.jsx'
import Select from './Select.jsx'
import { todayISO, mondayOf, addDays } from '../utils/dates.js'

const dayOptions = [
  { value: 1, label: 'Sen' }, { value: 2, label: 'Sel' }, { value: 3, label: 'Rab' },
  { value: 4, label: 'Kam' }, { value: 5, label: 'Jum' }, { value: 6, label: 'Sab' }, { value: 0, label: 'Min' },
]

export function TaskForm({ task, categories, priorities, onSave, onClose }) {
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(() => ({
    title: task?.title ?? '', description: task?.description ?? '', category: task?.category ?? categories[0] ?? 'Lainnya',
    priority: task?.priority ?? priorities[1] ?? priorities[0] ?? 'Sedang', status: task?.status ?? 'To Do',
    startDate: task?.startDate ?? '', dueDate: task?.dueDate ?? '', reminder: task?.reminder ?? '', repeat: task?.repeat ?? 'Tidak berulang',
    subtasksText: (task?.subtasks ?? []).map(item => item.title).join('\n'),
  }))
  const change = event => setDraft(current => ({ ...current, [event.target.name]: event.target.value }))
  const submit = event => {
    event.preventDefault()
    if (!draft.title.trim()) return setError('Judul tugas perlu diisi.')
    if (draft.startDate && draft.dueDate && draft.dueDate < draft.startDate) return setError('Tenggat tidak boleh sebelum tanggal mulai.')
    const oldByTitle = new Map((task?.subtasks ?? []).map(item => [item.title, item]))
    const subtasks = draft.subtasksText.split('\n').map(line => line.trim()).filter(Boolean).map(title => oldByTitle.get(title) ?? ({ id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, title, done: false }))
    const { subtasksText, ...fields } = draft
    onSave({ ...fields, title: draft.title.trim(), subtasks })
  }
  return (
    <Modal title={task ? 'Ubah tugas' : 'Tugas baru'} onClose={onClose} wide>
      <form className="form-stack" onSubmit={submit}>
        <Field label="Judul tugas"><input autoFocus name="title" value={draft.title} onChange={change} maxLength={120} required placeholder="Contoh: Selesaikan rangkuman" /></Field>
        <Field label="Deskripsi"><textarea name="description" value={draft.description} onChange={change} rows="3" placeholder="Tambahkan detail yang membantu" /></Field>
        <div className="form-grid">
          <Field label="Kategori"><Select name="category" value={draft.category} onChange={change} options={categories} /></Field>
          <Field label="Prioritas"><Select name="priority" value={draft.priority} onChange={change} options={priorities} /></Field>
          <Field label="Status"><Select name="status" value={draft.status} onChange={change} options={['To Do', 'In Progress', 'Completed']} /></Field>
          <Field label="Berulang" hint="Tugas berikutnya dibuat saat tugas ini selesai."><Select name="repeat" value={draft.repeat} onChange={change} options={['Tidak berulang', 'Setiap hari', 'Setiap minggu', 'Setiap bulan']} /></Field>
          <Field label="Tanggal mulai"><input type="date" name="startDate" value={draft.startDate} onChange={change} /></Field>
          <Field label="Tenggat"><input type="date" name="dueDate" value={draft.dueDate} onChange={change} /></Field>
        </div>
        <Field label="Pengingat" hint="Pengingat tersimpan bersama tugas ini."><input type="datetime-local" name="reminder" value={draft.reminder} onChange={change} /></Field>
        <Field label="Subtugas" hint="Satu subtugas per baris."><textarea name="subtasksText" value={draft.subtasksText} onChange={change} rows="3" placeholder="Cari referensi\nBuat draf" /></Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><ModalCancelButton /><Button type="submit">Simpan tugas</Button></div>
      </form>
    </Modal>
  )
}

export function ScheduleForm({ schedule, categories, selectedDate, onSave, onClose }) {
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(() => ({
    title: schedule?.title ?? '', description: schedule?.description ?? '', category: schedule?.category ?? categories[0] ?? 'Lainnya',
    date: schedule?.date ?? selectedDate ?? todayISO(), startTime: schedule?.startTime ?? '09:00', endTime: schedule?.endTime ?? '10:00',
    reminder: schedule?.reminder ?? '',
  }))
  const change = event => setDraft(current => ({ ...current, [event.target.name]: event.target.value }))
  const submit = event => {
    event.preventDefault()
    if (!draft.title.trim()) return setError('Nama kegiatan perlu diisi.')
    if (draft.endTime <= draft.startTime) return setError('Waktu selesai harus setelah waktu mulai.')
    onSave({ ...draft, title: draft.title.trim() })
  }
  return (
    <Modal title={schedule ? 'Ubah jadwal' : 'Jadwal baru'} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <Field label="Nama kegiatan"><input autoFocus name="title" value={draft.title} onChange={change} maxLength={120} required placeholder="Contoh: Belajar mandiri" /></Field>
        <Field label="Deskripsi"><textarea name="description" value={draft.description} onChange={change} rows="3" placeholder="Tambahkan catatan bila perlu" /></Field>
        <Field label="Kategori"><Select name="category" value={draft.category} onChange={change} options={categories} /></Field>
        <Field label="Tanggal"><input type="date" name="date" value={draft.date} onChange={change} required /></Field>
        <div className="form-grid schedule-time-grid"><Field label="Mulai"><input type="time" name="startTime" value={draft.startTime} onChange={change} required /></Field><Field label="Selesai"><input type="time" name="endTime" value={draft.endTime} onChange={change} required /></Field></div>
        <Field label="Pengingat"><input type="datetime-local" name="reminder" value={draft.reminder} onChange={change} /></Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><ModalCancelButton /><Button type="submit">Simpan jadwal</Button></div>
      </form>
    </Modal>
  )
}

export function RoutineForm({ routine, categories, onSave, onClose }) {
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(() => ({
    title: routine?.title ?? '', description: routine?.description ?? '', category: routine?.category ?? categories[0] ?? 'Pribadi',
    time: routine?.time ?? '', days: routine?.days ?? [0, 1, 2, 3, 4, 5, 6],
  }))
  const toggleDay = day => setDraft(current => ({ ...current, days: current.days.includes(day) ? current.days.filter(item => item !== day) : [...current.days, day] }))
  const submit = event => {
    event.preventDefault()
    if (!draft.title.trim()) return setError('Nama rutinitas perlu diisi.')
    if (draft.days.length === 0) return setError('Pilih setidaknya satu hari.')
    onSave({ ...draft, title: draft.title.trim(), days: [...draft.days].sort((a, b) => a - b) })
  }
  return (
    <Modal title={routine ? 'Ubah rutinitas' : 'Rutinitas baru'} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <Field label="Nama rutinitas"><input autoFocus value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} maxLength={100} required placeholder="Contoh: Membaca 15 menit" /></Field>
        <Field label="Kategori"><Select value={draft.category} onChange={event => setDraft(current => ({ ...current, category: event.target.value }))} options={categories} /></Field>
        <Field label="Waktu (opsional)"><input type="time" value={draft.time} onChange={event => setDraft(current => ({ ...current, time: event.target.value }))} /></Field>
        <fieldset className="day-picker"><legend>Hari aktif</legend><div className="day-picker-grid">{dayOptions.map(day => <label className="day-choice" key={day.value}><input type="checkbox" checked={draft.days.includes(day.value)} onChange={() => toggleDay(day.value)} /><span>{day.label}</span></label>)}</div></fieldset>
        <Field label="Catatan singkat"><textarea rows="2" value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} placeholder="Opsional" /></Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><ModalCancelButton /><Button type="submit">Simpan rutinitas</Button></div>
      </form>
    </Modal>
  )
}

export function GoalForm({ goal, categories, onSave, onClose }) {
  const thisWeek = mondayOf(todayISO())
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(() => ({
    title: goal?.title ?? '', description: goal?.description ?? '', category: goal?.category ?? categories[0] ?? 'Pribadi',
    target: goal?.target ?? 1, current: goal?.current ?? 0, startDate: goal?.startDate ?? thisWeek, endDate: goal?.endDate ?? addDays(thisWeek, 6),
  }))
  const change = event => setDraft(current => ({ ...current, [event.target.name]: event.target.value }))
  const submit = event => {
    event.preventDefault()
    const target = Math.max(1, Number(draft.target) || 1)
    const current = Math.max(0, Number(draft.current) || 0)
    if (!draft.title.trim()) return setError('Judul target perlu diisi.')
    if (draft.endDate < draft.startDate) return setError('Tanggal akhir harus setelah tanggal mulai.')
    onSave({ ...draft, title: draft.title.trim(), target, current, completed: current >= target })
  }
  return (
    <Modal title={goal ? 'Ubah target' : 'Target mingguan baru'} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <Field label="Judul target"><input autoFocus name="title" value={draft.title} onChange={change} maxLength={120} required placeholder="Contoh: Belajar pemrograman" /></Field>
        <Field label="Deskripsi"><textarea name="description" value={draft.description} onChange={change} rows="2" placeholder="Apa yang ingin dicapai minggu ini?" /></Field>
        <Field label="Kategori"><Select name="category" value={draft.category} onChange={change} options={categories} /></Field>
        <div className="form-grid"><Field label="Target"><input type="number" name="target" min="1" max="999" value={draft.target} onChange={change} required /></Field><Field label="Progres saat ini"><input type="number" name="current" min="0" max="999" value={draft.current} onChange={change} /></Field></div>
        <div className="form-grid"><Field label="Mulai"><input type="date" name="startDate" value={draft.startDate} onChange={change} required /></Field><Field label="Selesai"><input type="date" name="endDate" value={draft.endDate} onChange={change} required /></Field></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><ModalCancelButton /><Button type="submit">Simpan target</Button></div>
      </form>
    </Modal>
  )
}
