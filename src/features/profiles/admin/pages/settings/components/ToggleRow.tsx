interface ToggleRowProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  checked: boolean;
  onChange: () => void;
  darkMode: boolean;
}

export function ToggleRow({ icon: Icon, label, checked, onChange, darkMode }: ToggleRowProps) {
  return (
    <button
      onClick={onChange}
      className={`w-full h-10 px-3 rounded-xl border flex items-center justify-between transition-colors ${
        darkMode ? "border-[#374151] hover:bg-white/5" : "border-[#E5E7EB] hover:bg-[#F6F7FB]"
      }`}
    >
      <span
        className={`text-xs font-bold inline-flex items-center gap-2 ${darkMode ? "text-white" : "text-[#111827]"}`}
      >
        <Icon size={15} />
        {label}
      </span>
      <span
        className={`w-9 h-5 rounded-full relative transition-colors ${checked ? "bg-[#6B0000]" : "bg-[#D1D5DB]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}