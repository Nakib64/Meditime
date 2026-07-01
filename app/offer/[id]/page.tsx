"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Loader2, Tag, Gift, ChevronRightIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";
import Nav_for_details from "@/components/nav_for_details";
import Footer from "@/components/footer";

interface Offer {
  _id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  imageUrl: string;
  isActive: boolean;
  isPopup: boolean;
  createdAt: string;
}

export default function OfferPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const t = homepageTranslations[language];

  useEffect(() => {
    if (id) {
      fetchOffer();
    }
  }, [id, language]);

  const fetchOffer = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/offer/${id}`);
      const data = await response.json();
      if (data.success && data.offer) {
        setOffer(data.offer);
      } else {
        setError("Offer not found");
      }
    } catch (error) {
      console.error("Error fetching offer:", error);
      setError("Failed to load offer");
    } finally {
      setLoading(false);
    }
  };

  const getFeaturedImage = (offer: Offer) => {
    return offer.imageUrl || "/slide.jpg";
  };

  // Keep recent offers for fallback
  const [recentOffers, setRecentOffers] = useState<Offer[]>([]);

  useEffect(() => {
    fetchRecentOffers();
  }, [id, language]);

  const fetchRecentOffers = async () => {
    try {
      const response = await fetch(`/api/offers`);
      const data = await response.json();
      if (data.success && Array.isArray(data.offers)) {
        const filtered = data.offers.filter((o: Offer) => o._id !== id).slice(0, 3);
        setRecentOffers(filtered);
      }
    } catch (error) {
      console.error("Error fetching recent offers:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Nav_for_details />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-[#3DB5A0]" />
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-white">
        <Nav_for_details />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">{error || "Offer not found"}</p>
            <Button onClick={() => router.push("/offer")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'bn' ? "অফারে ফিরে যান" : "Back to Offers"}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav_for_details />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">


            {/* Featured Image */}
            <div className="relative min-h-[300px] md:min-h-[450px] w-full mb-8 rounded-[32px] overflow-hidden shadow-xl border-4 border-white">
              <Image
                src={getFeaturedImage(offer)}
                alt={language === 'en' ? offer.title : (offer.titleBn || offer.title)}
                fill
                className="w-full h-auto object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />

            </div>

            {/* Article Header */}
            <div className="mb-8 bg-white p-8 rounded-[32px] shadow-sm">
              <h1 className="text-[32px] sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                {language === 'en' ? offer.title : (offer.titleBn || offer.title)}
              </h1>

              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full font-medium">
                  <Calendar className="h-4 w-4 text-[#3DB5A0]" />
                  {new Date(offer.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-sm">
              <article className="prose prose-lg prose-slate max-w-none">
                <div
                  className="leading-relaxed font-medium text-slate-600"
                  dangerouslySetInnerHTML={{ __html: language === 'en' ? offer.description : (offer.descriptionBn || offer.description) }}
                />
              </article>
            </div>

            {/* Back to Blog Button */}
            <div className="mt-8">
              <Button
                onClick={() => router.push("/offer")}
                variant="outline"
                className="btn-primary btn-slide w-fit"
              >
                <div className="flex  gap-2 py-3">
                  {language === 'bn' ? "অফারে ফিরে যান" : "Back to Offers"}
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
                
              </Button>
            </div>
          </div>

          {/* Sticky Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <h3 className="text-xl mb-6 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary]" />
                  {language === 'bn' ? "অন্যান্য অফার" : "Other Offers"}
                </h3>

                <div className="space-y-6">
                  {recentOffers.length > 0 ? (
                    recentOffers.map((recentOffer) => (
                      <Link key={recentOffer._id} href={`/offer/${recentOffer._id}`} className="block group">
                        <div className="flex flex-col gap-3">
                          <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-slate-100">
                            <Image
                              src={getFeaturedImage(recentOffer)}
                              alt={language === 'en' ? recentOffer.title : (recentOffer.titleBn || recentOffer.title)}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              sizes="(max-width: 1024px) 100vw, 33vw"
                            />
                          </div>
                          <div>
                            <h4 className="btn-slide btn-primary">
                              {language === 'en' ? recentOffer.title : (recentOffer.titleBn || recentOffer.title)}
                            </h4>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-slate-500 text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      {language === 'bn' ? "কোন অফার নেই" : "No other offers"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
