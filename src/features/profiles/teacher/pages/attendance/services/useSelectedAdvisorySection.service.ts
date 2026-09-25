import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchAdvisorySections, type AdvisorySection } from "./attendance.service";

export function useSelectedAdvisorySection() {
  const [sections, setSections] = useState<AdvisorySection[] | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    fetchAdvisorySections()
      .then((secs) => {
        if (cancelled) return;
        setSections(secs.length > 0 ? secs : null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load advisory sections:", err);
        setError("Couldn't load your advisory classes. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestedId = searchParams.get("classId");
  const section =
    sections === undefined || sections === null
      ? sections
      : sections.find((s) => s.classId === requestedId) ?? sections[0]; // Section 1 default

  function selectSection(classId: string) {
    const next = new URLSearchParams(searchParams);
    next.set("classId", classId);
    setSearchParams(next, { replace: true });
  }

  return { sections, section, error, selectSection };
}