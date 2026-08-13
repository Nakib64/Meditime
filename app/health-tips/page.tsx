"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Sparkles,
  Loader2,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

interface Blog {
  _id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  imageUrl: string;
  slug?: string;
  isActive: boolean;
  createdAt: string;
}

export default function HealthTipsPage() {
  const { language } = useLanguage();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch("/api/blog");
        const data = await response.json();
        if (data.success) {
          setBlogs(data.blogs);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-[#00B7B5]/10 overflow-hidden relative flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B7B5]/20 text-[#00B7B5] font-black text-xs uppercase tracking-[0.2em] mb-6">
              <Sparkles className="w-4 h-4" />
              {language === 'en' ? "Knowledge is Health" : "জ্ঞানই স্বাস্থ্য"}
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
              {language === 'en' ? (
                <>Health & <span className="text-[#00B7B5]">Wellness Tips</span></>
              ) : (
                <>স্বাস্থ্য ও <span className="text-[#00B7B5]">সুস্থতার টিপস</span></>
              )}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
              {language === 'en'
                ? "Expert advice, healthy habits, and medical insights to keep you and your family safe and thriving."
                : "আপনাকে এবং আপনার পরিবারকে নিরাপদ ও সুস্থ রাখতে বিশেষজ্ঞ পরামর্শ, স্বাস্থ্যকর অভ্যাস এবং চিকিৎসা সংক্রান্ত টিপস।"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-20 lg:py-24 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#00B7B5]" />
            </div>
          ) : blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {blogs.map((blog, i) => (
                <Link href={`/blog/${blog.slug || blog._id}`} key={blog._id} className="block group">
                  <motion.article
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="relative flex flex-col h-full rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {blog.imageUrl ? (
                        <Image
                          src={blog.imageUrl}
                          alt={language === 'en' ? blog.title : blog.titleBn}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100" />
                      )}
                    </div>

                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3">
                        <Calendar className="w-4 h-4" />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </div>
                      
                      <h3 className="text-xl font-black text-slate-900 mb-4 leading-tight group-hover:text-[#00B7B5] transition-colors">
                        {language === 'en' ? blog.title : (blog.titleBn || blog.title)}
                      </h3>
                      <div className="text-slate-500 leading-relaxed text-sm mb-8 flex-1 prose line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: language === 'en' ? blog.description : (blog.descriptionBn || blog.description) }}
                      />
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-20">
               <p className="text-xl text-slate-500">{language === 'en' ? "No health tips available right now." : "বর্তমানে কোনো হেলথ টিপস নেই।"}</p>
             </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
