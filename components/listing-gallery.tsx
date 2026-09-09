"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { useState } from "react";

export function ListingGallery({
  images,
  title
}: {
  images: string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="grid h-[min(58vh,560px)] min-h-[300px] place-items-center rounded-xl bg-[#edf0ec] text-[#8c9690] sm:min-h-[400px]">
        <div className="text-center">
          <ImageIcon
            size={40}
            className="mx-auto"
          />
          <p className="mt-2 text-sm font-medium">
            No photo provided
          </p>
        </div>
      </div>
    );
  }

  const current =
    images[Math.min(index, images.length - 1)];

  return (
    <div>
      <div className="relative h-[min(58vh,560px)] min-h-[300px] overflow-hidden rounded-xl bg-[#edf0ec] sm:min-h-[400px]">
        <Image
          src={current}
          alt={`${title} photo ${index + 1}`}
          fill
          priority={index === 0}
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 760px"
        />

        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() =>
                setIndex(
                  (index - 1 + images.length) %
                    images.length
                )
              }
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              aria-label="Next photo"
              onClick={() =>
                setIndex(
                  (index + 1) % images.length
                )
              }
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow"
            >
              <ChevronRight size={20} />
            </button>

            <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <button
              key={`${image}-${imageIndex}`}
              type="button"
              onClick={() => setIndex(imageIndex)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border ${
                imageIndex === index
                  ? "border-[#173f30]"
                  : "border-[#d9ded9]"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
