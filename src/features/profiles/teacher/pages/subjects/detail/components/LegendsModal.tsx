import { HOLISTIC_LEVELS } from "../types/Grading";
import { ModalBody, ModalFrame, ModalHeader } from "@shared/components/modal";

interface LegendsModalProps {
  onClose: () => void;
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
}

export function LegendsModal({ onClose, darkMode, panelBorder, textPrimary }: LegendsModalProps) {
  return (
    <ModalFrame shellVariant={darkMode ? "dark" : "standard"} onClose={onClose} size="narrow" ariaLabel="Rating Legend">
        <ModalHeader
          title="Rating Legend"
          titleClassName={textPrimary}
          onClose={onClose}
          closeDarkMode={darkMode}
          className=""
        />

        <ModalBody className={`space-y-2 divide-y p-4 ${panelBorder}`}>
          {HOLISTIC_LEVELS.slice()
            .reverse()
            .map((level) => (
              <div key={level.value} className="flex items-center gap-3 pt-2 first:pt-0">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ background: level.color }}
                >
                  {level.value}
                </span>
                <span className={`font-bold text-sm ${textPrimary}`}>{level.label}</span>
              </div>
            ))}
        </ModalBody>
    </ModalFrame>
  );
}
