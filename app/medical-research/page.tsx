import ResearchChat from "@/components/ResearchChat";

export default function MedicalResearchPage() {
  return (
    <ResearchChat
      type="medical"
      title="Medical Research"
      subtitle="Explore health research and clinical evidence"
      description="What medical topic would you like to research?"
      notice="For general research only—not diagnosis or personal treatment advice. Please consult a qualified healthcare professional about personal medical decisions."
      suggestions={[
        "What do current guidelines say about adult blood pressure ranges?",
        "Summarize the evidence on sleep and cardiovascular health",
        "What are common limitations of observational medical studies?",
      ]}
    />
  );
}
