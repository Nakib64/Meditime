"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";
import { formatBlogDate } from "@/lib/time-utils";
import Nav_for_details from "@/components/nav_for_details";
import Footer from "@/components/footer";

interface Blog {
  _id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}



export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const t = homepageTranslations[language];

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id, language]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blog/${id}`);
      const data = await response.json();
      if (data.success && data.blog) {
        setPost(data.blog);
      } else {
        setError(t.blogPage?.postNotFound || "Post not found");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      setError(t.blogPage?.failedLoad || "Failed to load post");
    } finally {
      setLoading(false);
    }
  };



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

  // Keep recentPosts for fallback
  const [recentPosts, setRecentPosts] = useState<Blog[]>([]);
  
  useEffect(() => {
    fetchRecentPosts();
  }, [id, language]);

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch(`/api/blog`);
      const data = await response.json();
      if (data.success && Array.isArray(data.blogs)) {
        const filtered = data.blogs.filter((p: Blog) => p._id !== id).slice(0, 3);
        setRecentPosts(filtered);
      }
    } catch (error) {
      console.error("Error fetching recent posts:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Nav_for_details />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Nav_for_details />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">{error || t.blogPage.postNotFound}</p>
            <Button onClick={() => router.push("/blog")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.blogPage.backToBlog}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav_for_details />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Back Button */}
            <div className="mb-8">
              <Button
                onClick={() => router.push("/blog")}
                variant="ghost"
                className="btn-slide btn-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.blogPage.backToBlog}
              </Button>
            </div>

            {/* Featured Image */}
            <div className="relative min-h-[200px] md:min-h-[400px] w-full mb-8 rounded-lg overflow-hidden">
              <Image
                src={getFeaturedImage(post)}
                alt={language === 'en' ? post.title : (post.titleBn || post.title)}
                fill
                className=" w-full h-auto object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            </div>

            {/* Article Header */}
            <div className="mb-8">
              <h1
                className="text-[32px] sm:text-5xl md:text-6xl lg:text-[56px] font-extrabold text-primary mb-6 leading-tight tracking-tight"
                dangerouslySetInnerHTML={{ __html: language === 'en' ? post.title : (post.titleBn || post.title) }}
              />
              
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {getAuthorName(post)}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <article className="prose prose-lg max-w-none">
              <div
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: language === 'en' ? post.description : (post.descriptionBn || post.description) }}
              />
            </article>

            {/* Back to Blog Button */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <Button
                onClick={() => router.push("/blog")}
                variant="outline"
                className="w-full sm:w-auto btn-slide btn-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.blogPage.backToAll}
              </Button>
            </div>
          </div>

          {/* Sticky Right Sidebar with Admin Photos */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Display Relevant Blogs */}
              <h3 className="text-xl font-bold text-gray-900 mb-4 px-2">{t.blogPage.relatedArticles}</h3>
              {recentPosts.length > 0 ? (
                recentPosts.map((recentPost) => (
                  <Card key={recentPost._id} className="overflow-hidden border-0 shadow-lg">
                    <Link href={`/blog/${recentPost._id}`}>
                      <div className="relative h-48 w-full bg-gray-200 group cursor-pointer">
                        <Image
                          src={getFeaturedImage(recentPost)}
                          alt={language === 'en' ? recentPost.title : (recentPost.titleBn || recentPost.title)}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/slide.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                          <p className="text-white font-bold text-sm line-clamp-2">
                            {language === 'en' ? recentPost.title : (recentPost.titleBn || recentPost.title)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="text-gray-500 p-4">{t.blogPage.noRelated}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

