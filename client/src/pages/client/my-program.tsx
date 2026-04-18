import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Pause, RotateCcw, CheckCircle2, Dumbbell, Timer, Calendar, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ClientProgram, Program, Workout, WorkoutLog } from "@shared/schema";
import { format, addDays, startOfWeek } from "date-fns";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const TYPE_COLORS: Record<string, string> = {
  traditional: "badge-traditional", wod: "badge-wod",
  emom: "badge-emom", amrap: "badge-amrap", tabata: "badge-tabata",
};
const TYPE_LABELS: Record<string, string> = {
  traditional: "Traditional", wod: "WOD", emom: "EMOM", amrap: "AMRAP", tabata: "Tabata",
};

export default function MyProgramPage() {
  const { user } = useAuth();
  const { data: assignment } = useQuery<ClientProgram | null>({
    queryKey: ["/api/client-programs", user?.id, "active"],
    queryFn: async () => { const r = await fetch(`/api/client-programs/${user?.id}/active`); return r.json(); }
  });
  const { data: program } = useQuery<Program>({
    queryKey: ["/api/programs", assignment?.programId],
    enabled: !!assignment?.programId
  });
  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ["/api/workouts", assignment?.programId],
    queryFn: async () => { const r = await fetch(`/api/workouts?programId=${assignment?.programId}`); return r.json(); },
    enabled: !!assignment?.programId
  });
  const { data: logs = [] } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/workout-logs", user?.id],
    queryFn: async () => { const r = await fetch(`/api/workout-logs/${user?.id}`); return r.json(); }
  });

  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const today = new Date();
  const todayDay = today.getDay(); // 0-5

  if (!assignment || !program) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-24">
        <Dumbbell className="h-16 w-16 mx-auto mb-6 text-muted-foreground/20" />
        <h2 className="text-xl font-bold mb-2">No Active Program</h2>
        <p className="text-muted-foreground">Your coach hasn't assigned a program yet. Check back soon or send them a message.</p>
      </div>
    );
  }

  const completedIds = new Set(logs.map(l => l.workoutId));
  const todayWorkouts = workouts.filter(w => w.dayOfWeek === todayDay);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Program header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{program.name}</p>
          <h1 className="text-2xl font-bold">This Week</h1>
          <p className="text-muted-foreground text-sm">{program.durationWeeks} week program · Started {format(new Date(assignment.startDate), "MMM d")}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{logs.length}</div>
          <div className="text-xs text-muted-foreground">sessions done</div>
        </div>
      </div>

      {/* Today highlight */}
      {todayWorkouts.length > 0 && (
        <div className="border-l-4 border-primary pl-4 py-1">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Today · {format(today, "EEEE, MMM d")}</p>
          <div className="space-y-2">
            {todayWorkouts.map(w => (
              <div key={w.id} className="flex items-center gap-3">
                <span className="font-semibold">{w.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${TYPE_COLORS[w.type]}`}>{TYPE_LABELS[w.type]}</span>
                {completedIds.has(w.id) && <Badge variant="secondary" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />Done</Badge>}
                <Button size="sm" onClick={() => setSelectedWorkout(w)} data-testid={`start-workout-${w.id}`} className="ml-auto">
                  {completedIds.has(w.id) ? "View" : "Start"} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week schedule */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {DAYS.map((day, di) => {
          const dayWorkouts = workouts.filter(w => w.dayOfWeek === di);
          const isToday = di === todayDay;
          return (
            <div key={day} className={`rounded-lg border p-3 space-y-2 ${isToday ? "border-primary bg-primary/5" : ""}`}>
              <div className={`text-xs font-bold uppercase tracking-wider text-center ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</div>
              {dayWorkouts.length === 0 ? (
                <div className="text-center text-[10px] text-muted-foreground/50 py-2">Rest</div>
              ) : dayWorkouts.map(w => (
                <button key={w.id} onClick={() => setSelectedWorkout(w)} className="w-full text-left" data-testid={`day-workout-${w.id}`}>
                  <div className={`p-2 rounded-md transition-colors hover:bg-muted ${completedIds.has(w.id) ? "opacity-60" : ""}`}>
                    <div className="text-xs font-semibold leading-tight line-clamp-2 mb-1">{w.name}</div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[w.type]}`}>{TYPE_LABELS[w.type]}</span>
                      {completedIds.has(w.id) && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Workout modal */}
      {selectedWorkout && (
        <WorkoutModal
          workout={selectedWorkout}
          clientId={user?.id || 0}
          isCompleted={completedIds.has(selectedWorkout.id)}
          onClose={() => setSelectedWorkout(null)}
        />
      )}
    </div>
  );
}

// ─── WORKOUT MODAL WITH TIMER ──────────────────────────────────────────────
function WorkoutModal({ workout, clientId, isCompleted, onClose }: {
  workout: Workout; clientId: number; isCompleted: boolean; onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentMinute, setCurrentMinute] = useState(1);
  const [running, setRunning] = useState(false);
  const [logNotes, setLogNotes] = useState("");
  const [score, setScore] = useState("");
  const [setLogs, setSetLogs] = useState<Record<string, { weight: string; reps: string; done: boolean }[]>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wType = workout.type;
  const blocks = (() => { try { return JSON.parse(workout.blocks || "[]"); } catch { return []; } })();

  // Initialize set logs for traditional
  useEffect(() => {
    if (wType === "traditional" && blocks.length > 0) {
      const init: typeof setLogs = {};
      blocks.forEach((block: any) => {
        block.exercises?.forEach((ex: any) => {
          if (!init[ex.name]) {
            init[ex.name] = Array.from({ length: ex.sets || 3 }, () => ({ weight: "", reps: ex.reps || "", done: false }));
          }
        });
      });
      setSetLogs(init);
    }
  }, [workout.id]);

  const initTimer = useCallback(() => {
    if (wType === "tabata") setTimeLeft(workout.workInterval || 20);
    else if (wType === "emom") setTimeLeft(60);
    else if (wType === "amrap" || wType === "wod") setTimeLeft(workout.timeCap || 1200);
  }, [workout]);

  useEffect(() => { initTimer(); }, [initTimer]);

  const startTimer = () => {
    setStarted(true);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Transition
          if (wType === "tabata") {
            setPhase(p => {
              if (p === "work") { return "rest"; }
              else {
                setCurrentRound(r => r + 1);
                return "work";
              }
            });
            return wType === "tabata" && phase === "work" ? (workout.restInterval || 10) : (workout.workInterval || 20);
          }
          if (wType === "emom") {
            setCurrentMinute(m => m + 1);
            return 60;
          }
          clearInterval(intervalRef.current!);
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    elapsedRef.current = setInterval(() => setTotalElapsed(e => e + 1), 1000);
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current!);
    clearInterval(elapsedRef.current!);
    setRunning(false);
  };

  const resetTimer = () => {
    stopTimer();
    setStarted(false);
    setCurrentRound(1);
    setCurrentMinute(1);
    setPhase("work");
    setTotalElapsed(0);
    initTimer();
  };

  const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => () => { clearInterval(intervalRef.current!); clearInterval(elapsedRef.current!); }, []);

  const logMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/workout-logs", {
      clientId, workoutId: workout.id, duration: totalElapsed,
      score: score || undefined, notes: logNotes || undefined,
      setLogs: JSON.stringify(setLogs),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/workout-logs", clientId] });
      toast({ title: "Workout logged! Great work." });
      onClose();
    },
  });

  const hasTimer = ["emom","amrap","wod","tabata"].includes(wType);
  const totalRounds = workout.roundCount || 8;
  const tabataProgress = ((currentRound - 1) / totalRounds) * 100;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{workout.name}</DialogTitle>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${TYPE_COLORS[wType]}`}>{TYPE_LABELS[wType]}</span>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4 pb-4">
            {/* Timer section */}
            {hasTimer && (
              <div className="rounded-xl bg-muted p-5 text-center space-y-3">
                {wType === "tabata" && (
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${phase === "work" ? "text-primary" : "text-blue-500"}`}>
                      {phase === "work" ? "WORK" : "REST"}
                    </div>
                    <div className="text-xs text-muted-foreground">Round {currentRound}/{totalRounds}</div>
                    <Progress value={tabataProgress} className="h-1.5 mt-2" />
                  </div>
                )}
                {wType === "emom" && (
                  <div className="text-xs text-muted-foreground font-semibold">
                    Minute {currentMinute} · {blocks[((currentMinute-1) % blocks.length)]?.name || ""}
                  </div>
                )}
                <div className={`text-6xl font-bold timer-display tabular-nums ${wType === "tabata" && phase === "rest" ? "text-blue-500" : "text-foreground"}`}>
                  {fmtTime(timeLeft)}
                </div>
                {(wType === "amrap" || wType === "wod") && (
                  <div className="text-xs text-muted-foreground">Elapsed: {fmtTime(totalElapsed)}</div>
                )}
                <div className="flex items-center justify-center gap-3">
                  {!running ? (
                    <Button onClick={started ? () => { setRunning(true); intervalRef.current = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000); elapsedRef.current = setInterval(() => setTotalElapsed(e => e + 1), 1000); } : startTimer} data-testid="button-timer-play">
                      <Play className="h-4 w-4 mr-2" />Start
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={stopTimer} data-testid="button-timer-pause">
                      <Pause className="h-4 w-4 mr-2" />Pause
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={resetTimer} data-testid="button-timer-reset">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Exercises */}
            {wType === "traditional" && blocks.map((block: any, bi: number) => (
              <div key={bi} className="space-y-3">
                {block.blockName && block.blockName !== "Main" && <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{block.blockName}</div>}
                {block.exercises?.map((ex: any, ei: number) => (
                  <div key={ei} className="border rounded-lg p-3 space-y-2" data-testid={`exercise-log-${bi}-${ei}`}>
                    <div className="font-semibold text-sm">{ex.name}</div>
                    <div className="text-xs text-muted-foreground">{ex.sets}×{ex.reps} · Rest {ex.rest}s</div>
                    <div className="space-y-1.5">
                      {setLogs[ex.name]?.map((s, si) => (
                        <div key={si} className="flex items-center gap-2">
                          <Checkbox
                            checked={s.done}
                            onCheckedChange={v => setSetLogs(prev => ({ ...prev, [ex.name]: prev[ex.name].map((ss, j) => j === si ? { ...ss, done: !!v } : ss) }))}
                            data-testid={`set-done-${bi}-${ei}-${si}`}
                          />
                          <span className="text-xs text-muted-foreground w-10">Set {si+1}</span>
                          <Input className="h-7 w-20 text-xs text-center" placeholder="lbs" value={s.weight} onChange={e => setSetLogs(prev => ({ ...prev, [ex.name]: prev[ex.name].map((ss, j) => j === si ? { ...ss, weight: e.target.value } : ss) }))} data-testid={`set-weight-${bi}-${ei}-${si}`} />
                          <Input className="h-7 w-16 text-xs text-center" placeholder="reps" value={s.reps} onChange={e => setSetLogs(prev => ({ ...prev, [ex.name]: prev[ex.name].map((ss, j) => j === si ? { ...ss, reps: e.target.value } : ss) }))} data-testid={`set-reps-${bi}-${ei}-${si}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Timed workout movements list */}
            {(wType === "wod" || wType === "amrap" || wType === "emom") && Array.isArray(blocks) && blocks.length > 0 && typeof blocks[0] === "object" && "name" in blocks[0] && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Movements</div>
                {blocks.map((ex: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted">
                    {wType === "emom" && <span className="text-xs font-mono text-muted-foreground w-6">M{i+1}</span>}
                    <span className="text-sm font-medium">{ex.name}</span>
                  </div>
                ))}
              </div>
            )}

            {wType === "tabata" && Array.isArray(blocks) && blocks.length > 0 && typeof blocks[0] === "object" && "name" in blocks[0] && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stations · {workout.workInterval}s work / {workout.restInterval}s rest × {workout.roundCount} rounds</div>
                {blocks.map((ex: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted">
                    <span className="text-sm font-medium">{ex.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Score for WOD */}
            {(wType === "wod") && (
              <div className="space-y-1.5">
                <Label>Your Score ({workout.scoreType})</Label>
                <Input data-testid="input-wod-score" value={score} onChange={e => setScore(e.target.value)} placeholder={wType === "wod" ? (workout.scoreType === "time" ? "e.g. 12:45" : "e.g. 87") : ""} />
              </div>
            )}

            {/* Coach notes */}
            {workout.notes && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="text-xs font-bold text-primary mb-1">Coach Notes</div>
                <p className="text-sm">{workout.notes}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notes / How did it feel?</Label>
              <Textarea data-testid="input-workout-log-notes" value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="How'd it go? Any PRs? How you feeling?" rows={2} />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!isCompleted && (
            <Button onClick={() => logMutation.mutate()} disabled={logMutation.isPending} data-testid="button-log-workout">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {logMutation.isPending ? "Logging..." : "Log Workout"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
