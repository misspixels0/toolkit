import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { checkServerIdentity } from "node:tls";
import { NextRequest, NextResponse } from "next/server";
import { aiGenerate, hasAIKey } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

type CategoryScore = {
  id: string;
  title: string;
  score: number | null;
};

type Audit = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
};

type Check = {
  id: string;
  title: string;
  description: string;
  passed: boolean;
};

const MAX_HTML_BYTES = 1_000_000;
const MAX_REDIRECTS = 5;

function isPublicIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) return false;
  const [a, b] = parts;

  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && parts[2] === 0) ||
    (a === 192 && b === 0 && parts[2] === 2) ||
    (a === 192 && b === 88 && parts[2] === 99) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && parts[2] === 100) ||
    (a === 203 && b === 0 && parts[2] === 113) ||
    a >= 224
  );
}

function isPublicIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("::ffff:") ||
    normalized.startsWith("2001:db8:")
  ) {
    return false;
  }
  return normalized.startsWith("2") || normalized.startsWith("3");
}

async function resolvePublicAddress(url: URL) {
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("Enter a valid public website URL using HTTP or HTTPS.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Only publicly accessible websites can be checked.");
  }

  const ipVersion = isIP(hostname);
  if (ipVersion === 4 && !isPublicIpv4(hostname)) {
    throw new Error("Only publicly accessible websites can be checked.");
  }
  if (ipVersion === 6 && !isPublicIpv6(hostname)) {
    throw new Error("Only publicly accessible websites can be checked.");
  }

  if (ipVersion) return { address: hostname, family: ipVersion };

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address, family }) => {
    return family === 4 ? !isPublicIpv4(address) : !isPublicIpv6(address);
  })) {
    throw new Error("Only publicly accessible websites can be checked.");
  }
  return addresses[0];
}

function normalizeUrl(input: string) {
  const candidate = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
  return new URL(candidate);
}

