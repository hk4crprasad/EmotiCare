import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { User, LoginRequest, RegisterRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const token = authStorage.getToken();
    const storedUser = authStorage.getUser();
    
    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (data) => {
      const { access_token, user } = data;
      authStorage.setToken(access_token);
      authStorage.setUser(user);
      setUser(user);
      setIsAuthenticated(true);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      // Navigate to dashboard after successful login
      setLocation('/dashboard');
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: (data) => {
      const { id, email, full_name, role, student_id } = data;
      // After registration, we need to login
      toast({
        title: "Registration successful!",
        description: "Please log in with your new account.",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      authStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      // Navigate to login page after logout
      setLocation('/login');
    },
    onError: () => {
      // Even if the API call fails, clear local storage
      authStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
      // Navigate to login page even if logout fails
      setLocation('/login');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      authStorage.setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/v1/auth/me'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: api.changePassword,
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been successfully changed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Password change failed",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    },
  });

  const login = (credentials: LoginRequest) => {
    loginMutation.mutate(credentials);
  };

  const register = (userData: RegisterRequest) => {
    registerMutation.mutate(userData);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const updateProfile = (data: { full_name?: string; phone_number?: string }) => {
    updateProfileMutation.mutate(data);
  };

  const changePassword = (data: { current_password: string; new_password: string }) => {
    changePasswordMutation.mutate(data);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isUpdateProfileLoading: updateProfileMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,
  };
}
