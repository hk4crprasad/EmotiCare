import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Heart } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    full_name: "",
    password: "",
    student_id: "",
  });

  const { login, register, isLoginLoading, isRegisterLoading } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register({
      ...registerData,
      role: "student",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">EmotiCare</CardTitle>
              <CardDescription>Mental Health Support</CardDescription>
            </div>
          </div>
          <CardTitle className="text-xl">
            {isLogin ? "Welcome Back" : "Join EmotiCare"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Sign in to access your mental health support" 
              : "Create your account for personalized support"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4" data-testid="form-login">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  data-testid="input-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoginLoading}
                data-testid="button-signin"
              >
                {isLoginLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" data-testid="form-register">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={registerData.full_name}
                  onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                  required
                  data-testid="input-fullname"
                />
              </div>
              <div>
                <Label htmlFor="regEmail">Email</Label>
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="student@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="STU001"
                  value={registerData.student_id}
                  onChange={(e) => setRegisterData({ ...registerData, student_id: e.target.value })}
                  required
                  data-testid="input-studentid"
                />
              </div>
              <div>
                <Label htmlFor="regPassword">Password</Label>
                <Input
                  id="regPassword"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  data-testid="input-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isRegisterLoading}
                data-testid="button-create-account"
              >
                {isRegisterLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}
          
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              data-testid="button-toggle-auth"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
