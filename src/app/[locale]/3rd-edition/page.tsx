"use client";

import React from "react";
// Uncomment the following imports when the content is ready
// import { Swiper, SwiperSlide, type SwiperRef } from "swiper/react";
// import { EffectCards } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/effect-cards";
// import { useTranslations } from "next-intl";
// import Image from "next/image";

const MovieNightSlider = () => {
  /* 
  // UNCOMMENT THIS SECTION WHEN CONTENT IS READY
  // AND REMOVE THE 'COMING SOON' JSX BELOW

  const t = useTranslations("3rd-edition");
  const images = [
    // Add your images here: { id: 1, image: "/path/to/img1.jpg" }, etc.
  ];

  const swiperRef = useRef<SwiperRef>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (swiperRef.current) swiperRef.current.swiper.slideNext();
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="z-10 mt-12 flex w-full max-w-5xl flex-col items-center justify-center gap-8 rounded-2xl p-4 shadow-[0_0.5px_0_1px_rgba(255,255,255,0.23)_inset,0_1px_0_0_rgba(255,255,255,0.66)_inset,0_4px_16px_rgba(0,0,0,0.12)] md:flex-row">
        <div className="m-8 flex max-w-md flex-col items-center justify-center p-2 text-justify">
          <p className="mb-5 font-rhomdon text-sm font-thin text-white sm:text-base">
            {t("Description1")}
          </p>
          <p className="mb-5 font-rhomdon text-sm font-thin text-white sm:text-base">
            {t("Description2")}
          </p>
        </div>

        <div className="flex h-[400px] w-full justify-center px-0 py-0 sm:h-[450px] sm:w-64">
          <Swiper
            ref={swiperRef}
            effect={"cards"}
            grabCursor={true}
            initialSlide={2}
            speed={500}
            loop={true}
            mousewheel={{
              invert: false,
            }}
            modules={[EffectCards]}
            className="h-[350px] w-48 sm:h-[450px] sm:w-64"
          >
            {images.map((image) => (
              <SwiperSlide
                key={image.id}
                className="relative rounded-lg shadow-lg"
              >
                <div className="absolute inset-0 h-full w-full">
                  <Image
                    fill
                    src={image.image}
                    alt={`Slide ${image.id}`}
                    className="object-cover"
                    style={
                      image.imgPosition ? { objectPosition: "50% 0%" } : {}
                    }
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      
      // ... background circles would go here (same as below) ...
    </section>
  );
  */

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="z-10 mt-12 flex w-full max-w-5xl flex-col items-center justify-center gap-8 rounded-2xl p-16 shadow-[0_0.5px_0_1px_rgba(255,255,255,0.23)_inset,0_1px_0_0_rgba(255,255,255,0.66)_inset,0_4px_16px_rgba(0,0,0,0.12)]">
        <h1 className="font-rhomdon text-5xl font-black text-white sm:text-7xl md:text-8xl lg:text-9xl tracking-wider text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          COMING SOON
        </h1>
        <p className="mt-4 font-rhomdon text-lg font-thin text-white/80 sm:text-xl md:text-2xl tracking-widest text-center">
          STAY TUNED FOR THE 3RD EDITION
        </p>
      </div>

      <ul className="absolute left-0 top-0 h-full w-full overflow-hidden">
        {Array.from({ length: 10 }).map((_, index) => (
          <li
            key={index}
            className="animate-circles absolute bottom-[-150px] block list-none bg-[#ff3cac] bg-gradient-to-br from-[#ff3cac] via-[#784ba0] to-[#2b86c5]"
            style={{
              left: `${index === 0 ? "25%" : index === 1 ? "10%" : index === 2 ? "70%" : index === 3 ? "40%" : index === 4 ? "65%" : index === 5 ? "75%" : index === 6 ? "35%" : index === 7 ? "50%" : index === 8 ? "20%" : "85%"}`,
              width: `${index === 0 ? "80px" : index === 1 ? "20px" : index === 2 ? "20px" : index === 3 ? "60px" : index === 4 ? "20px" : index === 5 ? "110px" : index === 6 ? "150px" : index === 7 ? "25px" : index === 8 ? "15px" : "150px"}`,
              height: `${index === 0 ? "80px" : index === 1 ? "20px" : index === 2 ? "20px" : index === 3 ? "60px" : index === 4 ? "20px" : index === 5 ? "110px" : index === 6 ? "150px" : index === 7 ? "25px" : index === 8 ? "15px" : "150px"}`,
              animationDelay: `${index === 0 ? "0s" : index === 1 ? "2s" : index === 2 ? "4s" : index === 3 ? "0s" : index === 4 ? "0s" : index === 5 ? "3s" : index === 6 ? "7s" : index === 7 ? "15s" : index === 8 ? "2s" : "0s"}`,
              animationDuration: `${index === 1 ? "12s" : index === 3 ? "18s" : index === 7 ? "45s" : index === 8 ? "35s" : index === 9 ? "11s" : "25s"}`,
            }}
          />
        ))}
      </ul>

      <style jsx>{`
        @keyframes circles {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
            border-radius: 0;
          }
          100% {
            transform: translateY(-1000px) rotate(720deg);
            opacity: 0;
            border-radius: 50%;
          }
        }

        .animate-circles {
          animation: circles 25s linear infinite;
        }

        @media (max-width: 768px) {
          .animate-circles {
            animation-duration: 15s;
          }
        }
      `}</style>
    </section>
  );
};

export default MovieNightSlider;
