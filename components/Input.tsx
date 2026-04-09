"use client";

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: "text" | "email" | "password";
  className?: string;
  disabled?: boolean;
}

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
  disabled = false,
}: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dark-muted">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-dark-border bg-dark-surface px-4 py-2.5 text-sm text-white placeholder-dark-muted transition-colors focus:border-accent-blue focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function Textarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
  className = "",
  disabled = false,
  maxLength,
}: TextareaProps) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dark-muted">{label}</label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className="w-full resize-none rounded-lg border border-dark-border bg-dark-surface px-4 py-2.5 text-sm text-white placeholder-dark-muted transition-colors focus:border-accent-blue focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
