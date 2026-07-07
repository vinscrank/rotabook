"use client";

import DatePicker from "react-datepicker";
import { formatTimeValue, parseTimeValue } from "@/lib/datetime";
import { formInputClassName } from "@/lib/formStyles";
import { DatePickerPopperContainer } from "@/components/DatePickerPopperContainer";

interface TimePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function TimePickerField({
  value,
  onChange,
  placeholder = "Select time",
  required,
}: TimePickerFieldProps) {
  return (
    <div className="relative w-full min-w-0">
      <DatePicker
        selected={parseTimeValue(value)}
        onChange={(date: Date | null) => onChange(date ? formatTimeValue(date) : "")}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="HH:mm"
        placeholderText={placeholder}
        required={required}
        className={formInputClassName}
        wrapperClassName="w-full"
        calendarClassName="rotabook-datepicker rotabook-timepicker"
        popperClassName="rotabook-datepicker-popper"
        popperContainer={DatePickerPopperContainer}
        popperPlacement="bottom-start"
      />
    </div>
  );
}
