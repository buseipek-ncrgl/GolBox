import React, { useId } from 'react';

type FieldWrap = {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

function useFieldIds() {
  const id = useId();
  return { id, helperId: `${id}-help`, errorId: `${id}-err` };
}

function Field({
  label,
  helper,
  error,
  required,
  disabled,
  children,
  htmlFor
}: FieldWrap & { children: React.ReactNode; htmlFor: string }) {
  return (
    <div className={`admin-field${error ? ' is-invalid' : ''}${disabled ? ' is-disabled' : ''}`}>
      <label htmlFor={htmlFor} className="admin-label">
        {label}
        {required ? <span className="admin-required" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {helper && !error ? <div id={`${htmlFor}-help`} className="admin-helper">{helper}</div> : null}
      {error ? <div id={`${htmlFor}-err`} className="admin-field-error" role="alert">{error}</div> : null}
    </div>
  );
}

type InputProps = FieldWrap & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, helper, error, required, disabled, id, ...rest }: InputProps) {
  const ids = useFieldIds();
  const fieldId = id || ids.id;
  const describedBy = [helper && !error ? `${fieldId}-help` : null, error ? `${fieldId}-err` : null].filter(Boolean).join(' ') || undefined;
  return (
    <Field label={label} helper={helper} error={error} required={required} disabled={disabled} htmlFor={fieldId}>
      <input
        id={fieldId}
        className="admin-input"
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    </Field>
  );
}

export function NumberInput(props: InputProps) {
  return <Input type="number" inputMode="decimal" {...props} />;
}

export function DateInput(props: InputProps) {
  return <Input type="date" {...props} />;
}

export function TimeInput(props: InputProps) {
  return <Input type="time" {...props} />;
}

export function Textarea({
  label, helper, error, required, disabled, id, rows = 4, ...rest
}: FieldWrap & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ids = useFieldIds();
  const fieldId = id || ids.id;
  const describedBy = [helper && !error ? `${fieldId}-help` : null, error ? `${fieldId}-err` : null].filter(Boolean).join(' ') || undefined;
  return (
    <Field label={label} helper={helper} error={error} required={required} disabled={disabled} htmlFor={fieldId}>
      <textarea
        id={fieldId}
        className="admin-input"
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    </Field>
  );
}

export function Select({
  label, helper, error, required, disabled, id, children, ...rest
}: FieldWrap & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const ids = useFieldIds();
  const fieldId = id || ids.id;
  const describedBy = [helper && !error ? `${fieldId}-help` : null, error ? `${fieldId}-err` : null].filter(Boolean).join(' ') || undefined;
  return (
    <Field label={label} helper={helper} error={error} required={required} disabled={disabled} htmlFor={fieldId}>
      <select
        id={fieldId}
        className="admin-input"
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
}

export function Checkbox({
  label, helper, error, disabled, id, ...rest
}: Omit<FieldWrap, 'required'> & React.InputHTMLAttributes<HTMLInputElement>) {
  const ids = useFieldIds();
  const fieldId = id || ids.id;
  return (
    <label htmlFor={fieldId} className="admin-check">
      <input id={fieldId} type="checkbox" disabled={disabled} aria-invalid={error ? true : undefined} {...rest} />
      <span>
        {label}
        {helper ? <span className="admin-helper">{helper}</span> : null}
        {error ? <span className="admin-field-error" role="alert">{error}</span> : null}
      </span>
    </label>
  );
}

export function RadioGroup({
  legend,
  name,
  value,
  onChange,
  options,
  error,
  required
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; helper?: string }[];
  error?: string;
  required?: boolean;
}) {
  return (
    <fieldset className="admin-fieldset">
      <legend className="admin-label">
        {legend}
        {required ? <span className="admin-required" aria-hidden="true"> *</span> : null}
      </legend>
      <div className="admin-radio-list">
        {options.map((opt) => (
          <label key={opt.value} className={`admin-radio${value === opt.value ? ' is-on' : ''}`}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span>
              <strong>{opt.label}</strong>
              {opt.helper ? <span className="admin-helper">{opt.helper}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {error ? <div className="admin-field-error" role="alert">{error}</div> : null}
    </fieldset>
  );
}
