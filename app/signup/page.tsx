"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { showToast } from "@/lib/toast";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";

const signupSchema = z
  .object({
    userType: z.enum(["user"], {
      message: "Please select a user type",
    }).default("user"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phoneNumber: z.string().length(11, "Phone number must be exactly 11 digits").regex(/^[0-9]+$/, "Phone number must contain only digits"),
    fullName: z.string().min(2, "Full name is required"),
    gender: z.enum(["male", "female"]),
    bloodGroup: z.string().optional(),
    age: z.preprocess(
      (val) => (val === "" || val === undefined ? undefined : Number(val)),
      z.number().min(1, "Age must be greater than 0").max(150, "Age must be less than 150")
    ),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";
import Image from "next/image";

export default function SignupPage() {
  const { language } = useLanguage() as { language: 'en' | 'bn' };
  const t = homepageTranslations[language].authPage;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [tempSignupData, setTempSignupData] = useState<SignupFormValues | null>(null);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema) as any,
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const agreeToTerms = watch("agreeToTerms");
  const phoneNumber = watch("phoneNumber");

  // Debounced phone number registration status check
  useEffect(() => {
    if (!phoneNumber) {
      setPhoneErrorMsg("");
      return;
    }

    if (phoneNumber.length !== 11 || !phoneNumber.startsWith("01")) {
      setPhoneErrorMsg(language === 'en' ? "Phone number must be exactly 11 digits starting with 01." : "ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে এবং ০১ দিয়ে শুরু হতে হবে।");
      return;
    }

    setPhoneErrorMsg("");

    const delayDebounce = setTimeout(async () => {
      setIsCheckingPhone(true);
      try {
        const res = await fetch(`/api/auth/check-phone?phoneNumber=${phoneNumber}`);
        const data = await res.json();
        if (data.exists) {
          setPhoneErrorMsg(language === 'en' ? "Phone number already registered." : "এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে।");
        }
      } catch (err) {
        console.error("Error checking phone existence:", err);
      } finally {
        setIsCheckingPhone(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [phoneNumber, language]);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/check-phone?phoneNumber=${data.phoneNumber}`);
      const checkData = await res.json();
      if (checkData.exists) {
        setPhoneErrorMsg(language === 'en' ? "Phone number already registered." : "এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে।");
        showToast.error(language === 'en' ? "Phone number already registered." : "এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে।");
        setIsLoading(false);
        return;
      }

      setPhoneErrorMsg("");
      setTempSignupData(data);
      setShowVerifyModal(true);
    } catch (err) {
      console.error("Error checking phone number before signup:", err);
      showToast.error("Failed to verify phone number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySuccess = async () => {
    if (!tempSignupData) return;
    setIsLoading(true);
    try {
      const { confirmPassword, agreeToTerms, ...userData } = tempSignupData;
      
      // Prepend +880 and strip leading zero if present
      let formattedPhone = userData.phoneNumber;
      if (!formattedPhone.startsWith("+880")) {
        const cleanPhone = formattedPhone.replace(/^0+/, '');
        formattedPhone = `+880${cleanPhone}`;
      }
      userData.phoneNumber = formattedPhone;
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        // Store user data in localStorage
        if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
          // Dispatch event to update navbar
          window.dispatchEvent(new Event("userLogin"));
        }

        const userType = tempSignupData.userType;
        if (userType === 'user') {
          router.push("/");
          showToast.success(language === 'en' ? "Account created successfully! You are now logged in." : "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! আপনি এখন লগ ইন করেছেন।");
        }
        router.refresh();
      } else {
        showToast.error(result.error || (language === 'en' ? "Signup failed" : "সাইনআপ ব্যর্থ হয়েছে"));
      }
    } catch (error) {
      showToast.error(language === 'en' ? "An error occurred. Please try again." : "একটি সমস্যা দেখা দিয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="min-h-screen flex flex-col" style={{
      backgroundImage: "url('/slide.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 pt-24 pb-16 md:pt-28 md:pb-20">
        <div className="w-full max-w-6xl">
          <div className="bg-white/20 backdrop-blur-lg rounded-lg sm:rounded-3xl shadow-2xl overflow-hidden border border-white/30">
            <div className="grid md:grid-cols-5 gap-0">
              {/* Left Section - Branding */}
              <div className="hidden md:flex md:col-span-2 bg-gradient-to-br from-primary/20 to-primary-dark/20 p-6 lg:p-12 flex-col justify-center text-white">
                <div className="space-y-4 lg:space-y-6">
                  <div className="flex items-center gap-3 mb-4 lg:mb-8">
                    <Image src="/SVG/asset-3.png" alt="Logo" width={200} height={50} />
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-bold leading-tight">
                    {t.signupTitle}
                  </h2>
                  <p className="text-base lg:text-lg text-white/90 leading-relaxed">
                    {t.signupSubtitle}
                  </p>
                  <p className="text-sm lg:text-base text-white/80">
                    {t.signupSubtitle2}
                  </p>
                </div>
              </div>

              {/* Right Section - Signup Form */}
              <div className="md:col-span-3 lg:col-span-3 bg-white/95 backdrop-blur-sm p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t.createAccountTitle}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{t.createAccountSubtitle}</p>

                  <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-3 sm:space-y-4">
                    <div>
                    
                      {errors.userType && (
                        <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.userType.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="fullName" className="text-sm sm:text-base">
                        {t.fullName} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder={t.fullNamePlaceholder}
                        {...register("fullName")}
                        className="mt-1 text-sm sm:text-base"
                      />
                      {errors.fullName && (
                        <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber" className="text-sm sm:text-base">
                        {t.phoneNumber} <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative flex items-center mt-1">
                        <span className="absolute left-3 flex items-center gap-1.5 text-gray-500 text-sm border-r pr-2 h-6 border-gray-300 pointer-events-none select-none">
                          <img src="https://flagcdn.com/w40/bd.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
                          <span>+88</span>
                        </span>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          maxLength={11}
                          placeholder={t.phoneNumberPlaceholder}
                          {...register("phoneNumber", {
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                            }
                          })}
                          className="pl-[5rem] w-full text-sm sm:text-base"
                        />
                      </div>
                      {isCheckingPhone && (
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'en' ? "Checking availability..." : "পরীক্ষা করা হচ্ছে..."}</span>
                        </p>
                      )}
                      {!isCheckingPhone && phoneErrorMsg && (
                        <p className="text-xs sm:text-sm text-red-500 mt-1">{phoneErrorMsg}</p>
                      )}
                      {!isCheckingPhone && !phoneErrorMsg && errors.phoneNumber && (
                        <p className="text-xs sm:text-sm text-red-500 mt-1">{language === 'en' ? "Please provide 11 digits number (starting with 01). Example: 01XXXXXXXXX" : "অনুগ্রহ করে 11 ডিজিটের নম্বরটি দিন (01 দিয়ে শুরু করুন)। যেমন: 01XXXXXXXXX"}</p>
                      )}
                 
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm sm:text-base">{t.emailOptional}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t.emailPlaceholder}
                        {...register("email")}
                        className="mt-1 text-sm sm:text-base"
                      />
                      {errors.email && (
                        <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gender" className="text-sm sm:text-base">
                          {t.gender} <span className="text-red-500">*</span>
                        </Label>
                        <Select id="gender" {...register("gender")} className="mt-1 text-sm sm:text-base">
                          <option value="">{t.genderPlaceholder}</option>
                          <option value="male">{t.male}</option>
                          <option value="female">{t.female}</option>
                          <option value="other">{t.other}</option>
                        </Select>
                        {errors.gender && (
                          <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.gender.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="age" className="text-sm sm:text-base">
                          {t.age} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder={t.agePlaceholder}
                          {...register("age")}
                          className="mt-1 text-sm sm:text-base"
                        />
                        {errors.age && (
                          <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.age.message}</p>
                        )}
                      </div>
                    </div>

                    {errors.bloodGroup && (
                      <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.bloodGroup.message}</p>
                    )}

                    <div>
                      <Label htmlFor="password" className="text-sm sm:text-base">
                        {t.password} <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t.passwordPlaceholder}
                          {...register("password")}
                          className="text-sm sm:text-base pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm sm:text-base">
                        {t.confirmPassword} <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t.confirmPasswordPlaceholder}
                          {...register("confirmPassword")}
                          className="text-sm sm:text-base pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs sm:text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="agreeToTerms"
                        checked={agreeToTerms}
                        onChange={(e) => setValue("agreeToTerms", e.target.checked)}
                        className="mt-1"
                      />
                      <Label htmlFor="agreeToTerms" className="text-xs sm:text-sm font-normal cursor-pointer leading-relaxed">
                        {t.agreeTerms}{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          {t.termsAndConditions}
                        </Link>
                      </Label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-xs sm:text-sm text-red-500">{errors.agreeToTerms.message}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary-light to-primary hover:from-primary hover:to-primary-dark text-white text-sm sm:text-base py-2 sm:py-3"
                      disabled={isLoading}
                    >
                      {isLoading ? t.creatingAccountBtn : t.signUpBtn}
                    </Button>
                  </form>

                  {/* Or divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">
                        {language === 'bn' ? 'অথবা' : 'Or'}
                      </span>
                    </div>
                  </div>

                  {/* Google Sign-in Button */}
                  <div className="w-full flex justify-center mb-6">
                    <div id="google-signup-button" className="w-full" />
                  </div>

                  <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
                    {t.alreadyHaveAccount}{" "}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                      {t.signInLink}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PhoneVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        phoneNumber={phoneNumber}
        onVerifySuccess={handleVerifySuccess}
        language={language}
        checkExists={true}
      />
      <Footer />
    </div>
  );
}
