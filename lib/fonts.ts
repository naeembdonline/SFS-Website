import { Inter, Hind_Siliguri, Noto_Naskh_Arabic } from "next/font/google";

export const fontEn = Inter({
  subsets: ["latin"],
  variable: "--font-en",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontBn = Hind_Siliguri({
  subsets: ["bengali"],
  variable: "--font-bn",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontAr = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-ar",
  display: "swap",
  weight: ["400", "700"],
});
