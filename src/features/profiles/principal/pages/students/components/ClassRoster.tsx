import { Users } from "lucide-react";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import { RosterTable } from "./RosterTable";
import { splitByGender } from "../utils/roster";
import type { Student } from "../data/types";

interface ClassRosterProps {
  roster: Student[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function ClassRoster({ roster, panelBg, panelBorder, textPrimary, textMuted, darkMode }: ClassRosterProps) {
  const { males, females } = splitByGender(roster);

  return (
    <SectionCard title="Class Roster" icon={Users} panelBg={panelBg} panelBorder={panelBorder} textPrimary={textPrimary} darkMode={darkMode}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RosterTable
          label="Male"
          students={males}
          emptyLabel="No male students."
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
        <RosterTable
          label="Female"
          students={females}
          emptyLabel="No female students."
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </div>
    </SectionCard>
  );
}
