import { Metadata } from "next";
import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import SearchSection from "@/components/search-section";
import ServicesSection from "@/components/services-section";
import WhyChooseSection from "@/components/why-choose-section";
import DepartmentSection from "@/components/department-section";
import MembershipSection from "@/components/membership-section";
import StatsSection from "@/components/stats-section";
import PatientReviewSection from "@/components/patient-review-section";
import ContactSection from "@/components/contact-section";
import HospitalPartnersSection from "@/components/hospital-partners-section";
import BlogSection from "@/components/blog-section";
import BookAppointmentSection from "@/components/book-appointment-section";
import FaqSection from "@/components/Faqsection";
import AppDownloadSection from "@/components/app-download-section";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Doctor Appointment in Savar | Meditime",
  description: "Find doctor near you in Savar. Medicine Specialist, Diabetese, Orthopedic Doctors, Gynecologist Doctors and 30+ More Specialities. Book Doctor Serial.",
};



export default function Home() {
  const baseUrl = "https://meditime.com.bd";
  
  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Meditime",
    "url": baseUrl
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Meditime",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Meditime is an online doctor appointment booking platform in Bangladesh that helps patients find and book appointments with verified doctors and clinics.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dhaka",
      "addressCountry": "BD"
    },
    "sameAs": [
      "https://www.facebook.com/meditime.health",
      "https://www.linkedin.com/company/meditime",
      "https://www.instagram.com/meditime.health"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+8801610384444",
      "contactType": "customer support",
      "areaServed": "BD",
      "availableLanguage": ["English", "Bengali"]
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/doctor?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  // MedicalOrganization Schema
  const medicalOrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "Meditime",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Meditime is an online doctor booking platform in Savar, Dhaka, Bangladesh that helps patients find doctors and book medical appointments with verified healthcare professionals.",
    "medicalSpecialty": {
      "@type": "MedicalSpecialty",
      "name": "General Healthcare"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Savar",
      "addressRegion": "Dhaka",
      "postalCode": "1340",
      "addressCountry": "BD"
    },
    "location": {
      "@type": "Place",
      "name": "Meditime Head Office",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "23.8583",
        "longitude": "90.2667"
      }
    },
    "sameAs": [
      "https://www.facebook.com/meditime.health",
      "https://www.linkedin.com/company/meditime",
      "https://www.instagram.com/meditime.health"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "areaServed": "BD",
      "availableLanguage": ["Bengali", "English"]
    }
  };

  // FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I book a doctor appointment on Meditime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Just search for a doctor, pick a time slot, and confirm with your phone number. You'll get an instant SMS."
        }
      },
      {
        "@type": "Question",
        "name": "What is the Meditime Health Discount Card?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "It's a family pass for instant discounts on your medical bill at 40+ hospitals near Savar. Covers you, your spouse and 2 kids."
        }
      },
      {
        "@type": "Question",
        "name": "Is the appointment booking service free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Booking through Meditime costs zero. Secure your appointment for free and pay the doctor directly at the chamber."
        }
      },
      {
        "@type": "Question",
        "name": "How can I compare diagnostic test prices?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Go to Diagnostics, search your test. See real-time prices from multiple labs and pick the cheapest."
        }
      },
      {
        "@type": "Question",
        "name": "Does Meditime support video consultation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Select a doctor offering video consultation, book a video slot and join the call from any device. Perfect for quick follow-ups."
        }
      },
      {
        "@type": "Question",
        "name": "How do I get an ambulance via Meditime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Check the 'Ambulance' section for a direct directory. Call or request one instantly through the app."
        }
      }
    ]
  };

  return (
    <div className="overflow-x-hidden relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalOrganizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <HeroSection />
      <SearchSection />
      <ServicesSection />
      <WhyChooseSection />
      <MembershipSection />
      <DepartmentSection />

      <StatsSection />
      <PatientReviewSection />
      {/* <ContactSection /> */}
      <HospitalPartnersSection />
      {/* <BookAppointmentSection /> */}
      <BlogSection />
      <FaqSection />
      <AppDownloadSection />
      <Footer />
    </div>
  );
}
