import { useEffect } from "react";
import { PetQuizPageComposition,type PetQuizPageEffectScope } from "./PetQuizPage.loading-view";
export * from "./PetQuizPage.loading-view";

function PetQuizPageDataEffects({ scope }: { scope: PetQuizPageEffectScope }) {
 const { studentId, topicId, setLoadError, setView, PetQuizService, setIntervention, setPetVisualState, InterventionArchivedError, hasSeenIntro, attempt } = scope;
 useEffect(() => {
    if (!studentId || !topicId) {
      setLoadError("Missing student or topic in the URL.");
      return;
    }
    let cancelled = false;
    setLoadError(null); setView("loading");

    async function init() {
      try {
        const state = await PetQuizService.getInterventionState(studentId!, topicId!);
        if (cancelled) return;
        setIntervention(state);

        // Already ended/archived: never show the intro or the quiz.
        if (state.interventionCompleted) {
          setView("archived");
          return;
        }

        setPetVisualState(
          state.hungerFilled < state.hungerTotal ? "hungry" : "idle",
        );
      } catch (err) {
        if (err instanceof InterventionArchivedError) {
          if (!cancelled) setView("archived");
          return;
        }
        console.error("Failed to load intervention state:", err);
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load intervention state.");
        return;
      }
      if (cancelled) return;
      setView(hasSeenIntro(studentId, topicId) ? "difficulty" : "intro");
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [studentId, topicId, attempt]);
 return null;
}

export default function PetQuizPage() {
 return <PetQuizPageComposition effects={scope => <PetQuizPageDataEffects scope={scope}/>} />;
}
