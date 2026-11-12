import { addDays, todayISO } from './dates.js'

function addMonths(dateString, amount) {
  const source = new Date(`${dateString}T12:00:00`)
  const day = source.getDate()
  source.setDate(1)
  source.setMonth(source.getMonth() + amount)
  const lastDay = new Date(source.getFullYear(), source.getMonth() + 1, 0).getDate()
  source.setDate(Math.min(day, lastDay))
  return `${source.getFullYear()}-${String(source.getMonth() + 1).padStart(2, '0')}-${String(source.getDate()).padStart(2, '0')}`
}

export function nextTaskOccurrence(task) {
  const baseDate = task.dueDate || task.startDate || todayISO()
  const nextDate = task.repeat === 'Setiap hari' ? addDays(baseDate, 1)
    : task.repeat === 'Setiap minggu' ? addDays(baseDate, 7)
      : task.repeat === 'Setiap bulan' ? addMonths(baseDate, 1)
        : ''
  if (!nextDate) return null
  const reminderTime = task.reminder?.split('T')[1]
  return {
    ...task,
    id: undefined,
    repeatSourceId: task.id,
    createdAt: undefined,
    updatedAt: undefined,
    completedAt: null,
    status: 'To Do',
    startDate: task.startDate ? (task.repeat === 'Setiap bulan' ? addMonths(task.startDate, 1) : addDays(task.startDate, task.repeat === 'Setiap minggu' ? 7 : 1)) : '',
    dueDate: nextDate,
    reminder: reminderTime ? `${nextDate}T${reminderTime}` : '',
    subtasks: (task.subtasks ?? []).map(item => ({ ...item, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, done: false })),
  }
}
