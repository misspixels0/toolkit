import ResearchChat from "@/components/ResearchChat";

export default function ProductResearchPage() {
  return (
    <ResearchChat
      type="product"
      title="Product & Market Research"
      subtitle="Explore products, compare options, and check the market"
      description="What product are you researching?"
      suggestions={[
        "Compare the latest iPhone and Samsung Galaxy models",
        "Research the market for reusable water bottles",
        "Find reliable budget laptops for students",
      ]}
    />
  );
}
