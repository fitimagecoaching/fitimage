import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Dumbbell, Trash2, ChevronRight, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Program } from "@shared/schema";

export default function ProgramsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", durationWeeks: 4 });

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs", { coachId: user?.id }],
    queryFn: async () => { const r = await fetch(`/api/programs?coachId=${user?.id}`); return r.json(); }
  });

  const createMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/programs", { ...form, coachId: user?.id }),
    onSuccess: async (res) => {
      const prog = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/programs", { coachId: user?.id }] });
      setShowCreate(false);
      setForm({ name: "", description: "", durationWeeks: 4 });
      navigate(`/programs/${prog.id}`);
    },
    onError: () => toast({ title: "Failed to create program", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/programs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/programs", { coachId: user?.id }] }),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-muted-foreground text-sm">Build and manage training programs</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-program">
          <Plus className="h-4 w-4 mr-2" />New Program
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No programs yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first program to start building workouts</p>
          <Button onClick={() => setShowCreate(true)} data-testid="button-first-program">
            <Plus className="h-4 w-4 mr-2" />Create First Program
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(p => (
            <Card key={p.id} className="hover:border-primary/40 transition-colors cursor-pointer group" data-testid={`program-card-${p.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{p.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" data-testid={`menu-program-${p.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => deleteMutation.mutate(p.id)} className="text-destructive" data-testid={`delete-program-${p.id}`}>
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />{p.durationWeeks} weeks
                  </Badge>
                </div>
                <Link href={`/programs/${p.id}`}>
                  <Button variant="outline" size="sm" className="w-full" data-testid={`open-program-${p.id}`}>
                    Open Builder <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Program Name</Label>
              <Input data-testid="input-program-name" placeholder="e.g. 8-Week Strength Foundation" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea data-testid="input-program-desc" placeholder="What is this program for?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (weeks)</Label>
              <Input data-testid="input-program-weeks" type="number" min={1} max={52} value={form.durationWeeks} onChange={e => setForm(f => ({ ...f, durationWeeks: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} data-testid="button-save-program">
              {createMutation.isPending ? "Creating..." : "Create & Build"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
