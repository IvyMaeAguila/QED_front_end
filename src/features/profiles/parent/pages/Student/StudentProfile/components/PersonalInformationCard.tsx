// // components/PersonalInformationCard.tsx
// // Restyled to match the maroon / soft-edge header: field tiles, maroon accents, sentence-case labels.
// import { useState } from "react";
// import type { ReactNode } from "react";
// import { UserRound, Pencil, ArrowLeft, Save } from "lucide-react";
// import SectionHeader from "../../../ui/SectionHeader";
// import type { PersonalInformation } from "../types/types";
// import type { AdminThemeContext } from "../../../../../admin/pages/AdminLayout";

// interface PersonalInformationCardProps {
//   info: PersonalInformation;
//   theme: AdminThemeContext;
//   onSave?: (updates: { dateOfBirth: string; residentialAddress: string }) => void | Promise<void>;
// }

// // Soft rounded tile that wraps every field (same idea as the tiles in the header)
// function Tile({ label, darkMode, children }: { label: string; darkMode: boolean; children: ReactNode }) {
//   return (
//     <div className={`rounded-2xl p-4 ${darkMode ? "bg-white/5" : "bg-[#FBF5F5]"}`}>
//       <p className={`text-xs font-medium ${darkMode ? "text-white/50" : "text-[#6B7280]"}`}>{label}</p>
//       <div className="mt-1.5">{children}</div>
//     </div>
//   );
// }

// function DisplayField({ label, value, darkMode }: { label: string; value: string | null; darkMode: boolean }) {
//   const hasValue = Boolean(value && value.trim().length > 0);
//   return (
//     <Tile label={label} darkMode={darkMode}>
//       <p
//         className={`text-sm font-semibold ${
//           hasValue ? (darkMode ? "text-white" : "text-[#111827]") : darkMode ? "text-white/40" : "text-[#9CA3AF]"
//         }`}
//       >
//         {hasValue ? value : "Not specified"}
//       </p>
//     </Tile>
//   );
// }

// // Read-only field shown in edit mode for fields that can't be changed.
// function LockedField({ label, value, darkMode }: { label: string; value: string | null; darkMode: boolean }) {
//   return (
//     <Tile label={label} darkMode={darkMode}>
//       <div
//         className={`w-full cursor-not-allowed rounded-xl border px-3 py-2 text-sm font-semibold ${
//           darkMode ? "border-white/5 bg-white/[0.03] text-white/40" : "border-slate-200 bg-slate-100 text-slate-400"
//         }`}
//       >
//         {value && value.trim().length > 0 ? value : "—"}
//       </div>
//     </Tile>
//   );
// }

// function UnlockedField({
//   label,
//   type,
//   value,
//   onChange,
//   darkMode,
// }: {
//   label: string;
//   type: "date" | "text";
//   value: string;
//   onChange: (value: string) => void;
//   darkMode: boolean;
// }) {
//   return (
//     <Tile label={label} darkMode={darkMode}>
//       <input
//         type={type}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-[#7A1212]/40 ${
//           darkMode
//             ? "border-white/10 bg-white/5 text-white placeholder:text-white/30"
//             : "border-maroon/20 bg-white text-slate-900 placeholder:text-slate-400"
//         }`}
//       />
//     </Tile>
//   );
// }

// export function PersonalInformationCard({ info, theme, onSave }: PersonalInformationCardProps) {
//   const { darkMode, panelBg, panelBorder, textPrimary } = theme;

//   const [isEditing, setIsEditing] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [dateOfBirth, setDateOfBirth] = useState(info.dateOfBirth ?? "");
//   const [residentialAddress, setResidentialAddress] = useState(info.residentialAddress ?? "");

//   function resetDraft() {
//     setDateOfBirth(info.dateOfBirth ?? "");
//     setResidentialAddress(info.residentialAddress ?? "");
//   }

//   function handleStartEdit() {
//     resetDraft();
//     setIsEditing(true);
//   }

