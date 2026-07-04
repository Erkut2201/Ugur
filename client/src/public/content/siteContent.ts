import { productPages } from "./products.js";

/** Keys match translations.highlights.* */
export const highlightKeys = [
  "price",
  "custom",
  "quality",
  "service",
  "install",
  "warranty",
] as const;

/** Keys match translations.faq.* */
export const faqKeys = [
  "permit",
  "timeline",
  "material",
  "showroom",
] as const;

export const siteContent = {
  products: productPages,
  highlightKeys,
  faqKeys,
  contact: {
    address: "Jakob-Krebs-Str. 53, 47877 Willich",
    phone: "+49 2156 9106557",
    email: "info@konzept-terrasse.de",
    mapsQuery: "Jakob-Krebs-Str.+53+Willich",
  },
} as const;
