import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Heart, User, Shield, GraduationCap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService, RegisterData } from '../services/api';

interface AuthPageProps {
  onLogin: (user: any, token: string) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'counselor' | 'admin'>('student');

  // Registration form state
  const [registerData, setRegisterData] = useState<RegisterData>({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    student_id: '',
    department: '',
    year_of_study: 'first_year',
    gender: 'prefer_not_to_say',
    age: 18,
    phone_number: '',
    emergency_contact: ''
  });

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiService.login(email, password);
      toast.success('Login successful!');
      onLogin(response.user, response.access_token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.email || !registerData.password || !registerData.full_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate student_id for students
    if (registerData.role === 'student' && (!registerData.student_id || registerData.student_id.trim() === '')) {
      toast.error('Student ID is required for student registration');
      return;
    }

    // Validate password strength
    if (registerData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(registerData.password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(registerData.password)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }
    if (!/\d/.test(registerData.password)) {
      toast.error('Password must contain at least one number');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(registerData.password)) {
      toast.error('Password must contain at least one special character');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.register(registerData);
      toast.success('Registration successful! Please log in with your credentials.');
      setSuccess('Registration successful! Please log in with your credentials.');
      // Reset form
      setRegisterData({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        student_id: '',
        department: '',
        year_of_study: 'first_year',
        gender: 'prefer_not_to_say',
        age: 18,
        phone_number: '',
        emergency_contact: ''
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'student' as const,
      email: 'student@college.edu',
      password: 'password123',
      description: 'Access all student features including AI chat, booking, resources, and peer support'
    },
    {
      role: 'counselor' as const,
      email: 'counselor@college.edu',
      password: 'password123',
      description: 'Manage appointments, view student interactions, and provide professional support'
    },
    {
      role: 'admin' as const,
      email: 'admin@college.edu',
      password: 'password123',
      description: 'Full analytics dashboard, user management, and system administration'
    }
  ];

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedRole(account.role);
    // Auto-login after a brief delay
    setTimeout(() => handleLogin(), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-3 sm:p-4 lg:p-6">
      <div className="max-w-sm sm:max-w-md lg:max-w-lg w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-xl sm:text-2xl font-semibold text-primary">EmotiCare</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">Welcome Back</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Sign in to access your mental health support platform</p>
        </div>

        {/* Demo Account Quick Access */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Demo Access</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">
            Try the platform with different user roles to explore all features:
          </p>
          
          <div className="space-y-2 sm:space-y-3">
            {demoAccounts.map((account) => (
              <div key={account.role} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    {account.role === 'student' && <GraduationCap className="h-4 w-4 text-blue-500" />}
                    {account.role === 'counselor' && <User className="h-4 w-4 text-green-500" />}
                    {account.role === 'admin' && <Shield className="h-4 w-4 text-purple-500" />}
                    <span className="font-medium capitalize text-sm sm:text-base">{account.role}</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleDemoLogin(account)}
                    disabled={isLoading}
                    className="w-full sm:w-auto text-xs"
                  >
                    {isLoading ? 'Signing in...' : 'Try Now'}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{account.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Traditional Login Form */}
        <Card className="p-4 sm:p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="signin" className="text-xs sm:text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-3 sm:space-y-4 mt-0">
              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm leading-relaxed">{error}</span>
                </div>
              )}
              
              {success && (
                <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm leading-relaxed">{success}</span>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@college.edu"
                  disabled={isLoading}
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="text-sm sm:text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                className="w-full text-sm sm:text-base" 
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <a href="#" className="text-xs sm:text-sm text-blue-600 hover:underline">
                  Forgot your password?
                </a>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-3 sm:space-y-4 mt-0">
              {/* Error/Success Messages for Registration */}
              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm leading-relaxed">{error}</span>
                </div>
              )}
              
              {success && (
                <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm leading-relaxed">{success}</span>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Full Name *</label>
                <Input 
                  value={registerData.full_name}
                  onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">College Email *</label>
                <Input 
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="your.email@college.edu"
                  disabled={isLoading}
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <Input 
                  type="password" 
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="Create a secure password"
                  disabled={isLoading}
                />
                {registerData.password && (
                  <div className="mt-2 text-xs">
                    <div className="flex space-x-1">
                      <span className={registerData.password.length >= 8 ? "text-green-600" : "text-red-600"}>
                        ✓ 8+ characters
                      </span>
                      <span className={/[A-Z]/.test(registerData.password) ? "text-green-600" : "text-red-600"}>
                        ✓ Uppercase
                      </span>
                      <span className={/[a-z]/.test(registerData.password) ? "text-green-600" : "text-red-600"}>
                        ✓ Lowercase
                      </span>
                      <span className={/\d/.test(registerData.password) ? "text-green-600" : "text-red-600"}>
                        ✓ Number
                      </span>
                      <span className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(registerData.password) ? "text-green-600" : "text-red-600"}>
                        ✓ Special char
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['student', 'counselor', 'admin'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRegisterData({...registerData, role: role as any})}
                      className={`p-2 rounded-lg border text-sm capitalize ${
                        registerData.role === role 
                          ? 'border-primary bg-primary text-primary-foreground' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={isLoading}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {registerData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Student ID *</label>
                    <Input 
                      value={registerData.student_id || ''}
                      onChange={(e) => setRegisterData({...registerData, student_id: e.target.value})}
                      placeholder="Enter your student ID"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <Input 
                      value={registerData.department || ''}
                      onChange={(e) => setRegisterData({...registerData, department: e.target.value})}
                      placeholder="e.g., Computer Science"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Year of Study</label>
                    <select
                      value={registerData.year_of_study || 'first_year'}
                      onChange={(e) => setRegisterData({...registerData, year_of_study: e.target.value as any})}
                      className="w-full p-2 border border-gray-200 rounded-lg"
                      disabled={isLoading}
                    >
                      <option value="first_year">1st Year</option>
                      <option value="second_year">2nd Year</option>
                      <option value="third_year">3rd Year</option>
                      <option value="fourth_year">4th Year</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="phd">PhD</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <label className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1" disabled={isLoading} />
                  <span className="text-sm text-gray-600">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and 
                    <a href="#" className="text-blue-600 hover:underline"> Privacy Policy</a>
                  </span>
                </label>
                
                <label className="flex items-start space-x-2">
                  <input type="checkbox" className="mt-1" disabled={isLoading} />
                  <span className="text-sm text-gray-600">
                    I consent to receive support and educational communications
                  </span>
                </label>
              </div>

              <Button 
                className="w-full" 
                onClick={handleRegister}
                disabled={isLoading || !registerData.email || !registerData.password || !registerData.full_name}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Privacy Notice */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-2">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Privacy & Security</p>
              <p>
                Your mental health data is encrypted and confidential. We never share personal 
                information without your explicit consent. Anonymous usage data helps improve our services.
              </p>
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-center text-sm text-red-800">
            <p className="font-medium mb-1">In Crisis? Get Immediate Help</p>
            <p>National Suicide Prevention Lifeline: <strong>988</strong></p>
            <p>Campus Emergency: <strong>Campus Security</strong></p>
          </div>
        </Card>
      </div>
    </div>
  );
}