//   function handleCancel() {
//     resetDraft();
//     setIsEditing(false);
//   }

//   async function handleSave() {
//     if (!onSave) return setIsEditing(false);
//     try {
//       setIsSaving(true);
//       await onSave({ dateOfBirth, residentialAddress });
//       setIsEditing(false);
//     } finally {
//       setIsSaving(false);
//     }
//   }

//   const ghostBtn = darkMode
//     ? "border-white/10 text-white/80 hover:bg-white/5"
//     : "border-maroon/20 text-brand-ink hover:bg-maroon-light/5";

//   const gridClass = "grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5";

//   // ---------- EDIT MODE ----------
//   if (isEditing) {
//     return (
//       <div className={`rounded-2xl border shadow-sm ${panelBorder} ${panelBg}`}>
//         <div className={`flex items-center gap-3 border-b px-4 py-3 sm:px-5 sm:py-4 ${panelBorder}`}>
//           <button
//             type="button"
//             onClick={handleCancel}
//             disabled={isSaving}
//             className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-50 ${ghostBtn}`}
//             aria-label="Cancel edit"
//           >
//             <ArrowLeft className="h-4 w-4" />
//           </button>
//           <UserRound className={`h-5 w-5 shrink-0 ${darkMode ? "text-red-400" : "text-brand-ink"}`} />
//           <p className={`min-w-0 truncate text-sm font-bold ${textPrimary}`}>Edit personal information</p>
//         </div>

//         <div className={gridClass}>
//           <LockedField label="Full name" value={info.fullName} darkMode={darkMode} />
//           <LockedField label="Student LRN" value={info.studentLrn} darkMode={darkMode} />
//           <LockedField label="Gender" value={info.gender} darkMode={darkMode} />
//           <LockedField label="Current class" value={info.currentClass} darkMode={darkMode} />
//           <UnlockedField label="Date of birth" type="date" value={dateOfBirth} onChange={setDateOfBirth} darkMode={darkMode} />
//           <UnlockedField
//             label="Residential address"
//             type="text"
//             value={residentialAddress}
//             onChange={setResidentialAddress}
//             darkMode={darkMode}
//           />
//         </div>

//         <div className={`flex items-center gap-3 border-t px-4 py-3 sm:px-5 sm:py-4 ${panelBorder}`}>
//           <button
//             type="button"
//             onClick={handleCancel}
//             disabled={isSaving}
//             className={`flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 sm:flex-none ${ghostBtn}`}
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             onClick={handleSave}
//             disabled={isSaving}
//             className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-900 disabled:opacity-50 sm:flex-none"
//           >
//             <Save className="h-4 w-4" />
//             {isSaving ? "Saving..." : "Save changes"}
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ---------- VIEW MODE ----------
//   return (
//     <div className={`rounded-2xl border shadow-sm ${panelBorder} ${panelBg}`}>
//       <SectionHeader
//         icon={UserRound}
//         title="Personal Information"
//         theme={theme}
//         action={
//           <button
//             type="button"
//             onClick={handleStartEdit}
//             className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${ghostBtn}`}
//           >
//             <Pencil className="h-3.5 w-3.5" />
//             <span className="hidden sm:inline">Edit</span>
//           </button>
//         }
//       />

//       <div className={gridClass}>
//         <DisplayField label="Full name" value={info.fullName} darkMode={darkMode} />
//         <DisplayField label="Student LRN" value={info.studentLrn} darkMode={darkMode} />
//         <DisplayField label="Gender" value={info.gender} darkMode={darkMode} />
//         <DisplayField label="Current class" value={info.currentClass} darkMode={darkMode} />
//         <DisplayField label="Date of birth" value={info.dateOfBirth} darkMode={darkMode} />
//         <DisplayField label="Residential address" value={info.residentialAddress} darkMode={darkMode} />
//       </div>
//     </div>
//   );
// }