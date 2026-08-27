import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'bg-ink border-line-strong text-soft placeholder:text-dim w-full rounded-[7px] border px-4 py-3 ' +
  'text-base transition-colors focus:border-orange focus:outline-none';

type BaseProps = { label: string; error?: string; hint?: string };

/** Campo de texto con su etiqueta y su error enlazados por id. */
export function Field({
  label,
  error,
  hint,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-soft text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className={cn(CONTROL, error && 'border-red-400/70')}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-dim text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Área de texto con el mismo tratamiento de etiqueta y error. */
export function TextArea({
  label,
  error,
  hint,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-soft text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className={cn(CONTROL, 'resize-y', error && 'border-red-400/70')}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-dim text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
