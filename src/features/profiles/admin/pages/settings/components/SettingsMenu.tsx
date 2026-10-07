import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Settings, X, Moon, Sun, Bell, Info, Pencil, Check, Landmark } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { ToggleRow } from "./ToggleRow";

const APPLE_EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function SettingsMenu() {
  const {
    darkMode,
    toggleDarkMode,
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

  const [editingAcronym, setEditingAcronym] = useState(false);
  const [acronymDraft, setAcronymDraft] = useState(schoolAcronym);
  const acronymInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(schoolName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const ref = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  function closeAll() {
    setOpen(false);
    setEditingAcronym(false);
    setEditingName(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedTrigger = ref.current?.contains(target);
      const clickedDrawer = drawerRef.current?.contains(target);
      if (!clickedTrigger && !clickedDrawer) {
        closeAll();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

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
  const borderColor = darkMode ? "border-[#1F2937]" : "border-[#EEF0F3]";
  const labelClasses = `text-xs font-semibold uppercase tracking-wider ${mutedText}`;
  const sectionBorder = `pt-4 border-t space-y-2.5 ${borderColor}`;

  const rowBase = `w-full h-10 px-3 rounded-lg border flex items-center justify-between transition-colors ${
    darkMode ? "bg-[#0B1120] border-[#2A3441]" : "bg-[#FAFBFC] border-[#E3E6EA]"
  }`;

  const drawer = (
    <>
      {/* Backdrop */}
      <div
        onClick={closeAll}
        aria-hidden={!open}
        className={`fixed inset-0 z-[90] modal-backdrop transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        data-drawer-panel="true"
        className={`fixed inset-y-0 right-0 z-[100] w-[26rem] max-w-[90vw] h-full flex flex-col shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.35)] transition-transform duration-500 ${APPLE_EASE} ${
          darkMode ? "bg-[#0F172A]" : "bg-white"
        } ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-center justify-between shrink-0 border-b ${borderColor}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                darkMode ? "bg-white/10" : "bg-[#F3E9E9]"
              }`}
            >
              <Settings size={16} className={darkMode ? "text-white" : "text-[#6B0000]"} />
            </div>
            <p
              className={`text-base font-semibold ${darkMode ? "text-white" : "text-[#111827]"}`}
            >
              Settings
            </p>
          </div>

          <button
            onClick={closeAll}
            aria-label="Close"
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              darkMode
                ? "text-[#9CA3AF] hover:bg-white/10 hover:text-white"
                : "text-[#9CA3AF] hover:bg-black/5 hover:text-[#374151]"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-2.5">
            <p className={labelClasses}>Appearance</p>
            <ToggleRow
              icon={darkMode ? Moon : Sun}
              label="Dark Mode"
              checked={darkMode}
              onChange={toggleDarkMode}
              darkMode={darkMode}
            />
          </div>

          <div className={sectionBorder}>
            <p className={`${labelClasses} flex items-center gap-1.5`}>
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
                  className={`flex-1 bg-transparent outline-none text-sm font-medium ${
                    darkMode ? "text-white" : "text-[#111827]"
                  }`}
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={commitAcronym}
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] hover:bg-[#6B0000]/10 transition-colors"
                  title="Save"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className={rowBase}>
                <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-[#111827]"}`}>
                  {schoolAcronym}
                </span>
                <button
                  onClick={() => setEditingAcronym(true)}
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] transition-colors ${
                    darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                  }`}
                  title="Edit school acronym"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}

            <p className={`${labelClasses} pt-1`}>School Full Name</p>

            {editingName ? (
              <div className={rowBase}>
                <input
                  ref={nameInputRef}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={commitName}
                  placeholder="Quality Education"
                  className={`flex-1 bg-transparent outline-none text-sm font-medium ${
                    darkMode ? "text-white" : "text-[#111827]"
                  }`}
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={commitName}
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] hover:bg-[#6B0000]/10 transition-colors"
                  title="Save"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className={rowBase}>
                <span className={`text-sm font-medium truncate ${darkMode ? "text-white" : "text-[#111827]"}`}>
                  {schoolName}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[#6B0000] transition-colors ${
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
            <p className={labelClasses}>Notifications</p>
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

          <div className={sectionBorder}>
            <p className={`${labelClasses} flex items-center gap-1.5`}>
              <Info size={12} />
              System Information
            </p>
            <dl className="space-y-2 text-sm">
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
    </>
  );

  return (
    <div ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-full transition-colors shrink-0 text-[#6B0000] ${
          darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
        }`}
        title="Settings"
      >
        <Settings size={22} />
      </button>

      {createPortal(drawer, document.body)}
    </div>
  );
}
