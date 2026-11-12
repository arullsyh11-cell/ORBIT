import { useRef, useState } from 'react'
import { Bell, Check, Download, FolderOpen, Moon, Plus, RotateCcw, Sun, Upload } from 'lucide-react'
import { Button, Field, PageHeading } from '../components/Primitives.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { downloadWorkspace, validateWorkspace } from '../services/storage.js'

const widgetOptions = [
  { id: 'summary', label: 'Ringkasan hari ini' }, { id: 'schedule', label: 'Jadwal mendatang' },
  { id: 'routines', label: 'Rutinitas hari ini' }, { id: 'goals', label: 'Target mingguan' }, { id: 'notes', label: 'Catatan cepat' },
]
const categoryOptions = [
  { key: 'taskCategories', label: 'Kategori tugas', collection: 'tasks' },
  { key: 'scheduleCategories', label: 'Kategori jadwal', collection: 'schedules' },
  { key: 'routineCategories', label: 'Kategori rutinitas', collection: 'routines' },
  { key: 'noteCategories', label: 'Kategori catatan', collection: 'notes' },
  { key: 'goalCategories', label: 'Kategori target', collection: 'goals' },
]

function CategoryEditor({ item, values, records, onAdd, onRemove }) {
  const [value, setValue] = useState('')
  const add = event => {
    event.preventDefault()
    const name = value.trim()
    if (!name) return
    if (values.some(existing => existing.toLocaleLowerCase('id-ID') === name.toLocaleLowerCase('id-ID'))) return
    onAdd(item.key, name)
    setValue('')
  }
  return <div className="category-setting-row">
    <div className="category-setting-copy"><strong>{item.label}</strong><span>{values.map(value => <span className="category-chip" key={value}>{value}{!records.some(record => record.category === value) && <button type="button" aria-label={`Hapus kategori ${value}`} onClick={() => onRemove(item.key, value)}>×</button>}</span>)}</span></div>
    <form className="inline-add-form" onSubmit={add}><label className="sr-only" htmlFor={`category-${item.key}`}>Nama kategori baru untuk {item.label}</label><input id={`category-${item.key}`} value={value} onChange={event => setValue(event.target.value)} maxLength={32} placeholder="Kategori baru" /><Button variant="secondary" type="submit" aria-label={`Tambah kategori ${item.label}`}><Plus size={15} />Tambah</Button></form>
  </div>
}

