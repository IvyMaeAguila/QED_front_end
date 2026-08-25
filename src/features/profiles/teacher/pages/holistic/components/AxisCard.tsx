// import type { ComponentType } from "react";
// import { RatingSelector } from "./RatingSelector";

// interface AxisCardProps {
//   icon: ComponentType<{ size?: number }>;
//   label: string;
//   description: string;
//   score: number | null;
//   note: string;
//   onScoreChange: (value: number) => void;
//   onNoteChange: (value: string) => void;
//   darkMode: boolean;
//   panelBorder: string;
//   textPrimary: string;
//   textMuted: string;
//   accent: string;
// }

// export function AxisCard({
//   icon: Icon,
//   label,
//   description,
//   score,
//   note,
//   onScoreChange,
//   onNoteChange,
//   darkMode,
//   panelBorder,
//   textPrimary,
//   textMuted,
//   accent,
// }: AxisCardProps) {
//   const textareaClasses = `w-full px-2.5 py-2 rounded-lg border text-xs font-semibold outline-none transition-colors resize-none ${
//     darkMode
//       ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#6B0000]"
//       : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#6B0000]"
//   }`;

//   return (
//     <div className={`rounded-xl border p-4 space-y-3 ${panelBorder}`}>
//       <div className="flex items-center gap-2.5">
//         <span
//           className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
//           style={{ background: darkMode ? `${accent}33` : `${accent}1A`, color: accent }}
//         >
//           <Icon size={16} />
//         </span>
//         <div className="min-w-0">
//           <p className={`font-bold text-sm leading-tight ${textPrimary}`}>{label}</p>
//           <p className={`text-[11px] font-semibold ${textMuted}`}>{description}</p>
//         </div>
//       </div>

//       <RatingSelector value={score} onChange={onScoreChange} darkMode={darkMode} textMuted={textMuted} />

//       <textarea
//         value={note}
//         onChange={(e) => onNoteChange(e.target.value)}
//         placeholder={`Optional note about ${label.toLowerCase()} development…`}
//         rows={2}
//         className={textareaClasses}
//       />
//     </div>
//   );
// }