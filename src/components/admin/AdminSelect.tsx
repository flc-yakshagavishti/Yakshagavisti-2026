"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type AdminSelectProps = {
  id?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function AdminSelect({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
}: AdminSelectProps): React.ReactElement {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn("admin-select-trigger", className)}
      >
        <SelectValue placeholder={placeholder}>
          {options.find((option) => option.value === value)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className="admin-select-content"
        position="popper"
        sideOffset={4}
        collisionPadding={12}
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="admin-select-item"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
