import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  placeholder = '',
  required = false,
  children,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          className="input pr-11"
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-celebra-dark/50 hover:text-celebra-dark"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {children}
    </div>
  );
}
