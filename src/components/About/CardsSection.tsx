"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import Card from "~/components/About/Aboutcard";
import { getFacultyAndFounder, getMembers, getMembers2025_26 } from "~/utils/translations";

type YearOption = "faculty" | "2025-26" | "2024-25";

const AboutCardsSection: React.FC = () => {
  const t = useTranslations("Members");
  const facultyAndFounder = getFacultyAndFounder(t);
  const members2024_25 = getMembers(t);
  const members2025_26 = getMembers2025_26(t);
  const [selectedYear, setSelectedYear] = useState<YearOption>("2025-26");

  const currentMembers = 
    selectedYear === "faculty" ? facultyAndFounder :
    selectedYear === "2025-26" ? members2025_26 : 
    members2024_25;

  const years = [
    { value: "faculty" as YearOption, label: "Faculty & Founder" },
    { value: "2024-25" as YearOption, label: "2024-25" },
    { value: "2025-26" as YearOption, label: "2025-26" },
  ];

  return (
    <div className="flex flex-col my-8 items-center justify-center w-full">
      {/* Year Toggle Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-10">
        {years.map((year) => (
          <button
            key={year.value}
            onClick={() => setSelectedYear(year.value)}
            className={`group relative px-8 py-3.5 rounded-xl font-semibold text-base sm:text-lg tracking-wide transition-all duration-300 border-2 ${
              selectedYear === year.value
                ? "bg-gradient-to-br from-secondary-100 to-secondary-200 text-white border-secondary-100 scale-105 shadow-2xl shadow-secondary-100/60 ring-2 ring-secondary-100/30 ring-offset-2 ring-offset-primary-100"
                : "bg-gray-800/40 text-white border-gray-700 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 hover:border-secondary-200/50 hover:scale-105 hover:shadow-xl hover:shadow-gray-700/50 active:scale-95"
            }`}
          >
            <span className="relative z-10">{year.label}</span>
            {selectedYear !== year.value && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary-100/0 to-secondary-200/0 group-hover:from-secondary-100/10 group-hover:to-secondary-200/10 transition-all duration-300" />
            )}
          </button>
        ))}
      </div>

      {/* Members Grid */}
      <div className="flex flex-wrap gap-10 justify-center">
        {currentMembers.map((member, idx) => (
          <Card key={`${selectedYear}-${idx}`} {...member} />
        ))}
      </div>
    </div>
  );
};

export default AboutCardsSection;