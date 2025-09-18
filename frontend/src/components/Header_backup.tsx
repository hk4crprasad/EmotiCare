import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, Calendar, BookOpen, Users, BarChart3, LogOut, Brain, LayoutDashboard, Share2, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: any) => void;
  isAuthenticated: boolean;
  userRole: 'student' | 'counselor' | 'admin';
  onLogout: () => void;
}

export function Header({ currentPage, onNavigate, isAuthenticated, userRole, onLogout }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'home', label: 'Home', shortLabel: 'Home', icon: Heart },
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Support', shortLabel: 'AI', icon: MessageCircle },
    { id: 'assessment', label: 'Assessment', shortLabel: 'Test', icon: Brain },
    { id: 'posts', label: 'Community', shortLabel: 'Posts', icon: Share2 },
    { id: 'booking', label: 'Book Session', shortLabel: 'Book', icon: Calendar },
    { id: 'resources', label: 'Resources', shortLabel: 'Resources', icon: BookOpen },
    { id: 'forum', label: 'Peer Support', shortLabel: 'Forum', icon: Users },
  ];

  if (userRole === 'admin') {
    navigationItems.push({ id: 'admin', label: 'Admin', shortLabel: 'Admin', icon: BarChart3 });
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-shrink-0"
            onClick={() => onNavigate('home')}
          >
            <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <span className="text-lg sm:text-xl font-bold text-primary hidden sm:block">EmotiCare</span>
            <span className="text-sm font-bold text-primary sm:hidden">EC</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-6xl overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center space-x-2 whitespace-nowrap text-sm px-3 py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Mobile Menu Button & Desktop Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop Logout */}
            {isAuthenticated && (
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="hidden lg:flex items-center space-x-2 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-3">
            <nav className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center space-y-1 h-auto py-3 text-xs"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:block">{item.label}</span>
                    <span className="sm:hidden">{item.shortLabel}</span>
                  </Button>
                );
              })}
            </nav>
            
            {/* Mobile Logout */}
            {isAuthenticated && (
              <div className="pt-3 border-t border-gray-100 mt-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  size="sm"
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xl:inline">{item.shortLabel}</span>
                </Button>
              );
            })}
          </nav>

          {/* Tablet Navigation - Icons only */}
          <nav className="hidden md:flex lg:hidden items-center space-x-1 flex-1 justify-center overflow-x-auto">
            {navigationItems.slice(0, 7).map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  size="sm"
                  className="p-2.5 rounded-lg flex-shrink-0"
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center space-x-3">
                  <Badge variant="secondary" className="text-xs px-3 py-1 font-medium">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                </div>
                <Button variant="outline" onClick={onLogout} size="sm" className="px-3 py-2 text-sm rounded-lg">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button onClick={() => onNavigate('auth')} size="sm" className="px-4 py-2 rounded-lg">
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="grid grid-cols-2 gap-2 p-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-start space-x-3 p-4 text-sm font-medium rounded-lg h-12"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}