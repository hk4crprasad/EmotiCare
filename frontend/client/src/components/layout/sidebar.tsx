import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  LayoutDashboard, 
  MessageCircle, 
  ClipboardCheck, 
  Calendar, 
  BookOpen, 
  AlertTriangle,
  LogOut,
  Settings
} from "lucide-react";
import ProfileModal from "@/components/profile/profile-modal";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Chat Support", href: "/chat", icon: MessageCircle },
  { name: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Resources", href: "/resources", icon: BookOpen },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-card-foreground">EmotiCare</h1>
                <p className="text-xs text-muted-foreground">Mental Health Support</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-card-foreground hover:bg-muted"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Emergency button */}
            <Link 
              href="/emergency"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors emergency-pulse"
              data-testid="nav-emergency"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Emergency Resources</span>
            </Link>
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <div 
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
                onClick={() => setShowProfile(true)}
                data-testid="button-profile"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {user ? getInitials(user.full_name) : "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate" data-testid="text-username">
                  {user?.full_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-email">
                  {user?.student_id || "Student"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(true)}
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 text-muted-foreground hover:text-destructive border-border hover:border-destructive"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <ProfileModal 
        open={showProfile} 
        onOpenChange={setShowProfile} 
      />
    </>
  );
}
