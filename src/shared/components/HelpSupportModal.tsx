import { Mail, Phone, MessageCircleQuestion, BookOpen, LifeBuoy } from "lucide-react";
import { ModalBody, ModalFrame, ModalHeader } from "./modal";


interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How do I add or edit a student record?",
    answer:
      "Go to Student Records from the sidebar, then use Add Student or select an existing student to edit their details.",
  },
  {
    question: "How do I change the current school year?",
    answer:
      "Open Settings (top right) and click the pencil icon next to Current School Year to type in a new value.",
  },
  {
    question: "How do I create or manage classes?",
    answer: "Go to Classes from the sidebar to create sections, assign teachers, and manage class rosters.",
  },
  {
    question: "Who can I contact for technical issues?",
    answer: "Reach out through the contact details below and our support team will get back to you.",
  },
];

interface HelpSupportModalProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export function HelpSupportModal({ open, onClose, darkMode }: HelpSupportModalProps) {
  if (!open) return null;

  const mutedText = darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]";
  const cardBg = darkMode ? "bg-[#0B1120] border-[#374151]" : "bg-[#F8FAFC] border-[#E5E7EB]";
  const sectionLabel = `text-xs font-bold uppercase tracking-wide mb-2 ${mutedText}`;

  return (
    <ModalFrame
      shellVariant={darkMode ? "dark" : "standard"}
      open={open}
      onClose={onClose}
      size="md"
      zIndexClass="z-60"
      ariaLabel="Help and Support"
      className="max-h-[85vh]"
    >
        <ModalHeader
          title="Help & Support"
          onClose={onClose}
          closeDarkMode={darkMode}
          className="items-center border-b-0 px-4 py-3"
          leading={<LifeBuoy size={16} />}
        />

        <ModalBody className="space-y-5 p-4">
          <div>
            <p className={`${sectionLabel} flex items-center gap-1.5`}>
              <MessageCircleQuestion size={12} />
              Frequently Asked Questions
            </p>
            <div className="space-y-2">
              {FAQS.map((faq) => (
                <div key={faq.question} className={`rounded-lg border p-3 ${cardBg}`}>
                  <p className={`text-xs font-bold mb-1 ${darkMode ? "text-white" : "text-[#111827]"}`}>
                    {faq.question}
                  </p>
                  <p className={`text-xs leading-relaxed ${mutedText}`}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className={sectionLabel}>Contact Support</p>
            <div className={`rounded-lg border p-3 space-y-2.5 ${cardBg}`}>
              <a
                href="mailto:support@qed.edu.ph"
                className={`flex items-center gap-2.5 text-xs font-semibold hover:text-[#6B0000] transition-colors ${
                  darkMode ? "text-white" : "text-[#111827]"
                }`}
              >
                <Mail size={14} className="shrink-0 text-[#6B0000]" />
                support@qed.edu.ph
              </a>
              <a
                href="tel:+639171234567"
                className={`flex items-center gap-2.5 text-xs font-semibold hover:text-[#6B0000] transition-colors ${
                  darkMode ? "text-white" : "text-[#111827]"
                }`}
              >
                <Phone size={14} className="shrink-0 text-[#6B0000]" />
                +63 917 123 4567
              </a>
              <p className={`text-xs pt-1 ${mutedText}`}>
                Support hours: Monday&ndash;Friday, 8:00 AM&ndash;5:00 PM
              </p>
            </div>
          </div>

          <div>
            <p className={`${sectionLabel} flex items-center gap-1.5`}>
              <BookOpen size={12} />
              Resources
            </p>
            <div className={`rounded-lg border p-3 ${cardBg}`}>
              <p className={`text-xs leading-relaxed ${mutedText}`}>
                QED follows the MATATAG curriculum framework. For curriculum guides and admin
                training materials, contact your system administrator or the support team above.
              </p>
            </div>
          </div>
        </ModalBody>
    </ModalFrame>
  );
}
