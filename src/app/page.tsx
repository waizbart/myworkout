"use client";

import { useState, useEffect, useCallback } from "react";
import workoutData from "@/data/workouts.json";

interface LogEntry {
  date: string;
  weight: string;
  reps: string;
  notes: string;
}

interface ExerciseLogs {
  [exerciseId: string]: LogEntry[];
}

const STORAGE_KEY = "myworkout-logs";

function loadLogs(): ExerciseLogs {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLogs(logs: ExerciseLogs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function getTodayStr(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function Home() {
  const [logs, setLogs] = useState<ExerciseLogs>({});
  const [activeWorkout, setActiveWorkout] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [formWeight, setFormWeight] = useState("");
  const [formReps, setFormReps] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState(getTodayStr());

  useEffect(() => {
    setLogs(loadLogs());
    setMounted(true);
  }, []);

  const persistLogs = useCallback((newLogs: ExerciseLogs) => {
    setLogs(newLogs);
    saveLogs(newLogs);
  }, []);

  const addEntry = (exerciseId: string) => {
    if (!formWeight && !formReps && !formNotes) return;
    const entry: LogEntry = {
      date: formDate,
      weight: formWeight,
      reps: formReps,
      notes: formNotes,
    };
    const current = logs[exerciseId] || [];
    const newLogs = { ...logs, [exerciseId]: [entry, ...current] };
    persistLogs(newLogs);
    setFormWeight("");
    setFormReps("");
    setFormNotes("");
  };

  const deleteEntry = (exerciseId: string, index: number) => {
    const current = [...(logs[exerciseId] || [])];
    current.splice(index, 1);
    const newLogs = { ...logs, [exerciseId]: current };
    persistLogs(newLogs);
  };

  const toggleExercise = (id: string) => {
    if (expandedExercise === id) {
      setExpandedExercise(null);
    } else {
      setExpandedExercise(id);
      setFormWeight("");
      setFormReps("");
      setFormNotes("");
      setFormDate(getTodayStr());
    }
  };

  const getLastWeight = (exerciseId: string): string | null => {
    const entries = logs[exerciseId];
    if (!entries || entries.length === 0) return null;
    return entries[0].weight || null;
  };

  const workout = workoutData.workouts[activeWorkout];

  const exportData = () => {
    const text = JSON.stringify(logs, null, 2);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myworkout-logs-${getTodayStr()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          persistLogs(data);
        } catch {
          alert("Arquivo inválido");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur-sm z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">MyWorkout</h1>
          <p className="text-xs text-white/40 mt-0.5">{workoutData.program.focus}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Workout Tabs */}
        <div className="flex gap-2 mb-6">
          {workoutData.workouts.map((w, i) => (
            <button
              key={w.id}
              onClick={() => {
                setActiveWorkout(i);
                setExpandedExercise(null);
              }}
              className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-all ${
                activeWorkout === i
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              <span className="block text-xs opacity-60">{w.day}</span>
              <span className="block">{w.name}</span>
            </button>
          ))}
        </div>

        {/* Exercises */}
        <div className="space-y-2">
          {workout.exercises.map((ex, idx) => {
            const isExpanded = expandedExercise === ex.id;
            const lastWeight = getLastWeight(ex.id);
            const entryCount = (logs[ex.id] || []).length;

            return (
              <div
                key={ex.id}
                className={`border rounded-lg transition-all ${
                  isExpanded
                    ? "border-white/20 bg-white/[0.03]"
                    : "border-white/[0.08] hover:border-white/15"
                }`}
              >
                {/* Exercise Header */}
                <button
                  onClick={() => toggleExercise(ex.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3"
                >
                  <span className="text-xs text-white/25 font-mono w-5 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{ex.name}</span>
                      <span className="text-xs text-white/30">{ex.sets}</span>
                    </div>
                    {ex.obs && (
                      <p className="text-xs text-white/30 mt-0.5">{ex.obs}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {lastWeight && (
                      <span className="text-xs text-white/50 font-mono">
                        {lastWeight}kg
                      </span>
                    )}
                    {entryCount > 0 && (
                      <span className="text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded">
                        {entryCount}
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-white/30 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.08]">
                    {/* Add Entry Form */}
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/70 focus:outline-none focus:border-white/30 w-[130px]"
                        />
                        <input
                          type="number"
                          placeholder="Peso (kg)"
                          value={formWeight}
                          onChange={(e) => setFormWeight(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 flex-1"
                        />
                        <input
                          type="text"
                          placeholder="Reps"
                          value={formReps}
                          onChange={(e) => setFormReps(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 w-[70px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Observações..."
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addEntry(ex.id);
                          }}
                          className="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 flex-1"
                        />
                        <button
                          onClick={() => addEntry(ex.id)}
                          className="bg-white text-black text-xs font-medium px-4 py-1.5 rounded hover:bg-white/90 transition-colors shrink-0"
                        >
                          Registrar
                        </button>
                      </div>
                    </div>

                    {/* History */}
                    {(logs[ex.id] || []).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
                          Histórico
                        </h4>
                        <div className="space-y-1">
                          {(logs[ex.id] || []).map((entry, i) => (
                            <div
                              key={`${entry.date}-${i}`}
                              className="flex items-center gap-2 text-xs group"
                            >
                              <span className="text-white/30 font-mono w-[72px] shrink-0">
                                {formatDate(entry.date)}
                              </span>
                              {entry.weight && (
                                <span className="text-white/70 font-medium">
                                  {entry.weight}kg
                                </span>
                              )}
                              {entry.reps && (
                                <span className="text-white/40">
                                  {entry.reps} reps
                                </span>
                              )}
                              {entry.notes && (
                                <span className="text-white/30 truncate flex-1">
                                  — {entry.notes}
                                </span>
                              )}
                              <button
                                onClick={() => deleteEntry(ex.id, i)}
                                className="text-transparent group-hover:text-white/30 hover:!text-red-400 transition-colors ml-auto shrink-0"
                                title="Remover"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Periodization */}
        <div className="mt-8 border border-white/[0.08] rounded-lg p-4">
          <h3 className="text-xs uppercase tracking-wider text-white/25 mb-3">
            Periodização (8 semanas)
          </h3>
          <div className="space-y-2">
            {workoutData.periodization.map((p) => (
              <div key={p.weeks} className="flex gap-3 text-xs">
                <span className="text-white/50 font-mono shrink-0 w-12">
                  Sem {p.weeks}
                </span>
                <span className="text-white/40">{p.focus}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Principles */}
        <div className="mt-4 border border-white/[0.08] rounded-lg p-4">
          <h3 className="text-xs uppercase tracking-wider text-white/25 mb-3">
            Princípios
          </h3>
          <div className="space-y-1.5">
            {workoutData.program.principles.map((p, i) => (
              <p key={i} className="text-xs text-white/35">
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Export/Import */}
        <div className="mt-6 flex gap-2 justify-center pb-8">
          <button
            onClick={exportData}
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors px-3 py-1.5 border border-white/[0.08] rounded hover:border-white/15"
          >
            Exportar dados
          </button>
          <button
            onClick={importData}
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors px-3 py-1.5 border border-white/[0.08] rounded hover:border-white/15"
          >
            Importar dados
          </button>
        </div>
      </main>
    </div>
  );
}
