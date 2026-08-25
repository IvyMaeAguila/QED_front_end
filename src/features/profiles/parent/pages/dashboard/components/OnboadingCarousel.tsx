// OnboardingCarousel.tsx
import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import MockupFrame, { type HighlightTarget } from "./MockUpFrame";

interface Step {
  label: string;
  title: string;
  desc: string;
  highlight: HighlightTarget;
}

interface Page {
  heading: string;
  description: string;
  steps: Step[];
}

interface OnboardingCarouselProps {
  darkMode?: boolean;
  onClose?: () => void;
}

// Autoplay: how long each PAGE stays up before auto-sliding to the next one.
// Only pages auto-advance (Link Student -> Download Progress Report -> Edit
// Student Information -> loops back) — steps within a page don't auto-play.
const AUTOPLAY_INTERVAL_MS = 6000;

const pages: Page[] = [
  {
    heading: "Link Student",
    description:
      "Link your child to monitor their academic progress, holistic development, and attendance.",
    steps: [
      {
        label: "Step 1 of 3",
        title: "Open the Enrolled Children",
        desc: 'Click the "Enrolled Children" from the side bar',
        highlight: "sidebar-2",
      },
      {
        label: "Step 2 of 3",
        title: "Input Student Information",
        desc: "Input the student ID, last name, and first name into the required fields, then select Connect Student to link the account.",
        highlight: "form-connect",
      },
      {
        label: "Step 3 of 3",
        title: "Verify Student",
        desc: "Verify your student's information. If the details match, click Yes, this is correct. If they do not match, click Not my child.",
        highlight: "confirm-modal",
      },
    ],
  },
  {
    heading: "Download Progress Report",
    description:
      "Export a detailed PDF summary of acdemic and holistic development.",
    steps: [
      {
        label: "Step 1 of 4",
        title: "Open the Enrolled Children",
        desc: "Click the Enrolled Children from the side bar",
        highlight: "sidebar-2",
      },
      {
        label: "Step 2 of 4",
        title: "Choose Student",
        desc: "Select a stdent from the list to download their progress report",
        highlight: "student-fields",
      },
      {
        label: "Step 3 of 4",
        title: "Open Progress Report",
        desc: "Navigate to Progress Report at the top navigation bar to view the summary.",
        highlight: "report-toolbar",
      },
      {
        label: "Step 4 of 4",
        title: "Click Download",
        desc: "Click the Download button below the top navigation bar to save the student's progress report as a PDF.",
        highlight: "report-download",
      }
    ],
  },
  {
    heading: "Edit Student Information",
    description: "Update your child's personal information.",
    steps: [
      {
        label: "Step 1 of 5",
        title: "Open the Enrolled Children",
        desc: "Click the Enrolled Children from the side bar",
        highlight: "sidebar-2",
      },
      {
        label: "Step 2 of 5",
        title: "Choose Student",
        desc: "Select a stdent from the list to edit their personal information",
        highlight: "student-fields",
      },
      {
        label: "Step 3 of 5",
        title: "Open Student Profile",
        desc: "Navigate to Student profile at the top navigation bar to view the summary.",
        highlight: "profile-toolbar",
      },
      {
        label: "Step 4 of 5",
        title: "Click Edit",
        desc: "Click Edit to update the student's personal information and records.",
        highlight: "profile-detail",
      },
      {
        label: "Step 5 of 5",
        title: "Save Changes",
        desc: "Click Save Changes to apply and update the student's modified information.",
        highlight: "profile-edit",
      }
    ],
  },
];

