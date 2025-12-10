import type { GameEffect } from './EffectManager';

/**
 * Interface for TTS hook return type
 */
export interface TTSHook {
  isAvailable: () => boolean;
  speakPlayerTurn: (playerName: string) => void;
  speakMatchFound: (playerName: string) => void;
  speak: (text: string) => void;
  cancel: () => void;
}

/**
 * Creates a TTS effect that can be registered with EffectManager.
 *
 * Usage:
 * ```typescript
 * const tts = useTextToSpeech();
 * const ttsEffect = createTTSEffect(tts, () => ttsEnabled);
 * effectManager.register(ttsEffect);
 * ```
 *
 * @param ttsHook The TTS hook instance from useTextToSpeech()
 * @param isEnabled Function that returns whether TTS is currently enabled
 * @param delay Optional delay in ms before speaking (default: 400ms for better UX)
 */
export function createTTSEffect(
  ttsHook: TTSHook,
  isEnabled: () => boolean,
  delay: number = 400
): GameEffect {
  const speakWithDelay = (fn: () => void) => {
    if (!isEnabled() || !ttsHook.isAvailable()) {
      return;
    }
    setTimeout(fn, delay);
  };

  return {
    onMatchFound(playerName: string) {
      speakWithDelay(() => ttsHook.speakMatchFound(playerName));
    },

    onTurnChange(playerName: string) {
      speakWithDelay(() => ttsHook.speakPlayerTurn(playerName));
    },

    onGameStart(firstPlayerName: string) {
      speakWithDelay(() => ttsHook.speakPlayerTurn(firstPlayerName));
    },

    onGameOver(winner, isTie) {
      speakWithDelay(() => {
        if (isTie) {
          ttsHook.speak("It's a tie!");
        } else if (winner) {
          ttsHook.speak(`${winner.name} wins!`);
        }
      });
    },
  };
}
