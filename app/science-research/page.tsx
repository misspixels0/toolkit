import ResearchChat from "@/components/ResearchChat";

export default function ScienceResearchPage() {
  return (
    <ResearchChat
      type="science"
      title="Science Research"
      subtitle="Explore scientific evidence with current sources"
      description="What scientific question are you exploring?"
      notice="Research summaries are informational. Check the linked studies, methods, dates, and limitations."
      suggestions={[
        "What does current research say about how sleep affects memory?",
        "Summarize recent evidence on ocean microplastics",
        "What are the leading scientific explanations for auroras?",
      ]}
    />
  );
}
