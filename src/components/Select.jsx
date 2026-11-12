import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

function normalizeOptions(options) {
  return options.map(option => typeof option === 'string'
    ? { value: option, label: option }
    : { value: String(option.value), label: option.label ?? String(option.value), disabled: Boolean(option.disabled) })
}

export default function Select({
  options: sourceOptions = [], value, defaultValue, onChange, name, id, className = '', disabled = false,
  placeholder = 'Pilih…', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy,
}) {
  const options = normalizeOptions(sourceOptions)
  const generatedId = useId()
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const typeaheadRef = useRef('')
  const typeaheadTimerRef = useRef(0)
  const closeTimerRef = useRef(0)
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === String(value ?? defaultValue ?? '')))
  const [internalValue, setInternalValue] = useState(() => String(defaultValue ?? options[0]?.value ?? ''))
  const currentValue = value === undefined ? internalValue : String(value ?? '')
  const currentIndex = Math.max(0, options.findIndex(option => option.value === currentValue))
  const [open, setOpen] = useState(false)
  const [present, setPresent] = useState(false)
  const [closing, setClosing] = useState(false)
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const [position, setPosition] = useState(null)
  const menuId = `dayflow-select-menu-${generatedId}`
  const selectedOption = options.find(option => option.value === currentValue)

  const closeMenu = useCallback(() => {
    setOpen(false)
    setClosing(true)
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      setPresent(false)
      setClosing(false)
      setPosition(null)
    }, 140)
  }, [])

  const openMenu = useCallback((index = currentIndex) => {
    if (disabled || options.length === 0) return
    window.clearTimeout(closeTimerRef.current)
    setActiveIndex(index)
    setPresent(true)
    setClosing(false)
    setOpen(true)
  }, [currentIndex, disabled, options.length])

  const choose = option => {
    if (option.disabled) return
    if (value === undefined) setInternalValue(option.value)
    onChange?.({ target: { name, value: option.value } })
    closeMenu()
  }

  useLayoutEffect(() => {
    if (!present || !menuRef.current || !triggerRef.current) return undefined
    const updatePosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect()
      const menu = menuRef.current?.getBoundingClientRect()
      if (!trigger || !menu) return
      const margin = 12
      const width = Math.min(Math.max(trigger.width, Math.min(190, window.innerWidth - margin * 2)), window.innerWidth - margin * 2)
      const left = Math.max(margin, Math.min(trigger.left, window.innerWidth - width - margin))
      const below = window.innerHeight - trigger.bottom - margin
      const above = trigger.top - margin
      const opensAbove = below < Math.min(menu.height, 220) && above > below
      const available = Math.max(96, opensAbove ? above : below)
      const maxHeight = Math.min(280, available)
      const height = Math.min(menu.height, maxHeight)
      const top = opensAbove ? Math.max(margin, trigger.top - height - 7) : Math.min(window.innerHeight - height - margin, trigger.bottom + 7)
      const nextPosition = { top, left, width, maxHeight }
      setPosition(previous => previous && Object.keys(nextPosition).every(key => Math.abs(previous[key] - nextPosition[key]) < 1) ? previous : nextPosition)
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updatePosition)
    if (triggerRef.current) observer?.observe(triggerRef.current)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      observer?.disconnect()
    }
  }, [present, options.length])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = event => {
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      closeMenu()
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, closeMenu])

  useEffect(() => () => {
    window.clearTimeout(closeTimerRef.current)
    window.clearTimeout(typeaheadTimerRef.current)
  }, [])

  const handleKeyDown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      if (!open) {
        const enabled = options.findIndex((option, index) => index >= currentIndex && !option.disabled)
        openMenu(enabled >= 0 ? enabled : options.findIndex(option => !option.disabled))
      } else {
        setActiveIndex(index => {
          let next = index
          for (let count = 0; count < options.length; count += 1) {
            next = (next + step + options.length) % options.length
            if (!options[next]?.disabled) return next
          }
          return index
        })
      }
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      if (!open) openMenu()
      const indexes = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0)
      setActiveIndex(event.key === 'Home' ? indexes[0] ?? 0 : indexes.at(-1) ?? 0)
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      closeMenu()
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) openMenu()
      else if (options[activeIndex]) choose(options[activeIndex])
      return
    }
    if (event.key === 'Tab' && open) closeMenu()
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeaheadRef.current += event.key.toLocaleLowerCase('id-ID')
      window.clearTimeout(typeaheadTimerRef.current)
      typeaheadTimerRef.current = window.setTimeout(() => { typeaheadRef.current = '' }, 550)
      const start = open ? activeIndex + 1 : currentIndex
      const ordered = [...options.slice(start), ...options.slice(0, start)]
      const match = ordered.find(option => !option.disabled && option.label.toLocaleLowerCase('id-ID').startsWith(typeaheadRef.current))
      if (match) {
        const nextIndex = options.indexOf(match)
        setActiveIndex(nextIndex)
        if (!open) openMenu(nextIndex)
      }
    }
  }

  return (
    <div className={`custom-select ${className}`.trim()}>
      <button
        ref={triggerRef}
        id={id}
        className="select-trigger"
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-activedescendant={open && options[activeIndex] ? `${menuId}-option-${activeIndex}` : undefined}
        disabled={disabled}
        onClick={() => open ? closeMenu() : openMenu()}
        onKeyDown={handleKeyDown}
      >
        <span className={!selectedOption ? 'select-placeholder' : ''}>{selectedOption?.label ?? placeholder}</span>
        <ChevronDown className={`select-chevron${open ? ' is-open' : ''}`} size={17} aria-hidden="true" />
      </button>
      {name && <input type="hidden" name={name} value={currentValue} />}
      {present && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          className={`select-menu${closing ? ' is-closing' : ''}${position ? ' is-positioned' : ''}`}
          role="listbox"
          aria-hidden={!open}
          style={position ? { top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight } : undefined}
        >
          {options.map((option, index) => (
            <div
              id={`${menuId}-option-${index}`}
              className={`select-option${currentValue === option.value ? ' is-selected' : ''}${activeIndex === index ? ' is-active' : ''}`}
              key={`${option.value}-${index}`}
              role="option"
              aria-selected={currentValue === option.value}
              aria-disabled={option.disabled || undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={event => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {currentValue === option.value && <Check size={16} aria-hidden="true" />}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
