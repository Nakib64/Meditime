"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ChevronRight } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "select_phone" | "otp">("credentials");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [timer, setTimer] = useState(120); // 2 minutes countdown for OTP resend
  const [phoneOptions, setPhoneOptions] = useState<{ lastDigits: string; masked: string }[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  
  // OTP digits state
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  // Timer countdown logic
  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  // Focus first OTP field when step transitions to OTP
  useEffect(() => {
    if (step === "otp") {
      setCodeDigits(["", "", "", ""]);
      setTimer(120);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const handlePasswordLogin = async (e: React.FormEvent, chosenPhone?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, selectedPhone: chosenPhone }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.step === "select_phone") {
          setPhoneOptions(result.phoneNumbers);
          setSelectedPhone(result.phoneNumbers[0]?.lastDigits || "");
          setStep("select_phone");
          showToast.success("Select a phone number for verification");
        } else if (result.step === "verify_phone") {
          // Mask phone number (e.g. 017*****123)
          const phone = result.phoneNumber || "";
          const masked = phone.substring(0, 3) + "*****" + phone.substring(8);
          setMaskedPhone(masked);
          setStep("otp");
          showToast.success("Verification code sent to your phone");
        } else {
          // Standard login logic fallback if phone verification is not triggered
          window.dispatchEvent(new Event("adminLogin"));
          showToast.success("Welcome back, Admin!");
          router.push("/admin");
          router.refresh();
        }
      } else {
        showToast.error(result.error || "Login failed");
      }
    } catch (error) {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeDigits.join("");
    if (code.length !== 4) {
      showToast.error("Please enter a 4-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (response.ok) {
        window.dispatchEvent(new Event("adminLogin"));
        showToast.success("Welcome back, Admin!");
        router.push("/admin");
        router.refresh();
      } else {
        showToast.error(result.error || "OTP verification failed");
      }
    } catch (error) {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, selectedPhone }),
      });
      const result = await response.json();
      if (response.ok) {
        setTimer(120);
        setCodeDigits(["", "", "", ""]);
        showToast.success("A new verification code has been sent!");
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        showToast.error(result.error || "Failed to resend code");
      }
    } catch {
      showToast.error("Failed to connect. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const newDigits = [...codeDigits];
      newDigits[index] = "";
      setCodeDigits(newDigits);
      return;
    }

    const digit = cleanValue[cleanValue.length - 1];
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);

    if (index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!codeDigits[index]) {
        if (index > 0) {
          const newDigits = [...codeDigits];
          newDigits[index - 1] = "";
          setCodeDigits(newDigits);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        const newDigits = [...codeDigits];
        newDigits[index] = "";
        setCodeDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pastedData) {
      const newDigits = [...codeDigits];
      for (let i = 0; i < 4; i++) {
        newDigits[i] = pastedData[i] || "";
      }
      setCodeDigits(newDigits);

      const focusIndex = Math.min(pastedData.length, 3);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary-dark/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-8 text-center bg-gradient-to-br from-primary to-primary-dark text-white">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                <ShieldCheck className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
            <p className="text-white/80">
              {step === "credentials"
                ? "Secure Administration Access"
                : step === "select_phone"
                ? "Select Phone for Verification"
                : "Verify SMS One-Time PIN"}
            </p>
          </div>

          <div className="p-8">
            {step === "credentials" ? (
              <form onSubmit={(e) => handlePasswordLogin(e)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@meditime.com"
                      className="pl-10 h-12 border-gray-200 focus:ring-primary focus:border-primary rounded-xl transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 h-12 border-gray-200 focus:ring-primary focus:border-primary rounded-xl transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold text-lg rounded-xl shadow-lg shadow-primary/20 transform active:scale-95 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    "Log In"
                  )}
                </Button>
              </form>
            ) : step === "select_phone" ? (
              <form onSubmit={(e) => handlePasswordLogin(e, selectedPhone)} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Select a phone number for verification:
                  </Label>
                  <div className="space-y-2">
                    {phoneOptions.map((option) => (
                      <label
                        key={option.lastDigits}
                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedPhone === option.lastDigits
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedPhone"
                          value={option.lastDigits}
                          checked={selectedPhone === option.lastDigits}
                          onChange={() => setSelectedPhone(option.lastDigits)}
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="font-medium text-md">{option.masked}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold text-lg rounded-xl shadow-lg shadow-primary/20 transform active:scale-95 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 transition-all font-semibold"
                  onClick={() => setStep("credentials")}
                >
                  Back to Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    We've sent a 4-digit verification code to your registered mobile number:
                  </p>
                  <p className="font-semibold text-gray-800 text-lg">{maskedPhone}</p>
                </div>

                <div className="flex justify-center gap-3 py-4">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={codeDigits[index]}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800"
                      required
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-gray-500">
                    {timer > 0 ? (
                      <span className="text-gray-600 font-mono">
                        Resend in {formatTime(timer)}
                      </span>
                    ) : (
                      <span className="text-red-500">Code expired</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={timer > 0 || isLoading}
                    className="text-primary disabled:text-gray-400 font-semibold transition-colors"
                  >
                    Resend Code
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="flex-1 py-3 px-4 border border-gray-200 rounded-2xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 flex justify-center items-center gap-2"
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Unauthorized access is strictly prohibited.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-primary hover:text-primary-dark font-medium cursor-pointer transition-colors" onClick={() => router.push('/')}>
                <span className="text-sm">Back to Main Website</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} Meditime Administration System.
        </p>
      </div>
    </div>
  );
}
