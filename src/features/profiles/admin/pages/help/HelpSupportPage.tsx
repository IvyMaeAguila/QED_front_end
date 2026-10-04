import { BookOpen, ChevronDown, LifeBuoy, Mail, MessageCircleQuestion, Phone } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../../pages/AdminLayout";

export type HelpAudience = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";

interface HelpSupportPageProps {
  audience?: HelpAudience;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: Record<HelpAudience, FaqItem[]> = {
  ADMIN: [
    {
      question: "How do I add or update a student record?",
      answer: "Open Student Records, choose Add Student to create a record, or open an existing student and select Edit.",
    },
    {
      question: "How do I create a class and assign its adviser?",
      answer: "Open Classes and choose Add Class. Set the grade, section, adviser, and schedule, then review the details before saving.",
    },
    {
      question: "How do I add a subject or assign a teacher?",
      answer: "Open Academics to add a subject. To change an existing subject assignment, edit that subject and select the assigned teacher.",
    },
    {
      question: "Who can help with account or system issues?",
      answer: "Contact the support team using the email address or phone number below. Include the page and account role where the issue occurred.",
    },
  ],
  PRINCIPAL: [
    {
      question: "Where can I review school performance?",
      answer: "Open Reports to view school analytics and holistic performance summaries. Use the gradebook pages to review submitted class grades.",
    },
    {
      question: "How do I find a student or class roster?",
      answer: "Open Students, then choose a grade or class to view its roster and student records.",
    },
    {
      question: "How do I check a teacher’s schedule?",
      answer: "Open Teachers, select a teacher, and review the schedule and assigned classes shown on their profile.",
    },
    {
      question: "Who can help with access or data issues?",
      answer: "Contact the support team below and include the report, grade, or teacher record involved so the issue can be routed quickly.",
    },
  ],
  TEACHER: [
    {
      question: "How do I mark or update attendance?",
      answer: "Open Attendance, select your class and date, then mark each student. Attendance changes save as you make them.",
    },
    {
      question: "Where do I enter grades?",
      answer: "Open Grades or My Subjects, choose the class and subject, then enter grades in the relevant grading period.",
    },
    {
      question: "How do I view my class roster?",
      answer: "Open My Subjects for a subject roster, or use your advisory roster for the students assigned to your advisory class.",
    },
    {
      question: "Who can help if a class or student is missing?",
      answer: "Contact your school administrator first. For technical issues, contact the support team below and include the class and student details.",
    },
  ],
  PARENT: [
    {
      question: "How do I link my child to my account?",
      answer: "Open Enrolled Children and choose Link Student. Enter the requested student details and follow the verification steps.",
    },
    {
      question: "Where can I view my child’s attendance and grades?",
      answer: "Open your child’s profile from the dashboard or Enrolled Children. Attendance, grades, and progress are available in the profile sections.",
    },
    {
      question: "How do I open learning support activities?",
      answer: "From your child’s academic progress, open a flagged topic and choose the available support activity or courseware.",
    },
    {
      question: "What if I cannot link or find my child?",
      answer: "Check that the student details match the school record. If the issue continues, contact the school or support team below for help verifying the record.",
    },
  ],
};

const PAGE_COPY: Record<HelpAudience, { title: string; description: string; resource: string }> = {
  ADMIN: {
    title: "Administrator help",
    description: "Guidance for managing school records, users, classes, and academics.",
    resource: "Use the admin sections to maintain school records and account access. For curriculum or policy questions, coordinate with your school leadership team.",
  },
  PRINCIPAL: {
    title: "Principal help",
    description: "Guidance for reviewing school data, class rosters, schedules, and performance.",
    resource: "Reports, gradebooks, student rosters, and teacher schedules are available from the main menu. Contact an administrator if a record or class assignment needs correction.",
  },
  TEACHER: {
    title: "Teacher help",
    description: "Quick guidance for attendance, grades, subject rosters, and student progress.",
    resource: "Attendance, Grades, My Subjects, and Holistic are available from the main menu. Contact your administrator if a class assignment or student record needs correction.",
  },
  PARENT: {
    title: "Parent help",
    description: "Find help linking your child and viewing their school progress.",
    resource: "Use the dashboard and Enrolled Children to open your child’s school information. Contact the school if you need help confirming or updating student details.",
  },
};

export function HelpSupportPage({ audience = "ADMIN" }: HelpSupportPageProps) {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const pageCopy = PAGE_COPY[audience];
  const cardBg = darkMode ? "bg-[#0B1120] border-[#374151]" : "bg-[#F8FAFC] border-[#E5E7EB]";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <header>
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Help &amp; Support</h1>
          <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>{pageCopy.description}</p>
        </div>
      </header>

      <section className={`rounded-[12px] border p-4 sm:p-6 ${panelBg} ${panelBorder}`}>
        <h2 className={`mb-4 flex items-center gap-2 text-sm font-bold ${textPrimary}`}>
          <MessageCircleQuestion size={17} className="text-[#8B0D0D]" />
          Frequently asked questions
        </h2>
        <div className="space-y-2">
          {FAQS[audience].map((faq) => (
            <details key={faq.question} className={`group rounded-[10px] border ${cardBg}`}>
              <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden ${textPrimary}`}>
                {faq.question}
                <ChevronDown size={16} className={`shrink-0 transition-transform group-open:rotate-180 ${textMuted}`} />
              </summary>
              <p className={`px-4 pb-4 text-sm leading-relaxed ${textMuted}`}>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`rounded-[12px] border p-4 sm:p-6 ${panelBg} ${panelBorder}`}>
          <h2 className={`mb-4 flex items-center gap-2 text-sm font-bold ${textPrimary}`}>
            <LifeBuoy size={17} className="text-[#8B0D0D]" />
            Contact support
          </h2>
          <div className={`space-y-3 rounded-[10px] border p-4 ${cardBg}`}>
            <a href="mailto:support@qed.edu.ph" className={`flex items-center gap-3 text-sm font-semibold transition-colors hover:text-[#8B0D0D] ${textPrimary}`}>
              <Mail size={16} className="shrink-0 text-[#8B0D0D]" />
              support@qed.edu.ph
            </a>
            <a href="tel:+639171234567" className={`flex items-center gap-3 text-sm font-semibold transition-colors hover:text-[#8B0D0D] ${textPrimary}`}>
              <Phone size={16} className="shrink-0 text-[#8B0D0D]" />
              +63 917 123 4567
            </a>
            <p className={`border-t pt-3 text-xs ${panelBorder} ${textMuted}`}>
              Support hours: Monday–Friday, 8:00 AM–5:00 PM
            </p>
          </div>
        </section>

        <section className={`rounded-[12px] border p-4 sm:p-6 ${panelBg} ${panelBorder}`}>
          <h2 className={`mb-4 flex items-center gap-2 text-sm font-bold ${textPrimary}`}>
            <BookOpen size={17} className="text-[#8B0D0D]" />
            {pageCopy.title}
          </h2>
          <div className={`rounded-[10px] border p-4 ${cardBg}`}>
            <p className={`text-sm leading-relaxed ${textMuted}`}>{pageCopy.resource}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