export default function OnboardingCarousel({
  darkMode = false,
  onClose,
}: OnboardingCarouselProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const page = pages[pageIndex];
  const step = page.steps[stepIndex];
  const isLastStep = stepIndex === page.steps.length - 1;
  const isLastPage = pageIndex === pages.length - 1;

  const goNext = () => {
    if (!isLastStep) {
      setStepIndex((i) => i + 1);
    } else if (!isLastPage) {
      setPageIndex((i) => i + 1);
      setStepIndex(0);
    } else {
      onClose?.();
    }
  };

  const goToPage = (i: number) => {
    setPageIndex(i);
    setStepIndex(0);
  };

  // Auto-slide the pages (Link Student -> Download Progress Report -> Edit
  // Student Information -> back to Link Student), looping forever. Pauses
  // while the user is hovering the widget or has the "..." menu open so it
  // doesn't yank the page out from under them mid-read.
  useEffect(() => {
    if (hidden || menuOpen || isPaused) return;

    const id = setInterval(() => {
      setPageIndex((i) => (i + 1) % pages.length);
      setStepIndex(0);
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(id);
  }, [hidden, menuOpen, isPaused]);

  const handleHide = () => {
    setMenuOpen(false);
    setHidden(true);
    onClose?.();
  };

  if (hidden) return null;

  const outerBg = darkMode ? "bg-[#0f0f0f]" : "bg-gray-200";
  const panelBg = darkMode ? "bg-[#1a1a1a]" : "bg-white";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-500";
  const badgeText = darkMode ? "text-gray-300" : "text-gray-700";
  const dividerBorder = darkMode ? "border-white/10" : "border-gray-200";
  const menuIconColor = darkMode ? "text-gray-300" : "text-gray-600";
  const menuIconHover = darkMode ? "hover:bg-white/10" : "hover:bg-black/5";
  const menuBg = darkMode ? "bg-[#1a1a1a]" : "bg-white";
  const menuHover = darkMode ? "hover:bg-white/10" : "hover:bg-gray-100";
  const menuBorder = darkMode ? "border-white/10" : "border-gray-200";

  return (
    // max-w-3xl + mx-auto: pumipigil sa buong widget na sumobra kalapad sa ultra-wide screens
    <div
      className={` rounded-2xl p-3 shadow-card ${outerBg}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Menu row — lives directly on the gray background, above the white panel */}
      <div className="relative mb-2 flex justify-end px-1">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={`flex h-1 w-7 items-center justify-center rounded-md transition-colors ${menuIconColor} ${menuIconHover}`}
          aria-label="Carousel options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div
            className={`absolute top-8 right-1 z-10 w-32 overflow-hidden rounded-lg border shadow-lg ${menuBg} ${menuBorder}`}
          >
            <button
              onClick={handleHide}
              className={`block w-full px-3 py-2 text-left text-xs font-medium ${textPrimary} ${menuHover}`}
            >
              Hide
            </button>
          </div>
        )}
      </div>

      {/* White/panel card */}
      <div className={`rounded-xl2 p-6 ${panelBg}`}>
        {/* relative wrapper: lets the mockup float bigger on the right,
            overlapping from the header all the way down past the step content.
            min-h-[...] keeps the card the SAME height across pages/steps even
            though heading/description/step-desc lengths differ (3 vs 4 vs 5
            step pages). Adjust the px values if content still clips/overflows
            on the longest step. */}
        <div className="relative">
          {/* Left column: header + step content. Reserves space on the right
              (md:pr-*) so text never sits underneath the oversized mockup */}
          <div className="md:pr-[44%]">
            {/* Top: page heading + description, full width.
                line-clamp-2 + min-h-[2.5rem] pins the description block to
                exactly 2 lines of space (text-sm leading-snug ≈ 1.2rem/line)
                whether the copy is 1 line or wraps to 2 — no wasted space,
                no jump between pages. */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>
                  {page.heading}
                </h3>
                <p
                  className={`mt-1.5 line-clamp-2 min-h-[2.5rem] max-w-md text-sm leading-snug ${textMuted}`}
                >
                  {page.description}
                </p>
              </div>

              <div
                className={`shrink-0 pt-1 text-xs font-semibold ${badgeText}`}
              >
                {step.label}
              </div>
            </div>

            <div className={`mt-5 border-t pt-5 ${dividerBorder}`}>
              {/* current step title + desc. line-clamp-3 + min-h-[3.6rem]
                  on the desc keeps this block the same height regardless of
                  how short/long the step copy is (same math as above, 3 lines). */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#711111] text-[10px] font-bold text-white">
                    {stepIndex + 1}
                  </span>
                  <p className={`text-base font-bold ${textPrimary}`}>
                    {step.title}
                  </p>
                </div>
                <p className={`mt-2 line-clamp-3 min-h-[3.6rem] text-sm leading-snug ${textMuted}`}>
                  {step.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Right: mockup — enlarged & overlapping. On mobile it's shown
              smaller, centered, and slightly taller (aspect-[4/3]) below
              the text; from md+ it's pinned absolute and spans the full
              height of the header + step-content block. */}
          <div className="mt-5 flex justify-center md:mt-0 md:block md:absolute md:right-0 md:top-0 md:bottom-0 md:w-[40%]">
            <div className="aspect-[4/3] w-full max-w-[280px] sm:aspect-[16/10] sm:max-w-[340px] md:max-w-none md:w-full md:aspect-auto md:h-full">
              <MockupFrame highlight={step.highlight} darkMode={darkMode} />
            </div>
          </div>
        </div>

        {/* Bottom row: step dots (left) + Next button (right) */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {page.steps.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === stepIndex
                    ? "bg-[#711111]"
                    : darkMode
                      ? "bg-white/20"
                      : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            className="rounded-lg bg-[#711111] px-5 py-2 text-xs font-semibold text-white hover:bg-maroon-800"
          >
            {isLastStep && isLastPage ? "Done" : "Next"}
          </button>
        </div>
      </div>

      {/* Outer page progress bar */}
      <div className="flex gap-1.5 px-1 pt-3">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => goToPage(i)}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i === pageIndex
                ? "bg-[#711111]"
                : darkMode
                  ? "bg-white/15"
                  : "bg-gray-300"
            }`}
            aria-label={`Go to page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}