import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { lastKnownCount,rememberRows,skeletonRows } from "@shared/loading/reservations";
import { ArrowLeft,ChevronLeft,Flame } from "lucide-react";
import { useRef,useState } from "react";
import { useNavigate,useParams } from "react-router-dom";
import EDJourneyIntro from "./components/EDJourneyIntro";
import LeaveQuizConfirm from "./components/LeaveQuizConfirm";
import LevelSelect,{ type BonusGame } from "./components/LevelSelect";
import MatchGame from "./components/MatchGame";
import MemoryGame from "./components/MemoryGame";
import PetSpeechBubble from "./components/PetSpeechBubble";
import QedPet,{ type PetState } from "./components/QedPet";
import QuestWorldBackground from "./components/QuestWorldBackground";
import {
AccomplishmentModal,
EndInterventionConfirm,
} from "./components/QuizModals";
import QuizRound from "./components/QuizRound";
import {
CHOICE_LABELS,
CORRECT_MESSAGES,
WRONG_MESSAGES,
buildChoiceOrders,
nextDifficulty,
pickRandom,
type AnswerFeedback,
type Choice,
type RoundMode,
} from "./components/QuizShared";
import { ConfettiBurst,HungerMeter } from "./components/QuizWidgets";
import RoundResult from "./components/RoundResult";
import PetQuizService,{
InterventionArchivedError,
type AnswerSubmission,
type BonusGames,
type Difficulty,
type InterventionState,
type QuizQuestion,
type SubmitResult,
} from "./service/petQuiz.service";

type ViewMode =
  | "loading"
  | "intro"
  | "difficulty"
  | "quiz"
  | "roundResult"
  | "bonusMatch"
  | "bonusMemory"
  | "archived";




function introSeenKey(studentId?: string, topicId?: string) {
  return `ed-intro-seen:${studentId ?? ""}:${topicId ?? ""}`;
}

