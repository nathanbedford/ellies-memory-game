import { useEffect, useRef, useState } from "react";
import { CARD_DECKS } from "../data/cardDecks";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import type { Card } from "../types";

interface CardLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  cards?: Card[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

// Helper function to format imageId into a readable name
const formatCardName = (imageId: string): string => {
  // Find the card in any deck
  for (const deck of CARD_DECKS) {
    const cardData = deck.cards.find((c) => c.id === imageId);
    if (cardData) {
      // Convert kebab-case to Title Case (e.g., 'very-happy' -> 'Very Happy')
      return imageId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  }
  // Fallback: format the imageId itself
  return imageId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const CardLightbox = ({
  isOpen,
  onClose,
  card,
  cards = [],
  currentIndex = 0,
  onNavigate,
}: CardLightboxProps) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isPositioning, setIsPositioning] = useState(false); // true = no transition (instant position)
  const [entryDirection, setEntryDirection] = useState<"left" | "right" | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Calculate rotation based on swipe (subtle tilt effect)
  const rotation = (swipeOffset / window.innerWidth) * 8; // max ~8 degrees
  const opacity = isAnimatingOut ? 0.5 : 1;

  // Disable transition when actively swiping or positioning for entry
  const disableTransition = isSwiping || isPositioning;

  // Calculate transition time based on remaining distance (100-250ms range)
  // More distance to travel = more time, so animation is always visible
  const remainingDistance = Math.abs(window.innerWidth - Math.abs(swipeOffset));
  const transitionTime = Math.max(100, Math.min(250, (remainingDistance / window.innerWidth) * 300));
  const { speak, isAvailable } = useTextToSpeech();

  // Swipe configuration
  const screenWidth = window.innerWidth;
  const minSwipeDistance = screenWidth / 2; // Must drag 50% of screen to trigger
  const velocityThreshold = 0.3; // pixels per ms - fast flicks trigger navigation

  // Check if navigation is possible
  const canNavigate = cards.length > 1 && onNavigate;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && cards.length > 0 && onNavigate && !isAnimatingOut) {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        setEntryDirection("left");
        onNavigate(prevIndex);
      } else if (e.key === "ArrowRight" && cards.length > 0 && onNavigate && !isAnimatingOut) {
        const nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        setEntryDirection("right");
        onNavigate(nextIndex);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, cards, currentIndex, onNavigate, isAnimatingOut]);

  // Animate new card entering from the appropriate side
  useEffect(() => {
    if (entryDirection) {
      // Disable transition and position off-screen instantly
      setIsPositioning(true);
      const startOffset = entryDirection === "left" ? -window.innerWidth : window.innerWidth;
      setSwipeOffset(startOffset);
      setIsAnimatingOut(false);
      setIsSwiping(false);

      // Wait for position to apply, then enable transition and animate to center
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPositioning(false); // Re-enable transition
          setSwipeOffset(0);       // Animate to center
          setEntryDirection(null);
        });
      });
    } else {
      // Normal reset (e.g., when opening modal)
      setSwipeOffset(0);
      setIsSwiping(false);
      setIsAnimatingOut(false);
      setIsPositioning(false);
    }
  }, [currentIndex, entryDirection]);

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnimatingOut) return;
    const touch = e.touches[0];
    touchStartTimeRef.current = Date.now();
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
    });
    setIsSwiping(true);
  };

  // Handle touch move - card follows finger
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isAnimatingOut) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // If vertical movement dominates, don't swipe horizontally
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(swipeOffset) < 10) {
      return;
    }

    setSwipeOffset(deltaX);
  };

  // Handle touch end - snap or spring back
  const onTouchEnd = () => {
    if (!touchStart || !canNavigate || !onNavigate || isAnimatingOut) {
      setTouchStart(null);
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }

    const elapsed = Date.now() - touchStartTimeRef.current;
    const velocity = Math.abs(swipeOffset) / elapsed;
    const isLeftSwipe = swipeOffset < -minSwipeDistance || (swipeOffset < -20 && velocity > velocityThreshold);
    const isRightSwipe = swipeOffset > minSwipeDistance || (swipeOffset > 20 && velocity > velocityThreshold);

    // Calculate exit animation time based on remaining distance
    const remainingDist = screenWidth - Math.abs(swipeOffset);
    const exitTime = Math.max(80, Math.min(200, (remainingDist / screenWidth) * 250));

    if (isLeftSwipe) {
      // Animate out to the left, then navigate - new card enters from right
      setIsAnimatingOut(true);
      setSwipeOffset(-screenWidth);
      setTimeout(() => {
        const nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        setEntryDirection("right");
        onNavigate(nextIndex);
      }, exitTime);
    } else if (isRightSwipe) {
      // Animate out to the right, then navigate - new card enters from left
      setIsAnimatingOut(true);
      setSwipeOffset(screenWidth);
      setTimeout(() => {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        setEntryDirection("left");
        onNavigate(prevIndex);
      }, exitTime);
    } else {
      // Spring back to center
      setSwipeOffset(0);
    }

    setTouchStart(null);
    setIsSwiping(false);
  };

  if (!isOpen || !card) return null;

  const handlePrevious = () => {
    if (canNavigate && !isAnimatingOut) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
      setEntryDirection("left");
      onNavigate(prevIndex);
    }
  };

  const handleNext = () => {
    if (canNavigate && !isAnimatingOut) {
      const nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
      setEntryDirection("right");
      onNavigate(nextIndex);
    }
  };

  // Check if imageUrl is an actual image URL or an emoji
  const isImage =
    card.imageUrl &&
    (card.imageUrl.startsWith("http") ||
      card.imageUrl.startsWith("/") ||
      card.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
      card.imageUrl.includes("blob:") ||
      card.imageUrl.includes("data:"));

  const cardName = formatCardName(card.imageId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm transition-opacity" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors z-10"
        type="button"
        title="Close"
        aria-label="Close lightbox"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <title>Close</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Navigation Arrows */}
      {canNavigate && (
        <>
          {/* Left Arrow */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors z-10"
            type="button"
            title="Previous card"
            aria-label="Previous card"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Previous</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors z-10"
            type="button"
            title="Next card"
            aria-label="Next card"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Next</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Card Display */}
      {/** biome-ignore lint/a11y/useSemanticElements: Non-critical */}
      <div
        ref={cardContainerRef}
        className="relative w-full h-full flex items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="region"
        aria-label="Card display"
      >
        {/* Card container with rounded corners */}
        <div
          className="relative flex items-center justify-center w-full max-w-[95vmin] max-h-[95vmin] rounded-3xl overflow-hidden shadow-2xl"
          style={{
            aspectRatio: "1/1",
            transform: `translateX(${swipeOffset}px) rotate(${rotation}deg)`,
            opacity,
            transition: disableTransition ? "none" : `transform ${transitionTime}ms ease-out, opacity ${transitionTime * 0.8}ms ease-out`,
            willChange: disableTransition ? "transform" : "auto",
          }}
        >
          {isImage ? (
            <img
              src={card.imageUrl}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <div
              className={`relative w-full h-full flex items-center justify-center ${card.gradient
                ? `bg-gradient-to-br ${card.gradient}`
                : "bg-white"
                }`}
            >
              {/* Semi-transparent overlay for gradient backgrounds */}
              {card.gradient && (
                <div className="absolute inset-0 bg-white opacity-30" />
              )}
              <div
                className="text-center relative z-10"
                style={{ fontSize: "min(52.25vmin, 200px)" }}
              >
                {card.imageUrl || "?"}
              </div>
            </div>
          )}

          {/* Card Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-center gap-3">
              <h2
                className="text-white text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold"
                style={{
                  textShadow:
                    "0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.9)",
                }}
              >
                {cardName}
              </h2>
              {isAvailable() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(cardName);
                  }}
                  className="p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/30 text-white transition-colors flex-shrink-0 shadow-lg"
                  type="button"
                  title="Read name aloud"
                  style={{
                    boxShadow:
                      "0 2px 8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 drop-shadow-lg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }}
                    aria-hidden="true"
                  >
                    <title>Speak</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};