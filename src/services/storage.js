export const STORAGE_KEY = 'dayflow-workspace-v1'

export const initialData = () => ({
  version: 1,
  profile: { name: '', workspace: 'Ruang pribadi' },
  settings: {
    theme: 'light',
    dashboardWidgets: ['summary', 'schedule', 'routines', 'goals', 'notes'],
    taskCategories: ['Kuliah', 'Tugas', 'Pribadi', 'Rumah', 'Kerja', 'Lainnya'],
    scheduleCategories: ['Kuliah', 'Belajar', 'Pribadi', 'Rumah', 'Kerja', 'Lainnya'],
    routineCategories: ['Kesehatan', 'Belajar', 'Rumah', 'Pribadi', 'Lainnya'],
    noteCategories: ['Pribadi', 'Kuliah', 'Ide', 'Penting', 'Lainnya'],
    goalCategories: ['Kuliah', 'Belajar', 'Kesehatan', 'Rumah', 'Pribadi', 'Lainnya'],
    priorities: ['Rendah', 'Sedang', 'Tinggi'],
    remindersEnabled: false,
  },
  tasks: [],
  schedules: [],
  routines: [],
  notes: [],
  goals: [],
})

function isRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

export function validateWorkspace(value) {
  if (!isRecord(value)) throw new Error('File harus berisi objek data ORBIT.')
  const arrays = ['tasks', 'schedules', 'routines', 'notes', 'goals']
  for (const key of arrays) {
    if (!Array.isArray(value[key])) throw new Error(`Data ${key} tidak ditemukan atau formatnya salah.`)
    if (value[key].some(record => !isRecord(record) || typeof record.id !== 'string')) throw new Error(`Setiap data ${key} harus memiliki ID.`)
  }
  const initial = initialData()
  const incomingSettings = isRecord(value.settings) ? value.settings : {}
  const categoryKeys = ['taskCategories', 'scheduleCategories', 'routineCategories', 'noteCategories', 'goalCategories', 'priorities', 'dashboardWidgets']
  for (const key of categoryKeys) {
    if (incomingSettings[key] !== undefined && (!Array.isArray(incomingSettings[key]) || incomingSettings[key].some(item => typeof item !== 'string'))) {
      throw new Error(`Pengaturan ${key} memiliki format yang salah.`)
    }
  }
  const settings = { ...initial.settings, ...incomingSettings }
  for (const key of categoryKeys.slice(0, 6)) {
    if (settings[key].length === 0) settings[key] = [...initial.settings[key]]
  }
  settings.dashboardWidgets = settings.dashboardWidgets.filter(item => initial.settings.dashboardWidgets.includes(item))
  settings.theme = settings.theme === 'dark' ? 'dark' : 'light'
  settings.remindersEnabled = Boolean(settings.remindersEnabled)
  return {
    version: 1,
    profile: { ...initial.profile, ...(isRecord(value.profile) ? value.profile : {}) },
    settings,
    tasks: value.tasks,
    schedules: value.schedules,
    routines: value.routines,
    notes: value.notes,
    goals: value.goals,
  }
}

export function readWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { data: initialData(), error: '' }
    return { data: validateWorkspace(JSON.parse(raw)), error: '' }
  } catch (error) {
    return {
      data: initialData(),
      error: `Data ORBIT tidak dapat dibaca: ${error.message}. Anda dapat memulihkan cadangan dari Pengaturan.`,
    }
  }
}

export function writeWorkspace(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function downloadWorkspace(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `orbit-cadangan-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  window.setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(url)
  }, 60_000)
}
