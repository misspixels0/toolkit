import ResearchChat from "@/components/ResearchChat";

export default function LawResearchPage() {
  return (
    <ResearchChat
      type="law"
      title="Laws & Regulations Research"
      subtitle="Research current rules with official sources"
      description="Which law or rule would you like to understand?"
      notice="Include the country or region in your question. This tool provides general research, not legal advice."
      suggestions={[
        "What are the current rules for registering a small business in Pakistan?",
        "Find official UK rules for returning an online purchase",
        "What should I check before renting a home in California?",
      ]}
    />
  );
}
