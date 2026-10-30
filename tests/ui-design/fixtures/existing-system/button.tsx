import type { ButtonHTMLAttributes } from 'react';

export function Button({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`rounded-md bg-brand px-4 py-2 font-semibold text-on-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}
