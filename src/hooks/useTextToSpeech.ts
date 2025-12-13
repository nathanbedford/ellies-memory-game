import { useRef, useCallback, useEffect } from 'react';

interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

/**
 * Formats an imageId (e.g., "juvenile-trex") into a readable name for speech (e.g., "Juvenile Trex")
 */
export const formatCardNameForSpeech = (imageId: string): string => {
	return imageId
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

export const useTextToSpeech = () => {
  const speechSynthesisRef = useRef<typeof speechSynthesis | null>(null);
  const isSpeakingRef = useRef(false);
  const voicesLoadedRef = useRef(false);
  const lastSpeakTimeRef = useRef(0);
  const lastTextRef = useRef<string>('');
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize speechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      
      // Chrome bug workaround: cancel any stuck speech on init
      speechSynthesisRef.current.cancel();
      
      // Load voices (some browsers need this)
      const loadVoices = () => {
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.getVoices();
          voicesLoadedRef.current = true;
        }
      };
      
      // Try to load voices immediately
      loadVoices();
      
      // Some browsers fire the voiceschanged event
      if (speechSynthesisRef.current.onvoiceschanged !== undefined) {
        speechSynthesisRef.current.onvoiceschanged = loadVoices;
      }
      
      // Fallback: try loading after a short delay
      setTimeout(loadVoices, 100);
    }
  }, []);

  // Check if TTS is available
  const isAvailable = useCallback(() => {
    return speechSynthesisRef.current !== null;
  }, []);

  // Cancel any ongoing speech
  const cancel = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      isSpeakingRef.current = false;
    }
  }, []);

  // Speak a message
  const speak = useCallback((
    text: string,
    options: TextToSpeechOptions = {}
  ) => {
    const now = Date.now();
    
    // Debounce: skip duplicate calls for the same text within 100ms
    if (text === lastTextRef.current && now - lastSpeakTimeRef.current < 100) {
      return;
    }
    lastSpeakTimeRef.current = now;
    lastTextRef.current = text;
    
    if (!speechSynthesisRef.current) {
      console.warn('Text-to-speech is not available in this browser');
      return;
    }

    // Only cancel if WE know we're speaking - don't trust browser's .speaking which can get stuck (Chrome bug)
    if (isSpeakingRef.current) {
      cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set options - slightly slower rate for better clarity
    utterance.rate = options.rate ?? 0.9;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    utterance.lang = options.lang ?? 'en-US';

    // Try to find an American English voice (kid-friendly)
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoice = voices.find(
      voice => voice.lang === 'en-US' && (
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('allison') ||
        voice.name.toLowerCase().includes('ava') ||
        voice.name.toLowerCase().includes('susan')
      )
    ) || voices.find(voice => voice.lang === 'en-US');

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Set up event handlers
    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    utterance.onerror = (event) => {
      // Ignore "canceled" errors - these are expected when speech is interrupted
      if (event.error !== 'canceled') {
        console.error('Speech synthesis error:', event);
      }
      isSpeakingRef.current = false;
    };

    // Speak
    speechSynthesisRef.current.speak(utterance);
  }, [cancel]);

  // Helper function to speak a player's turn message
  const speakPlayerTurn = useCallback((playerName: string) => {
    speak(`${playerName}'s turn`);
  }, [speak]);

  // Helper function to speak a match found message
  const speakMatchFound = useCallback((playerName: string, cardName?: string) => {
    if (cardName) {
      speak(`${playerName} found a ${cardName}! It's still their turn.`);
    } else {
      speak(`${playerName} found a match! It's still their turn`);
    }
  }, [speak]);

  // Cancel any pending delayed announcements
  const cancelPendingAnnouncements = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
  }, []);

  // Speak a match announcement with delay (debounced)
  const speakMatchWithDelay = useCallback((
    playerName: string,
    cardName: string,
    delayMs: number = 400
  ) => {
    cancelPendingAnnouncements();
    delayTimeoutRef.current = setTimeout(() => {
      speakMatchFound(playerName, cardName);
      delayTimeoutRef.current = null;
    }, delayMs);
  }, [speakMatchFound, cancelPendingAnnouncements]);

  // Speak a turn announcement with delay (debounced)
  const speakTurnWithDelay = useCallback((
    playerName: string,
    delayMs: number = 400
  ) => {
    cancelPendingAnnouncements();
    delayTimeoutRef.current = setTimeout(() => {
      speakPlayerTurn(playerName);
      delayTimeoutRef.current = null;
    }, delayMs);
  }, [speakPlayerTurn, cancelPendingAnnouncements]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingAnnouncements();
    };
  }, [cancelPendingAnnouncements]);

  return {
    isAvailable,
    speak,
    speakPlayerTurn,
    speakMatchFound,
    speakMatchWithDelay,
    speakTurnWithDelay,
    cancelPendingAnnouncements,
    cancel
  };
};

