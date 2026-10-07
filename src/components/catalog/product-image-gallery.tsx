"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImage = { imageUrl: string; imageAlt?: string };

export function ProductImageGallery({ name, images }: { name: string; images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (!activeImage) return null;

  return <div className="product-detail-art has-product-photo product-image-gallery">
    <Image className="product-detail-photo" src={activeImage.imageUrl} alt={activeImage.imageAlt ?? name} fill sizes="(max-width: 650px) 100vw, 45vw" priority={activeIndex === 0} />
    <span className="detail-art-label">VG MULTISERVICE</span>
    {images.length > 1 ? <>
      <button className="product-gallery-arrow previous" type="button" onClick={() => setActiveIndex((index) => (index - 1 + images.length) % images.length)} aria-label="Ver foto anterior">‹</button>
      <button className="product-gallery-arrow next" type="button" onClick={() => setActiveIndex((index) => (index + 1) % images.length)} aria-label="Ver próxima foto">›</button>
      <span className="product-gallery-counter" aria-live="polite">{activeIndex + 1} / {images.length}</span>
    </> : null}
  </div>;
}
