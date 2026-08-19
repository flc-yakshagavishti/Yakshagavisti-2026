import React from "react";
import Card from "~/components/Team/Corecard";

const AllCards: React.FC = () => {
  const techTeam2026_27 = [
    {
      name: "Ashton Prince Mathias",
      role: "Web Developer",
      linkedinURL: "https://www.linkedin.com/in/ashtonmths/",
      githubURL: "https://github.com/ashtonmths",
      url:"https://res.cloudinary.com/dstpdenfa/image/upload/v1754551729/profile_pictures/profile_205_1754551724.jpg",
    },
    {
      name:"Sushan S Shetty",
      role:"Web Developer",
      linkedinURL:"https://linkedin.com/in/samarth-shetty-a53018247/",
      githubURL:"https://github.com/sushanshetty1",
      url:"https://res.cloudinary.com/dtwyb0bpv/image/upload/v1759782404/tvmrd27bh9ykichknuno.jpg",
    },
    {
      name:"Suvidha Karkera",
      role:"Web Developer",
      linkedinURL:"https://www.linkedin.com/in/suvidhakarkera/",
      githubURL:"https://github.com/suvidhakarkera",
      url:"https://res.cloudinary.com/dstpdenfa/image/upload/v1761972998/profile_pictures/profile_870_1761972995.jpg",
    }
  ];

  const techTeam2025_26 = [
    {
      name: "Omkar Prabhu",
      role: "Web Developer",
      linkedinURL: "https://www.linkedin.com/in/prabhuomkar9/",
      githubURL: "https://github.com/Prabhuomkar9",
      url:"https://res.cloudinary.com/dstpdenfa/image/upload/v1725635318/flc-website/Core/kplgkmklnf8gitxtfbpp.jpg",
    },
    {
      name:"Samarth H Shetty",
      role:"Web Developer",
      linkedinURL:"https://linkedin.com/in/samarth-shetty-a53018247/",
      githubURL:"https://github.com/Sammonster495",
      url:"https://res.cloudinary.com/dvueqtopm/image/upload/v1743224895/Samarth_H_Shetty_gyvsrx.webp",
    },
    {
      name:"Ishan Shetty",
      role:"Web Developer",
      linkedinURL:"https://www.linkedin.com/in/ishan-shetty-0a889821a/",
      githubURL:"https://github.com/Ishan-Shetty",
      url:"https://res.cloudinary.com/dvueqtopm/image/upload/v1743224899/Ishan_Shetty_urcr9o.jpg",
    }
  ];

  return (
    <div className="my-8 flex flex-col items-center justify-center gap-16">
      {/* 2026-27 Tech Team */}
      <div className="w-full">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-8 text-secondary-100">
          Tech Team 2026-27
        </h2>
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {techTeam2026_27.map((cardProp, idx) => (
              <Card key={idx} {...cardProp} />
            ))}
          </div>
        </div>
      </div>

      {/* 2025-26 Tech Team */}
      <div className="w-full">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-8 text-secondary-100">
          Tech Team 2025-26
        </h2>
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {techTeam2025_26.map((cardProp, idx) => (
              <Card key={idx} {...cardProp} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllCards;
