"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layouts/main-layout";
import { mcqApi, MCQ } from "@/lib/api-modules";
import { Button } from "@/components/ui/button";
import {
  Loader2, CheckCircle2, XCircle, ArrowRight, HelpCircle,
  ShieldAlert, AlertTriangle, Eye, EyeOff, Maximize
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =============================================
// 🛡️ ANTI-CHEAT STRIKE SYSTEM
// =============================================
const MAX_STRIKES = 3;

const STRIKE_MESSAGES = [
  {
    title: "⚠️ Warning: Tab Switch Detected!",
    description: "Switching tabs or windows during the exam is not allowed. This incident has been recorded.",
    level: "warning" as const,
  },
  {
    title: "🚨 FINAL WARNING: Tab Switch Detected!",
    description: "This is your LAST warning. Your exam will be auto-submitted and terminated if you switch tabs again.",
    level: "critical" as const,
  },
  {
    title: "🚫 Session Terminated",
    description: "You have exceeded the maximum number of tab switches. Your session has been automatically terminated for violation of exam integrity rules.",
    level: "terminated" as const,
  },
];

function MCQSessionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const lang = params.get("lang");
  const difficulty = params.get("difficulty");

  // --- MCQ STATE ---
  const [loading, setLoading] = useState(true);
  const [mcq, setMCQ] = useState<MCQ | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // --- ANTI-CHEAT STATE ---
  const [strikes, setStrikes] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [currentWarning, setCurrentWarning] = useState(STRIKE_MESSAGES[0]);
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [tabSwitchLog, setTabSwitchLog] = useState<string[]>([]);

  // Refs to access latest state inside event listeners
  const strikesRef = useRef(0);
  const sessionTerminatedRef = useRef(false);
  const sessionStartedRef = useRef(false);

  // --- ANTI-CHEAT: HANDLE TAB SWITCH ---
  // Cooldown ref to prevent double-counting (visibilitychange + blur fire together)
  const lastStrikeTimeRef = useRef(0);

  const handleTabSwitch = useCallback(() => {
    if (sessionTerminatedRef.current || !sessionStartedRef.current) return;

    // Debounce: ignore if last strike was less than 1 second ago
    const now = Date.now();
    if (now - lastStrikeTimeRef.current < 1000) return;
    lastStrikeTimeRef.current = now;

    const currentStrikes = strikesRef.current + 1;
    strikesRef.current = currentStrikes;
    setStrikes(currentStrikes);

    // Log the incident
    const timestamp = new Date().toLocaleTimeString();
    setTabSwitchLog((prev) => [...prev, `Strike ${currentStrikes} at ${timestamp}`]);

    if (currentStrikes >= MAX_STRIKES) {
      // TERMINATE SESSION
      setCurrentWarning(STRIKE_MESSAGES[2]);
      setShowWarningModal(true);
      setSessionTerminated(true);
      sessionTerminatedRef.current = true;
      toast.error("Session terminated due to multiple tab switches!");
    } else {
      // SHOW WARNING
      setCurrentWarning(STRIKE_MESSAGES[currentStrikes - 1]);
      setShowWarningModal(true);
      toast.warning(`Strike ${currentStrikes}/${MAX_STRIKES}: Tab switch detected!`);
    }
  }, []);

  // --- ANTI-CHEAT: SETUP EVENT LISTENERS ---
  useEffect(() => {
    if (!sessionStarted) return;

    // 1. Page Visibility API (detects tab switches & minimizing)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitch();
      }
    };

    // 2. Window Blur (detects clicking outside the browser)
    const handleWindowBlur = () => {
      setTimeout(() => {
        if (document.hidden || !document.hasFocus()) {
          handleTabSwitch();
        }
      }, 100);
    };

    // 3. Block keyboard shortcuts that can open new tabs/windows
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "t" || e.key === "n" || e.key === "w")) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Opening new tabs/windows is not allowed during the exam!");
      }
      if (e.key === "F5") {
        e.preventDefault();
        toast.warning("Page refresh is not allowed during the exam!");
      }
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
      }
    };

    // 4. Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning("Right-click is disabled during the exam!");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [sessionStarted, handleTabSwitch]);

  // --- FULLSCREEN HELPERS ---
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }
  };

  // Detect fullscreen exit — counts as a strike!
  useEffect(() => {
    if (!sessionStarted) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && sessionStartedRef.current && !sessionTerminatedRef.current) {
        handleTabSwitch();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [sessionStarted, handleTabSwitch]);

  // --- START SESSION ---
  const handleStartSession = () => {
    setSessionStarted(true);
    sessionStartedRef.current = true;
    enterFullscreen();
    if (lang && difficulty) fetchNextMCQ();
  };

  // --- MCQ LOGIC ---
  const fetchNextMCQ = async () => {
    try {
      setLoading(true);
      const data = await mcqApi.getMCQs({ language: lang!, difficulty: difficulty!, limit: 20 });
      const available = (data.mcqs || []).filter((q: MCQ) => !seenIds.includes(q._id));

      if (available.length === 0) {
        setMCQ(null);
        return;
      }
      const next = available[Math.floor(Math.random() * available.length)];
      setMCQ(next);
      setSeenIds((prev) => [...prev, next._id]);
      setSelectedAnswer(null);
      setSubmitted(false);
      setResult(null);
    } catch (err) {
      toast.error("Failed to load MCQ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || !mcq) return;
    try {
      const res = await mcqApi.submitAnswer({ mcqId: mcq._id, answer: selectedAnswer });
      setSubmitted(true);
      setResult(res);
      if (res.isCorrect) toast.success("Correct Answer!");
      else toast.error("Incorrect Answer");
    } catch (e) {
      toast.error("Submission failed");
    }
  };

  const handleEndSession = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    router.push("/practice");
  };

  // =============================================
  // 🎨 RENDER: PRE-SESSION START SCREEN
  // =============================================
  if (!sessionStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 max-w-lg mx-auto">
        <div className="p-5 bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-3xl border border-amber-500/30">
          <ShieldAlert className="h-16 w-16 text-amber-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Exam Mode</h1>
          <p className="text-zinc-400 leading-relaxed">
            This session will be monitored for academic integrity. The following rules apply:
          </p>
        </div>

        <div className="w-full space-y-3 text-left">
          {[
            { icon: EyeOff, text: "Tab switching is monitored and will trigger warnings" },
            { icon: Maximize, text: "The exam will run in fullscreen mode" },
            { icon: AlertTriangle, text: `After ${MAX_STRIKES} tab switches, your session will be auto-terminated` },
            { icon: ShieldAlert, text: "Right-click and keyboard shortcuts are disabled" },
          ].map((rule, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <rule.icon className="h-5 w-5 text-amber-500 shrink-0" />
              <span className="text-sm text-zinc-300">{rule.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full pt-4">
          <Button
            onClick={handleStartSession}
            className="bg-emerald-500 hover:bg-emerald-600 text-white h-14 text-lg rounded-xl font-bold shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] w-full"
          >
            <Eye className="h-5 w-5 mr-2" />
            I Agree — Start Exam
          </Button>
          <Button
            onClick={() => router.push("/practice")}
            className="bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700 w-full h-12 text-base rounded-xl font-medium"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // =============================================
  // 🎨 RENDER: SESSION TERMINATED
  // =============================================
  if (sessionTerminated && !showWarningModal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="p-6 bg-red-500/10 rounded-full border border-red-500/30">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-red-500">Session Terminated</h2>
        <p className="text-zinc-400 max-w-md">
          Your MCQ session was terminated due to repeated tab switching violations.
          This incident has been recorded.
        </p>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-left w-full max-w-sm">
          <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Violation Log</h4>
          {tabSwitchLog.map((log, i) => (
            <p key={i} className="text-xs text-red-400 font-mono">{log}</p>
          ))}
        </div>
        <Button onClick={handleEndSession} className="bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700 h-12 px-8 text-base rounded-xl font-medium">
          Return to Practice
        </Button>
      </div>
    );
  }

  // =============================================
  // 🎨 RENDER: MAIN MCQ SESSION
  // =============================================
  if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;

  if (!mcq) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
      <div className="p-6 bg-zinc-900 rounded-full border border-zinc-800"><CheckCircle2 className="h-12 w-12 text-emerald-500" /></div>
      <h2 className="text-2xl font-bold text-white">Session Complete!</h2>
      <p className="text-zinc-400">You{"'"}ve answered all available questions.</p>
      <Button onClick={handleEndSession} className="bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700 h-12 px-8 text-base rounded-xl font-medium">Back to Practice</Button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 relative">

      {/* 🛡️ ANTI-CHEAT WARNING MODAL OVERLAY */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={cn(
            "max-w-md w-full mx-4 rounded-2xl border-2 p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300",
            currentWarning.level === "warning" ? "bg-zinc-900 border-amber-500/50" :
            currentWarning.level === "critical" ? "bg-zinc-900 border-red-500" :
            "bg-zinc-950 border-red-600"
          )}>
            <div className={cn(
              "mx-auto p-4 rounded-full w-fit",
              currentWarning.level === "warning" ? "bg-amber-500/10" :
              "bg-red-500/10"
            )}>
              {currentWarning.level === "terminated" ? (
                <XCircle className="h-12 w-12 text-red-500" />
              ) : (
                <AlertTriangle className={cn("h-12 w-12", currentWarning.level === "warning" ? "text-amber-500" : "text-red-500")} />
              )}
            </div>

            <div>
              <h2 className={cn(
                "text-xl font-bold mb-2",
                currentWarning.level === "warning" ? "text-amber-500" : "text-red-500"
              )}>
                {currentWarning.title}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{currentWarning.description}</p>
            </div>

            {/* Strike Counter */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: MAX_STRIKES }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    i < strikes ? "bg-red-500 scale-110" : "bg-zinc-700"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-600">
              {strikes}/{MAX_STRIKES} strikes used
            </p>

            {currentWarning.level === "terminated" ? (
              <Button
                onClick={() => { setShowWarningModal(false); }}
                className="bg-red-600 hover:bg-red-700 text-white w-full h-12 text-base rounded-xl font-bold"
              >
                I Understand
              </Button>
            ) : (
              <Button
                onClick={() => { setShowWarningModal(false); enterFullscreen(); }}
                className={cn("w-full h-12 text-base rounded-xl font-bold",
                  currentWarning.level === "warning"
                    ? "bg-amber-500 hover:bg-amber-600 text-black"
                    : "bg-red-600 hover:bg-red-700 text-white"
                )}
              >
                Return to Exam
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Strike Indicator Bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-full px-4 py-2 backdrop-blur-md shadow-lg">
        <ShieldAlert className={cn("h-4 w-4", strikes > 0 ? "text-red-500" : "text-emerald-500")} />
        <span className="text-xs font-bold text-zinc-400">
          Strikes: <span className={cn(strikes > 0 ? "text-red-400" : "text-emerald-400")}>{strikes}</span>/{MAX_STRIKES}
        </span>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold uppercase">{lang}</span>
          <span className={cn("px-3 py-1 rounded-full bg-zinc-800 text-xs font-bold uppercase",
            difficulty === 'easy' ? 'text-emerald-400' : difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'
          )}>{difficulty}</span>
        </div>
        <span className="text-zinc-500 text-sm font-mono">Q.{seenIds.length}</span>
      </div>

      {/* Question Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 mb-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-8">{mcq.question}</h2>

        <div className="space-y-3">
          {mcq.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            let stateClass = "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-zinc-600";

            if (submitted && result) {
              const correctIdx = typeof result.correctAnswer === 'string' ? parseInt(result.correctAnswer) : result.correctAnswer;
              if (idx === correctIdx) stateClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
              else if (isSelected && !result.isCorrect) stateClass = "border-red-500 bg-red-500/10 text-red-400";
              else stateClass = "border-zinc-800 opacity-50";
            } else if (isSelected) {
              stateClass = "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500";
            }

            return (
              <div
                key={idx}
                onClick={() => !submitted && setSelectedAnswer(idx)}
                className={cn(
                  "relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  stateClass
                )}
              >
                <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold mr-4 transition-colors",
                  isSelected ? "border-emerald-500 bg-emerald-500 text-black" : "border-zinc-700 bg-zinc-900 text-zinc-500"
                )}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-base">{option}</span>

                {submitted && result && idx === (typeof result.correctAnswer === 'string' ? parseInt(result.correctAnswer) : result.correctAnswer) && (
                  <CheckCircle2 className="absolute right-4 h-5 w-5 text-emerald-500" />
                )}
                {submitted && result && isSelected && !result.isCorrect && (
                  <XCircle className="absolute right-4 h-5 w-5 text-red-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-4">
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="bg-emerald-500 hover:bg-emerald-600 text-white h-12 px-8 text-base rounded-xl font-bold shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] transition-all hover:scale-105"
          >
            Check Answer
          </Button>
        ) : (
          <Button
            onClick={fetchNextMCQ}
            className="bg-zinc-100 hover:bg-white text-zinc-900 h-12 px-8 text-base rounded-xl font-bold transition-all hover:scale-105"
          >
            Next Question <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Explanation */}
      {submitted && result?.explanation && (
        <div className="mt-8 animate-in fade-in slide-in-from-top-4">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold uppercase text-xs tracking-wider">
              <HelpCircle className="h-4 w-4" /> Explanation
            </div>
            <p className="text-zinc-300 leading-relaxed">{result.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MCQSessionPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}>
        <MCQSessionContent />
      </Suspense>
    </MainLayout>
  );
}