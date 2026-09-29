import Image from "next/image";
import React from "react";

interface CardProps {
  name: string;
  role: string;
  // desc: string;
  url: string;
  rotation?: number;
}

const Card: React.FC<CardProps> = ({ name, role, url, rotation }) => {

  return (
    <div className="group sm:h-96 h-80 my-2 sm:my-0 sm:w-80 w-64 [perspective:1000px]">
      <div className="relative h-full w-full rounded-xl shadow-xl transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        <div className="absolute inset-0">
          {url ? (
            <Image
              className="h-full w-full rounded-xl object-cover shadow-xl shadow-black/40"
              src={url}
              alt=""
              height={400}
              width={400}
              style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/60 p-6 text-center shadow-xl shadow-black/40">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary-100/20 border border-secondary-100/40 text-secondary-100 text-3xl font-bold mb-4">
                {name.charAt(0) || "?"}
              </div>
              <h2 className="text-xl font-bold text-white line-clamp-2">{name}</h2>
              <p className="mt-1 text-sm text-secondary-200 capitalize">{role}</p>
            </div>
          )}
        </div>
        <div className="absolute inset-0 h-full w-full rounded-xl bg-black/60 px-12 text-center text-slate-200 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex min-h-full flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">{name}</h1>
            <p className="text-lg capitalize">{role}</p>
            {/* <p className="text-base">{desc}</p>   */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;