
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  GraduationCap, 
  Users, 
  Wallet, 
  FileText, 
  LayoutDashboard, 
  LogOut,
  School,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: location.pathname === "/dashboard",
    },
    {
      label: "Students",
      icon: GraduationCap,
      href: "/students",
      active: location.pathname.startsWith("/students"),
    },
    {
      label: "Staff",
      icon: Users,
      href: "/staff",
      active: location.pathname.startsWith("/staff"),
    },
    {
      label: "Finances",
      icon: Wallet,
      href: "/finances",
      active: location.pathname.startsWith("/finances"),
    },
    {
      label: "Reports",
      icon: BarChart3,
      href: "/reports",
      active: location.pathname.startsWith("/reports"),
    },
    {
      label: "Receipts",
      icon: FileText,
      href: "/receipts",
      active: location.pathname.startsWith("/receipts"),
    },
    {
      label: "settings",
      icon: LayoutDashboard,
      href: "/config",
      active: location.pathname === "/config",
    },
  ];

  return (
    <div className={cn(
      "pb-12 min-h-screen transition-all duration-300 relative",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          {/* Header with toggle button */}
          <div className={cn(
            "flex items-center mb-6",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <div className="flex items-center">
                <School className="h-8 w-8 text-school-purple" />
                <h2 className="ml-2 text-xl font-bold text-school-purple">Eazy Skool</h2>
              </div>
            )}
            {isCollapsed && (
              <School className="h-8 w-8 text-school-purple" />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn(
                "h-8 w-8 text-muted-foreground hover:text-school-purple",
                isCollapsed && "absolute -right-3 top-4 bg-background border shadow-sm"
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Navigation Items */}
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                to={route.href}
                className={cn(
                  "flex items-center text-sm group py-3 px-3 rounded-md transition-colors hover:bg-school-purple-light hover:text-school-purple relative",
                  route.active
                    ? "bg-school-purple-light text-school-purple font-medium"
                    : "text-muted-foreground",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? route.label : ""}
              >
                <route.icon className={cn(
                  "h-5 w-5",
                  isCollapsed ? "" : "mr-3",
                  route.active ? "text-school-purple" : ""
                )} />
                {!isCollapsed && (
                  <span className="transition-opacity duration-300">
                    {route.label}
                  </span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {route.label}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Logout Button */}
      <div className="px-3 py-2 mt-auto">
        <Link
          to="/logout"
          className={cn(
            "flex items-center text-sm group py-3 px-3 rounded-md hover:bg-school-purple-light hover:text-school-purple text-muted-foreground relative",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut className={cn(
            "h-5 w-5",
            isCollapsed ? "" : "mr-3"
          )} />
          {!isCollapsed && (
            <span className="transition-opacity duration-300">
              Logout
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
