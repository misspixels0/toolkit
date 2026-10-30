import ResearchChat from "@/components/ResearchChat";

export default function BusinessResearchPage() {
  return (
    <ResearchChat
      type="business"
      title="Business Research"
      subtitle="Explore markets, competitors, and business opportunities"
      description="What business question are you researching?"
      notice="Research is informational. Verify important market figures and decisions against the linked sources."
      suggestions={[
        "Research the electric vehicle market in Pakistan",
        "How can I assess competitors before opening a coffee shop?",
        "What should a market analysis include for a small online clothing store?",
      ]}
    />
  );
}
