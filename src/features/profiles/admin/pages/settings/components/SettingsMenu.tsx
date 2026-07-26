import { useState, useRef, useEffect } from "react";
import { Settings, X, Moon, Sun, Bell, GraduationCap, Info, Pencil, Check, Landmark } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { ToggleRow } from "./ToggleRow";

const ACCENT = "#6B0000";

export function SettingsMenu() {
  const {
    darkMode,
    toggleDarkMode,
    schoolYear,
    setSchoolYear,
    schoolAcronym,
    setSchoolAcronym,
    schoolName,
    setSchoolName,
    emailNotifications,
    setEmailNotifications,
    pushNotifications,
    setPushNotifications,
  } = useSettings();

  const [open, setOpen] = useState(false);

  const [editingYear, setEditingYear] = useState(false);
  const [yearDraft, setYearDraft] = useState(schoolYear);
  const yearInputRef = useRef<HTMLInputElement>(null);

  const [editingAcronym, setEditingAcronym] = useState(false);
  const [acronymDraft, setAcronymDraft] = useState(schoolAcronym);
  const acronymInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(schoolName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingYear(false);
        setEditingAcronym(false);
        setEditingName(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingYear) {
      setYearDraft(schoolYear);
      yearInputRef.current?.focus();
      yearInputRef.current?.select();
    }
  }, [editingYear, schoolYear]);

  useEffect(() => {
    if (editingAcronym) {
      setAcronymDraft(schoolAcronym);
      acronymInputRef.current?.focus();
      acronymInputRef.current?.select();
    }
  }, [editingAcronym, schoolAcronym]);

  useEffect(() => {
    if (editingName) {
      setNameDraft(schoolName);
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName, schoolName]);

  function commitYear() {
    const trimmed = yearDraft.trim();
    if (trimmed && trimmed !== schoolYear) {
      setSchoolYear(trimmed);
    }
    setEditingYear(false);
  }

  function handleYearKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitYear();
    } else if (e.key === "Escape") {
      setYearDraft(schoolYear);
      setEditingYear(false);
    }
  }

  function commitAcronym() {
    const trimmed = acronymDraft.trim();
    if (trimmed && trimmed !== schoolAcronym) {
      setSchoolAcronym(trimmed);
    }
    setEditingAcronym(false);
  }

  function handleAcronymKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitAcronym();
    } else if (e.key === "Escape") {
      setAcronymDraft(schoolAcronym);
      setEditingAcronym(false);
    }
  }

  function commitName() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== schoolName) {
      setSchoolName(trimmed);
    }
    setEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitName();
    } else if (e.key === "Escape") {
      setNameDraft(schoolName);
      setEditingName(false);
    }
  }

  const mutedText = darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]";
  const dropdownLabel = `text-[10px] font-bold uppercase tracking-wide mb-1.5 ${mutedText}`;
  const sectionBorder = `pt-3 border-t space-y-2 ${darkMode ? "border-[#374151]" : "border-[#E5E7EB]"}`;

  const rowBase = `w-full h-9 px-2.5 rounded-lg border flex items-center justify-between ${
    darkMode ? "bg-[#0B1120] border-[#374151]" : "bg-[#F8FAFC] border-[#E5E7EB]"
  }`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-full transition-colors shrink-0 text-[#6B0000] ${
          darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
        }`}
        title="Settings"
      >
        <Settings size={22} />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-12 z-30 w-80 rounded-2xl border shadow-lg overflow-hidden max-h-[80vh] overflow-y-auto ${
            darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"
          }`}
        >
          <div className="px-4 py-3 flex items-center justify-between sticky top-0" style={{ background: ACCENT }}>
            <span className="text-white font-bold text-sm">Settings</span>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={13} className="text-white" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <p className={dropdownLabel}>Appearance</p>
              <ToggleRow
                icon={darkMode ? Moon : Sun}
                label="Dark Mode"
                checked={darkMode}
                onChange={toggleDarkMode}
                darkMode={darkMode}
              />
            </div>

            <div className={sectionBorder}>
              <p className={`${dropdownLabel} flex items-center gap-1.5`}>
                <Landmark size={11} />
                School Acronym
              </p>

              {editingAcronym ? (
                <div className={rowBase}>
                  <input
                    ref={acronymInputRef}
                    value={acronymDraft}
                    onChange={(e) => setAcronymDraft(e.target.value)}
                    onKeyDown={handleAcronymKeyDown}
                    onBlur={commitAcronym}
                    placeholder="QED"
                    className={`flex-1 bg-transparent outline-none text-xs font-bold ${
                      darkMode ? "text-white" : "text-[#111827]"
                    }`}
                  />
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={commitAcronym}
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] hover:bg-[#6B0000]/10 transition-colors"
                    title="Save"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className={rowBase}>
                  <span className={`text-xs font-bold ${darkMode ? "text-white" : "text-[#111827]"}`}>
                    {schoolAcronym}
                  </span>
                  <button
                    onClick={() => setEditingAcronym(true)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] transition-colors ${
                      darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                    }`}
                    title="Edit school acronym"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}

              <p className={`${dropdownLabel} pt-1`}>School Full Name</p>

              {editingName ? (
                <div className={rowBase}>
                  <input
                    ref={nameInputRef}
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={commitName}
                    placeholder="Quality Education"
                    className={`flex-1 bg-transparent outline-none text-xs font-bold ${
                      darkMode ? "text-white" : "text-[#111827]"
                    }`}
                  />
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={commitName}
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] hover:bg-[#6B0000]/10 transition-colors"
                    title="Save"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className={rowBase}>
                  <span className={`text-xs font-bold truncate ${darkMode ? "text-white" : "text-[#111827]"}`}>
                    {schoolName}
                  </span>
                  <button
                    onClick={() => setEditingName(true)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] transition-colors ${
                      darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                    }`}
                    title="Edit school name"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>

            <div className={sectionBorder}>
              <p className={`${dropdownLabel} flex items-center gap-1.5`}>
                <GraduationCap size={11} />
                Current School Year
              </p>

              {editingYear ? (
                <div className={rowBase}>
                  <input
                    ref={yearInputRef}
                    value={yearDraft}
                    onChange={(e) => setYearDraft(e.target.value)}
                    onKeyDown={handleYearKeyDown}
                    onBlur={commitYear}
                    placeholder="2025-2026"
                    className={`flex-1 bg-transparent outline-none text-xs font-bold ${
                      darkMode ? "text-white" : "text-[#111827]"
                    }`}
                  />
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={commitYear}
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] hover:bg-[#6B0000]/10 transition-colors"
                    title="Save"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className={rowBase}>
                  <span className={`text-xs font-bold ${darkMode ? "text-white" : "text-[#111827]"}`}>
                    {schoolYear}
                  </span>
                  <button
                    onClick={() => setEditingYear(true)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] transition-colors ${
                      darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                    }`}
                    title="Edit school year"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>

            <div className={sectionBorder}>
              <p className={dropdownLabel}>Notifications</p>
              <ToggleRow
                icon={Bell}
                label="Email Notifications"
                checked={emailNotifications}
                onChange={() => setEmailNotifications(!emailNotifications)}
                darkMode={darkMode}
              />
              <ToggleRow
                icon={Bell}
                label="Push Notifications"
                checked={pushNotifications}
                onChange={() => setPushNotifications(!pushNotifications)}
                darkMode={darkMode}
              />
            </div>

            <div className={sectionBorder.replace(" space-y-2", "")}>
              <p className={`${dropdownLabel} flex items-center gap-1.5`}>
                <Info size={12} />
                System Information
              </p>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className={mutedText}>System</dt>
                  <dd className={`font-semibold ${darkMode ? "text-white" : "text-[#111827]"}`}>
                    QED &mdash; Quality Education
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className={mutedText}>Version</dt>
                  <dd className={`font-semibold ${darkMode ? "text-white" : "text-[#111827]"}`}>v1.0.0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className={mutedText}>Curriculum</dt>
                  <dd className={`font-semibold ${darkMode ? "text-white" : "text-[#111827]"}`}>MATATAG</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}