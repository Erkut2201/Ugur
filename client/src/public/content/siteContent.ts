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
    address: "Bertholdweg 9, 72768 Reutlingen",
    phone: "+49 7071 8826970",
    email: "acun@acpremiumbau.de",
    mapsQuery: "Bertholdweg+9+Reutlingen",
  },
} as const;
