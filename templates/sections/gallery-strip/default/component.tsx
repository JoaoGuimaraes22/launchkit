"use client";

import Image from "next/image";

interface GalleryImage {
  src: string;
  alt: string;
}

interface GalleryStripDict {
  images: GalleryImage[];
}

export default function GalleryStrip({ galleryStrip }: { galleryStrip: GalleryStripDict }) {
  // Duplicate the array for seamless infinite loop
  const images = [...galleryStrip.images, ...galleryStrip.images];

  return (
    <section className="overflow-hidden bg-zinc-950 py-3">
      <div className="gallery-track flex" style={{ width: "max-content" }}>
        {images.map((img, i) => (
          <div
            key={i}
            className="relative mx-1.5 h-48 w-72 shrink-0 overflow-hidden rounded-lg sm:h-56 sm:w-80"
          >
            <Image src={img.src} alt={img.alt} fill className="object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  );
}
