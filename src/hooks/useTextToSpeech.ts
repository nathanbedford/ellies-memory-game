import { useRef, useCallback, useEffect } from 'react';

interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export const useTextToSpeech = () => {
  const speechSynthesisRef = useRef<typeof speechSynthesis | null>(null);
  const isSpeakingRef = useRef(false);
  const voicesLoadedRef = useRef(false);

  // Initialize speechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      
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
    if (!speechSynthesisRef.current) {
      console.warn('Text-to-speech is not available in this browser');
      return;
    }

    // Cancel any ongoing speech
    cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    utterance.lang = options.lang ?? 'en-US';

    // Try to find a female voice (more kid-friendly)
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoice = voices.find(
      voice => voice.name.toLowerCase().includes('female') ||
               voice.name.toLowerCase().includes('samantha') ||
               voice.name.toLowerCase().includes('karen') ||
               voice.name.toLowerCase().includes('zira') ||
               voice.name.toLowerCase().includes('susan')
    ) || voices.find(voice => voice.lang.startsWith('en'));

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

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
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
  const speakMatchFound = useCallback((playerName: string) => {
    speak(`${playerName} found a match! It's still their turn`);
  }, [speak]);

  return {
    isAvailable,
    speak,
    speakPlayerTurn,
    speakMatchFound,
    cancel
  };
};

