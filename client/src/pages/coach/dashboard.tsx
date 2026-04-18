import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, Dumbbell, MessageSquare, TrendingUp, Plus, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { User, Program, Message } from "@shared/schema";
import anvilLogo from "@assets/logo-anvil.jpeg";

export default function CoachDashboard() {
  const { user } = useAuth();
  const { data: clients = [] } = useQuery<User[]>({ queryKey: ["/api/clients"] });
  const { data: programs = [] } = useQuery<Program[]>({ queryKey: ["/api/programs", { coachId: user?.id }], queryFn: async () => {
    const res = await fetch(`/api/programs?coachId=${user?.id}`);
    return res.json();
  }});
  const { data: inbox = [] } = useQuery<Message[]>({ queryKey: ["/api/messages/inbox", user?.id], queryFn: async () => {
    const res = await fetch(`/api/messages/inbox/${user?.id}`);
    return res.json();
  }});

  const unread = inbox.filter(m => !m.isRead && m.toId === user?.id).length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">The Anvil Method™ · Assess · Program · Accountability</p>
        </div>
        <img src={anvilLogo} alt="Anvil Method" className="h-12 w-12 object-contain rounded opacity-80" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Clients", value: clients.length, icon: Users, color: "text-blue-500" },
          { label: "Programs", value: programs.length, icon: Dumbbell, color: "text-primary" },
          { label: "Unread Messages", value: unread, icon: MessageSquare, color: "text-purple-500" },
          { label: "Active Programs", value: programs.filter(p => !p.isTemplate).length, icon: TrendingUp, color: "text-green-500" },
        ].map(stat => (
          <Card key={stat.label} data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/programs">
              <Button variant="outline" className="w-full justify-between" data-testid="action-new-program">
                <span className="flex items-center gap-2"><Plus className="h-4 w-4" />New Program</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="outline" className="w-full justify-between" data-testid="action-view-clients">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" />View Clients</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="outline" className="w-full justify-between" data-testid="action-messages">
                <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Messages {unread > 0 && <Badge className="h-5 px-1.5 text-xs">{unread}</Badge>}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Programs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Programs</CardTitle>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No programs yet. Create your first one.
              </div>
            ) : (
              <div className="space-y-2">
                {programs.slice(0, 4).map(p => (
                  <Link key={p.id} href={`/programs/${p.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted cursor-pointer transition-colors" data-testid={`program-item-${p.id}`}>
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.durationWeeks} weeks</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No clients yet.
              </div>
            ) : (
              <div className="space-y-2">
                {clients.slice(0, 5).map(c => (
                  <Link key={c.id} href={`/clients/${c.id}`}>
                    <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted cursor-pointer transition-colors" data-testid={`client-item-${c.id}`}>
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pillars */}
        <Card className="bg-card border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">The Anvil Method™</p>
              <p className="text-xs text-muted-foreground mt-1">Heat · Pressure · Repetition</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Assess", desc: "Evaluate where you are" },
                { label: "Program", desc: "Build the path forward" },
                { label: "Accountability", desc: "Stay the course" },
              ].map(pillar => (
                <div key={pillar.label} className="text-center p-3 rounded-md bg-muted">
                  <div className="text-sm font-bold text-primary">{pillar.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{pillar.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
