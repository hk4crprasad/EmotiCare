import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ChatInterface } from './components/ChatInterface';
import { BookingSystem } from './components/BookingSystem';
import { ResourceHub } from './components/ResourceHub';
import { PeerSupport } from './components/PeerSupport';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthPage } from './components/AuthPage';
import Assessment from './components/Assessment';
import Dashboard from './components/Dashboard';
import Posts from './components/Posts';
import { User, apiService } from './services/api';

export type Page = 'home' | 'chat' | 'booking' | 'resources' | 'forum' | 'admin' | 'auth' | 'assessment' | 'dashboard' | 'posts';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'counselor' | 'admin'>('student');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const existingToken = localStorage.getItem('access_token');
      if (existingToken) {
        try {
          // Verify token is still valid by fetching user data
          const userData = await apiService.getCurrentUser();
          setIsAuthenticated(true);
          setUserRole(userData.role);
          setUser(userData);
          setToken(existingToken);
          toast.success(`Welcome back, ${userData.full_name}!`);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('access_token');
          apiService.clearToken();
          console.error('Invalid token on app load:', error);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (userData: User, accessToken: string) => {
    setIsAuthenticated(true);
    setUserRole(userData.role);
    setUser(userData);
    setToken(accessToken);
    setCurrentPage('home');
    toast.success(`Welcome, ${userData.full_name}!`);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    } finally {
      setIsAuthenticated(false);
      setUserRole('student');
      setUser(null);
      setToken('');
      setCurrentPage('home');
    }
  };

  const renderPage = () => {
    if (!isAuthenticated && currentPage !== 'home') {
      return <AuthPage onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'home':
        return <LandingPage onNavigate={setCurrentPage} isAuthenticated={isAuthenticated} />;
      case 'chat':
        return <ChatInterface />;
      case 'booking':
        return <BookingSystem />;
      case 'resources':
        return <ResourceHub userRole={userRole} isAuthenticated={isAuthenticated} />;
      case 'forum':
        return <PeerSupport />;
      case 'assessment':
        return <Assessment />;
      case 'dashboard':
        return <Dashboard />;
      case 'posts':
        return <Posts />;
      case 'admin':
        return userRole === 'admin' ? <AdminDashboard /> : <LandingPage onNavigate={setCurrentPage} isAuthenticated={isAuthenticated} />;
      case 'auth':
        return <AuthPage onLogin={handleLogin} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} isAuthenticated={isAuthenticated} />;
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Header 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        onLogout={handleLogout}
      />
      <main>
        {renderPage()}
      </main>
    </div>
  );
}