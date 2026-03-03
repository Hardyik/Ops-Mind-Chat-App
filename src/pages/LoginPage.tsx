import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sun, Moon, Shield, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("admin@infotact.com");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Quick-fill demo credentials
  const fillDemo = (role: "admin" | "employee") => {
    if (role === "admin") {
      setEmail("admin@infotact.com");
      setPassword("admin123");
    } else {
      setEmail("john@infotact.com");
      setPassword("employee123");
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10"
      >
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">OpsMind AI</h1>
          <p className="text-muted-foreground mt-1 text-sm">by Infotact Solutions</p>
        </div>

        <Card className="glass">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Access your corporate knowledge assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@infotact.com"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              {/* Quick demo fill buttons */}
              <div className="space-y-2">
                <Label>Quick Demo Fill</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo("admin")}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${email === "admin@infotact.com"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                  >
                    <Shield className="h-4 w-4" />
                    Admin Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo("employee")}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${email === "john@infotact.com"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                  >
                    <User className="h-4 w-4" />
                    Employee Demo
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Run <code className="bg-muted px-1 rounded">npm run seed</code> in the backend to create demo users
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
