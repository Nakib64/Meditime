"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, CheckCircle2, Facebook, MessageCircle, Clock, Info, ShieldCheck } from "lucide-react";
import { showToast } from "@/lib/toast";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { FaFacebookF, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaHeadset } from "react-icons/fa";
import { trackContactFormSubmit } from "@/lib/gtm";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^(?:\+8801|01|8801)[3-9]\d{8}$/, "Please enter a valid Bangladeshi phone number"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  isExistingCustomer: z.enum(["yes", "no"], {
    error: "Please select if you are an existing customer",
  }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const SUBJECTS = [
  { en: "Doctor & Video Consultation", bn: "ডাক্তার বুকিং ও ভিডিও কল সংক্রান্ত" },
  { en: "Hospital & Test Booking", bn: "হাসপাতাল তথ্য ও ল্যাব টেস্ট সংক্রান্ত" },
  { en: "Ambulance Emergency", bn: "জরুরি অ্যাম্বুলেন্স সেবা" },
  { en: "Blood Donor Services", bn: "রক্তের জন্য অনুরোধ বা ডোনার হতে চাইলে" },
  { en: "Health Discount Card", bn: "ডিসকাউন্ট কার্ডের সুবিধা সংক্রান্ত" },
  { en: "Payment & Refund Issues", bn: "পেমেন্ট বা টাকা ফেরত সংক্রান্ত সমস্যা" },
  { en: "Partnership Inquiry", bn: "ডাক্তার বা প্রতিষ্ঠান হিসেবে যুক্ত হতে চাইলে" },
  { en: "Account & Profile Issues", bn: "লগইন বা প্রোফাইল আপডেট সংক্রান্ত সমস্যা" },
  { en: "Feedback & Complaints", bn: "সেবার মান নিয়ে অভিযোগ বা মতামত" },
  { en: "General Inquiry", bn: "অন্যান্য যেকোনো সাধারণ তথ্যের জন্য" },
];

export default function ContactPage() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      isExistingCustomer: "no"
    }
  });

  const isExistingCustomer = watch("isExistingCustomer");
  const phoneVal = watch("phone");

  // Debounced phone number format check
  useEffect(() => {
    if (!phoneVal) {
      setPhoneErrorMsg("");
      return;
    }

    const timer = setTimeout(() => {
      if (phoneVal.length !== 11 || !phoneVal.startsWith("01")) {
        setPhoneErrorMsg(language === 'en' ? "Phone number must be exactly 11 digits starting with 01." : "ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে এবং ০১ দিয়ে শুরু হতে হবে।");
      } else {
        setPhoneErrorMsg("");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [phoneVal, language]);

  const onSubmit = async (data: ContactFormValues) => {
    if (phoneErrorMsg) {
      showToast.error(phoneErrorMsg);
      return;
    }
    setIsLoading(true);
    setIsSuccess(false);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        trackContactFormSubmit({
          name: data.name,
          phone: data.phone,
          email: data.email,
          subject: data.subject,
        });
        setIsSuccess(true);
        reset();
        showToast.success(language === 'bn' ? "অ্যাডমিনকে মেসেজ পাঠানো হয়েছে!" : "Message has been sent to admin!");
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        showToast.error(result.error || (language === 'en' ? "Failed to send message." : "মেসেজ পাঠাতে ব্যর্থ হয়েছে।"));
      }
    } catch (error) {
      showToast.error(language === 'en' ? "An error occurred." : "একটি সমস্যা দেখা দিয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative  h-[450px] md:h-[650px] w-full overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:95%_center] lg:bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero/contact.png')",
          }}
        />
        <div className="relative z-20 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl w-full text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-2xl md:text-5xl lg:text-[50px] font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                {language === 'bn' ? "আমাদের সাথে যোগাযোগ করুন" : "Contact Us"}              </h1>
              <p className="text-sm  md:text-xl text-white/90 drop-shadow-lg max-w-3xl  leading-relaxed">
                {language === 'bn'
                  ? "আপনার যেকোনো জিজ্ঞাসা বা সাহায্যের জন্য আমরা ২৪/৭ নিয়োজিত আছি।"
                  : "Have questions or need help? Our support team is here for you 24/7."}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-30">
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Info Cards */}
          <div className="lg:col-span-4 flex flex-col space-y-6 h-full ">
            {/* Emergency Hotline Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#193252] rounded-[32px] p-8 text-white shadow-2xl overflow-hidden group"
            >

              <div className="">
                <h2 className="text-3xl font-bold mb-6">
                  {language === 'bn' ? "জরুরি হেল্পলাইন" : "Emergency Helpline"}
                </h2>
                <a
                  href="tel:+8801610384444"
                  className="inline-flex items-center gap-4 bg-white text-[#193252] md:px-8 px-4 py-4 rounded-2xl font-bold text-2xl shadow-lg hover:bg-orange-50 transition-all active:scale-95"
                >
                  <Phone className="w-6 h-6" />
                  +880 1610-384444
                </a>
              </div>
            </motion.div>

            {/* Contact Details Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[32px] flex-1 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100"
            >
              <h3 className="text-3xl font-bold text-slate-900 mb-10">
                {language === 'bn' ? "যোগাযোগের মাধ্যম" : "Get in Touch"}
              </h3>

              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#00B1C2] flex items-center justify-center text-white shrink-0 border border-slate-100">
                    <a href="mailto:support@meditime.com.bd">   <FaEnvelope className="w-6 h-6" /></a>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Email</p>
                    <a href="mailto:support@meditime.com.bd" className="text-lg font-bold text-slate-900 hover:text-[#3DB5A0] transition-colors">
                      support@meditime.com.bd
                    </a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#00B1C2] flex items-center justify-center text-white shrink-0 border border-slate-100">
                    <a href="tel:+8801610384444">   <Phone className="w-6 h-6" /></a>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Phone</p>
                    <a href="tel:+8801610384444" className="text-lg font-bold text-slate-900 hover:text-[#3DB5A0] transition-colors">
                      +880 1610-384444
                    </a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#00B1C2] flex items-center justify-center text-white shrink-0 border border-slate-100">
                    <a href="https://www.facebook.com/meditime.com.bd" target="_blank">
                      <FaFacebookF className="w-6 h-6" />
                    </a>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Facebook</p>
                    <a href="https://www.facebook.com/meditime.com.bd" target="_blank" className="text-lg font-bold text-slate-900 hover:text-[#3DB5A0] transition-colors">
                      meditime.com.bd
                    </a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#00B1C2] flex items-center justify-center text-white shrink-0 border border-slate-100">
                    <FaMapMarkerAlt className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Address</p>
                    <p className="text-lg font-bold text-slate-900 leading-relaxed">
                      {language === 'bn'
                        ? 'সাভার ডিওএইচএস, ঢাকা-১৩৪৪, বাংলাদেশ'
                        : 'Savar DOHS, Dhaka-1344, Bangladesh'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 h-full"
          >
            <Card className="bg-white rounded-[40px] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.06)] border border-[#00B1C2] h-full">
              <div className="text-center mb-12">
                <h3 className="text-[32px] md:text-[42px] font-bold text-[#1a1a1a] ">
                  {language === 'bn' ? "আমাদের কাছে কি কোনো প্রশ্ন আছে?" : "Have a question for us?"}
                </h3>
                <section className="text-[#1a1a1a] text-lg">
                  {language === 'bn' ? "আমাদের সাপোর্ট টিম আপনার সমস্ত প্রশ্নের উত্তর দেবে।" : "Our support team will answer all your questions."}
                </section>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 h-full">
                  {/* Full Name */}
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-[15px] font-semibold text-[#1a1a1a]">
                      {language === 'bn' ? "পুরো নাম" : "Full Name"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder= {language === 'en' ? "Karim Ahmed" : "করিম আহমেদ"}
                      {...register("name")}
                      className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-100 transition-all text-base"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-[15px] font-semibold text-[#1a1a1a]">
                      {language === 'bn' ? "ইমেইল" : "Email"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="abc@gmail.com"
                      {...register("email")}
                      className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-100 transition-all text-base"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2.5">
                    <Label htmlFor="subject" className="text-[15px] font-semibold text-[#1a1a1a]">
                      {language === 'bn' ? "বিষয়" : "Subject"} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        id="subject"
                        {...register("subject")}
                        className="w-full h-14 rounded-xl border border-slate-200 bg-white focus:ring-slate-100 transition-all text-base px-4 outline-none appearance-none cursor-pointer"
                      >
                        <option value="">{language === 'bn' ? "একটি বিষয় নির্বাচন করুন" : "Select a subject"}</option>
                        {SUBJECTS.map((sub, idx) => (
                          <option key={idx} value={sub.en}>
                            {language === 'bn' ? sub.bn : sub.en}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.subject && (
                      <p className="text-sm text-red-500">{errors.subject.message}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2.5">
                    <Label htmlFor="phone" className="text-[15px] font-semibold text-[#1a1a1a]">
                      {language === 'bn' ? "ফোন নম্বর" : "Phone Number"} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 flex items-center gap-1.5 text-gray-500 text-sm border-r pr-2 h-6 border-slate-200 pointer-events-none select-none">
                        <img src="https://flagcdn.com/w40/bd.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
                        <span>+88</span>
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        maxLength={11}
                        placeholder={language === 'bn' ? '০১XXXXXXXXX' : '01XXXXXXXXX'}
                        {...register("phone", {
                          onChange: (e) => {
                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          }
                        })}
                        className="h-14 rounded-xl border-slate-200 bg-white focus:ring-slate-100 transition-all text-base pl-[5rem]"
                      />
                    </div>
                    {phoneErrorMsg ? (
                      <p className="text-sm text-red-500">{phoneErrorMsg}</p>
                    ) : errors.phone ? (
                      <p className="text-sm text-red-500">{language === 'en' ? "Please provide 11 digits number (starting with 01). Example: 01XXXXXXXXX" : "অনুগ্রহ করে 11 ডিজিটের নম্বরটি দিন (01 দিয়ে শুরু করুন)। যেমন: 01XXXXXXXXX"}</p>
                    ) : null}
                   
                  </div>
                </div>



                {/* Message */}
                <div className="space-y-2.5">
                  <Label htmlFor="message" className="text-[15px] font-semibold text-[#1a1a1a]">
                    {language === 'bn' ? "আপনার বার্তা" : "Your message"} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder=""
                    rows={6}
                    {...register("message")}
                    className="rounded-xl border-slate-200 bg-white focus:ring-slate-100 transition-all text-base p-4 min-h-[160px] resize-none"
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500">{errors.message.message}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row-reverse sm:items-center justify-between gap-6 pt-4">

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="btn-slide btn-primary rounded-none px-12 h-14 text-lg min-w-[160px] flex items-center justify-center gap-3 group/btn overflow-hidden"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin w-6 h-6" />
                    ) : (
                      <>
                        {language === 'bn' ? "পাঠান" : "Send"}
                        <Send className="w-5 h-5 " />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