function hasSeenIntro(studentId?: string, topicId?: string) {
  try {
    return localStorage.getItem(introSeenKey(studentId, topicId)) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen(studentId?: string, topicId?: string) {
  try {
    localStorage.setItem(introSeenKey(studentId, topicId), "1");
  } catch {
    // ignore — worst case the story replays on next load
  }
}

function usePetQuizPageState() {
  const { studentId, topicId } = useParams<{
    studentId: string;
    topicId: string;
  }>();
  const navigate = useNavigate();

  const [petVisualState, setPetVisualState] = useState<PetState>("idle");
  const [intervention, setIntervention] = useState<InterventionState | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);
  const [initialTarget] = useState(() => hasSeenIntro(studentId, topicId) ? "difficulty" : "intro");
  const [requestedBonus, setRequestedBonus] = useState<BonusGame>("match");
  const [view, setView] = useState<ViewMode>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);
  const [loadingLevel, setLoadingLevel] = useState<Difficulty | null>(null);
  const [showAccomplishment, setShowAccomplishment] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [practiceSetId, setPracticeSetId] = useState<number | null>(null);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [roundMode, setRoundMode] = useState<RoundMode>("full");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundAnswers, setRoundAnswers] = useState<AnswerSubmission[]>([]);
  const [roundResults, setRoundResults] = useState<(boolean | null)[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [choiceOrders, setChoiceOrders] = useState<Record<string, Choice[]>>(
    {},
  );

  const [firstRoundScore, setFirstRoundScore] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [lastWrongQuestions, setLastWrongQuestions] = useState<QuizQuestion[]>(
    [],
  );
  const [pendingCleared, setPendingCleared] = useState(false);

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);

  // Bonus game content from the server, loaded the first time a bonus game is opened.
  const [bonusGames, setBonusGames] = useState<BonusGames | null>(null);
  const [loadingBonus, setLoadingBonus] = useState(false);

  const awaitingRoundOutcomeRef = useRef(false);

  const interventionRef = useRef<InterventionState | null>(null);
  interventionRef.current = intervention;

  function restingPetState(): PetState {
    const s = interventionRef.current;
    return s && s.hungerFilled >= s.hungerTotal ? "happy" : "hungry";
  }

  const petWrapRef = useRef<HTMLDivElement>(null);

  async function scrollToPet() {
    const el = petWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (fullyVisible) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    await new Promise((r) => setTimeout(r, 450));
  }

  // If the server says the intervention is archived at ANY point
  // (quiz load, grading, submit, bonus games), switch to the archived screen.
  // Returns true when it handled the error.
  function handleArchivedError(err: unknown): boolean {
    if (err instanceof InterventionArchivedError) {
      setShowEndConfirm(false);
      setShowAccomplishment(false);
      setShowLeaveConfirm(false);
      setIsAnswering(false);
      setLoadingLevel(null);
      setLoadingBonus(false);
      setView("archived");
      return true;
    }
    return false;
  }

  async function startFullRound(chosenDifficulty: Difficulty) {
    if (!studentId || !topicId || loadingLevel) return;
    setDifficulty(chosenDifficulty);
    setQuizError(null);
    setLoadingLevel(chosenDifficulty);
    setPetVisualState("thinking");
    try {
      const quiz = await PetQuizService.getQuiz(
        studentId,
        topicId,
        chosenDifficulty,
      );
      setPracticeSetId(quiz.practiceSetId);
      setChoiceOrders(buildChoiceOrders(quiz.questions));
      setAllQuestions(quiz.questions);
      setActiveQuestions(quiz.questions);
      setRoundMode("full");
      setCurrentIndex(0);
      setRoundAnswers([]);
      setRoundResults(new Array(quiz.questions.length).fill(null));
      setFeedback(null);
      setFirstRoundScore(null);
      setStreak(0);
      setPendingCleared(false);
      awaitingRoundOutcomeRef.current = false;
      setPetVisualState(restingPetState());
      setView("quiz");
    } catch (err: any) {
      if (handleArchivedError(err)) return;
      console.error("Failed to load quiz:", err);
      setPetVisualState(restingPetState());
      setQuizError(
        `Couldn't load the ${chosenDifficulty} questions. Please try again in a moment.`,
      );
    } finally {
      setLoadingLevel(null);
    }
  }

  async function openBonus(game: BonusGame) {
    if (!studentId || !topicId || loadingBonus) return;
    setQuizError(null);
    setRequestedBonus(game);

    if (!bonusGames) {
      setLoadingBonus(true);
      setPetVisualState("thinking");
      try {
        const games = await PetQuizService.getBonusGames(studentId, topicId);
        setBonusGames(games);
      } catch (err) {
        if (handleArchivedError(err)) return;
        console.error("Failed to load bonus game:", err);
        setQuizError(
          "Couldn't load the bonus game. Please try again in a moment.",
        );
        setPetVisualState(restingPetState());
        setLoadingBonus(false);
        return;
      }
      setPetVisualState(restingPetState());
      setLoadingBonus(false);
    }

    setView(game === "match" ? "bonusMatch" : "bonusMemory");
  }

  // Saves a finished bonus game on the server so it fills one segment of the
  // meter and counts toward being allowed to end the intervention.
  async function finishBonus(game: BonusGame) {
    setView("difficulty");
    if (!studentId || !topicId) return;
    try {
      const result = await PetQuizService.completeBonus(
        studentId,
        topicId,
        game,
      );
      setIntervention((prev) =>
        prev
          ? {
              ...prev,
              hungerFilled: result.hungerFilled,
              hungerTotal: result.hungerTotal,
              bonus: result.bonus,
            }
          : prev,
      );
    } catch (err) {
      if (handleArchivedError(err)) return;
      console.error("Failed to save bonus progress:", err);
      setQuizError("Couldn't save your bonus progress. Please play it again.");
    }
  }

  function startRemedialRound(wrongOnes: QuizQuestion[]) {
    setChoiceOrders(buildChoiceOrders(wrongOnes));
    setActiveQuestions(wrongOnes);
    setRoundMode("remedial");
    setCurrentIndex(0);
    setRoundAnswers([]);
    setRoundResults(new Array(wrongOnes.length).fill(null));
    setFeedback(null);
    setPendingCleared(false);
    awaitingRoundOutcomeRef.current = false;
    setPetVisualState(restingPetState());
    setView("quiz");
  }

  async function handleAnswer(selected: Choice) {
    if (isAnswering || !studentId || !topicId || !practiceSetId) return;

    const question = activeQuestions[currentIndex];
    setIsAnswering(true);
    setPetVisualState("thinking");

    try {
      const graded = await PetQuizService.submitAnswer(
        studentId,
        topicId,
        practiceSetId,
        question.id,
        selected,
      );

      await scrollToPet();

      setFeedback({
        selected,
        correctAnswer: graded.correctAnswer,
        isCorrect: graded.isCorrect,
        explanation: graded.explanation,
      });
      setFeedbackMessage(
        pickRandom(graded.isCorrect ? CORRECT_MESSAGES : WRONG_MESSAGES),
      );
      setRoundAnswers((prev) => [
        ...prev,
        { questionId: question.id, selected },
      ]);
      setRoundResults((prev) => {
        const next = [...prev];
        next[currentIndex] = graded.isCorrect;
        return next;
      });

      setStreak((prev) => {
        const next = graded.isCorrect ? prev + 1 : 0;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });

      setPetVisualState(graded.isCorrect ? "eating" : "wrong");
    } catch (err) {
      if (handleArchivedError(err)) return;
      console.error("Failed to grade answer:", err);
      setPetVisualState(restingPetState());
      setIsAnswering(false);
    }
  }

  function handleSettled(next: PetState) {
    if (awaitingRoundOutcomeRef.current && next === "happy") {
      awaitingRoundOutcomeRef.current = false;
      if (pendingCleared) {
        setPetVisualState("levelup");
        return;
      }
    }
    setPetVisualState(next === "idle" ? restingPetState() : next);
  }

  async function goToNextQuestion() {
    const wasLastInRound = currentIndex + 1 >= activeQuestions.length;
    setFeedback(null);
    setIsAnswering(false);
    setPetVisualState(restingPetState());

    if (!wasLastInRound) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    if (roundMode === "full") {
      await finishFullRound();
    } else {
      await finishRemedialRound();
    }
  }

  async function finishFullRound() {
    if (!practiceSetId || !studentId || !topicId) return;
    setPetVisualState("thinking");
    try {
      const result = await PetQuizService.submitQuiz(
        studentId,
        topicId,
        practiceSetId,
        difficulty,
        roundAnswers,
      );

      setFirstRoundScore({ score: result.score, total: result.totalQuestions });

      const wrongIds = new Set(
        result.results.filter((r) => !r.isCorrect).map((r) => r.questionId),
      );
      const wrongOnes = allQuestions.filter((q) => wrongIds.has(q.id));
      setLastWrongQuestions(wrongOnes);
      setPendingCleared(result.fullyCleared);

      setIntervention((prev) =>
        prev
          ? {
              ...prev,
              hungerFilled: result.hungerFilled,
              hungerTotal: result.hungerTotal,
              levels: result.fullyCleared
                ? {
                    ...prev.levels,
                    [difficulty.toLowerCase()]: "completed",
                    ...(result.unlockedNext
                      ? { [result.unlockedNext.toLowerCase()]: "available" }
                      : {}),
                  }
                : prev.levels,
            }
          : prev,
      );

      awaitingRoundOutcomeRef.current = true;
      setPetVisualState("eating");
      setView("roundResult");
    } catch (err) {
      if (handleArchivedError(err)) return;
      console.error("Failed to submit quiz:", err);
      setPetVisualState(restingPetState());
    }
  }

  async function finishRemedialRound() {
    const wrongOnes = activeQuestions.filter(
      (_, i) => roundResults[i] === false,
    );
    const cleared = wrongOnes.length === 0;
    setLastWrongQuestions(wrongOnes);

    let serverResult: SubmitResult | null = null;
    if (cleared && practiceSetId && studentId && topicId) {
      setPetVisualState("thinking");
      try {
        serverResult = await PetQuizService.submitQuiz(
          studentId,
          topicId,
          practiceSetId,
          difficulty,
          roundAnswers,
          "remedial",
        );
      } catch (err) {
        if (handleArchivedError(err)) return;
        console.error("Failed to record the practice round:", err);
      }
    }

    setPendingCleared(cleared);

    const confirmed = serverResult ? serverResult.fullyCleared : true;
    if (cleared && confirmed) {
      const unlocked = serverResult
        ? serverResult.unlockedNext
        : nextDifficulty(difficulty);
      setIntervention((prev) =>
        prev
          ? {
              ...prev,
              hungerFilled: serverResult
                ? serverResult.hungerFilled
                : prev.hungerFilled,
              hungerTotal: serverResult
                ? serverResult.hungerTotal
                : prev.hungerTotal,
              levels: {
                ...prev.levels,
                [difficulty.toLowerCase()]: "completed",
                ...(unlocked ? { [unlocked.toLowerCase()]: "available" } : {}),
              },
            }
          : prev,
      );
    }

    awaitingRoundOutcomeRef.current = true;
    setPetVisualState("eating");
    setView("roundResult");
  }

  function handlePracticeMissed() {
    startRemedialRound(lastWrongQuestions);
  }

  function handleContinueToNext() {
    setView("difficulty");
  }

  function handleIntroContinue() {
    markIntroSeen(studentId, topicId);
    setView("difficulty");
  }
  
  function handleRequestLeaveQuiz() {
    setShowLeaveConfirm(true);
  }

  function handleConfirmLeaveQuiz() {
    setShowLeaveConfirm(false);
    setFeedback(null);
    setIsAnswering(false);
    setCurrentIndex(0);
    setRoundAnswers([]);
    setRoundResults([]);
    awaitingRoundOutcomeRef.current = false;
    setPetVisualState(restingPetState());
    setView("difficulty");
  }

  async function confirmEndIntervention() {
    if (!studentId || !topicId || isEnding) return;
    setIsEnding(true);
    setEndError(null);
    try {
      await PetQuizService.markTopicMastered(studentId, topicId);
      setIntervention((prev) =>
        prev ? { ...prev, interventionCompleted: true } : prev,
      );
      setShowEndConfirm(false);
      setShowAccomplishment(true);
    } catch (err) {
      console.error("Failed to archive intervention:", err);
      setShowEndConfirm(false);
      setEndError(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't end the intervention. Please try again.",
      );
    } finally {
      setIsEnding(false);
    }
  }

  function handleStopForNow() {
    navigate(-1);
  }
  function handleBackHeader() {
    navigate(-1);
  }

  function handleAccomplishmentContinue() {
    setShowAccomplishment(false);
    navigate(-1);
  }

  const isLastInRound = currentIndex + 1 >= activeQuestions.length;
  const nextDiff = nextDifficulty(difficulty);

  const currentQuestion = activeQuestions[currentIndex];
  const currentOrder: Choice[] =
    (currentQuestion && choiceOrders[String(currentQuestion.id)]) ||
    CHOICE_LABELS;
  const correctDisplayLetter: Choice = feedback
    ? (CHOICE_LABELS[currentOrder.indexOf(feedback.correctAnswer)] ??
      feedback.correctAnswer)
    : "A";
  const correctText =
    feedback && currentQuestion
      ? String(
          currentQuestion[
            `choice_${feedback.correctAnswer.toLowerCase()}` as keyof QuizQuestion
          ],
        )
      : "";

  const inGame =
    view !== "intro" &&
    view !== "loading" &&
    !loadingLevel &&
    !loadingBonus &&
    !!intervention;
  const showMeter = inGame && view !== "quiz";
  const showStreak = inGame && streak >= 3;

  const allStepsDone = intervention
    ? Object.values(intervention.levels).every(
        (status) => status === "completed",
      ) &&
      intervention.bonus.match &&
      intervention.bonus.memory
    : false;

  const gameView = `pet-quiz:${studentId}:${topicId}:${difficulty}`;
  const waiting = view === "loading" || !!loadingLevel || loadingBonus;
  function renderGameContent(pending: boolean) {
    const target = loadingLevel ? "quiz" : loadingBonus ? (requestedBonus === "match" ? "bonusMatch" : "bonusMemory") : view === "loading" ? initialTarget : view;
    if (target === "intro") return <EDJourneyIntro loading={pending} onContinue={handleIntroContinue} intervention={intervention ?? {levels:{easy:"locked",medium:"locked",hard:"locked"},bonus:{match:false,memory:false},hungerFilled:0,hungerTotal:0,interventionCompleted:false}} />;
    if (target === "difficulty") return (<LevelSelect
            loading={pending}
            levels={intervention?.levels ?? {easy:"locked",medium:"locked",hard:"locked"}}
            error={quizError}
            bonusDone={intervention?.bonus}
            onSelect={startFullRound}
            onSelectBonus={openBonus}
            onShowStory={() => setView("intro")}
            onEnd={() => {
              if (allStepsDone) {
                setEndError(null);
                setShowEndConfirm(true);
              } else {
                setEndError(
                  "Finish Easy, Medium, Hard, Matching and Memory before ending the intervention.",
                );
              }
            }}
          />);
    if (target === "quiz" && !pending && !activeQuestions.length) return null;
    if (target === "quiz") return <QuizRound loading={pending} viewKey={gameView} questions={activeQuestions} currentIndex={currentIndex} results={roundResults} roundMode={roundMode} difficulty={difficulty} choiceOrder={currentOrder} feedback={feedback} isAnswering={isAnswering} onAnswer={handleAnswer} />;
    if (target === "bonusMatch") return <MatchGame key="bonus-match" loading={pending} pairs={bonusGames?.match ?? Array.from({length:Math.min(lastKnownCount(gameView+":match",3),skeletonRows(gameView))},(_,id)=>({id,left:"",right:""}))} onDone={() => finishBonus("match")} />;
    if (target === "bonusMemory") return <MemoryGame key="bonus-memory" loading={pending} pairs={bonusGames?.memory ?? Array.from({length:Math.min(lastKnownCount(gameView+":memory",3),skeletonRows(gameView))},(_,id)=>({id,a:"",b:""}))} onDone={() => finishBonus("memory")} />;
    return null;
  }

  function renderGame(pending: boolean) { return <div className="flex w-full justify-center">{renderGameContent(pending)}</div>; }

  // Ended interventions are archived and can't be opened again.
  if (view === "archived") {
    return { content: ((
      <div className="p-4 text-center">
        <p className="text-sm text-gray-700">
          This intervention has been completed and archived, so it can no longer
          be accessed.
        </p>
        <button
          onClick={() => navigate(-1)} 
          className="mt-3 text-sm underline"
        >
          Go back
        </button>
      </div>
    )), scope: { studentId, topicId, setLoadError, setView, PetQuizService, setIntervention, setPetVisualState, InterventionArchivedError, hasSeenIntro, attempt } };
  }

  return { content: ((
    <div className="sk-surface-quiz relative isolate -m-4 flex min-h-[calc(100dvh-5.8125rem)] flex-col items-center gap-4 overflow-x-clip p-4 sm:-m-6 sm:p-6">
      <QuestWorldBackground />
      {view !== "quiz" && (
        <button
          type="button"
          onClick={handleBackHeader}
          aria-label="Back to Quest Board"
          className="flex items-center gap-1 self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm"
        >
          <ChevronLeft size={16} />
          Quest Board
        </button>
      )}
      {showEndConfirm && (
        <EndInterventionConfirm
          onConfirm={confirmEndIntervention}
          onCancel={() => setShowEndConfirm(false)}
          isEnding={isEnding}
        />
      )}
      {showAccomplishment && (
        <AccomplishmentModal onContinue={handleAccomplishmentContinue} />
      )}
      {showLeaveConfirm && (
        <LeaveQuizConfirm
          onConfirm={handleConfirmLeaveQuiz}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}

      {endError && (
        <p role="alert" className="text-sm text-red-600">
          {endError}
        </p>
      )}

      {view === "quiz" && !feedback && (
        <button
          type="button"
          onClick={handleRequestLeaveQuiz}
          disabled={isAnswering}
          aria-label="Leave the quiz"
          className="flex items-center gap-1 self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm disabled:opacity-50"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      )}

      {view !== "intro" &&
        (view !== "loading" || initialTarget === "difficulty") && (
          <div ref={petWrapRef} className="relative scroll-mt-4">
            <QedPet state={petVisualState} onSettled={handleSettled} />
            {feedback?.isCorrect && (
              <ConfettiBurst key={`${roundMode}-${currentIndex}`} />
            )}
          </div>
        )}

      {view === "quiz" && feedback && (
        <PetSpeechBubble
          key={`${roundMode}-${currentIndex}`}
          message={feedbackMessage}
          isCorrect={feedback.isCorrect}
          correctChoice={correctDisplayLetter}
          correctText={correctText}
          explanation={feedback.explanation}
          isLast={isLastInRound}
          onNext={goToNextQuestion}
        />
      )}

      {(showMeter || showStreak) && (
        <div className="flex flex-col items-center gap-2">
          {showMeter && intervention && (
            <>
              <HungerMeter
                filled={intervention.hungerFilled}
                total={intervention.hungerTotal}
              />
            </>
          )}
          {showStreak && (
            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 animate-pulse">
              <Flame size={14} />
              {streak} streak!
            </span>
          )}
        </div>
      )}

      {quizError ? <>{renderGame(false)}<button type="button" className="text-sm underline" onClick={() => requestedBonus && /bonus/.test(quizError) ? openBonus(requestedBonus) : startFullRound(difficulty)}>Retry</button></> : <LoadingRegion name="pet-quiz-content" loading={waiting} error={loadError} retry={() => setAttempt(value => value + 1)} variable className="w-full" skeleton={null} frame={renderGame} onSettled={() => { if (view === "quiz") rememberRows(gameView+":questions",activeQuestions.length); if (bonusGames) { rememberRows(gameView+":match",bonusGames.match.length); rememberRows(gameView+":memory",bonusGames.memory.length); } }}>{null}</LoadingRegion>}

      {view === "roundResult" && (
        <RoundResult
          firstRoundScore={firstRoundScore}
          roundMode={roundMode}
          bestStreak={bestStreak}
          cleared={pendingCleared}
          difficulty={difficulty}
          nextDiff={nextDiff}
          onContinue={handleContinueToNext}
          onPracticeMissed={handlePracticeMissed}
          onStop={handleStopForNow}
        />
      )}
    </div>
  )), scope: { studentId, topicId, setLoadError, setView, PetQuizService, setIntervention, setPetVisualState, InterventionArchivedError, hasSeenIntro, attempt } };
}


export type PetQuizPageEffectScope = ReturnType<typeof usePetQuizPageState>["scope"];
export type PetQuizPageRouteProps = Record<string, never>;
export function PetQuizPageComposition(props: object & { effects?: (scope: PetQuizPageEffectScope) => import("react").ReactNode }) {
 const state = usePetQuizPageState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
