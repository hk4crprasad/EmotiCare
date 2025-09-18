import React, { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { StudentDashboard } from "./components/dashboard/StudentDashboard";
import { ChatInterface } from "./components/chat/ChatInterface";
import { AssessmentInterface } from "./components/assessments/AssessmentInterface";
import { AppointmentInterface } from "./components/appointments/AppointmentInterface";
import { ResourcesInterface } from "./components/resources/ResourcesInterface";
import { TestResources } from "./components/resources/TestResources";
import { PeerSupportInterface } from "./components/peer-support/PeerSupportInterface";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import {
  Brain,
  Calendar,
  MessageCircle,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";

type Page =
  | "dashboard"
  | "chat"
  | "assessments"
  | "appointments"
  | "resources"
  | "peer-support"
  | "profile";

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [currentPage, setCurrentPage] =
    useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Brain className="mx-auto h-12 w-12 text-primary animate-pulse" />
          <p>Loading EmotiCare...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showLogin ? (
            <LoginForm
              onToggleForm={() => setShowLogin(false)}
            />
          ) : (
            <RegisterForm
              onToggleForm={() => setShowLogin(true)}
            />
          )}
        </div>
      </div>
    );
  }

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: Home },
    { id: "chat", name: "AI Chat", icon: MessageCircle },
    { id: "assessments", name: "Assessments", icon: Brain },
    {
      id: "appointments",
      name: "Appointments",
      icon: Calendar,
    },
    { id: "resources", name: "Resources", icon: BookOpen },
    { id: "peer-support", name: "Peer Support", icon: Users },
  ];

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <div className="p-6 lg:p-8">
            <StudentDashboard onNavigate={setCurrentPage} />
          </div>
        );
      case "chat":
        return <ChatInterface />;
      case "assessments":
        return (
          <div className="p-6 lg:p-8">
            <AssessmentInterface />
          </div>
        );
      case "appointments":
        return (
          <div className="p-6 lg:p-8">
            <AppointmentInterface />
          </div>
        );
      case "resources":
        return (
          <div className="p-6 lg:p-8">
            <ResourcesInterface />
          </div>
        );
      case "peer-support":
        return (
          <div className="p-6 lg:p-8">
            <PeerSupportInterface />
          </div>
        );
      default:
        return (
          <div className="p-6 lg:p-8">
            <StudentDashboard onNavigate={setCurrentPage} />
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold">EmotiCare</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('Mobile toggle clicked, current state:', sidebarOpen);
            setSidebarOpen(!sidebarOpen);
          }}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Desktop toggle button */}
      <div className="hidden lg:block fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('Desktop toggle clicked, current state:', sidebarOpen);
            setSidebarOpen(!sidebarOpen);
          }}
          className="h-9 w-9 p-0 bg-background/95 backdrop-blur-sm shadow-lg border hover:bg-accent"
        >
          {sidebarOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex h-[calc(100vh-64px)] lg:h-screen overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            bg-background border-r transition-all duration-300 ease-in-out overflow-hidden shrink-0
            ${sidebarOpen ? "w-72" : "w-0"}
          `}
        >
          <div className={`w-72 h-full flex flex-col transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}>
            {/* Logo */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">
                    EmotiCare
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Mental Health Support
                  </p>
                </div>
              </div>
            </div>

            {/* User info */}
            <div className="p-6 border-b">
              <div className="space-y-2">
                <h3 className="font-medium">
                  {user.full_name}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.role}</Badge>
                  {user.is_active && (
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={
                        currentPage === item.id
                          ? "default"
                          : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => {
                        setCurrentPage(item.id as Page);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            </nav>

            {/* Bottom actions */}
            <div className="p-4 border-t space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        <div
          className={`
            lg:hidden fixed inset-0 w-72 bg-background border-r z-50 transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="w-72 h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">EmotiCare</h1>
                  <p className="text-sm text-muted-foreground">Mental Health Support</p>
                </div>
              </div>
            </div>

            {/* User info */}
            <div className="p-6 border-b">
              <div className="space-y-2">
                <h3 className="font-medium">{user.full_name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.role}</Badge>
                  {user.is_active && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={currentPage === item.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setCurrentPage(item.id as Page);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            </nav>

            {/* Bottom actions */}
            <div className="p-4 border-t space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <main className="h-full w-full">
            {renderCurrentPage()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}