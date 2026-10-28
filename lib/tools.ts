export type EnvReq = { key: string; label: string; optional?: boolean; anyOf?: string[] };

export type Tool = {
  slug: string;
  href: string;
  name: string; // brand name
  title: string; // short plain name
  letter: string;
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
    letter: "S",
    description: "Run free, lightweight estimated performance, SEO, accessibility, and best-practice checks on any public website.",
    login: "No login required",
    env: [
      { key: "GROQ_API_KEY", label: "Groq or Gemini key (AI summary)", optional: true, anyOf: ["GROQ_API_KEY", "GEMINI_API_KEY"] },
    ],
  },
  {
    slug: "inbox",
    href: "/inbox",
    name: "InboxHub",
    title: "Multi Gmail",
    letter: "I",
    description: "Connect multiple Gmail accounts and manage your inbox and email sending from one dashboard.",
    login: "Google login",
    env: [
      { key: "GOOGLE_CLIENT_ID", label: "Google Client ID" },
      { key: "GOOGLE_CLIENT_SECRET", label: "Google Client Secret" },
    ],
  },
  {
    slug: "reelforge",
    href: "/reelforge",
    name: "ReelForge",
    title: "Faceless YouTube",
    letter: "R",
    description: "Generate a script, voiceover, and captions from a topic, then upload the video to your YouTube channel.",
    login: "Google login for upload",
    env: [
      { key: "GROQ_API_KEY", label: "Groq or Gemini key", anyOf: ["GROQ_API_KEY", "GEMINI_API_KEY"] },
      { key: "VOICERSS_API_KEY", label: "VoiceRSS key" },
      { key: "GOOGLE_CLIENT_ID", label: "Google Client ID", optional: true },
    ],
  },
  {
    slug: "search-console",
    href: "/search-console",
    name: "PageControl",
    title: "Search Console",
    letter: "P",
    description: "Review top queries and pages, and check the indexing status of any URL in Google Search Console.",
    login: "Google login",
    env: [
      { key: "GOOGLE_CLIENT_ID", label: "Google Client ID" },
      { key: "GOOGLE_CLIENT_SECRET", label: "Google Client Secret" },
    ],
  },
  {
    slug: "chatbot",
    href: "/chatbot",
    name: "Chat Assistant",
    title: "AI Chatbot",
    letter: "C",
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
    letter: "P",
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
    letter: "L",
    description: "Research current laws and regulations with jurisdiction-aware answers and official source links.",
    login: "No login required",
    env: [
      { key: "GROQ_API_KEY", label: "Groq or Gemini key", anyOf: ["GROQ_API_KEY", "GEMINI_API_KEY"] },
    ],
  },
];
