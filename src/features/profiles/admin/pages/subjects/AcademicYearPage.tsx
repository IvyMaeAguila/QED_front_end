import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import type { AdminThemeContext } from "../AdminLayout";
import { AdminTopTabs } from "./components/AdminTopTabs";
import { AcademicYearCard } from "./components/AcademicYearCard";
import { TermsTable } from "./components/TermsTable";
import { EditAcademicYearModal } from "./components/EditAcademicYearModal";
import { EditTermDatesModal } from "./components/EditTermDatesModal";
import type { AcademicYear, SchoolYearStatus, Term } from "./types/academicyear";
import {
  fetchActiveAcademicYear,
  updateAcademicYear as updateAcademicYearRequest,
  fetchTerms,
  saveTerms as saveTermsRequest,
  type TermInput,
} from "./services/academicyear.service";

export function AcademicYearPage() {
  const theme = useOutletContext<AdminThemeContext>();
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = theme;

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

  async function saveAcademicYear(updates: {
    label: string;
    status: SchoolYearStatus;
  }) {
    if (!academicYear) return;
    setSavingYear(true);
    setYearError(null);
    try {
      const updated = await updateAcademicYearRequest(academicYear.id, updates);
      setAcademicYear(updated);
      setEditingYear(false);
    } catch (err) {
      console.error("Failed to update academic year:", err);
      setYearError(
        err instanceof Error ? err.message : "Failed to update academic year.",
      );
    } finally {
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

  return (
    <div className="space-y-6 pb-12">
      <AdminTopTabs
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />

      <div>
        <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
          Academic Year
        </h1>
        <p className={`text-sm font-semibold mt-1 ${textMuted}`}>
          Manage school years, grading periods, and term settings.
        </p>
      </div>

      {loading ? (
        <div className={`rounded-2xl border shadow-sm p-12 text-center ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textMuted}`}>Loading...</p>
        </div>
      ) : loadError || !academicYear ? (
        <div className={`rounded-2xl border shadow-sm p-12 text-center ${panelBg} ${panelBorder}`}>
          <p className="text-sm font-semibold text-red-500">
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