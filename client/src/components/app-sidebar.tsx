import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Dumbbell, Users, BookOpen, MessageSquare,
  Trophy, TrendingUp, CalendarDays, LogOut, Settings, Flame
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import athleticLogo from "@assets/logo-athletic.jpeg";
import anvilLogo from "@assets/logo-anvil.jpeg";

const coachNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Programs", url: "/programs", icon: Dumbbell },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Ministry", url: "/ministry", icon: BookOpen },
  { title: "Community", url: "/community", icon: Trophy },
  { title: "Messages", url: "/messages", icon: MessageSquare },
];

const clientNav = [
  { title: "My Program", url: "/", icon: CalendarDays },
  { title: "Progress", url: "/progress", icon: TrendingUp },
  { title: "Habits", url: "/habits", icon: Flame },
  { title: "Ministry", url: "/ministry", icon: BookOpen },
  { title: "Community", url: "/community", icon: Trophy },
  { title: "Messages", url: "/messages", icon: MessageSquare },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const nav = user?.role === "coach" ? coachNav : clientNav;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <img src={anvilLogo} alt="Anvil" className="h-8 w-8 object-contain rounded" />
          <div>
            <div className="text-xs font-bold text-sidebar-foreground tracking-wide">FITIMAGE</div>
            <div className="text-[10px] text-sidebar-foreground/50 tracking-widest">COACHING</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] tracking-widest uppercase px-4">
            {user?.role === "coach" ? "Coach Portal" : "My Training"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 px-1 mb-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name}</div>
            <div className="text-[10px] text-sidebar-foreground/50 capitalize">{user?.role}</div>
          </div>
        </div>
        <SidebarMenuButton onClick={logout} className="text-sidebar-foreground/60 hover:text-sidebar-foreground" data-testid="button-logout">
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
