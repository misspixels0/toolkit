export type EnvReq = { key: string; label: string; optional?: boolean; anyOf?: string[] };

export type Tool = {
  slug: string;
  href: string;
  name: string; // brand name
  title: string; // short plain name
  icon: "website" | "chat" | "product" | "law" | "science" | "medical" | "business" | "language";
  description: string;
  login: string; // what the user needs to do
  env: EnvReq[]; // for status display only
};

export const TOOLS: Tool[] = [
  {
    slug: "website-review",
    href: "/website-review",
    name: "SiteScope",
    title: "Website Review",
    icon: "website",
    description: "Run free, lightweight estimated performance, SEO, accessibility, and best-practice checks on any public website.",
    login: "No login required",
    env: [
      { key: "GROQ_API_KEY", label: "Groq or Gemini key (AI summary)", optional: true, anyOf: ["GROQ_API_KEY", "GEMINI_API_KEY"] },
    ],
  },
  {
    slug: "chatbot",
    href: "/chatbot",
    name: "Chat Assistant",
    title: "AI Chatbot",
    icon: "chat",
    description: "Ask questions and get helpful answers in a conversational chat.",
    login: "No login required",
    env: [
      { key: "GROQ_API_KEY", label: "Groq or Gemini key", anyOf: ["GROQ_API_KEY", "GEMINI_API_KEY"] },
    ],
  },
  {
    slug: "product-research",
    href: "/product-research",
    name: "Product & Market Research",
    title: "Product Research",
    icon: "product",
    description: "Research products, compare features and prices, and explore market alternatives with live web sources.",
    login: "No login required",
    env: [
      { key: "GROQ_API_KEY", label: "Groq or Gemini key", anyOf: ["GROQ_API_KEY", "GEMINI_API_KEY"] },
    ],
  },
  {
    slug: "law-research",
    href: "/law-research",
    name: "Laws & Regulations",
    title: "Law Research",
    icon: "law",
    description: "Research current laws and regulations with jurisdiction-aware answers and official source links.",
    login: "No login required",
    env: [
      { key: "GROQ_API_KEY", label: "Groq or Gemini key", anyOf: ["GROQ_API_KEY", "GEMINI_API_KEY"] },
    ],
  },
  {
    slug: "science-research",
    href: "/science-research",
    name: "Science Research",
    title: "Science Research",
    icon: "science",
    description: "Explore scientific questions using current web sources, research papers, and evidence-aware explanations.",
    login: "Groq API key",
    env: [{ key: "SCIENCE_GROQ_API_KEY", label: "Science Groq key" }],
  },
  {
    slug: "medical-research",
    href: "/medical-research",
    name: "Medical Research",
    title: "Medical Research",
    icon: "medical",
    description: "Find evidence-based medical information and research with clear sources and limitations.",
    login: "Groq API key",
    env: [{ key: "MEDICAL_GROQ_API_KEY", label: "Medical Groq key" }],
  },
  {
    slug: "business-research",
    href: "/business-research",
    name: "Business Research",
    title: "Business Research",
    icon: "business",
    description: "Research industries, competitors, customers, and business opportunities using current web sources.",
    login: "Groq API key",
    env: [{ key: "SPECIALIST_GROQ_API_KEY", label: "Business & Language Groq key" }],
  },
  {
    slug: "language-tutor",
    href: "/language-tutor",
    name: "Language Tutor",
    title: "Language Tutor",
    icon: "language",
    description: "Practice a language through tailored explanations, corrections, vocabulary, and conversation.",
    login: "Groq API key",
    env: [{ key: "SPECIALIST_GROQ_API_KEY", label: "Business & Language Groq key" }],
  },
];
