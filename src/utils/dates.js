export const isoDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const todayISO = () => isoDate(new Date())

export function addDays(dateString, amount) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + amount)
  return isoDate(date)
}

export function mondayOf(dateString) {
  const date = new Date(`${dateString}T12:00:00`)
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  return isoDate(date)
}

export function formatDate(dateString, options = { day: 'numeric', month: 'long' }) {
  if (!dateString) return 'Belum ditentukan'
  const date = new Date(`${dateString}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak valid'
  return new Intl.DateTimeFormat('id-ID', options).format(date)
}

export function formatLongDate(dateString) {
  return formatDate(dateString, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function monthLabel(year, month) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1))
}
