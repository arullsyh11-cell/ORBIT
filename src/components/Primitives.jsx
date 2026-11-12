import { Check, Plus } from 'lucide-react'

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`.trim()} type="button" {...props}>{children}</button>
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, children, hint, className = '' }) {
  return <div className={`field ${className}`}><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</div>
}

export function EmptyState({ icon: Icon, title, detail, action, compact = false }) {
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      {Icon && <span className="empty-icon"><Icon size={20} aria-hidden="true" /></span>}
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  )
}

export function ProgressBar({ value, label, showValue = true }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="progress-wrap">
      <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeValue}>
        <span className="progress-fill" style={{ width: `${safeValue}%` }} />
      </div>
      {showValue && <span className="progress-value">{safeValue}%</span>}
    </div>
  )
}

export function CountBadge({ children, muted = false }) {
  return <span className={`count-badge${muted ? ' count-badge-muted' : ''}`}>{children}</span>
}

export function AddButton({ children = 'Tambah', ...props }) {
  return <Button {...props}><Plus size={17} aria-hidden="true" />{children}</Button>
}

export function CompletionMark({ checked }) {
  return <span className={`completion-mark${checked ? ' is-complete' : ''}`} aria-hidden="true">{checked && <Check size={13} />}</span>
}
