"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { PiUsersThreeDuotone, PiHospitalDuotone, PiFlaskDuotone, PiDropDuotone, PiStethoscopeDuotone, PiPlusCircleDuotone } from "react-icons/pi";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";

/**
 * Counter Component (Matches Homepage)
 */
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const spring = useSpring(0, {
    stiffness: 40,
    damping: 20,
    restDelta: 0.001
  });

  const displayValue = useTransform(spring, (current) => Math.floor(current));

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return (
    <span ref={ref}>
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
}

/**
 * ServiceImage Component
 * Handles dynamic image loading with a local fallback
 */
function ServiceImage({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-105"
      onError={() => setImgSrc(fallback)}
    />
  );
}

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <section className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors pr-8">
          {question}
        </section>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-primary border-primary text-white rotate-180' : 'text-slate-400'}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <section className="pb-6 text-slate-600 leading-relaxed">
              {answer}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ServicePage() {
  const { language } = useLanguage() as { language: 'en' | 'bn' };
  const t = homepageTranslations[language].servicesPage;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const services = [
    {
      title: t.doctorTitle,
      cta: t.doctorBtn,
      href: "/doctor",
      description: t.doctorDesc,
      image: "/service/doctor.png",
    },
    {
      title: t.videoTitle,
      cta: t.videoBtn,
      href: "/live-consultation",
      description: t.videoDesc,
      image: "/service/video_consult.png",
    },
    {
      title: t.hospitalTitle,
      cta: t.hospitalBtn,
      href: "/hospital",
      description: t.hospitalDesc,
      image: "/service/hospital.png",
    },

    {
      title: t.diagnosticTitle,
      cta: t.diagnosticBtn,
      href: "/diagnostic",
      description: t.diagnosticDesc,
      image: "/service/diagnostic.png",
    },
    {
      title: t.bloodTitle,
      cta: t.bloodBtn,
      href: "/blood-donor",
      description: t.bloodDesc,
      image: "/service/blood.png",
    },
    {
      title: t.ambulanceTitle,
      cta: t.ambulanceBtn,
      href: "/ambulance",
      description: t.ambulanceDesc,
      image: "/service/ambulance.png",
    },
  ];

  const socialProof = [
    { label: t.socialProof.doctor, value: 2000, suffix: "+", icon: PiStethoscopeDuotone },
    { label: t.socialProof.hospital, value: 40, suffix: "+", icon: PiHospitalDuotone },
    { label: t.socialProof.test, value: 100, suffix: "+", icon: PiFlaskDuotone },
    { label: t.socialProof.bloodDonor, value: 1000, suffix: "+", icon: PiDropDuotone },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F8] overflow-x-hidden">
      <Navbar />

      {/* ── Cover Hero Section ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[450px] md:h-[650px] w-full overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:90%_center] lg:bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero/service.png')",
          }}
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 ">
          <div className="max-w-7xl w-full text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-2xl md:text-6xl lg:text-[50px] font-bold text-white mb-6 drop-shadow-2xl leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-[16px] md:text-xl text-white/90 max-w-2xl mb-8 font-light">
                {t.heroDesc}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Social Proof Section (Matches Homepage StatsSection) ── */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 mt-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-18">
          {socialProof.map(({ value, suffix, label, icon: Icon }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className=""
            >
              <div className="btn-slide group flex flex-col items-center text-center rounded-3xl btn-primary min-h-[100px] h-full justify-center">
                {/* Icon */}
                <div className=" text-[#20E7E7] pt-4 transition-all duration-300 group-hover:scale-110 group-hover:brightness-125">
                  <Icon size={50} height="duotone" />
                </div>

                {/* Stat number with Counter */}
                <div className="text-[30px] sm:text-[60px] font-bold text-white leading-none transition-colors duration-300">
                  <Counter value={value} suffix={suffix} />
                </div>

                {/* Label */}
                <div className="text-[16px] sm:text-[18px] text-teal-100/70 font-bold uppercase tracking-widest transition-colors duration-300">
                  {label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 ">
        {/* ── Services Section (Alternating) ── */}
        <div className="space-y-10 sm:space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            {/* <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Meditime Service Section
            </h2> */}
            {/* <div className="h-1.5 w-24 bg-[#20E7E7] mx-auto rounded-full" /> */}
          </motion.div>

          {services.map((service, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="bg-white rounded-[24px] p-4 shadow-md overflow-hidden group border border-slate-100"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* IMAGE SIDE */}
                  <div className={`relative h-64 sm:h-80 lg:h-[480px] rounded-2xl overflow-hidden ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <ServiceImage
                      src={service.image}
                      alt={service.title}
                      fallback="/slide.jpg"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-all duration-300" />
                  </div>

                  {/* CONTENT SIDE */}
                  <div className={`p-8 sm:p-12 lg:p-20 flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-6">
                      {service.title}
                    </h3>
                    <p className="text-slate-500 text-sm sm:text-lg leading-relaxed mb-8 lg:mb-12 max-w-xl">
                      {service.description}
                    </p>
                    <div>
                      <Link href={service.href}>
                        <button className="btn-slide group/btn btn-primary overflow-hidden">
                          <span className="relative z-10 flex items-center gap-3">
                            {service.cta}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── FAQ Section ── */}
        <div className="mt-24 md:mt-32 max-w-4xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold  mb-4">
              {t.faq.title}
            </h2>
            <div className="h-1.5 w-24 bg-[#20E7E7] mx-auto rounded-full mb-8" />
          </motion.div>

          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100">
            {t.faq.questions.map((item: any, index: number) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openFaqIndex === index}
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
