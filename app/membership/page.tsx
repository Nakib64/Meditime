"use client";

import { motion } from "framer-motion";
import { Crown, Sparkles, Star, Building2, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";

export default function MembershipPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { language } = useLanguage();
  const t = homepageTranslations[language].membershipPage;
  const faqT = homepageTranslations[language].faqHealthCards;

  const membershipPlans = [
    {
      id: "silver",
      title: t.plans.silver.title,
      icon: Star,
      color: "#9CA3AF",
      gradient: "from-gray-300 to-gray-500",
      price: t.plans.silver.price,
      period: "",
      description: t.plans.silver.desc,
    },
    {
      id: "gold",
      title: t.plans.gold.title,
      icon: Sparkles,
      color: "#F59E0B",
      gradient: "from-yellow-300 to-yellow-600",
      price: t.plans.gold.price,
      period: "",
      popular: true,
      description: t.plans.gold.desc,
    },
    {
      id: "platinum",
      title: t.plans.platinum.title,
      icon: Crown,
      color: "#9333EA",
      gradient: "from-purple-300 to-purple-600",
      price: t.plans.platinum.price,
      period: "",
      description: t.plans.platinum.desc,
    },
    {
      id: "corporate",
      title: t.plans.corporate.title,
      icon: Building2,
      color: "#3B82F6",
      gradient: "from-blue-400 to-blue-700",
      price: t.plans.corporate.price,
      period: "",
      description: t.plans.corporate.desc,
    },
  ];

  const howToGetSteps = [
    t.step1,
    t.step2,
    t.step3,
    t.step4,
    t.step5,
    t.step6,
    t.step7,
  ];

  const handleSelectPlan = (planId: string) => {
    router.push(`/membership/${planId}`);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": language === 'bn' ? 'মেডিটাইম হেলথ কার্ড' : 'Meditime Health Card',
    "image": "https://meditime.com.bd/logo.png",
    "description": t.desc,
    "brand": {
      "@type": "Brand",
      "name": "Meditime"
    },
    "offers": membershipPlans.map(plan => ({
      "@type": "Offer",
      "name": plan.title,
      "price": plan.price.replace(/[^\d]/g, ''),
      "priceCurrency": "BDT",
      "availability": "https://schema.org/InStock"
    }))
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative  h-[450px] md:h-[650px] w-full overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:80%_center] lg:bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero/membership.png')",
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
                {t.headerTitle}
              </h1>
              <p className="text-[16px] md:text-xl text-white/90 drop-shadow-lg max-w-3xl  leading-relaxed">
                {t.desc}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* How to Get Your Health Discount Card Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#009A98] mb-8 text-center">
            {t.howToGetTitle}
          </h2>
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8">
            <ol className="space-y-4">
              {howToGetSteps.map((step, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed pt-1">{step}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>

        {/* Membership Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {membershipPlans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 flex flex-col h-full"
              >
                {'popular' in plan && plan.popular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-10">
                    {language === 'en' ? 'Most Popular' : 'জনপ্রিয়'}
                  </div>
                )}

                <div className="p-8 flex flex-col flex-grow">
                  {/* Icon and Title */}
                  <div className="flex items-center mb-6">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
                      style={{ backgroundColor: `${plan.color}20` }}
                    >
                      <IconComponent className="w-8 h-8" style={{ color: plan.color }} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold" style={{ color: plan.color }}>
                        {plan.title}
                      </h2>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600 ml-1">{plan.period}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-lg leading-relaxed mb-8 flex-grow">
                    {plan.description}
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full py-4 px-6 rounded-lg font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mt-auto"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
                    }}
                  >
                    {t.registerBtn}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#009A98] mb-8 text-center">
            {faqT.title}
          </h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {faqT.questions.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-5 bg-gray-50"
                  >
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}