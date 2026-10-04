import { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { AdminThemeContext } from "../AdminLayout";
import { AcademicYearCard } from "./components/AcademicYearCard";
import { TermsTable } from "./components/TermsTable";
import { EditAcademicYearModal } from "./components/EditAcademicYearModal";
import { EditTermDatesModal } from "./components/EditTermDatesModal";
import type { AcademicYear, SchoolYearStatus, Term } from "./types/academicyear";
import {
  fetchActiveAcademicYear,
  addAcademicYear,
  fetchTerms,
  saveTerms as saveTermsRequest,
  type TermInput,
} from "./services/academicyear.service";

export function AcademicYearPage() {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;
  const navigate = useNavigate();

  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingYear, setEditingYear] = useState(false);
  const [editingTerms, setEditingTerms] = useState(false);

  const [savingYear, setSavingYear] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);

  const [savingTerms, setSavingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const loadAcademicYear = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const year = await fetchActiveAcademicYear();
      setAcademicYear(year);
      const yearTerms = await fetchTerms(year.id);
      setTerms(yearTerms);
    } catch (err) {
      console.error("Failed to load academic year:", err);
      setLoadError(
        err instanceof Error ? err.message : "Failed to load academic year.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAcademicYear();
  }, [loadAcademicYear]);

  async function saveAcademicYear(newYear: {
    label: string;
    status: SchoolYearStatus;
  }) {
    setSavingYear(true);
    setYearError(null);
    try {
      await addAcademicYear(newYear);
      // Full page reload so the new year, its freshly-seeded terms,
      // and every dependent badge/status all reflect the fresh DB state.
      window.location.reload();
    } catch (err) {
      console.error("Failed to add academic year:", err);
      setYearError(
        err instanceof Error ? err.message : "Failed to add academic year.",
      );
      setSavingYear(false);
    }
  }

  async function saveTermDates(updatedTerms: TermInput[]) {
    if (!academicYear) return;
    setSavingTerms(true);
    setTermsError(null);
    try {
      const saved = await saveTermsRequest(academicYear.id, updatedTerms);
      setTerms(saved);
      setEditingTerms(false);
      const refreshedYear = await fetchActiveAcademicYear();
      setAcademicYear(refreshedYear);
    } catch (err) {
      console.error("Failed to save term dates:", err);
      setTermsError(
        err instanceof Error ? err.message : "Failed to save term dates.",
      );
    } finally {
      setSavingTerms(false);
    }
  }

  // ── Shared design tokens (same as StudentFormPage) ──
  const stateCardClasses = `rounded-[12px] border shadow-xs p-12 text-center transition-all ${panelBg} ${panelBorder}`;

  return (
    <div className="w-full min-h-full space-y-6 pb-12">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/subjects")}
            aria-label="Go back to academics"
            className="system-back-button"
          >
            <ArrowLeft />
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
              Academic Year
            </h1>
            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
              Manage school years, grading periods, and term settings.
            </p>
          </div>
        </div>

      </div>

      {loading ? (
        <div className={stateCardClasses}>
          <p className={`text-sm font-semibold ${textMuted}`}>Loading...</p>
        </div>
      ) : loadError || !academicYear ? (
        <div className={stateCardClasses}>
          <p className="text-sm font-semibold text-[#B91C1C]">
            {loadError ?? "No active academic year found."}
          </p>
        </div>
      ) : (
        <>
          <AcademicYearCard
            academicYear={academicYear}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            onEdit={() => setEditingYear(true)}
          />

          <TermsTable
            terms={terms}
            darkMode={darkMode}
            panelBg={panelBg}
            panelBorder={panelBorder}
            textPrimary={textPrimary}
            textMuted={textMuted}
            onEdit={() => setEditingTerms(true)}
          />

          {editingYear && (
            <EditAcademicYearModal
              academicYear={academicYear}
              darkMode={darkMode}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              onClose={() => {
                setEditingYear(false);
                setYearError(null);
              }}
              onSave={saveAcademicYear}
              saving={savingYear}
              error={yearError}
            />
          )}

          {editingTerms && (
            <EditTermDatesModal
              terms={terms}
              darkMode={darkMode}
              panelBg={panelBg}
              panelBorder={panelBorder}
              textPrimary={textPrimary}
              textMuted={textMuted}
              onClose={() => {
                setEditingTerms(false);
                setTermsError(null);
              }}
              onSave={saveTermDates}
              saving={savingTerms}
              error={termsError}
            />
          )}
        </>
      )}
    </div>
  );
}
