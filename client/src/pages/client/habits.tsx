import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Droplets, Moon, Utensils, Brain, CheckCircle2, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, eachDayOfInterval } from "date-fns";
import type { HabitLog } from "@shared/schema";

const today = format(new Date(), "yyyy-MM-dd");

const RATINGS = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];

export default function HabitsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState({ water: 8, sleep: 7, nutrition: 3, stress: 3, notes: "" });

  const { data: logs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habits", user?.id],
    queryFn: async () => { const r = await fetch(`/api/habits/${user?.id}`); return r.json(); }
  });

  const { data: todayLog } = useQuery<HabitLog | null>({
    queryKey: ["/api/habits", user?.id, selectedDate],
    queryFn: async () => { const r = await fetch(`/api/habits/${user?.id}/${selectedDate}`); return r.json(); }
  });

  const logMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/habits", { clientId: user?.id, date: selectedDate, ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/habits", user?.id] });
      qc.invalidateQueries({ queryKey: ["/api/habits", user?.id, selectedDate] });
      toast({ title: "Habits logged!" });
    },
  });

  const last14 = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  const logsByDate = new Map(logs.map(l => [l.date, l]));

  const avgWater = logs.length ? Math.round(logs.reduce((a, l) => a + (l.water || 0), 0) / logs.length) : 0;
  const avgSleep = logs.length ? (logs.reduce((a, l) => a + (l.sleep || 0), 0) / logs.length).toFixed(1) : "—";
  const avgNutrition = logs.length ? (logs.reduce((a, l) => a + (l.nutrition || 0), 0) / logs.length).toFixed(1) : "—";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Habit Tracker</h1>
        <p className="text-muted-foreground text-sm">Body · Mind · Spirit — daily check-in</p>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Avg Water", value: `${avgWater} cups`, icon: Droplets, color: "text-blue-500" },
          { label: "Avg Sleep", value: `${avgSleep}h`, icon: Moon, color: "text-purple-500" },
          { label: "Avg Nutrition", value: avgNutrition !== "—" ? RATINGS[Math.round(Number(avgNutrition))] : "—", icon: Utensils, color: "text-green-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <s.icon className={`h-7 w-7 ${s.color}`} />
              <div>
                <div className="font-bold text-sm">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 14-day streak */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Last 14 Days</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-1.5">
            {last14.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const logged = logsByDate.has(key);
              const isToday = key === today;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  title={format(day, "MMM d")}
                  className={`flex-1 h-8 rounded text-[10px] font-bold transition-all
                    ${logged ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground/40"}
                    ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
                    ${selectedDate === key ? "scale-110" : ""}
                  `}
                  data-testid={`habit-day-${key}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily log form */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {selectedDate === today ? "Today's Check-In" : format(new Date(selectedDate + "T12:00:00"), "EEEE, MMM d")}
            </CardTitle>
            {todayLog && <span className="text-xs text-green-500 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Logged</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Water */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" />Water Intake</Label>
              <span className="text-sm font-bold text-blue-500">{form.water} cups</span>
            </div>
            <Slider
              min={0} max={16} step={1}
              value={[form.water]}
              onValueChange={v => setForm(f => ({ ...f, water: v[0] }))}
              data-testid="slider-water"
            />
            <div className="flex justify-between text-xs text-muted-foreground"><span>0</span><span>Goal: 8</span><span>16</span></div>
          </div>

          {/* Sleep */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Moon className="h-4 w-4 text-purple-500" />Sleep</Label>
              <span className="text-sm font-bold text-purple-500">{form.sleep}h</span>
            </div>
            <Slider
              min={0} max={12} step={0.5}
              value={[form.sleep]}
              onValueChange={v => setForm(f => ({ ...f, sleep: v[0] }))}
              data-testid="slider-sleep"
            />
            <div className="flex justify-between text-xs text-muted-foreground"><span>0h</span><span>Goal: 7-9h</span><span>12h</span></div>
          </div>

          {/* Nutrition */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Utensils className="h-4 w-4 text-green-500" />Nutrition Quality</Label>
              <span className="text-sm font-bold text-green-500">{RATINGS[form.nutrition]}</span>
            </div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, nutrition: n }))}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors
                    ${form.nutrition === n ? "bg-green-500 text-white" : "bg-muted hover:bg-muted/80"}`}
                  data-testid={`nutrition-${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Brain className="h-4 w-4 text-orange-500" />Stress Level</Label>
              <span className="text-sm font-bold text-orange-500">{RATINGS[form.stress]}</span>
            </div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, stress: n }))}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors
                    ${form.stress === n ? "bg-orange-500 text-white" : "bg-muted hover:bg-muted/80"}`}
                  data-testid={`stress-${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes / Reflections</Label>
            <Textarea
              data-testid="input-habit-notes"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="How are you feeling today? Any spiritual reflections, wins, or challenges..."
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => logMutation.mutate()}
            disabled={logMutation.isPending}
            data-testid="button-log-habits"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {logMutation.isPending ? "Saving..." : todayLog ? "Update Log" : "Log Today"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
