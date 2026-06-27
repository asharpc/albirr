import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Login({ className, ...props }: LoginFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Make API call to Django backend
      const response = await api.post("accounts/login/", {
        email: email,
        password,
      });

      // Store tokens AND flip auth state so ProtectedRoute lets us through
      login(response.data.access, response.data.refresh);

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      // Check if the error response contains the specific email verification error
      if (
        error.response &&
        error.response.data &&
        error.response.data.error === "Email not verified. Please verify your email."
      ) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Email not verified. Please verify your email.",
        });
      } else {
        // Handle other errors (e.g., invalid credentials)
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-school-purple-light p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-white p-2 shadow-md">
              <School className="h-12 w-12 text-school-purple" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Eazy Skool
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>
        <div className={cn("grid gap-6", className)} {...props}>
          <form onSubmit={onSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button disabled={isLoading} type="submit">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link
              to="/auth/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}