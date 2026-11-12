import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const ModalCloseContext = createContext(() => {})

export function ModalCancelButton({ children = 'Batal' }) {
  const close = useContext(ModalCloseContext)
  return <button className="button button-secondary" type="button" onClick={close}>{children}</button>
}

export default function Modal({ title, onClose, children, wide = false }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const closeTimerRef = useRef(0)
  const closingRef = useRef(false)
  const [closing, setClosing] = useState(false)
  onCloseRef.current = onClose

  const beginClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => onCloseRef.current(), 160)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    const previous = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const firstControl = dialog?.querySelector('input:not([type="hidden"]), textarea, select, [role="combobox"]') ?? dialog?.querySelector('button')
    firstControl?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        const openSelect = dialog?.querySelector('[role="combobox"][aria-expanded="true"]')
        if (openSelect) {
          event.stopImmediatePropagation()
          openSelect.focus()
          openSelect.click()
          return
        }
        beginClose()
      }
      if (event.key !== 'Tab' || !dialog) return
      const controls = [...dialog.querySelectorAll('button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [role="combobox"]:not([disabled]), a[href]')]
      if (controls.length === 0) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(closeTimerRef.current)
      document.body.style.overflow = previousOverflow
      previous?.focus?.()
    }
  }, [])

  return createPortal(
    <ModalCloseContext.Provider value={beginClose}>
      <div className={`modal-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={event => { if (event.target === event.currentTarget) beginClose() }}>
        <section ref={dialogRef} className={`modal-panel${wide ? ' modal-panel-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button className="icon-button" type="button" onClick={beginClose} aria-label="Tutup dialog"><X size={19} /></button>
          </div>
          {children}
        </section>
      </div>
    </ModalCloseContext.Provider>,
    document.body,
  )
}
