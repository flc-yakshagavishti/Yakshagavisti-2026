"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import EventsCard from "~/components/Sponsors/EventsCard";

const Sponsor = () => {
  const t = useTranslations("Sponsors");
  const [selectedYear, setSelectedYear] = useState<string>("2025-26");

  const sponsorsByYear: Record<
    string,
    Array<{
      name: string;
      subtitle: string;
      description: string;
      image: string;
      url?: string;
    }>
  > = {
    "2023-24": [
      {
        name: "Mr. Adarsh Sudhakar Hegde",
        subtitle: "Title Sponsor",
        description: `Allcargo Logistics, Joint Managing Director & Executive Director. Gati-KWE, Managing Director`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769937899/Mr.-Adarsh-Hegde-Joint-MD-Allcargo-Logistics-Ltd-scaled_blmgdp.jpg",
      },
      {
        name: "Ventana Foundation",
        subtitle: t("Associate"),
        description: `The Ventana Foundation was founded in 2022 by Rohith Bhat (the entrepreneur behind Robosoft Technologies and 99Games) along with a group of like-minded colleagues, including Adarsh Hegde, to drive social impact in the Udupi region. Operating as a non-profit, the foundation focuses on four primary pillars: supporting rural education and Kannada-medium schools, reviving local art forms like Yakshagana and Tiger Dance, preserving regional biodiversity through afforestation, and engaging in community service such as restoring historical monuments. As of 2026, the organization remains active in its mission, having touched the lives of thousands of students across dozens of schools and providing critical support to local institutions like the Hosabelaku elderly care home.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769937959/headerlogo_desktop_d8m9v0.png",
        url: "https://ventanafoundation.org/eng",
      },
      {
        name: "WENAMITAA",
        subtitle: t("Associate"),
        description: `Established in 1991 and registered in 2013, the WENAMITAA, NMAMIT Alumni Association signifies the enduring bond between alumni and their alma mater. With vibrant chapters like Me-NMAMIT and Be-NMAMIT, the association fosters connections through annual gatherings. Highlight events, including the annual Alumni Meet and biennial Global Meet, provide opportunities for alumni to relive academic memories and celebrate achievements globally. The association, beyond celebrations, sponsors academic excellence and funds student projects, exemplified by the recent inauguration of a conference hall in the Atal Block. Actively involving alumni in academic endeavors, NMAMIT seeks their input for curriculum development and invites them as esteemed judges during fests, underscoring a commitment to excellence.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769934751/Yakshagavishti/yakshagavishti/assets/sponsors/WENAMITAA.png",
        url: "https://alumni.nitte.edu.in/page/wenamitaa-607",
      },
      {
        name: "Quadx Drones",
        subtitle: t("Executive"),
        description: `QuadX Drones, established in 2019, is India's premier online store offering end-to-end drone-related services. Our mission is to provide top-quality DJI equipment and services to the Indian market, delivering an unparalleled level of professionalism and after-sales support. As a result, QuadX Drones has become the most trusted drone provider in India, with a customer base that includes the country's top digital production houses, television channels, and influencers.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769934753/Yakshagavishti/yakshagavishti/assets/sponsors/Quadx_Drones.png",
        url: "https://www.quadxdrones.com/",
      },
      {
        name: "Muliya Jewels",
        subtitle: t("Executive"),
        description: `Muliya Jewels was established in 1944, by Mr. Keshava Bhatta, at Court Road Puttur, which is 54 Kilometers away from Mangalore. We have more than 75 years of expertise and trust in the field of jewllery. We are happy to realize your desire to have dream jewels from array of overwhelming collection at Muliya.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769934755/Yakshagavishti/yakshagavishti/assets/sponsors/Muliya_Jewels.png",
        url: "https://muliya.in/",
      },
      {
        name: "Agari Enterprises",
        subtitle: t("Executive"),
        description: `Agari Enterprises is a leading retail brand that has been serving the community since 1992. Specializing in electronics and furniture, our stores offer a wide range of high-quality products at competitive prices. Whether you're looking for the latest gadgets or stylish home furnishings, we have everything you need to make your life more comfortable and convenient. AGARI name is derived through yakshagana. Our organisation proprietor Agari Raghavendra Rao has started the organisation with his ancestor name Agari Shrinivas Rao who was considered has yakshagana brahma.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769937993/5500ffec-c785-45dd-80da-c0a3442c0d1d.png",
        url: "https://agarienterprises.com/",
      },
      {
        name: "A.J. Institute of Management",
        subtitle: t("Executive"),
        description: `AJ Institute of Management, commonly referred to as AJIM, is a renowned educational institution located in the picturesque city of Mangalore Under the Management of Laxmi Memorial Education Trust ®, Karnataka, India. Established with a vision to provide quality management education, AJIM has consistently strived for excellence in the field of business and management studies. The institute is known for its commitment to fostering leadership skills, nurturing innovation, and preparing students to excel in the dynamic and competitive business world. With a strong emphasis on academic rigor, industry exposure, and holistic development, A J Institute of Management has emerged as a sought-after destination for aspiring management professionals.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769938103/AJIM-logo_trqjjs.jpg",
        url: "https://www.ajimmangalore.ac.in/about-aj-institute-of-management.php",
      },
    ],
    "2024-25": [
      {
        name: "WENAMITAA",
        subtitle: t("Associate"),
        description: `Established in 1991 and registered in 2013, the WENAMITAA, NMAMIT Alumni Association signifies the enduring bond between alumni and their alma mater. With vibrant chapters like Me-NMAMIT and Be-NMAMIT, the association fosters connections through annual gatherings. Highlight events, including the annual Alumni Meet and biennial Global Meet, provide opportunities for alumni to relive academic memories and celebrate achievements globally. The association, beyond celebrations, sponsors academic excellence and funds student projects, exemplified by the recent inauguration of a conference hall in the Atal Block. Actively involving alumni in academic endeavors, NMAMIT seeks their input for curriculum development and invites them as esteemed judges during fests, underscoring a commitment to excellence.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769934753/Yakshagavishti/yakshagavishti/assets/sponsors/WENAMITAA.png",
        url: "https://alumni.nitte.edu.in/page/wenamitaa-607",
      },
      {
        name: "Quadx Drones",
        subtitle: t("Executive"),
        description: `QuadX Drones, established in 2019, is India's premier online store offering end-to-end drone-related services. Our mission is to provide top-quality DJI equipment and services to the Indian market, delivering an unparalleled level of professionalism and after-sales support. As a result, QuadX Drones has become the most trusted drone provider in India, with a customer base that includes the country's top digital production houses, television channels, and influencers.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769934753/Yakshagavishti/yakshagavishti/assets/sponsors/Quadx_Drones.png",
        url: "https://www.quadxdrones.com/",
      },
      {
        name: "NSS, Nitte University",
        subtitle: "Co Sponsors",
        description: `The NSS was launched on 24 September 1969, the birth centenary year of the Father of our Nation Mahatma Gandhi to whom social service was almost a religion. NSS is a voluntary association of Students and Teachers in Colleges at UG level. The principle of the NSS programme is to get a sense of involvement in the task of Nation Building through community service`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769937789/png-clipart-government-of-india-national-service-scheme-ministry-of-youth-affairs-and-sports-school-emblem-logo_vzajzf.png",
        url: "https://nitte.edu.in/nmamit/nss.php",
      },
      {
        name: "Muliya Jewels",
        subtitle: t("Executive"),
        description: `Muliya Jewels was established in 1944, by Mr. Keshava Bhatta, at Court Road Puttur, which is 54 Kilometers away from Mangalore. We have more than 75 years of expertise and trust in the field of jewllery. We are happy to realize your desire to have dream jewels from array of overwhelming collection at Muliya.`,
        image:
          "https://res.cloudinary.com/dstpdenfa/image/upload/v1769934755/Yakshagavishti/yakshagavishti/assets/sponsors/Muliya_Jewels.png",
        url: "https://muliya.in/",
      },
      {
        name: "Dr. T. Sham Bhatt",
        subtitle: t("Associate"),
        description: ``,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSlCACI8589CTw86W5WCflW1-SSt0XiLM_T-Rey8mczoYM_9oeV9NscUjAWTyMz2YhjaA&usqp=CAU",
      },
    ],
    "2025-26": [
      {
        name: "Nattoja Foundation",
        subtitle: "Co Sponsor",
        description:
          "The Nattoja Foundation Trust is a premier educational and philanthropic organization based in Puttur, Karnataka, founded by Shri Subramanya Nattoja and Smt. Rajashree S. Nattoja to provide value-based, culturally rooted education. The trust sponsors and manages the prominent Ambika Group of Educational Institutions, which includes Ambika Vidyalaya CBSE (the first CBSE school in Puttur Taluk), pre-university day and residential colleges, a degree college, and competitive exam coaching academies. Distinctly driven by a strong ethos of patriotism and social service, the foundation constructed and maintains the Amar Jawan Jyothi war memorial in Puttur and runs a major philanthropic initiative offering entirely free education, food, and accommodation from kindergarten up to graduation for children of martyrs and victims of terror attacks.",
        image:
          "https://res.cloudinary.com/mqgak7n7/image/upload/v1790309537/Nattoja.webp",
      },
      {
        name: "Canara Bank",
        subtitle: "Co Sponsor",
        description:
          "Canara Bank is one of India's oldest and largest public sector banks, founded in July 1906 by the visionary philanthropist Shri Ammembal Subba Rao Pai in Mangaluru, Karnataka. Originally established as the Canara Hindu Permanent Fund Limited to assist small traders and eliminate predatory moneylending, the bank was nationalised by the Government of India in 1969 and is now headquartered in Bengaluru. Following its 2020 merger with Syndicate Bank, it operates a massive network of over 10,000 domestic branches, several international offices (including London and New York), and robust digital banking platforms like the Canara ai1 app. Driven by its founding principles of community welfare and customer centricity, the bank remains a leading national financial institution with a strong emphasis on retail, agriculture, and MSME lending.",
        image:
          "https://res.cloudinary.com/mqgak7n7/image/upload/v1790309536/canara_bank_logo.webp",
      },
      {
        name: "Shree Caterers",
        subtitle: "Executive Sponsor",
        description: "",
        image:
          "https://res.cloudinary.com/mqgak7n7/image/upload/v1790309537/Shree_Caterers.webp",
      },
      {
        name: "Muliya Jewels",
        subtitle: "Executive Sponsor",
        description:
          "Muliya Gold & Diamonds (popularly known as Muliya Jewellers) is a highly respected jewellery brand in Karnataka with a legacy dating back to 1944. Established by Mr. Keshava Bhatta in Puttur, the brand has grown over eight decades to become a trusted household name, particularly celebrated across Coastal Karnataka (Dakshina Kannada) and the Coorg (Kodagu) regions. They are widely renowned for their specialty in traditional Kodava jewelry, exquisite temple and antique designs, alongside modern diamond, gold, and dedicated silver ornaments.",
        image:
          "https://res.cloudinary.com/mqgak7n7/image/upload/v1790309537/Muliya_jewels_logo.webp",
        url: "https://muliya.in/",
      },
      {
        name: "Master Plannery",
        subtitle: "Executive Sponsor",
        description:
          "Master Plannery is a technology, engineering, construction, manufacturing and financial company.It is the Innovation imbibed with compassion to embrace all living creatures and the whole of nature and its beauty that distinguishes Master Plannery from the rest of the world. More than six decades of a strong, customer-focused approach and the continuous quest for the technology and building methods have enabled it to attain and sustain leadership in all its major lines of the industry. Master Plannery cutting edge capabilities covering the basic principles of construction and services extend to large industrial and infrastructure projects from concept to commissioning. Master Plannery believes that progress must be achieved in harmony with the environment. A commitment to community welfare and environmental protection are an integral part of the corporate vision",
        image:
          "https://res.cloudinary.com/mqgak7n7/image/upload/v1790309536/masterplannery.webp",
        url: "https://masterplannery.com/",
      },
      {
        name: "Sri Prashanth Kumar Holla",
        subtitle: "Executive Sponsor",
        description: "",
        image: "Didn't share yet.jpg :<",
      },
      {
        name: "G L Acharya Jewellers",
        subtitle: "Sponsor",
        description:
          "Established in 1957 by Sri G L Acharya in the agricultural town of Puttur. G L Acharya Jewellers has had a long memorable journey of Trust, Purity, Innovative Designs and Customer Delight. With these values as our foundation, we have evolved from a humble 100sft. shop to a momentous group of five showrooms in Puttur, Hassan, Sullia, Kushalnagar and Moodbidri, with an upcoming flagship showroom in Mangaluru launching by the end of 2026.",
        image:
          "https://res.cloudinary.com/mqgak7n7/image/upload/v1790309537/GL-Acharya-jewellers.webp",
        url: "http://glacharya.com/",
      },
    ],
  };

  const years = [
    { value: "2023-24", label: "2023-24" },
    { value: "2024-25", label: "2024-25" },
    { value: "2025-26", label: "2025-26" },
    { value: "2026-27", label: "2026-27", comingSoon: true },
  ];

  const currentSponsors = sponsorsByYear[selectedYear] ?? [];

  return (
    <div className="mb-10 mt-[4.75rem] min-h-screen sm:mt-[5.75rem] sm:p-4 md:mt-24 lg:mt-[6.25rem] lg:p-8">
      <div className="flex flex-col items-center justify-center gap-14 pt-10 text-center md:pt-2">
        <div className="flex flex-col py-5">
          <h1 className="pb-4 font-rhomdon text-5xl sm:text-7xl md:text-8xl">
            {t("Heading")}
          </h1>
          <p className="font-body text-center text-3xl text-secondary-100">
            {t("Description")}
          </p>
        </div>

        {/* Year Toggle */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
          {years.map((year) => (
            <button
              key={year.value}
              onClick={() => !year.comingSoon && setSelectedYear(year.value)}
              disabled={year.comingSoon}
              className={`group relative rounded-xl border-2 px-8 py-3.5 text-base font-semibold tracking-wide transition-all duration-300 sm:text-lg ${
                selectedYear === year.value
                  ? "scale-105 border-secondary-100 bg-gradient-to-br from-secondary-100 to-secondary-200 text-white shadow-2xl shadow-secondary-100/60 ring-2 ring-secondary-100/30 ring-offset-2 ring-offset-primary-100"
                  : year.comingSoon
                    ? "cursor-not-allowed border-gray-700/50 bg-gray-800/30 text-gray-500 opacity-60"
                    : "border-gray-700 bg-gray-800/40 text-white hover:scale-105 hover:border-secondary-200/50 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 hover:shadow-xl hover:shadow-gray-700/50 active:scale-95"
              }`}
            >
              <span className="relative z-10">{year.label}</span>
              {!year.comingSoon && selectedYear !== year.value && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary-100/0 to-secondary-200/0 transition-all duration-300 group-hover:from-secondary-100/10 group-hover:to-secondary-200/10" />
              )}
              {year.comingSoon && (
                <span className="absolute -right-2 -top-2 animate-pulse rounded-full bg-gradient-to-r from-secondary-200 to-secondary-100 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg sm:text-xs">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sponsors Display */}
        {currentSponsors.length > 0 ? (
          <div className="mx-4 flex max-w-7xl flex-col gap-7 sm:mx-8 lg:mx-32">
            {currentSponsors.map((sponsorDetail, i) => (
              <EventsCard
                delay={i * 1000}
                key={i}
                rev={i % 2 === 0 ? false : true}
                ImageSrc={sponsorDetail.image}
                SponsorTitle={sponsorDetail.name}
                SponsorDesc={sponsorDetail.description}
                SponsorWebsiteLink={sponsorDetail.url}
                Subtitle={sponsorDetail.subtitle}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="text-6xl">🎯</div>
            <h3 className="text-2xl font-medium text-gray-300 sm:text-3xl">
              No sponsors yet for {selectedYear}
            </h3>
            <p className="max-w-md text-lg text-gray-400">
              We&apos;re working on bringing amazing sponsors for this edition.
              Stay tuned!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sponsor;
