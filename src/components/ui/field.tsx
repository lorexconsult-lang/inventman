import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const inputClass =
  "mt-2 min-h-11 w-full rounded-xl border bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-muted";

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block text-sm font-medium">
      <span>{label}</span>
      {hint && <span className="ml-2 font-normal text-subtle">{hint}</span>}
      <input className={inputClass} {...props} />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium">
      <span>{label}</span>
      <select className={inputClass} {...props}>
        {children}
      </select>
    </label>
  );
}

export function TextareaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium">
      <span>{label}</span>
      <textarea className={`${inputClass} min-h-28 py-3`} {...props} />
    </label>
  );
}
