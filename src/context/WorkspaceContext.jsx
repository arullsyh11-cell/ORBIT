import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { initialData, readWorkspace, writeWorkspace } from '../services/storage.js'

const WorkspaceContext = createContext(null)
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

export function WorkspaceProvider({ children }) {
  const [initial] = useState(() => readWorkspace())
  const [workspace, setWorkspace] = useState(initial.data)
  const [storageError, setStorageError] = useState(initial.error)
  const [dirty, setDirty] = useState(false)
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || !dirty) return
    try {
      writeWorkspace(workspace)
      setStorageError('')
    } catch {
      setStorageError('Perubahan ini belum tersimpan di perangkat. Periksa ruang penyimpanan browser, lalu coba lagi.')
    }
  }, [workspace, ready, dirty])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const notify = useCallback((message, tone = 'success') => setToast({ id: makeId(), message, tone }), [])
  const changeWorkspace = useCallback(updater => {
    setWorkspace(updater)
    setDirty(true)
  }, [])
  const updateCollection = useCallback((key, updater) => {
    changeWorkspace(current => ({ ...current, [key]: updater(current[key]) }))
  }, [changeWorkspace])
  const createRecord = useCallback((key, record) => {
    const saved = { ...record, id: record.id ?? makeId(), createdAt: record.createdAt ?? new Date().toISOString() }
    updateCollection(key, records => [saved, ...records])
    return saved
  }, [updateCollection])
  const updateRecord = useCallback((key, id, patch) => {
    updateCollection(key, records => records.map(record => record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record))
  }, [updateCollection])
  const deleteRecord = useCallback((key, id) => updateCollection(key, records => records.filter(record => record.id !== id)), [updateCollection])
  const replaceWorkspace = useCallback(data => {
    changeWorkspace(data)
    notify('Data ORBIT berhasil dipulihkan.')
  }, [changeWorkspace, notify])
  const resetWorkspace = useCallback(() => {
    changeWorkspace(initialData())
    notify('Ruang kerja kembali kosong.')
  }, [changeWorkspace, notify])

  const value = useMemo(() => ({
    ...workspace,
    ready,
    storageError,
    toast,
    notify,
    setProfile: patch => changeWorkspace(current => ({ ...current, profile: { ...current.profile, ...patch } })),
    setSettings: patch => changeWorkspace(current => ({ ...current, settings: { ...current.settings, ...patch } })),
    createTask: record => createRecord('tasks', record),
    updateTask: (id, patch) => updateRecord('tasks', id, patch),
    deleteTask: id => deleteRecord('tasks', id),
    createSchedule: record => createRecord('schedules', record),
    updateSchedule: (id, patch) => updateRecord('schedules', id, patch),
    deleteSchedule: id => deleteRecord('schedules', id),
    createRoutine: record => createRecord('routines', record),
    updateRoutine: (id, patch) => updateRecord('routines', id, patch),
    deleteRoutine: id => deleteRecord('routines', id),
    createNote: record => createRecord('notes', record),
    updateNote: (id, patch) => updateRecord('notes', id, patch),
    deleteNote: id => deleteRecord('notes', id),
    createGoal: record => createRecord('goals', record),
    updateGoal: (id, patch) => updateRecord('goals', id, patch),
    deleteGoal: id => deleteRecord('goals', id),
    replaceWorkspace,
    resetWorkspace,
  }), [workspace, ready, storageError, toast, notify, changeWorkspace, createRecord, updateRecord, deleteRecord, replaceWorkspace, resetWorkspace])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace harus digunakan di dalam WorkspaceProvider.')
  return context
}
