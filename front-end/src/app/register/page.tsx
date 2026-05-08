"use client";

import { useState, useEffect } from "react";
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
import { Loader2, User, Mail, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumbers: /\d/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

interface PasswordStrength {
  score: number; // 0-5
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChar: boolean;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [emailValid, setEmailValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very Weak",
    color: "bg-red-500",
    requirements: {
      minLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumbers: false,
      hasSpecialChar: false,
    },
  });
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // OTP Timer
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendTimer]);

  // Email validation
  const validateEmail = (value: string) => {
    setEmail(value);
    if (!value) {
      setEmailError("Email is required");
      setEmailValid(false);
      return;
    }
    if (!EMAIL_REGEX.test(value)) {
      setEmailError("Please enter a valid email address");
      setEmailValid(false);
      return;
    }
    setEmailError("");
    setEmailValid(true);
  };

  // Password strength validation
  const validatePassword = (value: string) => {
    setPassword(value);

    const requirements = {
      minLength: value.length >= PASSWORD_REQUIREMENTS.minLength,
      hasUpperCase: PASSWORD_REQUIREMENTS.hasUpperCase.test(value),
      hasLowerCase: PASSWORD_REQUIREMENTS.hasLowerCase.test(value),
      hasNumbers: PASSWORD_REQUIREMENTS.hasNumbers.test(value),
      hasSpecialChar: PASSWORD_REQUIREMENTS.hasSpecialChar.test(value),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;

    let score = 0;
    let label = "Very Weak";
    let color = "bg-red-500";

    if (metRequirements === 0) {
      score = 0;
      label = "Very Weak";
      color = "bg-red-500";
    } else if (metRequirements <= 1) {
      score = 1;
      label = "Weak";
      color = "bg-red-500";
    } else if (metRequirements === 2) {
      score = 2;
      label = "Fair";
      color = "bg-yellow-500";
    } else if (metRequirements === 3) {
      score = 3;
      label = "Good";
      color = "bg-yellow-600";
    } else if (metRequirements === 4) {
      score = 4;
      label = "Strong";
      color = "bg-green-500";
    } else {
      score = 5;
      label = "Very Strong";
      color = "bg-green-600";
    }

    setPasswordStrength({
      score,
      label,
      color,
      requirements,
    });

    // Check if passwords match
    if (confirmPassword) {
      setPasswordMatch(value === confirmPassword);
    }
  };

  // Confirm password validation
  const validateConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    setPasswordMatch(password === value);
  };

  // Send OTP
  const sendOTP = async () => {
    if (!emailValid) {
      setEmailError("Please enter a valid email first");
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpResendTimer(60);
        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${email}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Could not send OTP",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not send OTP. Check your connection.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setOtpError("");
        toast({
          title: "Email Verified",
          description: "Your email has been verified successfully",
        });
      } else {
        setOtpError(data.error || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setOtpError("Could not verify OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validations
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter your full name",
      });
      return;
    }

    if (!emailValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email",
      });
      return;
    }

    if (!otpVerified) {
      toast({
        variant: "destructive",
        title: "Verification Required",
        description: "Please verify your email with OTP first",
      });
      return;
    }

    if (passwordStrength.score < 3) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least Good strength",
      });
      return;
    }

    if (!passwordMatch) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match",
      });
      return;
    }

    setIsLoading(true);

    try {;
      const response = await fetch(`${API_URL}/api/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: "You can now log in with your new account.",
        });
        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setOtpVerified(false);
        setOtpSent(false);
        
        setTimeout(() => router.push("/"), 1500);
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: data.error || "Could not register user.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not connect to the backend.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md border-none shadow-xl relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join HeartWise to start monitoring your heart health today.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-9"
                  required
                  disabled={isLoading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Field with OTP */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@example.com"
                      className={cn(
                        "pl-9 pr-10",
                        emailValid && "border-green-500 focus:border-green-500",
                        emailError && !emailValid && "border-red-500 focus:border-red-500"
                      )}
                      required
                      disabled={otpSent || isLoading}
                      value={email}
                      onChange={(e) => validateEmail(e.target.value)}
                    />
                    {emailValid && (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                    {emailError && (
                      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <Button
                    type="button"
                    disabled={!emailValid || otpSent || otpLoading || isLoading}
                    onClick={sendOTP}
                    className="w-24"
                  >
                    {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                  </Button>
                </div>

                {emailError && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* OTP Input */}
              {otpSent && !otpVerified && (
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="otp" className="text-sm">
                    Verification Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className={cn(
                        "text-center font-mono tracking-widest",
                        otpVerified && "border-green-500",
                        otpError && "border-red-500"
                      )}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setOtpError("");
                      }}
                    />
                    <Button
                      type="button"
                      disabled={otpLoading || otp.length !== 6}
                      onClick={verifyOTP}
                      className="w-24"
                    >
                      {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>

                  {otpError && (
                    <p className="text-sm text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {otpError}
                    </p>
                  )}

                  {otpVerified && (
                    <p className="text-sm text-green-500 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Email verified successfully
                    </p>
                  )}

                  {otpResendTimer > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Resend OTP in {otpResendTimer}s
                    </p>
                  )}

                  {otpResendTimer === 0 && !otpVerified && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={sendOTP}
                      disabled={otpLoading}
                    >
                      Resend OTP
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Password Field */}
            {otpVerified && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {showPasswordRequirements ? "Hide" : "Show"} requirements
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                      required
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => validatePassword(e.target.value)}
                      onFocus={() => setShowPasswordRequirements(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all",
                            i < passwordStrength.score ? passwordStrength.color : "bg-gray-200"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium">
                      Strength: <span className={`text-${passwordStrength.color.split("-")[1]}-600`}>
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>

                  {/* Requirements Checklist */}
                  {showPasswordRequirements && (
                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-xs">
                      <p className="font-semibold text-gray-700">Password must have:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordStrength.requirements.minLength ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-300" />
                          )}
                          <span className={passwordStrength.requirements.minLength ? "text-green-600" : ""}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordStrength.requirements.hasUpperCase ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-300" />
                          )}
                          <span className={passwordStrength.requirements.hasUpperCase ? "text-green-600" : ""}>
                            One uppercase letter (A-Z)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordStrength.requirements.hasLowerCase ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-300" />
                          )}
                          <span className={passwordStrength.requirements.hasLowerCase ? "text-green-600" : ""}>
                            One lowercase letter (a-z)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordStrength.requirements.hasNumbers ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-300" />
                          )}
                          <span className={passwordStrength.requirements.hasNumbers ? "text-green-600" : ""}>
                            One number (0-9)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordStrength.requirements.hasSpecialChar ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-300" />
                          )}
                          <span className={passwordStrength.requirements.hasSpecialChar ? "text-green-600" : ""}>
                            One special character (!@#$%^&*)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={cn(
                        "pl-9 pr-10",
                        password && confirmPassword && passwordMatch && "border-green-500",
                        password && confirmPassword && !passwordMatch && "border-red-500"
                      )}
                      required
                      disabled={isLoading}
                      value={confirmPassword}
                      onChange={(e) => validateConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {password && confirmPassword && !passwordMatch && (
                    <p className="text-sm text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Passwords do not match
                    </p>
                  )}

                  {password && confirmPassword && passwordMatch && (
                    <p className="text-sm text-green-500 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full shadow-md font-semibold mt-6"
                  disabled={
                    isLoading ||
                    !name ||
                    !emailValid ||
                    !otpVerified ||
                    passwordStrength.score < 3 ||
                    !passwordMatch
                  }
                >
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Account"}
                </Button>
              </>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/"
              className="font-semibold text-primary underline-offset-4 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}