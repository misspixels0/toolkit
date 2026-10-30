import ResearchChat from "@/components/ResearchChat";

export default function LanguageTutorPage() {
  return (
    <ResearchChat
      type="language"
      title="Language Tutor"
      subtitle="Practice languages with patient, personalized guidance"
      description="Which language would you like to practice?"
      notice="Tell the tutor your target language and level. Ask it to correct your writing, explain grammar, or practice a conversation."
      suggestions={[
        "Help me practice beginner English conversation",
        "Teach me five useful Spanish phrases and quiz me",
        "Correct this sentence and explain the grammar: I has a book",
      ]}
    />
  );
}
