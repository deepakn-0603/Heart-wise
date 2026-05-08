import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useMounted();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard...",
        });
        
        setEmail("");
        setPassword("");
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        
      } else {
        toast({
          title: "Login Failed",
          description: data.error || data.detail || "An error occurred during login.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred while trying to log in.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-sm border-none shadow-xl relative z-10">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto mb-6">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your heart health dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  disabled={isLoading}
                  suppressHydrationWarning
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9"
                  disabled={isLoading}
                  placeholder="••••••••"
                  suppressHydrationWarning
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full shadow-md font-semibold" 
              disabled={isLoading} 
              suppressHydrationWarning
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-4">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
          <Link href="#" className="text-xs text-muted-foreground hover:underline">
            Forgot your password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}