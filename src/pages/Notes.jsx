import { useEffect, useState } from 'react'
import { ArrowUpRight, FileText, Pin, PinOff, Search, StickyNote, Trash2 } from 'lucide-react'
import { AddButton, Button, EmptyState, Field, PageHeading } from '../components/Primitives.jsx'
import Select from '../components/Select.jsx'
import Modal, { ModalCancelButton } from '../components/Modal.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { formatDate } from '../utils/dates.js'

function NoteEditor({ note, categories, onSave, onClose, onConvert, isNew }) {
  const [draft, setDraft] = useState({ title: note.title ?? '', content: note.content ?? '', category: note.category ?? categories[0] ?? 'Lainnya', pinned: Boolean(note.pinned) })
  const [saveStatus, setSaveStatus] = useState('Tersimpan otomatis')
  useEffect(() => {
    setSaveStatus('Menyimpan…')
    const timer = window.setTimeout(() => {
      onSave(draft)
      setSaveStatus('Tersimpan otomatis')
    }, 450)
    return () => window.clearTimeout(timer)
  }, [draft])
  const update = (key, value) => setDraft(current => ({ ...current, [key]: value }))
  const close = () => {
    onSave(draft)
    onClose(draft)
  }
  return (
    <Modal title={isNew ? 'Catatan baru' : 'Ubah catatan'} onClose={close} wide>
      <div className="note-editor form-stack">
        <Field label="Judul catatan"><input autoFocus value={draft.title} onChange={event => update('title', event.target.value)} maxLength={140} placeholder="Beri judul bila perlu" /></Field>
        <Field label="Isi catatan"><textarea className="note-editor-body" value={draft.content} onChange={event => update('content', event.target.value)} rows="12" placeholder="Tulis yang ingin Anda ingat…" /></Field>
        <div className="form-grid"><Field label="Kategori"><Select value={draft.category} onChange={event => update('category', event.target.value)} options={categories} /></Field><label className="pin-choice"><input type="checkbox" checked={draft.pinned} onChange={event => update('pinned', event.target.checked)} /><Pin size={16} />Sematkan catatan</label></div>
        <div className="note-save-line"><span role="status" aria-live="polite">{saveStatus}</span><div className="form-actions"><ModalCancelButton>Selesai</ModalCancelButton>{(draft.title.trim() || draft.content.trim()) && <Button onClick={() => onConvert(draft)}><ArrowUpRight size={16} />Jadikan tugas</Button>}</div></div>
      </div>
    </Modal>
  )
}

export default function Notes({ onNavigate }) {
  const data = useWorkspace()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua kategori')
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)

  const filtered = data.notes.filter(note => {
    if (category !== 'Semua kategori' && note.category !== category) return false
    const query = search.trim().toLocaleLowerCase('id-ID')
    return !query || `${note.title} ${note.content} ${note.category}`.toLocaleLowerCase('id-ID').includes(query)
  }).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))

  const openNew = () => {
    const note = data.createNote({ title: '', content: '', category: data.settings.noteCategories[0] ?? 'Lainnya', pinned: false })
    setIsNew(true); setEditing(note)
  }
  const update = draft => {
    if (!editing) return
    data.updateNote(editing.id, draft)
  }
  const closeEditor = draft => {
    if (isNew && !draft.title.trim() && !draft.content.trim()) data.deleteNote(editing.id)
    setEditing(null); setIsNew(false)
  }
  const convert = draft => {
    update(draft)
    const title = draft.title.trim() || draft.content.trim().split('\n')[0].slice(0, 70) || 'Catatan baru'
    data.createTask({ title, description: draft.content, category: data.settings.taskCategories[0] ?? 'Lainnya', priority: data.settings.priorities[1] ?? data.settings.priorities[0] ?? 'Sedang', status: 'To Do', startDate: '', dueDate: '', reminder: '', repeat: 'Tidak berulang', subtasks: [], completedAt: null })
    data.notify('Catatan ditambahkan ke daftar tugas.')
    setEditing(null); setIsNew(false); onNavigate('tasks')
  }
  const remove = note => {
    if (!window.confirm(`Hapus catatan “${note.title || 'Tanpa judul'}”? Tindakan ini tidak dapat dibatalkan.`)) return
    data.deleteNote(note.id)
    data.notify('Catatan dihapus.')
  }
  const togglePin = note => {
    data.updateNote(note.id, { pinned: !note.pinned })
    data.notify(note.pinned ? 'Catatan dilepas dari sematan.' : 'Catatan disematkan.')
  }

  return (
    <>
      <PageHeading eyebrow="CATATAN / IDE" title="Simpan sebelum lupa." description="Catatan tersimpan otomatis di perangkat ini. Cari atau ubah kapan saja." action={<AddButton onClick={openNew}>Catatan baru</AddButton>} />
      <div className="note-toolbar"><div className="search-field"><Search size={17} aria-hidden="true" /><label className="sr-only" htmlFor="note-search">Cari catatan</label><input id="note-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari isi catatan" /></div><Select id="note-category" aria-label="Filter kategori catatan" value={category} onChange={event => setCategory(event.target.value)} options={['Semua kategori', ...data.settings.noteCategories]} /></div>
      {filtered.length ? <section className="notes-list" aria-label="Daftar catatan">
        {filtered.map(note => <article className={`note-row${note.pinned ? ' note-row-pinned' : ''}`} key={note.id}>
          <button type="button" className="note-row-open" onClick={() => { setEditing(note); setIsNew(false) }}>
            <span className="note-row-mark"><StickyNote size={17} aria-hidden="true" /></span><span className="note-row-copy"><strong>{note.title || 'Tanpa judul'}</strong><span>{note.content || 'Belum ada isi catatan.'}</span></span><span className="note-row-meta"><span>{note.category}</span><time>{formatDate((note.updatedAt ?? note.createdAt)?.slice(0, 10), { day: 'numeric', month: 'short' })}</time></span>
          </button>
          <div className="row-actions"><button type="button" className="icon-button" aria-label={`${note.pinned ? 'Lepas sematan' : 'Sematkan'} ${note.title || 'catatan'}`} onClick={() => togglePin(note)}>{note.pinned ? <PinOff size={16} /> : <Pin size={16} />}</button><button type="button" className="icon-button danger-hover" aria-label={`Hapus ${note.title || 'catatan'}`} onClick={() => remove(note)}><Trash2 size={16} /></button></div>
        </article>)}
      </section> : <EmptyState icon={FileText} title={search || category !== 'Semua kategori' ? 'Catatan tidak ditemukan' : 'Halaman catatan masih kosong'} detail={search || category !== 'Semua kategori' ? 'Coba kata pencarian atau kategori lain.' : 'Tulis ide, catatan kuliah, atau hal yang perlu diingat.'} action={<AddButton onClick={openNew}>Tulis catatan</AddButton>} />}
      {editing && <NoteEditor note={editing} categories={data.settings.noteCategories} onSave={update} onClose={closeEditor} onConvert={convert} isNew={isNew} />}
    </>
  )
}
