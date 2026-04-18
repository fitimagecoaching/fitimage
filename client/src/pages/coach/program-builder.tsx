import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, ChevronLeft, Dumbbell, Timer, Repeat, Zap, Trophy } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Program, Workout } from "@shared/schema";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const WORKOUT_TYPES = [
  { value: "traditional", label: "Traditional", icon: Dumbbell, color: "badge-traditional" },
  { value: "wod", label: "WOD", icon: Trophy, color: "badge-wod" },
  { value: "emom", label: "EMOM", icon: Timer, color: "badge-emom" },
  { value: "amrap", label: "AMRAP", icon: Repeat, color: "badge-amrap" },
  { value: "tabata", label: "Tabata", icon: Zap, color: "badge-tabata" },
];

interface Block {
  blockName: string;
  exercises: { name: string; sets: number; reps: string; rest: number; notes?: string }[];
}

interface TimedExercise {
  name: string;
  reps?: string;
  notes?: string;
}

const defaultWorkout = () => ({
  name: "",
  type: "traditional",
  dayOfWeek: 1,
  weekNumber: 1,
  notes: "",
  timeCap: 20,
  roundCount: 3,
  workInterval: 20,
  restInterval: 10,
  scoreType: "time",
  blocks: JSON.stringify([{ blockName: "Main", exercises: [{ name: "", sets: 3, reps: "10", rest: 60 }] }] as Block[]),
});

