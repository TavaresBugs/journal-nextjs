"use client";

import React from "react";

interface SelectValueWithIconProps {
  icon: string;
  label: string;
}

export const SelectValueWithIcon = React.memo(function SelectValueWithIcon({
  icon,
  label,
}: SelectValueWithIconProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-lg">{icon}</span>
      <span>{label}</span>
    </div>
  );
});
