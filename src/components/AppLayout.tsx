import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, FileText, BarChart3, Sun, Moon, LogOut,
  Shield, User, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Chat", path: "/chat", icon: MessageSquare, roles: ["admin", "employee"] },
  { label: "Documents", path: "/documents", icon: FileText, roles: ["admin"] },
  { label: "Dashboard", path: "/dashboard", icon: BarChart3, roles: ["admin"] },
];

const AppLayout = () => {
  const { user, logout } = useAuth();       // ← removed switchRole (no longer in context)
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleNav = navItems.filter((n) => n.roles.includes(user?.role || "employee"));

  return (
    <div className="flex flex-col h-screen">
      {/* ── Top bar ── */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 flex-shrink-0">

        {/* Logo */}
        <div
          className="flex items-center gap-2 mr-4 cursor-pointer"
          onClick={() => navigate("/chat")}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BrainIcon className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-sm hidden sm:block">OpsMind AI</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {visibleNav.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname.startsWith(item.path) ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm hidden sm:inline">{user?.name}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              {/* User info — read-only */}
              <div className="px-2 py-1.5 space-y-0.5">
                <p className="text-xs font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>

              {/* Role badge */}
              <div className="px-2 pb-1.5">
                <Badge
                  variant={user?.role === "admin" ? "default" : "secondary"}
                  className="text-xs gap-1"
                >
                  {user?.role === "admin"
                    ? <><Shield className="h-2.5 w-2.5" /> Admin</>
                    : <><User className="h-2.5 w-2.5" /> Employee</>
                  }
                </Badge>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

function BrainIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}

export default AppLayout;
