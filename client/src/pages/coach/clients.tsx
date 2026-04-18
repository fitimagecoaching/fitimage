import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Dumbbell, MessageSquare, Calendar, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import type { User, Program, ClientProgram, WorkoutLog } from "@shared/schema";

export default function ClientsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [assignClient, setAssignClient] = useState<User | null>(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: clients = [] } = useQuery<User[]>({ queryKey: ["/api/clients"] });
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs", { coachId: user?.id }],
    queryFn: async () => { const r = await fetch(`/api/programs?coachId=${user?.id}`); return r.json(); }
  });

  const assignMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/client-programs", {
      clientId: assignClient?.id, programId: Number(selectedProgram), startDate, status: "active"
    }),
    onSuccess: () => {
      toast({ title: "Program assigned" });
      setAssignClient(null);
      setSelectedProgram("");
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground text-sm">{clients.length} registered clients</p>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No clients yet</h3>
          <p className="text-muted-foreground text-sm">Clients who register will appear here</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <ClientCard key={c.id} client={c} onAssign={() => setAssignClient(c)} />
          ))}
        </div>
      )}

      <Dialog open={!!assignClient} onOpenChange={() => setAssignClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Program — {assignClient?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger data-testid="select-assign-program"><SelectValue placeholder="Choose program..." /></SelectTrigger>
                <SelectContent>
                  {programs.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} data-testid="input-start-date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignClient(null)}>Cancel</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={!selectedProgram || assignMutation.isPending} data-testid="button-confirm-assign">
              {assignMutation.isPending ? "Assigning..." : "Assign Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientCard({ client, onAssign }: { client: User; onAssign: () => void }) {
  const { data: assignment } = useQuery<ClientProgram | null>({
    queryKey: ["/api/client-programs", client.id, "active"],
    queryFn: async () => { const r = await fetch(`/api/client-programs/${client.id}/active`); return r.json(); }
  });
  const { data: logs = [] } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/workout-logs", client.id],
    queryFn: async () => { const r = await fetch(`/api/workout-logs/${client.id}`); return r.json(); }
  });

  return (
    <Card data-testid={`client-card-${client.id}`}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
            {client.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold">{client.name}</div>
            <div className="text-xs text-muted-foreground">{client.email}</div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
            {assignment ? (
              <Badge variant="secondary" className="text-xs">Program assigned</Badge>
            ) : (
              <span className="text-muted-foreground text-xs">No program</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{logs.length} sessions logged</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onAssign} data-testid={`assign-program-${client.id}`}>
            <Dumbbell className="h-3.5 w-3.5 mr-1.5" />Assign
          </Button>
          <Link href={`/messages?with=${client.id}`}>
            <Button variant="outline" size="sm" data-testid={`message-client-${client.id}`}>
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
