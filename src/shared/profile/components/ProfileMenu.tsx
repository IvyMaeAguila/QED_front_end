// src/components/ProfileMenu.tsx
import { useState, useRef, useEffect } from "react";
import { User, ChevronDown, Pencil, Check } from "lucide-react";
import { useSettings } from "../../../features/profiles/admin/pages/settings/context/SettingsContext";
import { useAuth } from "../../../features/auth/context/AuthContext";
import { PROFILE_FIELD_CONFIG } from "../../profile/config/ProfileFieldConfig";
import type { UserProfile } from "../../profile/types/types";

const ACCENT = "#6B0000";

export function ProfileMenu() {
  const { darkMode } = useSettings();
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile | null>(user);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(user), [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || !draft) return null; 

  const fields = PROFILE_FIELD_CONFIG[user.role];
  const mutedText = darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]";
  const inputClasses = `w-full h-9 px-2.5 rounded-lg border text-xs font-semibold outline-none transition-colors ${
    darkMode
      ? "bg-[#0B1120] border-[#374151] text-white focus:border-[#6B0000]"
      : "bg-[#F8FAFC] border-[#E5E7EB] text-[#111827] focus:border-[#6B0000]"
  }`;
  const dropdownLabel = `text-[10px] font-bold uppercase tracking-wide mb-1.5 ${mutedText}`;

  function startEdit() {
    setDraft(user);
    setEditing(true);
  }

  async function save() {
    if (!draft) return;
    // TODO: palitan ng tamang endpoint kapag ready na sa backend
    // await AuthService.updateProfile(draft);
    setUser(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(user);
    setEditing(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-2.5 shrink-0 rounded-xl pl-1.5 pr-2.5 py-1.5 border transition-all duration-200 ${
          open
            ? darkMode
              ? "bg-white/10 border-white/10"
              : "bg-black/4 border-black/5"
            : darkMode
              ? "border-transparent hover:bg-white/5 hover:border-white/10"
              : "border-transparent hover:bg-black/3 hover:border-black/5"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-2 ring-transparent transition-all duration-200 ${
            darkMode
              ? "bg-[#374151] group-hover:ring-[#6B0000]/40"
              : "bg-[#E5E5E5] group-hover:ring-[#6B0000]/25"
          }`}
        >
          <User size={17} className="text-[#6B0000]" />
        </div>

        <div className="hidden lg:block leading-tight text-left">
          <p
            className={`text-sm font-bold ${darkMode ? "text-white" : "text-black"}`}
          >
            {user.name}
          </p>
          <p
            className={`text-xs ${darkMode ? "text-[#D1D5DB]" : "text-[#555]"}`}
          >
            {user.role}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={`hidden lg:block shrink-0 transition-transform duration-200 ${mutedText} ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-14 z-30 w-72 rounded-2xl border shadow-lg overflow-hidden ${
            darkMode
              ? "bg-[#111827] border-[#374151]"
              : "bg-white border-[#E5E7EB]"
          }`}
        >
          <div
            className="px-4 py-4 flex items-center gap-3"
            style={{ background: ACCENT }}
          >
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <User size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">
                {user.name}
              </p>
              <p className="text-white/70 text-xs truncate">{user.role}</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {editing ? (
              <>
                {fields
                  .filter((f) => f.editable)
                  .map((f) => (
                    <div key={f.key}>
                      <label className={dropdownLabel}>{f.label}</label>
                      <input
                        value={(draft as any)[f.key] ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [f.key]: e.target.value,
                          } as UserProfile)
                        }
                        className={inputClasses}
                      />
                    </div>
                  ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={cancel}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-colors ${
                      darkMode
                        ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10"
                        : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    className="flex-1 h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                    style={{ background: ACCENT }}
                  >
                    <Check size={13} />
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                {fields
                  .filter((f) => f.showInSummary)
                  .map((f) => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={f.key}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Icon size={13} className={mutedText} />
                        <span
                          className={
                            darkMode ? "text-[#D1D5DB]" : "text-[#374151]"
                          }
                        >
                          {(user as any)[f.key]}
                        </span>
                      </div>
                    );
                  })}
                <button
                  onClick={startEdit}
                  className="w-full h-9 rounded-lg text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 mt-2 transition-opacity hover:opacity-90"
                  style={{ background: ACCENT }}
                >
                  <Pencil size={13} />
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
