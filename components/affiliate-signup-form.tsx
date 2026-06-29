"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, Copy } from "lucide-react";
import { showToast } from "@/lib/toast";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";
import { useLanguage } from "@/contexts/LanguageContext";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name/NID is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^[0-9]+$/, "Phone number must contain only digits"),
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

export default function AffiliateSignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [tempSignupData, setTempSignupData] = useState<SignupFormValues | null>(null);

  let language: "en" | "bn" = "bn";
  try {
    const langContext = useLanguage() as { language: "en" | "bn" };
    if (langContext && langContext.language) {
      language = langContext.language;
    }
  } catch (e) {}

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

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      let cleanPhone = data.phoneNumber.replace(/\D/g, "");
      if (cleanPhone.startsWith("880")) {
        cleanPhone = cleanPhone.substring(3);
      } else if (cleanPhone.startsWith("88")) {
        cleanPhone = cleanPhone.substring(2);
      }
      if (!cleanPhone.startsWith("0")) {
        cleanPhone = "0" + cleanPhone;
      }

      if (cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
        showToast.error("অবৈধ ফোন নম্বর। অবশ্যই ১১ ডিজিটের হতে হবে এবং ০১ দিয়ে শুরু হতে হবে।");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/auth/check-phone?phoneNumber=${cleanPhone}`);
      const checkData = await res.json();
      if (checkData.exists) {
        showToast.error("এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে।");
        setIsLoading(false);
        return;
      }

      setTempSignupData({
        ...data,
        phoneNumber: cleanPhone
      });
      setShowVerifyModal(true);
    } catch (err) {
      console.error("Error verifying phone number:", err);
      showToast.error("একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySuccess = async () => {
    if (!tempSignupData) return;
    setIsLoading(true);
    try {
      let formattedPhone = tempSignupData.phoneNumber;
      if (!formattedPhone.startsWith("+880")) {
        const cleanPhone = formattedPhone.replace(/^0+/, '');
        formattedPhone = `+880${cleanPhone}`;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: tempSignupData.name,
          email: tempSignupData.email,
          phoneNumber: formattedPhone,
          password: tempSignupData.password,
          userType: 'affiliate'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const affiliateData = result.affiliate || result.user;
        setAffiliateCode(affiliateData.affiliateCode);
        showToast.success("Affiliate account created successfully!");

        // Store affiliate data in localStorage
        localStorage.setItem("affiliate", JSON.stringify(affiliateData));
      } else {
        showToast.error(result.error || "Signup failed");
      }
    } catch (error) {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setShowVerifyModal(false);
    }
  };

  const copyAffiliateCode = () => {
    if (affiliateCode) {
      navigator.clipboard.writeText(affiliateCode);
      showToast.success("Affiliate code copied to clipboard!");
    }
  };

  if (affiliateCode) {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h3
            className="text-2xl font-bold text-gray-900 mb-2"

          >
            সফলভাবে নিবন্ধিত হয়েছে!
          </h3>
          <p
            className="text-gray-600 mb-6"

          >
            আপনার অ্যাফিলিয়েট কোড:
          </p>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-6 mb-6 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3">
            <code className="text-2xl font-bold text-primary">{affiliateCode}</code>
            <button
              onClick={copyAffiliateCode}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              title="Copy code"
            >
              <Copy className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>

        <p
          className="text-sm text-gray-600 mb-6"
        
        >
          এই কোডটি সংরক্ষণ করুন এবং আপনার রেফারেলের সাথে শেয়ার করুন
        </p>

        <Button
          onClick={() => window.location.href = "/affiliate-program/dashboard"}
          className="bg-gradient-to-r from-primary-light to-primary hover:from-primary hover:to-primary-dark text-white"
        
        >
          ড্যাশবোর্ডে যান
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h3
        className="text-2xl font-bold text-gray-900 mb-2"
        
      >
        অ্যাফিলিয়েট অ্যাকাউন্ট তৈরি করুন
      </h3>
      <p
        className="text-gray-600 mb-6"
        
      >
        আপনার তথ্য দিয়ে নিবন্ধন করুন
      </p>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <div>
          <Label htmlFor="name">
            নাম / এনআইডি <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="আপনার নাম বা এনআইডি লিখুন"
            {...register("name")}
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">
            ইমেইল <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="আপনার ইমেইল লিখুন"
            {...register("email")}
            className="mt-1"
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phoneNumber">
            ফোন নম্বর <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="আপনার ফোন নম্বর লিখুন"
            {...register("phoneNumber")}
            className="mt-1"
          />
          {errors.phoneNumber && (
            <p className="text-sm text-red-500 mt-1">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">
            পাসওয়ার্ড <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="পাসওয়ার্ড লিখুন"
              {...register("password")}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">
            পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="পাসওয়ার্ড আবার লিখুন"
              {...register("confirmPassword")}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="agreeToTerms"
            checked={agreeToTerms}
            onChange={(e) => setValue("agreeToTerms", e.target.checked)}
            className="mt-1"
          />
          <Label
            htmlFor="agreeToTerms"
            className="text-sm font-normal cursor-pointer leading-relaxed"

          >
            আমি মেডিটাইমের{" "}
            <Link href="/terms" className="text-primary hover:underline">
              শর্তাবলী
            </Link>{" "}
            এবং{" "}
            <Link href="/terms" className="text-primary hover:underline">
              নীতিমালা
            </Link>{" "}
            স্বীকার করছি
          </Label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary-light to-primary hover:from-primary hover:to-primary-dark text-white py-3"
          disabled={isLoading}
        
        >
          {isLoading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "নিবন্ধন করুন"}
        </Button>
      </form>

      {tempSignupData && (
        <PhoneVerificationModal
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          phoneNumber={tempSignupData.phoneNumber}
          onVerifySuccess={handleVerifySuccess}
          language={language}
          checkExists={true}
        />
      )}
    </div>
  );
}
