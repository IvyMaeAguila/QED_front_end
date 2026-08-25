// MockupFrame.tsx
import { MousePointer2 } from "lucide-react";

export type HighlightTarget =
  | "sidebar-1"
  | "sidebar-2"
  | "sidebar-3"
  | "main"
  | "panel-1"
  | "panel-2"
  | "form-connect"
  | "confirm-modal"
  | "student-fields"
  | "report-toolbar"
  | "report-download"
  | "profile-toolbar"
  | "profile-detail"
  | "profile-edit";

interface MockupFrameProps {
  highlight?: HighlightTarget;
  darkMode?: boolean;
}

export default function MockupFrame({
  highlight,
  darkMode = false,
}: MockupFrameProps) {
  const sidebarBg = darkMode ? "bg-[#7a1f1f]" : "bg-[#7a1f1f]";
  const surfaceBg = darkMode ? "bg-[#2a2a2a]" : "bg-gray-200";
  const frameBorder = darkMode ? "border-white/10" : "border-gray-300";
  const inputBg = darkMode
    ? "border-gray-600 bg-[#1a1a1a]"
    : "border-gray-300 bg-white";
  const topBarBg = darkMode ? "bg-[#2a2a2a]" : "bg-gray-300";
  const dividerBg = darkMode ? "bg-white/10" : "bg-gray-300";
  const modalBg = darkMode ? "bg-[#1a1a1a]" : "bg-white";
  const modalPlaceholder = darkMode ? "bg-white/10" : "bg-gray-200";
  const skeletonBg = darkMode ? "bg-white/15" : "bg-gray-300";

  const isHighlighted = (id: HighlightTarget) => highlight === id;
  const isStudentFields = highlight === "student-fields";
  const isReportToolbar = highlight === "report-toolbar";
  const isReportDownload = highlight === "report-download";
  const isProfileToolbar = highlight === "profile-toolbar";
  const isProfileDetail = highlight === "profile-detail";
  const isProfileEdit = highlight === "profile-edit";

  const badge = (letter: string) => (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
        darkMode
          ? "border-red-400 text-red-400 bg-[#1a1a1a]"
          : "border-red-600 text-red-600 bg-white"
      }`}
    >
      {letter}
    </span>
  );

  const sidebarItemClass = (id: HighlightTarget) =>
    `relative h-6 rounded-lg transition-all ${
      isHighlighted(id) ? "bg-white/35 ring-2 ring-white" : "bg-white/15"
    }`;

  const panelClass = (id: HighlightTarget, extra = "") =>
    `relative rounded-lg transition-all ${surfaceBg} ${extra} ${
      isHighlighted(id) ? "ring-2 ring-maroon-700 ring-offset-1" : ""
    } ${darkMode && isHighlighted(id) ? "ring-offset-[#0f0f0f]" : ""}`;

  const cursor = (
    <MousePointer2
      className="absolute -right-2 -bottom-2 h-5 w-5 fill-gray-900 text-white drop-shadow-md"
      strokeWidth={1.5}
    />
  );

  const smallCursor = (
    <MousePointer2
      className="absolute -right-1 -bottom-1 h-3 w-3 fill-gray-900 text-white drop-shadow-md"
      strokeWidth={1.5}
    />
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-xl border shadow-xl ${frameBorder}`}
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`flex w-1/4 flex-col gap-2.5 pt-4 px-2 ${sidebarBg}`}>
          {isStudentFields || isReportToolbar || isReportDownload || isProfileToolbar || isProfileDetail || isProfileEdit ? (
            <>
              <div className="h-6 rounded-lg bg-white/15" />
              <div className="relative h-6 rounded-lg bg-white/15">
                <span className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-400" />
              </div>
              <div className="h-6 rounded-lg bg-white/15" />
            </>
          ) : (
            <>
              <div className={sidebarItemClass("sidebar-1")} />
              <div className={sidebarItemClass("sidebar-2")}>
                {isHighlighted("sidebar-2") && cursor}
              </div>
              <div className={sidebarItemClass("sidebar-3")} />
            </>
          )}
        </div>

        {/* Right side: top bar + content */}
        <div className="flex flex-1 flex-col">
          {/* Top header bar */}
          <div className={`h-6 w-full shrink-0 ${topBarBg}`} />

          {/* Content */}
          <div
            className={`flex flex-1 items-center gap-3 p-3 ${
              darkMode ? "bg-[#1e1e1e]" : "bg-gray-100"
            }`}
          >
            {isProfileEdit ? (
              <div className="flex h-full w-full flex-col gap-2">
                {/* Hero banner with overlapping avatar badge */}
                <div className="relative mb-3 h-7 w-full shrink-0 rounded-lg bg-[#7a1f1f]">
                  <div
                    className={`absolute -bottom-2 left-2 h-6 w-6 rounded-lg border ${inputBg}`}
                  />
                </div>

                {/* Edit form card + side card */}
                <div className="flex flex-1 gap-2">
                  <div
                    className={`flex flex-[2] flex-col gap-2 rounded-lg border p-2 ${inputBg}`}
                  >

                    {/* Field rows: label + input, 2 columns x 3 rows */}
                    <div className="flex flex-col gap-1.5">
                      {[0, 1, 2].map((row) => (
                        <div key={row} className="flex gap-2">
                          <div className="flex flex-1 flex-col gap-0.5">
                            <div
                              className={`h-1 w-8 rounded-full ${surfaceBg}`}
                            />
                            <div
                              className={`h-2.5 w-full rounded border ${inputBg}`}
                            />
                          </div>
                          <div className="flex flex-1 flex-col gap-0.5">
                            <div
                              className={`h-1 w-8 rounded-full ${surfaceBg}`}
                            />
                            <div
                              className={`h-2.5 w-full rounded border ${inputBg}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom buttons: Cancel + Save Changes (cursor here) */}
                    <div className="mt-auto flex justify-end gap-1.5">
                      <div className={`h-3.5 w-8 rounded-md border ${inputBg}`} />
                      <div className="relative h-3.5 w-14 rounded-md ring-2 ring-white bg-[#7a1f1f]">
                        {smallCursor}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border p-2 ${inputBg}`}
                  >
                    <div className={`h-1.5 w-14 rounded-full ${surfaceBg}`} />
                  </div>
                </div>
              </div>
            ) : isProfileDetail ? (
              <div className="flex h-full w-full flex-col gap-2">
                {/* Tab row: 4 segments, last one active */}
                <div className="flex gap-1.5">
                  <div className={`h-4 flex-1 rounded-md ${surfaceBg}`} />
                  <div className={`h-4 flex-1 rounded-md ${surfaceBg}`} />
                  <div className={`h-4 flex-1 rounded-md ${surfaceBg}`} />
                  <div className={`h-4 flex-1 rounded-md border ${inputBg}`} />
                </div>

                {/* Hero banner with overlapping avatar badge */}
                <div className="relative mb-3 h-10 w-full shrink-0 rounded-lg bg-[#7a1f1f]">
                  <div
                    className={`absolute -bottom-2 left-2 h-7 w-7 rounded-lg border ${inputBg}`}
                  />
                </div>

                {/* Two cards: personal info (with Edit + cursor) and side card */}
                <div className="flex flex-1 gap-2">
                  <div
                    className={`flex flex-[2] flex-col gap-2 rounded-lg border p-2 ${inputBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`h-1.5 w-14 rounded-full ${surfaceBg}`} />
                      <div
                        className={`relative h-4 w-9 rounded-md border ring-2 ring-[#711111] ${inputBg}`}
                      >
                        {smallCursor}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-1 flex-col gap-1">
                        <div
                          className={`h-1 w-8 rounded-full ${surfaceBg}`}
                        />
                        <div
                          className={`h-1.5 w-14 rounded-full ${surfaceBg}`}
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <div
                          className={`h-1 w-8 rounded-full ${surfaceBg}`}
                        />
                        <div
                          className={`h-1.5 w-14 rounded-full ${surfaceBg}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border p-2 ${inputBg}`}
                  >
                    <div className={`h-1.5 w-14 rounded-full ${surfaceBg}`} />
                  </div>
                </div>
              </div>
            ) : isProfileToolbar ? (
              <div className="flex w-full flex-col gap-3">
                {/* Toolbar row: 4 segments, cursor on the 4th (last) */}
                <div className="flex gap-2">
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                  <div
                    className={`relative h-5 flex-1 rounded-md border ring-2 ring-[#711111] ${inputBg}`}
                  >
                    {smallCursor}
                  </div>
                </div>

                {/* Skeleton bar */}
                <div className={`h-5 w-full rounded-md ${surfaceBg}`} />

                {/* Big content panel */}
                <div className={`h-20 w-full rounded-lg ${surfaceBg}`} />
              </div>
            ) : isReportDownload ? (
              <div className="flex w-full flex-col gap-3">
                {/* Toolbar row: 4 plain segments */}
                <div className="flex gap-2">
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                </div>

                {/* Right-aligned download button, with cursor */}
                <div className="flex justify-end">
                  <div className="relative h-5 w-18 rounded-md ring-2 ring-white bg-[#7a1f1f]">
                    {smallCursor}
                  </div>
                </div>

                {/* Skeleton bar */}
                <div className={`h-5 w-full rounded-md ${surfaceBg}`} />

                {/* Big content panel */}
                <div className={`h-20 w-full rounded-lg ${surfaceBg}`} />
              </div>
            ) : isReportToolbar ? (
              <div className="flex w-full flex-col gap-3">
                {/* Toolbar row: 4 segments, cursor on the 3rd */}
                <div className="flex gap-2">
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                  <div
                    className={`relative h-5 flex-1 rounded-md border ring-2 ring-[#711111] ${inputBg}`}
                  >
                    {smallCursor}
                  </div>
                  <div className={`h-5 flex-1 rounded-md border ${inputBg}`} />
                </div>

                {/* Skeleton bar */}
                <div className={`h-5 w-full rounded-md ${surfaceBg}`} />

                {/* Big content panel */}
                <div className={`h-20 w-full rounded-lg ${surfaceBg}`} />
              </div>
            ) : isStudentFields ? (
              <>
                {/* Left: two stacked labeled inputs */}
                <div className="flex w-2/5 flex-col gap-3">
                  <div
                    className={`relative flex h-9 items-center gap-2 rounded-md border px-2 ring-2 ring-[#711111] ${inputBg}`}
                  >
                    {badge("J")}
                    {cursor}
                  </div>
                  <div
                    className={`flex h-9 items-center gap-2 rounded-md border px-2 ${inputBg}`}
                  >
                    {badge("A")}
                  </div>
                </div>

                {/* Divider */}
                <div className={`h-16 w-px ${dividerBg}`} />

                {/* Right: skeleton bars, last one solid maroon */}
                <div className="flex flex-1 flex-col gap-3">
                  <div className={`h-3 w-full rounded-full ${skeletonBg}`} />
                  <div className="flex gap-2">
                    <div
                      className={`h-3 flex-[1.2] rounded-full ${skeletonBg}`}
                    />
                    <div className={`h-3 flex-1 rounded-full ${skeletonBg}`} />
                  </div>
                  <div className="h-4 w-full rounded-full bg-[#7a1f1f]" />
                </div>
              </>
            ) : isHighlighted("form-connect") || isHighlighted("confirm-modal") ? (
              <>
                <div className="flex-1" />
                <div className={`h-20 w-px ${dividerBg}`} />
                <div className="flex w-2/5 flex-col gap-1.5">
                  <div className={`h-6 rounded-md border ${inputBg}`} />
                  <div className="flex gap-1.5">
                    <div className={`h-6 flex-1 rounded-md border ${inputBg}`} />
                    <div className={`h-6 flex-1 rounded-md border ${inputBg}`} />
                  </div>
                  <div
                    className={`relative h-7 rounded-md bg-[#7a1f1f] ${
                      isHighlighted("form-connect")
                        ? "ring-2 ring-white"
                        : ""
                    }`}
                  >
                    {isHighlighted("form-connect") && cursor}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={panelClass("main", "h-20 flex-[2]")}>
                  {isHighlighted("main") && cursor}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className={panelClass("panel-1", "h-9")}>
                    {isHighlighted("panel-1") && cursor}
                  </div>
                  <div className={panelClass("panel-2", "h-9")}>
                    {isHighlighted("panel-2") && cursor}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal overlay */}
      {isHighlighted("confirm-modal") && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`flex w-2/5 flex-col gap-2 rounded-lg p-3 shadow-2xl ${modalBg}`}
          >
            <div className={`h-10 rounded-md ${modalPlaceholder}`} />
            <div className="flex gap-1.5">
              <div className={`h-6 flex-1 rounded-md border ${inputBg}`} />
              <div className={`h-6 flex-1 rounded-md border ${inputBg}`} />
            </div>
            <div className="mt-1 flex gap-1.5">
              <div className={`h-6 flex-1 rounded-md border`} />
              <div className="relative h-6 flex-1 rounded-md ring-2 ring-white bg-[#711111]">
                {cursor}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}