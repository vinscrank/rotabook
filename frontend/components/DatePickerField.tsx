"use client";

import DatePicker from "react-datepicker";
import { formatDateValue, parseDateValue } from "@/lib/datetime";
import { formInputClassName } from "@/lib/formStyles";
import { DatePickerPopperContainer } from "@/components/DatePickerPopperContainer";

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: Date;
}

export default function DatePickerField({
  value,
  onChange,
  placeholder = "Select date",
  required,
  minDate,
}: DatePickerFieldProps) {
  return (
    <div className="relative w-full min-w-0">
      <DatePicker
        selected={parseDateValue(value)}
        onChange={(date: Date | null) => onChange(date ? formatDateValue(date) : "")}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholder}
        required={required}
        minDate={minDate}
        className={formInputClassName}
        wrapperClassName="w-full"
        calendarClassName="rotabook-datepicker"
        popperClassName="rotabook-datepicker-popper"
        popperContainer={DatePickerPopperContainer}
        popperPlacement="bottom-start"
      />
    </div>
  );
}
