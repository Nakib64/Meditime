"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import Image from "next/image";
import { Send, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { toast } from "react-hot-toast";
import { trackContactFormSubmit } from "@/lib/gtm";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const carouselImages = [
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504813184591-01572f98c85f?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop",
];

export default function ContactSection() {
  const { language } = useLanguage();
  
  const t = {
    title: language === 'bn' ? "যোগাযোগ করুন" : "Get In Touch",
    subtitle: language === 'bn' 
      ? "আপনার স্বাস্থ্য বিষয়ক যেকোনো জিজ্ঞাসা বা প্রয়োজনে সহায়তা করতে আমরা আপনার পাশে আছি।" 
      : "We are here to assist you with any medical concerns.",
    name: language === 'bn' ? "আপনার নাম" : "Your Name",
    email: language === 'bn' ? "ইমেইল ঠিকানা" : "Email Address",
    phone: language === 'bn' ? "ফোন নম্বর" : "Phone Number",
    message: language === 'bn' ? "আপনার বার্তা" : "Your Message",
    submit: language === 'bn' ? "সাবমিট" : "Submit",
    sending: language === 'bn' ? "পাঠানো হচ্ছে..." : "Sending...",
    success: language === 'bn' ? "আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে!" : "Your message has been sent successfully!",
    invalidPhone: language === 'bn' ? "অনুগ্রহ করে 11 ডিজিটের নম্বরটি দিন (01 দিয়ে শুরু করুন)। যেমন: 01XXXXXXXXX" : "Please provide an 11-digit number starting with 01. Example: 01XXXXXXXXX",
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const phoneRegex = /^(?:\+8801|01|8801)[3-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error(t.invalidPhone);
      return;
    }

    if (!formData.subject) {
      toast.error(language === 'bn' ? "দয়া করে একটি বিষয় নির্বাচন করুন" : "Please select a subject");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        trackContactFormSubmit({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          subject: formData.subject,
        });
        toast.success(t.success);
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
          
          {/* LEFT SIDE: CAROUSEL */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-[32px] overflow-hidden min-h-[400px] lg:min-h-[600px] shadow-2xl"
          >
            <Swiper
              modules={[Autoplay, Pagination, EffectFade]}
              effect="fade"
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              className="h-full w-full"
            >
              {carouselImages.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="relative h-full w-full">
                    <Image
                      src={img}
                      alt={`Slide ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-12 left-12 right-12 text-white">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                          {language === 'bn' ? "আপনার স্বাস্থ্য আমাদের অগ্রাধিকার" : "Your Health is Our Priority"}
                        </h3>
                        <p className="text-lg text-white/80 max-w-md">
                          {language === 'bn' 
                            ? "সেরা বিশেষজ্ঞ ডাক্তারদের সাথে সহজেই অ্যাপয়েন্টমেন্ট নিন।" 
                            : "Easily book appointments with the best specialist doctors."}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>

          {/* RIGHT SIDE: FORM */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center py-4"
          >
            <div className="mb-10">
              <h2 className="text-[32px] sm:text-[48px] font-bold text-slate-900 leading-tight mb-4">
                {t.title}
              </h2>
              <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">{t.name}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#3DB5A0] focus:ring-4 focus:ring-[#3DB5A0]/10 transition-all outline-none"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">{t.email}</label>
                  <input
                    type="email"
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#3DB5A0] focus:ring-4 focus:ring-[#3DB5A0]/10 transition-all outline-none"
                    placeholder="example@mail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">{t.phone}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 flex items-center gap-1.5 text-gray-500 text-sm border-r pr-2 h-6 border-slate-300 pointer-events-none select-none">
                      <img src="https://flagcdn.com/w40/bd.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
                      <span>+88</span>
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      className="w-full pl-[5rem] pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#3DB5A0] focus:ring-4 focus:ring-[#3DB5A0]/10 transition-all outline-none"
                      placeholder={language === 'bn' ? '০১XXXXXXXXX' : '01XXXXXXXXX'}
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setFormData({ ...formData, phone: val });
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 ml-1">
                    {language === 'bn' ? '১১ সংখ্যা (যেমন: ০১XXXXXXXXX)' : '11 digits (e.g. 01XXXXXXXXX)'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">{language === 'bn' ? "বিষয়" : "Subject"}</label>
                  <select
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#3DB5A0] focus:ring-4 focus:ring-[#3DB5A0]/10 transition-all outline-none appearance-none"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="">{language === 'bn' ? "নির্বাচন করুন" : "Select Subject"}</option>
                    {SUBJECTS.map((sub, idx) => (
                      <option key={idx} value={sub.en}>
                        {language === 'bn' ? sub.bn : sub.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">{t.message}</label>
                <textarea
                  rows={4}
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#3DB5A0] focus:ring-4 focus:ring-[#3DB5A0]/10 transition-all outline-none resize-none"
                  placeholder={language === 'bn' ? "আপনি কী জানতে চান?" : "How can we help you?"}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-fit h-14 btn-slide bg-white text-primary border border-primary px-12 text-lg font-bold shadow-lg shadow-[#3DB5A0]/20 transition-all active:scale-95 flex items-center justify-center gap-3 group/btn overflow-hidden"
                >
                  {loading ? t.sending : t.submit}
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-2" />
                </button>
              </div>
            </form>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#3DB5A0]/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-[#3DB5A0]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{language === 'bn' ? "আমাদের কল করুন" : "Call Us"}</p>
                  <p className="font-bold text-slate-900">+880 1610 38 4444</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#3DB5A0]/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-[#3DB5A0]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{language === 'bn' ? "ইমেইল পাঠান" : "Email Us"}</p>
                  <p className="font-bold text-slate-900">meditimebd@gmail.com</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
