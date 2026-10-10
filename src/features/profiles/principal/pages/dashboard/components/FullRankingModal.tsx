import { AccountSelect } from "@shared/components/AccountSelect";

import { TrendChip, ProgressBar, RankBadge } from "../../../../shared/components/DashboardUI";
import type { SubjectRankingItem, Term } from "../data/types";
import { ModalBody, ModalFrame, ModalHeader } from "@shared/components/modal";

interface FullRankingModalProps {
  ranking: SubjectRankingItem[];
  term: Term;
  onTermChange: (term: Term) => void;
  onClose: () => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function FullRankingModal({
  ranking,
  term,
  onTermChange,
  onClose,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: FullRankingModalProps) {
  return (
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} onClose={onClose} size="lg" ariaLabel="Full subject ranking" className="max-h-[85vh]">
        <ModalHeader
          title="School-wide Subject Ranking"
          subtitle={`${ranking.length} subjects ranked`}
          titleClassName={textPrimary}
          subtitleClassName={textMuted}
          onClose={onClose}
          closeDarkMode={darkMode}
          className="items-center border-b px-6 py-5"
          actions={(
            <div className="relative">
              <AccountSelect data-account-select=""
                value={term}
                onChange={(e) => onTermChange(e.target.value as Term)}
                className={`appearance-none text-sm font-bold uppercase tracking-wide pl-5 pr-10 py-2.5 rounded-lg shadow-card ${panelBg} ${panelBorder} border ${textPrimary} focus:outline-none focus:ring-2 focus:ring-maroon/40 cursor-pointer`}
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </AccountSelect>
            </div>
          )}
        />

        {/* Scrollable ranking list */}
        <ModalBody className="flex flex-col gap-3 px-6 py-5">
          {ranking.length === 0 ? (
            <p className={`text-sm text-center py-10 ${textMuted}`}>No ranking data for this term yet.</p>
          ) : (
            ranking.map((item) => (
              <div
                key={`${item.grade}-${item.subject}`}
                className="flex items-center gap-5 rounded-2xl px-5 py-4"
                style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.04)" : "#F7F7F8" }}
              >
                <RankBadge rank={item.rank} darkMode={darkMode} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${textPrimary}`}>{item.subject}</p>
                  <p className={`text-xs mt-0.5 ${textMuted}`}>{item.grade}</p>
                </div>
                <div className="w-32 hidden sm:block">
                  <ProgressBar value={item.score} darkMode={darkMode} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-bold tabular-nums ${textPrimary}`}>{item.score}%</span>
                  <TrendChip trend={item.trend} darkMode={darkMode} />
                </div>
              </div>
            ))
          )}
        </ModalBody>
    </ModalFrame>
  );
}
