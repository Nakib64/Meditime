"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade } from "swiper/modules";
import Link from "next/link";
import Image from "next/image";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";
import { ChevronRight } from "lucide-react";

export default function HeroSection() {
  const { language } = useLanguage();
  const t = homepageTranslations[language].hero;

  const slides = [
    {
      title: t.slide1.title,
      description: t.slide1.description,
      image: "/slide/doctor.png?v=1",
      ctaText: t.slide1.cta,
      ctaLink: "/doctor",
      ctaText2: t.slide1.cta2,
      ctaLink2: "/live-consultation",
    },
    {
      title: t.slide2.title,
      description: t.slide2.description,
      image: "/slide/diagnostic.png?v=1",
      ctaText: t.slide2.cta,
      ctaLink: "/diagnostic",

    },
    {
      title: t.slide3.title,
      description: t.slide3.description,
      image: "/slide/membership.png?v=1",
      ctaText: t.slide3.cta,
      ctaLink: "/membership",
    },
    {
      title: t.slide4.title,
      description: t.slide4.description,
      image: "/slide/app.png?v=1",
      ctaText: t.slide4.cta,
      ctaLink: "https://play.google.com/store",
    },
  ];

  return (
    <>
      <style>{`
        /* ── All dots are pill-shaped ────────────────────────────────────
           Inactive: narrow pill, 16px wide, semi-transparent white
           Active:   wider pill, 32px wide, solid white
           Both are the same height (8px) and fully rounded
        ─────────────────────────────────────────────────────────────── */
        .hero-swiper .swiper-pagination {
          bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .hero-swiper .swiper-pagination-bullet {
          width: 16px !important;
          height: 8px !important;
          border-radius: 999px !important;
          background: rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
          margin: 0 !important;
          transition: width 0.35s ease, background 0.35s ease;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          width: 32px !important;
          background: #ffffff !important;
        }
      `}</style>

      {/* ── MOBILE ──────────────────────────────────────────────────────── */}
      <div className="lg:hidden w-full h-[45vh] min-h-[400px] relative">
        <Swiper
          modules={[Pagination, Autoplay, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          loop={true}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          className="hero-swiper h-full! w-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className="h-full!">
              <div className="relative h-full w-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  className="object-cover  object-[100%_center] lg:object-center"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/45" />

                {/* ── Text: vertically & horizontally centered ── */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <h1 className="text-2xl lg:text-[48px] pt-4 font-bold leading-tight text-white mb-2 max-w-[320px] tracking-tight">
                    {slide.title}
                  </h1>
                  <p className=" text-sm lg:text-lg text-white/90 leading-relaxed mb-4 max-w-[300px]">
                    {slide.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                    <Link
                      href={slide.ctaLink}
                      target={slide.ctaLink.startsWith("http") ? "_blank" : "_self"}
                    >
                      <button className="btn-slide text-[12px]  btn-primary w-full md:w-fit flex items-center gap-2 group">
                        <span className="relative z-10">{slide.ctaText}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>

                    {
                      slide.ctaText2 && slide.ctaLink2 && (
                        <Link
                          href={slide.ctaLink2}
                          target={slide.ctaLink2.startsWith("http") ? "_blank" : "_self"}
                        >
                          <button className="btn-slidex text-[12px] btn-primaryx w-full md:w-fit flex items-center gap-2">
                            <span className="relative z-10">{slide.ctaText2}</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </Link>
                      )
                    }
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ── DESKTOP ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:block mx-auto  w-full h-[855px] relative ">
        <Swiper
          modules={[Pagination, Autoplay, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          loop={true}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          className="hero-swiper h-full! w-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className="h-full!">
              <div className="relative h-full w-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute inset-0 flex flex-col justify-center max-w-7xl mx-auto">
                  <div>
                    <h1 className="text-[48px] font-bold leading-[1.15] text-white mb-4">
                      {slide.title}
                    </h1>
                    <section className=" text-sm sm:text-lg leading-relaxed text-white/85 mb-6 max-w-[420px]">
                      {slide.description}
                    </section>
                    <div className="flex gap-4">
                      <Link
                        href={slide.ctaLink}
                        target={slide.ctaLink.startsWith("http") ? "_blank" : "_self"}
                      >
                        <button className="btn-slide btn-primary font-medium text-[15px] px-7 py-3 flex items-center gap-2 group">
                          <span className="relative z-10">{slide.ctaText}</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </Link>

                      {
                        slide.ctaLink2 && slide.ctaText2 && (
                          <Link
                            href={slide.ctaLink2}
                            target={slide.ctaLink2?.startsWith("http") ? "_blank" : "_self"}
                          >
                            <button className="btn-slidex btn-primaryx  font-medium text-[15px] px-7 py-3 flex items-center gap-2 group">
                              <span className="relative z-10">{slide.ctaText2}</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </Link>
                        )
                      }

                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}