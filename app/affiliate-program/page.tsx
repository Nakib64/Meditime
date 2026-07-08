"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Users,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// Import the form components
import AffiliateSignupForm from "@/components/affiliate-signup-form";
import AffiliateSigninForm from "@/components/affiliate-signin-form";

export default function AffiliateProgramPage() {
  const [showSignup, setShowSignup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const affiliateData = localStorage.getItem("affiliate");
      if (affiliateData) {
        router.push("/affiliate-program/dashboard");
      }
    }
  }, [router]);

  const features = [
    {
      icon: CheckCircle,
      title: "High Trust & Conversion",
      description:
        "Meditime is an authority in online health information services, so customers trust the platform, leading to better conversion rates for affiliate links.",
    },
    {
      icon: DollarSign,
      title: "Ease of Use",
      description:
        "The Meditime Affiliate Program provides a simple and easy-to-use affiliate code, simplifying the process of monetizing your social network.",
    },
    {
      icon: TrendingUp,
      title: "Reliable Payouts",
      description:
        "Meditime is known for paying commissions consistently and on time.",
    },
    {
      icon: Users,
      title: "Passive Income Potential in BD",
      description:
        "Once a patient is referred, it can generate passive income over time with minimal ongoing effort.",
    },
  ];

  const handleScrollToSignup = () => {
    const signupSection = document.getElementById("signup-section");
    signupSection?.scrollIntoView({ behavior: "smooth" });
    setShowSignup(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <div 
        className="relative mt-16 px-4 sm:px-6 lg:px-8 py-20 sm:py-32"
        style={{
          backgroundImage: "url('/slide3.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="relative z-10 container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
            >
              Be a Meditime Affiliate<br />
              <span className="text-2xl sm:text-3xl lg:text-4xl">Promote Meditime Diagnostic Tests and Earn Money Along the Way</span>
            </h1>
            <p 
              className="text-lg sm:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Joining the Meditime Affiliate Program is fast and free. We provide you with a code once the affiliate registration is complete. Tell your audience to use the code when booking a diagnostic test and earn commissions from the amount spent by the patients you refer.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleScrollToSignup}
                className="bg-gradient-to-r from-primary-light to-primary hover:from-primary hover:to-primary-dark text-white text-lg px-8 py-6 rounded-xl shadow-2xl"
              >
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Title & Description Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{
              color: "var(--background-dark)",
            }}
          >
            How To Make Money By Becoming an Affiliate
          </h2>
          <p
            className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            The process is easy and straightforward. Click the register button in the upper right corner. Fill out the registration form. Once the form is completed and registration is successful, you will receive a Meditime Affiliate Code. Use this code to refer a patient.
          </p>
        </motion.div>

        {/* Why Work With Us - Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-8 text-center"
            style={{
              color: "var(--background-dark)",
            }}
          >
            Why Choose Meditime Affiliate Programme
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-white border border-gray-200 shadow-md hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col group">
                    {/* Icon */}
                    <div className="mb-4">
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                          <IconComponent 
                            className="w-6 h-6 text-primary" 
                            strokeWidth={2} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-xl font-bold text-gray-900 mb-3"
                    >
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-gray-600 leading-relaxed grow"
                    >
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Get Started Now Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleScrollToSignup}
              className="bg-gradient-to-r from-primary-light to-primary hover:from-primary hover:to-primary-dark text-white text-lg px-12 py-6 rounded-xl shadow-2xl"
            >
              Start Earning Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Signup/Signin Section */}
      <div id="signup-section" className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AffiliateAuthForms showSignupByDefault={showSignup} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Affiliate Auth Forms Component
function AffiliateAuthForms({ showSignupByDefault }: { showSignupByDefault: boolean }) {
  const [isSignup, setIsSignup] = useState(showSignupByDefault);

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setIsSignup(true)}
          className={`flex-1 py-4 text-lg font-semibold transition-all ${
            isSignup
              ? "bg-primary text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => setIsSignup(false)}
          className={`flex-1 py-4 text-lg font-semibold transition-all ${
            !isSignup
              ? "bg-primary text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          Login
        </button>
      </div>

      {/* Forms */}
      <div className="p-8">
        {isSignup ? <AffiliateSignupForm /> : <AffiliateSigninForm />}
      </div>
    </div>
  );
}


