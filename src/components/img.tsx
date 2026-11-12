"use client";

import Image, { type ImageProps } from "next/image";
import { photoLoader } from "@/lib/image-loader";

/** next/image con el cargador propio (ver lib/image-loader). */
export function Img(props: ImageProps) {
  return <Image loader={photoLoader} {...props} />;
}
