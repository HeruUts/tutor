import { cn } from "@/lib/utils";
import { useAgent } from "@/hooks/use-agent";
import { useEffect, useRef, RefObject, useState, use } from "react";
import { saveTranscriptions } from "@/lib/api/transcription";
import { getUsernameFromCookie } from "@/utils/cookies";
import { Transcription } from "@/types/transcriptions";

export function Transcript({
  scrollContainerRef,
  scrollButtonRef,
}: {
  scrollContainerRef: RefObject<HTMLElement>;
  scrollButtonRef: RefObject<HTMLButtonElement>;
}) {
  const { displayTranscriptions } = useAgent();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const calculateDistanceFromBottom = (container: HTMLElement) => {
    const { scrollHeight, scrollTop, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight;
  };

  const handleScrollVisibility = (
    container: HTMLElement,
    scrollButton: HTMLButtonElement,
  ) => {
    const distanceFromBottom = calculateDistanceFromBottom(container);
    const shouldShowButton = distanceFromBottom > 100;
    setShowScrollButton(shouldShowButton);
    scrollButton.style.display = shouldShowButton ? "flex" : "none";
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const handleSaveTranscript = async () => {
    const user_name = getUsernameFromCookie();
    
    // Check if username exists
    if (!user_name) {
        setSaveMessage("You must be logged in to save transcripts.");
        setTimeout(() => setSaveMessage(""), 3000);
        return;
    }

    setIsSaving(true);
    try {
        // Convert displayTranscriptions to the format expected by saveTranscriptions
        const chat_transcriptions: Transcription[] = displayTranscriptions.map((item) => ({
            segment: {
              
                text: item.segment.text,
                id: item.segment.id,
                participant: item.participant,
            },
            username: user_name, // Now guaranteed to be string
        }));

        await saveTranscriptions( chat_transcriptions, user_name);
        setSaveMessage("Transcript saved successfully!");
    } catch (err) {
        console.error(err);
        setSaveMessage("Failed to save transcript.");
    } finally {
        setIsSaving(false);
        setTimeout(() => setSaveMessage(""), 3000);
    }
};
  useEffect(() => {
    const container = scrollContainerRef.current;
    const scrollButton = scrollButtonRef.current;
    if (container && scrollButton) {
      const handleScroll = () =>
        handleScrollVisibility(container, scrollButton);

      handleScroll(); // Check initial state
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [
    scrollContainerRef,
    scrollButtonRef,
    displayTranscriptions,
    handleScrollVisibility,
    handleSaveTranscript,
  ]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const distanceFromBottom = calculateDistanceFromBottom(container);
      const isNearBottom = distanceFromBottom < 100;

      if (isNearBottom) {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [displayTranscriptions, scrollContainerRef, transcriptEndRef]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const scrollButton = scrollButtonRef.current;
    if (scrollButton) {
      scrollButton.addEventListener("click", scrollToBottom);
      return () => scrollButton.removeEventListener("click", scrollToBottom);
    }
  }, [scrollButtonRef]);

  return (
    <>
      <div className="flex items-center text-xs font-semibold uppercase tracking-widest sticky top-0 left-0 bg-white w-full p-4">
        Transcript of Conversation
      </div>
      <button
        onClick={handleSaveTranscript}
        disabled={isSaving}
        className="flex items-center bg-green-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
      >
        {isSaving ? 'Saving...' : 'Save Transcript'}
      </button>
      <div className="p-4 min-h-[300px] relative">
        {displayTranscriptions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm">
            Get talking to start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {displayTranscriptions.map(
              ({ segment, participant, publication }) =>
                segment.text.trim() !== "" && (
                  <div
                    key={segment.id}
                    className={cn(
                      "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                      participant?.isAgent
                        ? "bg-neutral-100 text-[#09090B]"
                        : "ml-auto border border-white text-white",
                    )}
                  >
                    {segment.text.trim()}
                  </div>
                ),
            )}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>
    </>
  );
}
