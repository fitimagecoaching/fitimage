import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Dumbbell, Flame, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import type { WorkoutLog, Workout } from "@shared/schema";

const TYPE_COLORS: Record<string, string> = {
  traditional: "badge-traditional", wod: "badge-wod",
  emom: "badge-emom", amrap: "badge-amrap", tabata: "badge-tabata",
};
const TYPE_LABELS: Record<string, string> = {
  traditional: "Traditional", wod: "WOD", emom: "EMOM", amrap: "AMRAP", tabata: "Tabata",
};

export default function ProgressPage() {
  const { user } = useAuth();

  const { data: logs = [], isLoading } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/workout-logs", user?.id],
    queryFn: async () => { const r = await fetch(`/api/workout-logs/${user?.id}`); return r.json(); }
  });

  const { data: assignment } = useQuery({
    queryKey: ["/api/client-programs", user?.id, "active"],
    queryFn: async () => { const r = await fetch(`/api/client-programs/${user?.id}/active`); return r.json(); }
  });

  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ["/api/workouts", assignment?.programId],
    queryFn: async () => { const r = await fetch(`/api/workouts?programId=${assignment?.programId}`); return r.json(); },
    enabled: !!assignment?.programId
  });

  // Build last 30 days activity map
  const today = new Date();
  const last30 = eachDayOfInterval({ start: subDays(today, 29), end: today });
  const logsByDate = new Map<string, number>();
  logs.forEach(log => {
    const d = format(new Date(log.completedAt), "yyyy-MM-dd");
    logsByDate.set(d, (logsByDate.get(d) || 0) + 1);
  });

  // Streak calculation
  let streak = 0;
  for (let i = 0; i <= 30; i++) {
    const d = format(subDays(today, i), "yyyy-MM-dd");
    if (logsByDate.has(d)) streak++;
    else if (i > 0) break;
  }

  const workoutMap = new Map(workouts.map(w => [w.id, w]));

  const fmtDuration = (s?: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Progress</h1>
        <p className="text-muted-foreground text-sm">Track your consistency and growth</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: logs.length, icon: CheckCircle2, color: "text-green-500" },
          { label: "Current Streak", value: `${streak} days`, icon: Flame, color: "text-orange-500" },
          { label: "This Week", value: logs.filter(l => new Date(l.completedAt) > subDays(today, 7)).length, icon: Calendar, color: "text-blue-500" },
          { label: "Avg Duration", value: logs.length ? fmtDuration(Math.round(logs.reduce((a, l) => a + (l.duration || 0), 0) / logs.length)) : "—", icon: TrendingUp, color: "text-primary" },
        ].map(stat => (
          <Card key={stat.label} data-testid={`progress-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                <div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity grid - last 30 days */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {last30.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const count = logsByDate.get(key) || 0;
              const isToday = key === format(today, "yyyy-MM-dd");
              return (
                <div
                  key={key}
                  title={`${format(day, "MMM d")} · ${count} session${count !== 1 ? "s" : ""}`}
                  className={`h-7 w-7 rounded-sm flex items-center justify-center text-[10px] font-bold transition-colors
                    ${count > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground/40"}
                    ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
                  `}
                  data-testid={`activity-day-${key}`}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Red = workout completed</p>
        </CardContent>
      </Card>

      {/* Recent logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No sessions logged yet. Complete a workout to see it here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 15).map(log => {
                const workout = workoutMap.get(log.workoutId);
                return (
                  <div key={log.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors" data-testid={`log-item-${log.id}`}>
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{workout?.name || `Workout #${log.workoutId}`}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.completedAt), "EEE, MMM d · h:mm a")}
                        {log.duration ? ` · ${fmtDuration(log.duration)}` : ""}
                        {log.score ? ` · Score: ${log.score}` : ""}
                      </div>
                    </div>
                    {workout && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${TYPE_COLORS[workout.type]}`}>
                        {TYPE_LABELS[workout.type]}
                      </span>
                    )}
                    {log.rating && (
                      <div className="text-xs text-yellow-500">{"★".repeat(log.rating)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