export default function ProgramBuilder() {
  const [, params] = useRoute("/programs/:id");
  const programId = Number(params?.id);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showWorkout, setShowWorkout] = useState(false);
  const [editWorkout, setEditWorkout] = useState<Partial<typeof defaultWorkout extends () => infer R ? R : never> | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const { data: program } = useQuery<Program>({ queryKey: ["/api/programs", programId] });
  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ["/api/workouts", programId],
    queryFn: async () => { const r = await fetch(`/api/workouts?programId=${programId}`); return r.json(); }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editId) return apiRequest("PATCH", `/api/workouts/${editId}`, data);
      return apiRequest("POST", "/api/workouts", { ...data, programId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/workouts", programId] });
      setShowWorkout(false);
      setEditId(null);
      toast({ title: "Workout saved" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/workouts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workouts", programId] }),
  });

  const openNew = (day: number) => {
    setEditId(null);
    setEditWorkout({ ...defaultWorkout(), dayOfWeek: day, weekNumber: selectedWeek });
    setShowWorkout(true);
  };

  const openEdit = (w: Workout) => {
    setEditId(w.id);
    setEditWorkout({ ...w });
    setShowWorkout(true);
  };

  const weekWorkouts = workouts.filter(w => w.weekNumber === selectedWeek);
  const weeks = Array.from({ length: program?.durationWeeks || 4 }, (_, i) => i + 1);

  const getBlocks = (): Block[] => {
    try { return JSON.parse(editWorkout?.blocks || "[]"); } catch { return []; }
  };
  const setBlocks = (blocks: Block[]) => setEditWorkout(w => ({ ...w, blocks: JSON.stringify(blocks) }));

  const addBlock = () => setBlocks([...getBlocks(), { blockName: `Block ${getBlocks().length + 1}`, exercises: [{ name: "", sets: 3, reps: "10", rest: 60 }] }]);
  const removeBlock = (bi: number) => setBlocks(getBlocks().filter((_, i) => i !== bi));
  const updateBlock = (bi: number, key: string, val: any) => setBlocks(getBlocks().map((b, i) => i === bi ? { ...b, [key]: val } : b));
  const addExercise = (bi: number) => setBlocks(getBlocks().map((b, i) => i === bi ? { ...b, exercises: [...b.exercises, { name: "", sets: 3, reps: "10", rest: 60 }] } : b));
  const removeExercise = (bi: number, ei: number) => setBlocks(getBlocks().map((b, i) => i === bi ? { ...b, exercises: b.exercises.filter((_, j) => j !== ei) } : b));
  const updateExercise = (bi: number, ei: number, key: string, val: any) => setBlocks(getBlocks().map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? { ...e, [key]: val } : e) } : b));

  const getTimedExercises = (): TimedExercise[] => {
    try { const d = JSON.parse(editWorkout?.blocks || "[]"); return Array.isArray(d) && typeof d[0] === "object" && "name" in d[0] ? d : []; } catch { return []; }
  };
  const setTimedExercises = (ex: TimedExercise[]) => setEditWorkout(w => ({ ...w, blocks: JSON.stringify(ex) }));
  const addTimedExercise = () => setTimedExercises([...getTimedExercises(), { name: "", reps: "" }]);
  const updateTimedExercise = (i: number, key: string, val: string) => setTimedExercises(getTimedExercises().map((e, j) => j === i ? { ...e, [key]: val } : e));
  const removeTimedExercise = (i: number) => setTimedExercises(getTimedExercises().filter((_, j) => j !== i));

  const wType = editWorkout?.type || "traditional";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/programs">
          <Button variant="ghost" size="sm" data-testid="button-back"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{program?.name || "Program Builder"}</h1>
          <p className="text-xs text-muted-foreground">{program?.durationWeeks} weeks · Sun–Fri schedule</p>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weeks.map(w => (
          <Button key={w} variant={selectedWeek === w ? "default" : "outline"} size="sm" onClick={() => setSelectedWeek(w)} data-testid={`week-tab-${w}`}>
            Week {w}
          </Button>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {DAYS.map((day, di) => {
          const dayWorkouts = weekWorkouts.filter(w => w.dayOfWeek === di);
          return (
            <div key={day} className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">{day}</div>
              {dayWorkouts.map(w => {
                const t = WORKOUT_TYPES.find(t => t.value === w.type);
                return (
                  <Card key={w.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => openEdit(w)} data-testid={`workout-card-${w.id}`}>
                    <CardContent className="p-3">
                      <div className="text-xs font-semibold leading-tight mb-1 line-clamp-2">{w.name}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t?.color}`}>{t?.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
              <Button variant="outline" size="sm" className="w-full h-8 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary" onClick={() => openNew(di)} data-testid={`add-workout-${day}`}>
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            </div>
          );
        })}
      </div>

      {/* Workout Builder Dialog */}
      <Dialog open={showWorkout} onOpenChange={setShowWorkout}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Workout" : "New Workout"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4 pb-4">
              {/* Name & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Workout Name</Label>
                  <Input data-testid="input-workout-name" placeholder="e.g. Lower Body Power" value={editWorkout?.name || ""} onChange={e => setEditWorkout(w => ({ ...w, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={editWorkout?.type || "traditional"} onValueChange={v => setEditWorkout(w => ({ ...w, type: v }))}>
                    <SelectTrigger data-testid="select-workout-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKOUT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2"><t.icon className="h-3.5 w-3.5" />{t.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Type-specific settings */}
              {wType === "traditional" && (
                <div>
                  {getBlocks().map((block, bi) => (
                    <div key={bi} className="border rounded-md p-3 mb-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input value={block.blockName} onChange={e => updateBlock(bi, "blockName", e.target.value)} className="h-7 text-sm font-semibold" data-testid={`block-name-${bi}`} />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeBlock(bi)} data-testid={`remove-block-${bi}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      {block.exercises.map((ex, ei) => (
                        <div key={ei} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <Input value={ex.name} onChange={e => updateExercise(bi, ei, "name", e.target.value)} placeholder="Exercise" className="h-7 text-xs" data-testid={`exercise-name-${bi}-${ei}`} />
                          </div>
                          <div className="col-span-2">
                            <Input type="number" value={ex.sets} onChange={e => updateExercise(bi, ei, "sets", parseInt(e.target.value))} placeholder="Sets" className="h-7 text-xs text-center" data-testid={`exercise-sets-${bi}-${ei}`} />
                          </div>
                          <div className="col-span-2">
                            <Input value={ex.reps} onChange={e => updateExercise(bi, ei, "reps", e.target.value)} placeholder="Reps" className="h-7 text-xs text-center" data-testid={`exercise-reps-${bi}-${ei}`} />
                          </div>
                          <div className="col-span-2">
                            <Input type="number" value={ex.rest} onChange={e => updateExercise(bi, ei, "rest", parseInt(e.target.value))} placeholder="Rest(s)" className="h-7 text-xs text-center" data-testid={`exercise-rest-${bi}-${ei}`} />
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeExercise(bi, ei)} data-testid={`remove-exercise-${bi}-${ei}`}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono px-1">
                        <span className="w-[calc(33.33%-8px)]">Exercise</span>
                        <span className="w-[calc(16.66%-8px)] text-center">Sets</span>
                        <span className="w-[calc(16.66%-8px)] text-center">Reps</span>
                        <span className="w-[calc(16.66%-8px)] text-center">Rest(s)</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full h-7 border-dashed text-xs" onClick={() => addExercise(bi)} data-testid={`add-exercise-${bi}`}><Plus className="h-3 w-3 mr-1" />Add Exercise</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="border-dashed" onClick={addBlock} data-testid="add-block"><Plus className="h-3.5 w-3.5 mr-1.5" />Add Block</Button>
                </div>
              )}

              {(wType === "wod" || wType === "amrap") && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Time Cap (min)</Label>
                      <Input type="number" value={Math.floor((editWorkout?.timeCap || 1200) / 60)} onChange={e => setEditWorkout(w => ({ ...w, timeCap: parseInt(e.target.value) * 60 }))} data-testid="input-timecap" />
                    </div>
                    {wType === "wod" && (
                      <div className="space-y-1.5">
                        <Label>Score Type</Label>
                        <Select value={editWorkout?.scoreType || "time"} onValueChange={v => setEditWorkout(w => ({ ...w, scoreType: v }))}>
                          <SelectTrigger data-testid="select-score-type"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["time","reps","rounds","weight","none"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <Label>Exercises / Movements</Label>
                  {getTimedExercises().map((ex, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input value={ex.name} onChange={e => updateTimedExercise(i, "name", e.target.value)} placeholder="e.g. 21 Thrusters (95/65)" className="flex-1" data-testid={`timed-exercise-${i}`} />
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => removeTimedExercise(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="border-dashed" onClick={addTimedExercise} data-testid="add-timed-exercise"><Plus className="h-3.5 w-3.5 mr-1.5" />Add Movement</Button>
                </div>
              )}

              {wType === "emom" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Duration (min)</Label>
                      <Input type="number" value={Math.floor((editWorkout?.timeCap || 600) / 60)} onChange={e => setEditWorkout(w => ({ ...w, timeCap: parseInt(e.target.value) * 60 }))} data-testid="input-emom-duration" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Interval (min)</Label>
                      <Input type="number" value={editWorkout?.roundCount || 1} onChange={e => setEditWorkout(w => ({ ...w, roundCount: parseInt(e.target.value) }))} data-testid="input-emom-interval" />
                    </div>
                  </div>
                  <Label>Exercises (one per minute, repeating)</Label>
                  {getTimedExercises().map((ex, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="text-xs font-mono text-muted-foreground w-8 text-right">M{i+1}:</div>
                      <Input value={ex.name} onChange={e => updateTimedExercise(i, "name", e.target.value)} placeholder="e.g. 12 KB Swings" className="flex-1" data-testid={`emom-exercise-${i}`} />
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => removeTimedExercise(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="border-dashed" onClick={addTimedExercise} data-testid="add-emom-exercise"><Plus className="h-3.5 w-3.5 mr-1.5" />Add Minute</Button>
                </div>
              )}

              {wType === "tabata" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Work (sec)</Label>
                      <Input type="number" value={editWorkout?.workInterval || 20} onChange={e => setEditWorkout(w => ({ ...w, workInterval: parseInt(e.target.value) }))} data-testid="input-tabata-work" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rest (sec)</Label>
                      <Input type="number" value={editWorkout?.restInterval || 10} onChange={e => setEditWorkout(w => ({ ...w, restInterval: parseInt(e.target.value) }))} data-testid="input-tabata-rest" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rounds</Label>
                      <Input type="number" value={editWorkout?.roundCount || 8} onChange={e => setEditWorkout(w => ({ ...w, roundCount: parseInt(e.target.value) }))} data-testid="input-tabata-rounds" />
                    </div>
                  </div>
                  <Label>Exercises (per station)</Label>
                  {getTimedExercises().map((ex, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input value={ex.name} onChange={e => updateTimedExercise(i, "name", e.target.value)} placeholder="e.g. Burpees" className="flex-1" data-testid={`tabata-exercise-${i}`} />
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => removeTimedExercise(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="border-dashed" onClick={addTimedExercise} data-testid="add-tabata-exercise"><Plus className="h-3.5 w-3.5 mr-1.5" />Add Exercise</Button>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Coach Notes</Label>
                <Textarea data-testid="input-workout-notes" placeholder="Cues, scaling options, scripture..." value={editWorkout?.notes || ""} onChange={e => setEditWorkout(w => ({ ...w, notes: e.target.value }))} rows={2} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={() => setShowWorkout(false)}>Cancel</Button>
            {editId && (
              <Button variant="destructive" onClick={() => { deleteMutation.mutate(editId); setShowWorkout(false); }} data-testid="button-delete-workout">Delete</Button>
            )}
            <Button onClick={() => saveMutation.mutate(editWorkout)} disabled={!editWorkout?.name || saveMutation.isPending} data-testid="button-save-workout">
              {saveMutation.isPending ? "Saving..." : "Save Workout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