export default function Settings() {
  const data = useWorkspace()
  const importRef = useRef(null)
  const [profile, setProfile] = useState(data.profile)
  const [savedProfile, setSavedProfile] = useState(false)
  const [priority, setPriority] = useState('')
  const [importing, setImporting] = useState(false)

  const saveProfile = event => {
    event.preventDefault()
    data.setProfile({ name: profile.name.trim(), workspace: profile.workspace.trim() || 'Ruang pribadi' })
    setSavedProfile(true)
    data.notify('Profil disimpan.')
    window.setTimeout(() => setSavedProfile(false), 1800)
  }
  const toggleWidget = id => {
    const current = data.settings.dashboardWidgets
    const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    data.setSettings({ dashboardWidgets: next })
  }
  const addCategory = (key, value) => {
    data.setSettings({ [key]: [...data.settings[key], value] })
    data.notify('Kategori ditambahkan.')
  }
  const removeCategory = (key, value) => {
    const item = categoryOptions.find(option => option.key === key)
    const used = data[item.collection].some(record => record.category === value)
    if (used) {
      data.notify('Kategori ini masih dipakai oleh data tersimpan.', 'error')
      return
    }
    if (data.settings[key].length <= 1) {
      data.notify('Sisakan setidaknya satu kategori.', 'error')
      return
    }
    data.setSettings({ [key]: data.settings[key].filter(existing => existing !== value) })
    data.notify('Kategori dihapus.')
  }
  const addPriority = event => {
    event.preventDefault()
    const name = priority.trim()
    if (!name || data.settings.priorities.some(item => item.toLocaleLowerCase('id-ID') === name.toLocaleLowerCase('id-ID'))) return
    data.setSettings({ priorities: [...data.settings.priorities, name] })
    setPriority('')
    data.notify('Prioritas ditambahkan.')
  }
  const removePriority = value => {
    if (data.tasks.some(task => task.priority === value)) return data.notify('Prioritas ini masih dipakai oleh tugas tersimpan.', 'error')
    if (data.settings.priorities.length <= 1) return data.notify('Sisakan setidaknya satu prioritas.', 'error')
    data.setSettings({ priorities: data.settings.priorities.filter(item => item !== value) })
    data.notify('Prioritas dihapus.')
  }

  const restoreFile = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const parsed = validateWorkspace(JSON.parse(await file.text()))
      if (!window.confirm('Pulihkan cadangan ini? Data DayFlow yang ada saat ini akan diganti.')) return
      data.replaceWorkspace(parsed)
      setProfile(parsed.profile)
    } catch (error) {
      data.notify(`Cadangan tidak dapat dibaca: ${error.message}`, 'error')
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }
  const enableNotifications = async () => {
    if (!('Notification' in window)) return data.notify('Browser ini belum mendukung notifikasi.', 'error')
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission === 'granted') {
      data.setSettings({ remindersEnabled: true })
      data.notify('Pengingat browser diaktifkan saat DayFlow terbuka.')
    } else {
      data.setSettings({ remindersEnabled: false })
      data.notify('Izin notifikasi belum diberikan. Pengingat tetap tersimpan pada data.', 'error')
    }
  }
  const reset = () => {
    if (!window.confirm('Hapus semua data DayFlow dari perangkat ini? Unduh cadangan terlebih dahulu bila ingin menyimpannya.')) return
    data.resetWorkspace()
    setProfile({ name: '', workspace: 'Ruang pribadi' })
  }

  return (
    <>
      <PageHeading eyebrow="PENGATURAN / RUANG KERJA" title="Atur sesuai kebutuhanmu." description="DayFlow menyimpan data secara lokal di browser pada perangkat ini." />
      <div className="settings-layout">
        <nav className="settings-index" aria-label="Bagian pengaturan"><a href="#profile-settings">Profil</a><a href="#theme-settings">Tampilan</a><a href="#notifications-settings">Pengingat</a><a href="#dashboard-settings">Beranda</a><a href="#categories-settings">Kategori</a><a href="#data-settings">Data</a></nav>
        <div className="settings-content">
          <section className="settings-section" id="profile-settings"><div className="settings-section-heading"><p className="eyebrow">IDENTITAS</p><h2>Profil dan ruang kerja</h2><p>Nama ini digunakan pada sapaan di beranda.</p></div><form className="settings-form" onSubmit={saveProfile}><Field label="Nama panggilan"><input value={profile.name} onChange={event => setProfile(current => ({ ...current, name: event.target.value }))} maxLength={50} placeholder="Nama yang ingin digunakan" /></Field><Field label="Nama ruang kerja"><input value={profile.workspace} onChange={event => setProfile(current => ({ ...current, workspace: event.target.value }))} maxLength={60} /></Field><Button type="submit">{savedProfile ? <><Check size={16} />Tersimpan</> : 'Simpan profil'}</Button></form></section>

          <section className="settings-section" id="theme-settings"><div className="settings-section-heading"><p className="eyebrow">TAMPILAN</p><h2>Pilih suasana</h2><p>Palet Fiery Arctic Midnight menyesuaikan diri di kedua mode.</p></div><div className="theme-choice-grid"><button type="button" className={`theme-choice theme-choice-light${data.settings.theme === 'light' ? ' selected' : ''}`} aria-pressed={data.settings.theme === 'light'} onClick={() => data.setSettings({ theme: 'light' })}><Sun size={18} /><span><strong>Terang</strong><small>Arctic Cream</small></span>{data.settings.theme === 'light' && <Check size={16} />}</button><button type="button" className={`theme-choice theme-choice-dark${data.settings.theme === 'dark' ? ' selected' : ''}`} aria-pressed={data.settings.theme === 'dark'} onClick={() => data.setSettings({ theme: 'dark' })}><Moon size={18} /><span><strong>Gelap</strong><small>Midnight Charcoal</small></span>{data.settings.theme === 'dark' && <Check size={16} />}</button></div></section>

          <section className="settings-section" id="notifications-settings"><div className="settings-section-heading"><p className="eyebrow">PENGINGAT</p><h2>Notifikasi browser</h2><p>Pengingat berbunyi saat browser terbuka dan waktunya tiba. Browser akan meminta izin sebelum mengirim notifikasi.</p></div><div className="notification-setting"><span className="settings-feature-icon"><Bell size={18} /></span><div><strong>{data.settings.remindersEnabled ? 'Pengingat aktif' : 'Pengingat nonaktif'}</strong><span>{'Notification' in window ? `Izin browser: ${Notification.permission === 'granted' ? 'diberikan' : Notification.permission === 'denied' ? 'ditolak' : 'belum diminta'}` : 'Browser ini tidak mendukung notifikasi.'}</span></div><Button variant={data.settings.remindersEnabled ? 'secondary' : 'primary'} onClick={() => data.settings.remindersEnabled ? data.setSettings({ remindersEnabled: false }) : enableNotifications()}>{data.settings.remindersEnabled ? 'Nonaktifkan' : 'Aktifkan'}</Button></div></section>

          <section className="settings-section" id="dashboard-settings"><div className="settings-section-heading"><p className="eyebrow">BERANDA</p><h2>Pilih yang ingin terlihat</h2><p>Sembunyikan bagian yang belum Anda perlukan. Data tetap tersimpan.</p></div><div className="widget-settings">{widgetOptions.map(item => <label className="widget-setting" key={item.id}><input type="checkbox" checked={data.settings.dashboardWidgets.includes(item.id)} onChange={() => toggleWidget(item.id)} /><span>{item.label}</span></label>)}</div></section>

          <section className="settings-section" id="categories-settings"><div className="settings-section-heading"><p className="eyebrow">KATEGORI</p><h2>Susun ruang kerjamu</h2><p>Kategori yang sedang dipakai tidak dapat dihapus. Data lama tetap memiliki kategorinya.</p></div><div className="category-settings">{categoryOptions.map(item => <CategoryEditor key={item.key} item={item} values={data.settings[item.key]} records={data[item.collection]} onAdd={addCategory} onRemove={removeCategory} />)}
            <div className="category-setting-row"><div className="category-setting-copy"><strong>Prioritas tugas</strong><span>{data.settings.priorities.map(value => <span className="category-chip" key={value}>{value}{!data.tasks.some(task => task.priority === value) && <button type="button" aria-label={`Hapus prioritas ${value}`} onClick={() => removePriority(value)}>×</button>}</span>)}</span></div><form className="inline-add-form" onSubmit={addPriority}><label className="sr-only" htmlFor="new-priority">Prioritas baru</label><input id="new-priority" value={priority} onChange={event => setPriority(event.target.value)} maxLength={32} placeholder="Prioritas baru" /><Button variant="secondary" type="submit"><Plus size={15} />Tambah</Button></form></div>
          </div></section>

      <section className="settings-section" id="data-settings"><div className="settings-section-heading"><p className="eyebrow">DATA PRIBADI</p><h2>Cadangkan atau pulihkan</h2><p>Ekspor membuat file JSON dari tugas, jadwal, rutinitas, catatan, dan target Anda.</p></div><div className="data-actions"><Button onClick={() => { downloadWorkspace({ version: data.version, profile: data.profile, settings: data.settings, tasks: data.tasks, schedules: data.schedules, routines: data.routines, notes: data.notes, goals: data.goals }); data.notify('File cadangan sedang diunduh.') }}><Download size={17} />Unduh cadangan</Button><Button variant="secondary" onClick={() => importRef.current?.click()} disabled={importing}><Upload size={17} />{importing ? 'Memeriksa file…' : 'Pulihkan dari JSON'}</Button><input ref={importRef} className="sr-only" type="file" accept="application/json,.json" aria-label="Pilih file cadangan DayFlow" onChange={restoreFile} /><p className="data-privacy-note"><FolderOpen size={16} />Data tetap di browser ini kecuali Anda mengekspor file.</p></div><div className="reset-row"><div><strong>Kosongkan ruang kerja</strong><span>Menghapus seluruh data DayFlow dari perangkat ini.</span></div><Button variant="danger" onClick={reset}><RotateCcw size={16} />Hapus data</Button></div></section>
        </div>
      </div>
    </>
  )
}