function textContent(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function makeCheck(
  id: string,
  title: string,
  description: string,
  passed: boolean
): Check {
  return { id, title, description, passed };
}

function checkScore(checks: Check[]) {
  if (!checks.length) return 0;
  return Math.round((checks.filter((check) => check.passed).length / checks.length) * 100);
}

function analyzeHtml(html: string, finalUrl: URL, responseTime: number, bytes: number, status: number) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]?.trim() || "";
  const description = html.match(
    /<meta\b(?=[^>]*\bname\s*=\s*["']description["'])(?=[^>]*\bcontent\s*=\s*["']([^"']*)["'])[^>]*>/i
  )?.[1] || "";
  const h1Count = (html.match(/<h1\b[^>]*>/gi) || []).length;
  const images = html.match(/<img\b[^>]*>/gi) || [];
  const imagesWithAlt = images.filter((image) => /\balt\s*=/i.test(image)).length;
  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi) || [];
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button\s*>/gi) || [];
  const anchorsWithoutName = anchors.filter((anchor) => {
    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(anchor);
    const hasText = textContent(anchor).length > 0;
    const hasImageAlt = /<img\b[^>]*\balt\s*=\s*["'][^"']+["']/i.test(anchor);
    return !hasAriaLabel && !hasText && !hasImageAlt;
  }).length;
  const buttonsWithoutName = buttons.filter((button) => {
    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(button);
    return !hasAriaLabel && !textContent(button);
  }).length;

  const seoChecks = [
    makeCheck("title", "Add a page title", "Add a descriptive title tag so people and search engines can identify this page.", Boolean(title)),
    makeCheck("description", "Add a meta description", "Add a concise meta description to describe this page in search results.", Boolean(description)),
    makeCheck("h1", "Use one clear main heading", "Add exactly one H1 heading that describes the main topic of the page.", h1Count === 1),
    makeCheck("canonical", "Add a canonical URL", "Add a canonical link to indicate the preferred URL for this page.", /<link\b[^>]*\brel\s*=\s*["']canonical["']/i.test(html)),
    makeCheck("robots", "Allow search indexing", "This page has a noindex directive; remove it if you want search engines to index the page.", !/<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*\bcontent\s*=\s*["'][^"']*noindex/i.test(html)),
  ];
  const accessibilityChecks = [
    makeCheck("language", "Set the page language", "Add a lang attribute to the HTML element for assistive technology.", /<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(html)),
    makeCheck("image-alt", "Provide alternative text for images", images.length === 0 || imagesWithAlt === images.length ? "Images have alternative text." : `${images.length - imagesWithAlt} of ${images.length} images are missing an alt attribute.`, images.length === 0 || imagesWithAlt === images.length),
    makeCheck("link-name", "Give links accessible names", anchorsWithoutName === 0 ? "Links have text or an accessible label." : `${anchorsWithoutName} links appear to have no accessible name.`, anchorsWithoutName === 0),
    makeCheck("button-name", "Give buttons accessible names", buttonsWithoutName === 0 ? "Buttons have text or an accessible label." : `${buttonsWithoutName} buttons appear to have no accessible name.`, buttonsWithoutName === 0),
    makeCheck("heading", "Use a main heading", "Add an H1 heading to identify the main content.", h1Count > 0),
  ];
  const bestPracticeChecks = [
    makeCheck("https", "Use HTTPS", "Serve the website over HTTPS to protect connections.", finalUrl.protocol === "https:"),
    makeCheck("viewport", "Set a mobile viewport", "Add a viewport meta tag so the page displays correctly on mobile.", /<meta\b[^>]*\bname\s*=\s*["']viewport["']/i.test(html)),
    makeCheck("charset", "Declare a character encoding", "Declare UTF-8 in a meta charset tag.", /<meta\b[^>]*\bcharset\s*=/i.test(html)),
    makeCheck("status", "Return a successful response", `The page responded with HTTP ${status}.`, status >= 200 && status < 400),
  ];
  const performanceChecks = [
    makeCheck("response-time", "Keep response time low", `The request and HTML download took ${responseTime} ms. This is a simple server-side estimate, not a lab performance score.`, responseTime < 1000),
    makeCheck("document-size", "Keep the HTML document compact", `Downloaded ${(bytes / 1024).toFixed(0)} KB of HTML (up to 1 MB checked).`, bytes <= 200_000),
  ];
  const categories: CategoryScore[] = [
    { id: "performance", title: "Performance (estimate)", score: checkScore(performanceChecks) },
    { id: "seo", title: "SEO", score: checkScore(seoChecks) },
    { id: "accessibility", title: "Accessibility", score: checkScore(accessibilityChecks) },
    { id: "best-practices", title: "Best practices", score: checkScore(bestPracticeChecks) },
  ];
  const audits: Audit[] = [...seoChecks, ...accessibilityChecks, ...bestPracticeChecks, ...performanceChecks]
    .filter((check) => !check.passed)
    .map((check) => ({
      id: check.id,
      title: check.title,
      description: check.description,
      score: 0,
    }))
    .slice(0, 8);

  return { categories, audits };
}

async function fetchWebsite(inputUrl: URL) {
  let currentUrl = inputUrl;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const resolvedAddress = await resolvePublicAddress(currentUrl);
    const startedAt = Date.now();
    const targetUrl = new URL(currentUrl.href);
    targetUrl.hostname = resolvedAddress.address;
    const hostname = currentUrl.hostname.replace(/^\[|\]$/g, "");
    const requestFunction = currentUrl.protocol === "https:" ? httpsRequest : httpRequest;
    const response = await new Promise<import("node:http").IncomingMessage>((resolve, reject) => {
      const request = requestFunction(targetUrl, {
        headers: {
          Host: currentUrl.host,
          "User-Agent": "ToolkitHubSiteReview/1.0",
        },
        servername: isIP(hostname) ? undefined : hostname,
        checkServerIdentity: (_serverName, certificate) => checkServerIdentity(hostname, certificate),
      }, resolve);
      request.setTimeout(15_000, () => request.destroy(new Error("The website took too long to respond.")));
      request.on("error", reject);
      request.end();
    });

    if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
      const locationHeader = response.headers.location;
      const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
      response.resume();
      if (!location || redirects === MAX_REDIRECTS) {
        throw new Error("The website redirected too many times or returned an invalid redirect.");
      }
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    const contentType = response.headers["content-type"] || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      response.resume();
      throw new Error("That URL did not return an HTML page to review.");
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const value of response) {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      const remaining = MAX_HTML_BYTES - bytes;
      chunks.push(chunk.length > remaining ? chunk.subarray(0, remaining) : chunk);
      bytes += Math.min(chunk.length, remaining);
      if (chunk.length > remaining || bytes >= MAX_HTML_BYTES) {
        response.destroy();
        break;
      }
    }
    return {
      html: Buffer.concat(chunks).toString("utf8"),
      bytes,
      finalUrl: currentUrl,
      status: response.statusCode || 0,
      responseTime: Date.now() - startedAt,
    };
  }
  throw new Error("The website could not be reached.");
}

async function getAISummary(url: string, categories: CategoryScore[], audits: Audit[]) {
  if (!hasAIKey()) return null;
  const prompt = `You are a plain-speaking web consultant. A lightweight website check (not Lighthouse) found these approximate category scores (0-100): ${categories
    .map((category) => `${category.title}: ${category.score}`)
    .join(", ")}.

Issues:
${audits.map((audit) => `- ${audit.title}`).join("\n")}

Write a short, plain-English verdict and three prioritized fixes for ${url}, under 120 words.`;

  try {
    return (await aiGenerate(prompt)) || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url;
    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "Website URL is required." }, { status: 400 });
    }

    let inputUrl: URL;
    try {
      inputUrl = normalizeUrl(rawUrl);
    } catch {
      return NextResponse.json({ error: "Enter a valid website URL." }, { status: 400 });
    }

    const website = await fetchWebsite(inputUrl);
    const { categories, audits } = analyzeHtml(
      website.html,
      website.finalUrl,
      website.responseTime,
      website.bytes,
      website.status
    );
    const aiSummary = await getAISummary(website.finalUrl.href, categories, audits);

    return NextResponse.json({
      url: inputUrl.href,
      categories,
      audits,
      aiSummary,
      finalUrl: website.finalUrl.href,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong while analyzing this site.";
    const status = message.includes("Only publicly accessible") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
