// src/config/brand.ts
export const BRAND = {
  name: "SMV Holdings",
  shortName: "SMV Finance",
  appName: "SMV Finance",
  legalName: "SMV HOLDINGS (PVT) LTD",
  tagline: "Micro Finance",
  description: "Microfinance & SME Credit Division",
  location: "Microfinance & SME Credit Division • Colombo, Sri Lanka",
  logo: "/src/assets/logo2.jpg",
  colors: {
    primary: "#2563eb", // blue-600
    primaryDark: "#1d4ed8", // blue-700
    accent: "#059669", // emerald-600
    danger: "#e11d48", // rose-600
    warning: "#d97706", // amber-600
  },
  contact: {
    developer: "Axperia Information Systems",
    phone: "+94 788 017 808",
    email: "ask.axperia@gmail.com",
  },
  version: "v1.0.0",
} as const;
