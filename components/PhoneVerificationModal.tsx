import { useState, useEffect, useCallback, useRef } from "react";
import { showToast } from "@/lib/toast";
import { ChevronRight } from "lucide-react";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerifySuccess: () => void;
  language: "en" | "bn";
  checkExists?: boolean;
}

const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onVerifySuccess,
  language,
  checkExists = false,
}: PhoneVerificationModalProps) {
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", ""]);
  const code = codeDigits.join("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on open and reset code digits
  useEffect(() => {
    if (isOpen) {
      setCodeDigits(["", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const newDigits = [...codeDigits];
      newDigits[index] = "";
      setCodeDigits(newDigits);
      if (error) setError("");
      return;
    }

    const digit = cleanValue[cleanValue.length - 1]; // take the last entered char
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);
    if (error) setError("");

    // Focus next input if current one is filled
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
      if (error) setError("");
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
      if (error) setError("");

      // Focus the appropriate input
      const focusIndex = Math.min(pastedData.length, 3);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const t = {
    title: { en: "Verify Your Phone Number", bn: "মোবাইল নম্বর যাচাইকরণ" },
    subtitle: {
      en: `We have sent a 4-digit OTP code to +88${phoneNumber}`,
      bn: `আমরা আপনার +88${phoneNumber} নম্বরে একটি ৪-ডিজিটের ওটিপি কোড পাঠিয়েছি।`,
    },
    placeholder: { en: "Enter 4-digit OTP", bn: "৪-ডিজিটের ওটিপি লিখুন" },
    btnVerify: { en: "Verify", bn: "যাচাই করুন" },
    btnResend: { en: "Resend Code", bn: "পুনরায় কোড পাঠান" },
    btnCancel: { en: "Cancel", bn: "বাতিল করুন" },
    verifyingText: { en: "Verifying...", bn: "যাচাই করা হচ্ছে..." },
    sendingText: { en: "Sending...", bn: "পাঠানো হচ্ছে..." },
    expired: { en: "Code expired. Please resend.", bn: "কোডের মেয়াদ শেষ। আবার পাঠান।" },
    success: { en: "Verification successful!", bn: "সফলভাবে যাচাই করা হয়েছে!" },
  };

  const sendOtp = useCallback(async () => {
    if (!phoneNumber) return;
    setSending(true);
    setError("");
    setCodeDigits(["", "", "", ""]);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    try {
      const res = await fetch("/api/verify-phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, checkExists }),
      });
      const data = await res.json();
      if (res.ok) {
        setTimer(120);
        if (typeof window !== "undefined") {
          document.cookie = `otp_last_sent_${phoneNumber}=${Date.now()}; path=/; max-age=120`;
        }
        showToast.success(
          language === "en"
            ? "OTP sent successfully!"
            : "ওটিপি সফলভাবে পাঠানো হয়েছে!"
        );
      } else {
        setError(data.error || "Failed to send OTP.");
      }
    } catch {
      setError(language === "en" ? "Failed to connect. Try again." : "সংযোগ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSending(false);
    }
  }, [phoneNumber, checkExists, language, setCodeDigits]);

  // Send OTP automatically when modal opens
  useEffect(() => {
    if (isOpen && phoneNumber) {
      if (typeof window !== "undefined") {
        const lastSentTimeStr = getCookie(`otp_last_sent_${phoneNumber}`);
        if (lastSentTimeStr) {
          const elapsed = Math.floor((Date.now() - parseInt(lastSentTimeStr)) / 1000);
          if (elapsed < 120) {
            setTimer(120 - elapsed);
            return;
          }
        }
      }
      sendOtp();
    }
  }, [isOpen, phoneNumber, sendOtp]);

  // Countdown timer logic
  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 4) {
      setError(language === "en" ? "Please enter a valid 4-digit code." : "অনুগ্রহ করে ৪-ডিজিটের কোড দিন।");
      return;
    }

    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/verify-phone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast.success(t.success[language]);
        onVerifySuccess();
        onClose();
      } else {
        setError(data.error || "Invalid OTP code.");
      }
    } catch {
      setError(language === "en" ? "Failed to verify. Try again." : "যাচাইকরণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 transform transition-all duration-300 scale-100">
        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
          {t.title[language]}
        </h3>
        <p className="text-sm text-slate-600 text-center mb-6">
          {t.subtitle[language]}
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center gap-3">
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
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-2xl focus:border-[#3DB5A0] focus:ring-4 focus:ring-[#3DB5A0]/10 transition-all outline-none text-slate-800"
                  required
                />
              ))}
            </div>
            {error && (
              <p className="text-xs text-red-500 font-medium text-center">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-500">
              {timer > 0 ? (
                <span className="text-slate-600 font-mono">
                  {formatTime(timer)}
                </span>
              ) : (
                <span className="text-red-500">{t.expired[language]}</span>
              )}
            </span>
            <button
              type="button"
              onClick={sendOtp}
              disabled={timer > 0 || sending}
              className="text-primary disabled:text-slate-400 font-semibold transition-colors"
            >
              {sending ? t.sendingText[language] : t.btnResend[language]}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              {t.btnCancel[language]}
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="btn-primary btn-slide rounded-2xl flex justify-center items-center gap-2"
            >
              {verifying ? t.verifyingText[language] : t.btnVerify[language]}
              <ChevronRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
