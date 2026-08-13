"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { Calendar, Clock, Filter, Loader2, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";
import { formatBlogDate, toBengaliNumber } from "@/lib/time-utils";
import Footer from "@/components/footer";

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
  const [posts, setPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredPost, setFeaturedPost] = useState<Blog | null>(null);
  const { language } = useLanguage();
  const t = homepageTranslations[language];

  useEffect(() => {
    fetchPosts();
  }, [language]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blog');
      const data = await response.json();
      if (data.success && Array.isArray(data.blogs)) {
        setPosts(data.blogs);
        if (data.blogs.length > 0) {
          setFeaturedPost(data.blogs[0]);
        } else {
          setFeaturedPost(null);
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const regularPosts = useMemo(() => {
    // Exclude the featured post from regular posts
    if (!featuredPost) return posts;
    return posts.filter((post) => post._id !== featuredPost._id);
  }, [posts, featuredPost]);

  const stripHtml = (html: string) => {
    return (html || "").replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
  };

  const formatDate = (dateString: string) => {
    return formatBlogDate(dateString, language);
  };

  const getFeaturedImage = (post: Blog) => {
    return post.imageUrl || "/slide.jpg";
  };

  const getAuthorName = (post: Blog) => {
    return t.blogPage?.authorAdmin || "Admin";
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section - 70% of homepage height */}
      <div className="relative px-0">
        <div className=" mx-auto">
          <div className="h-[450px] md:h-[650px] rounded-none overflow-hidden">
            <div className="relative h-full w-full">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-[position:95%_center] lg:bg-center"
                style={{
                  backgroundImage: `url(/hero/blog.png)`,
                }}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50"></div>
              </div>

              {/* Content */}
              <div className="relative z-10 flex h-full items-center justify-center">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="mx-auto max-w-7xl text-center lg:text-left text-white">
                    <h1 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                      {t.blogPage.heroTitle}
                    </h1>
                    <p className="mb-8 text-base leading-relaxed sm:text-lg lg:text-xl">
                      {t.blogPage.heroDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        {/* Category Filter Removed */}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Featured Post - New York Style Large Hero */}
            {featuredPost && posts.length > 0 && (
              <div className="mb-16">
                <Link href={`/blog/${featuredPost.slug || featuredPost._id}`}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer group border-0 shadow-lg">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="relative h-96 md:h-auto min-h-[400px] bg-gray-100">
                        <Image
                          src={getFeaturedImage(featuredPost)}
                          alt={language === 'en' ? featuredPost.title : (featuredPost.titleBn || featuredPost.title)}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <div className="p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
                        <div className="mb-4">
                          <span className="text-xs font-bold text-primary uppercase tracking-[0.15em] letter-spacing-wide">
                            {t.blogPage.featuredArticle}
                          </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-[1.1] transition-colors tracking-tight">
                          {language === 'en' ? featuredPost.title : (featuredPost.titleBn || featuredPost.title)}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(featuredPost.createdAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {getAuthorName(featuredPost)}
                          </div>
                        </div>
                        <p className="text-lg text-gray-700 leading-relaxed mb-8 line-clamp-4 font-light">
                          {stripHtml(language === 'en' ? featuredPost.description : (featuredPost.descriptionBn || featuredPost.description))}
                        </p>
                        <div className="flex items-center text-primary font-bold text-sm uppercase tracking-wide group-hover:gap-2 transition-all">
                          {t.blogPage.readFullStory}
                          <ChevronRight className="h-5 w-5 ml-1" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            )}

            {/* Posts Grid - New York Style Editorial Layout */}
            {regularPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post, index) => {
                  // Create varied layouts for visual interest
                  const isLarge = index % 7 === 0;
                  
                  if (isLarge) {
                    return (
                      <div key={post._id} className="md:col-span-2 lg:col-span-2">
                        <Link href={`/blog/${post.slug || post._id}`}>
                          <Card className="overflow-hidden h-full hover:shadow-xl transition-shadow duration-300 cursor-pointer group border-0 shadow-lg">
                            <div className="grid md:grid-cols-2 gap-0 h-full">
                              <div className="relative h-64 md:h-full min-h-[300px] bg-gray-100">
                                <Image
                                  src={getFeaturedImage(post)}
                                  alt={language === 'en' ? post.title : (post.titleBn || post.title)}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/slide.jpg";
                                  }}
                                />
                              </div>
                              <div className="p-6 md:p-8 flex flex-col justify-center">
                                <h3 className="text-2xl md:text-3xl font-bold text-primary mb-3 leading-tight transition-colors tracking-tight">
                                  {language === 'en' ? post.title : (post.titleBn || post.title)}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 font-medium">
                                  <span>{formatDate(post.createdAt)}</span>
                                  <span>•</span>
                                  <span>{getAuthorName(post)}</span>
                                </div>
                                <p className="text-gray-600 leading-relaxed line-clamp-3 font-light">
                                  {stripHtml(language === 'en' ? post.description : (post.descriptionBn || post.description))}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div key={post._id}>
                      <Link href={`/blog/${post.slug || post._id}`}>
                        <Card className="overflow-hidden h-full hover:shadow-xl transition-shadow duration-300 cursor-pointer group flex flex-col border-0 shadow-md">
                          <div className="relative h-64 w-full bg-gray-100">
                            <Image
                              src={getFeaturedImage(post)}
                              alt={language === 'en' ? post.title : (post.titleBn || post.title)}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/slide.jpg";
                              }}
                            />
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold text-primary mb-3 leading-tight transition-colors line-clamp-2 tracking-tight">
                              {language === 'en' ? post.title : (post.titleBn || post.title)}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 font-medium">
                              <span>{formatDate(post.createdAt)}</span>
                              <span>•</span>
                              <span>{getAuthorName(post)}</span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 flex-1 font-light">
                              {stripHtml(language === 'en' ? post.description : (post.descriptionBn || post.description))}
                            </p>
                            <div className="mt-4 flex items-center text-primary font-semibold text-xs uppercase tracking-wide group-hover:gap-2 transition-all">
                              {t.blogPage.readMore}
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-500 text-lg">{t.blogPage.noPosts}</p>
              </Card>
            )}
          </>
        )}

        {/* Footer Info */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p>{t.blogPage.showing} {language === 'bn' ? toBengaliNumber(posts.length) : posts.length} {posts.length === 1 ? t.blogPage.post : t.blogPage.posts}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
