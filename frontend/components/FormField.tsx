import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, children, className = "" }: FormFieldProps) {
  return (
    <label className={`block space-y-2 min-w-0 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      {children}
    </label>
  );
}
