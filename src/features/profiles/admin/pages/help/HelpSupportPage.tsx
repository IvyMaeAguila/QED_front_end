import { useOutletContext } from "react-router-dom";
import { Mail, Phone, MessageCircleQuestion, BookOpen, LifeBuoy } from "lucide-react";
import type { AdminThemeContext } from "../shared/AdminLayout";

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

export function HelpSupportPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();

  const sectionLabel = `text-[10px] font-bold uppercase tracking-wide mb-2 ${textMuted}`;
  const cardBg = darkMode ? "bg-[#0B1120] border-[#374151]" : "bg-[#F8FAFC] border-[#E5E7EB]";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-xl font-bold flex items-center gap-2 ${textPrimary}`}>
          <LifeBuoy size={20} className="text-[#6B0000]" />
          Help &amp; Support
        </h1>
        <p className={`text-sm mt-1 ${textMuted}`}>
          Answers to common questions and ways to reach the support team.
        </p>
      </div>

      {/* FAQ */}
      <div className={`rounded-2xl border p-5 ${panelBg} ${panelBorder}`}>
        <p className={`${sectionLabel} flex items-center gap-1.5`}>
          <MessageCircleQuestion size={12} />
          Frequently Asked Questions
        </p>
        <div className="space-y-2">
          {FAQS.map((faq) => (
            <div key={faq.question} className={`rounded-lg border p-3 ${cardBg}`}>
              <p className={`text-xs font-bold mb-1 ${textPrimary}`}>{faq.question}</p>
              <p className={`text-xs leading-relaxed ${textMuted}`}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className={`rounded-2xl border p-5 ${panelBg} ${panelBorder}`}>
        <p className={sectionLabel}>Contact Support</p>
        <div className={`rounded-lg border p-3 space-y-2.5 ${cardBg}`}>
          <a
            href="mailto:support@qed.edu.ph"
            className={`flex items-center gap-2.5 text-xs font-semibold hover:text-[#6B0000] transition-colors ${textPrimary}`}
          >
            <Mail size={14} className="shrink-0 text-[#6B0000]" />
            support@qed.edu.ph
          </a>
          <a
            href="tel:+639171234567"
            className={`flex items-center gap-2.5 text-xs font-semibold hover:text-[#6B0000] transition-colors ${textPrimary}`}
          >
            <Phone size={14} className="shrink-0 text-[#6B0000]" />
            +63 917 123 4567
          </a>
          <p className={`text-[11px] pt-1 ${textMuted}`}>
            Support hours: Monday&ndash;Friday, 8:00 AM&ndash;5:00 PM
          </p>
        </div>
      </div>

      {/* Resources */}
      <div className={`rounded-2xl border p-5 ${panelBg} ${panelBorder}`}>
        <p className={`${sectionLabel} flex items-center gap-1.5`}>
          <BookOpen size={12} />
          Resources
        </p>
        <div className={`rounded-lg border p-3 ${cardBg}`}>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            QED follows the MATATAG curriculum framework. For curriculum guides and admin training
            materials, contact your system administrator or the support team above.
          </p>
        </div>
      </div>
    </div>
  );
}