import { useState, type KeyboardEvent } from "react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  hasLeftIcon?: boolean;
}

/** Campo de contraseña con botón integrado para mostrar u ocultar el texto. */
export default function PasswordInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  autoComplete,
  hasLeftIcon = false,
}: PasswordInputProps) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="relative">
      {hasLeftIcon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F7F77] pointer-events-none">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
      )}

      <input
        type={showPass ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full ${hasLeftIcon ? "pl-10" : "pl-4"} pr-11 py-3 rounded-xl border border-[#D3EBE4] bg-[#F1FAF7] text-[#0F2B26] text-sm focus:outline-none focus:ring-2 focus:ring-[#12A582]/30 focus:border-[#12A582] transition ${
          showPass || !value ? "font-500" : "tracking-widest"
        }`}
        style={showPass || !value ? { fontWeight: 500 } : undefined}
      />

      <button
        type="button"
        onClick={() => setShowPass((prev) => !prev)}
        aria-pressed={showPass}
        aria-label={showPass ? "Ocultar contraseña" : "Ver contraseña"}
        title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#5F7F77] hover:text-[#0B6B55] focus:outline-none focus:text-[#0B6B55] transition-colors cursor-pointer"
      >
        {showPass ? (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
