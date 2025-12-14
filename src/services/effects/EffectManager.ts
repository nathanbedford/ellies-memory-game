import type { Player } from '../../types';

/**
 * Interface for game effects (side effects that should be triggered by game events)
 * Effects are pluggable - you can register multiple effects and they all get called.
 */
export interface GameEffect {
  /** Called when a match is found */
  onMatchFound?(playerName: string, playerId: number, cardName?: string): void;

  /** Called when cards don't match */
  onNoMatch?(): void;

  /** Called when turn changes to a different player */
  onTurnChange?(playerName: string, playerId: number): void;

  /** Called when the game ends */
  onGameOver?(winner: Player | null, isTie: boolean): void;

  /** Called when the game starts */
  onGameStart?(firstPlayerName: string, firstPlayerId: number): void;
}

/**
 * EffectManager coordinates side effects for game events.
 *
 * Usage:
 * ```typescript
 * const effectManager = new EffectManager();
 *
 * // Register a TTS effect
 * const unregister = effectManager.register(createTTSEffect(ttsHook));
 *
 * // Later, when a match is found:
 * effectManager.notifyMatchFound("Alice", 1);
 *
 * // Cleanup when done:
 * unregister();
 * ```
 */
export class EffectManager {
  private effects: GameEffect[] = [];

  /**
   * Register an effect to receive game event notifications.
   * @returns A function to unregister the effect
   */
  register(effect: GameEffect): () => void {
    this.effects.push(effect);

    // Return unregister function
    return () => {
      const index = this.effects.indexOf(effect);
      if (index !== -1) {
        this.effects.splice(index, 1);
      }
    };
  }

  /**
   * Notify all registered effects that a match was found
   */
  notifyMatchFound(playerName: string, playerId: number, cardName?: string): void {
    this.effects.forEach(effect => {
      try {
        effect.onMatchFound?.(playerName, playerId, cardName);
      } catch (error) {
        console.error('Error in onMatchFound effect:', error);
      }
    });
  }

  /**
   * Notify all registered effects that cards didn't match
   */
  notifyNoMatch(): void {
    this.effects.forEach(effect => {
      try {
        effect.onNoMatch?.();
      } catch (error) {
        console.error('Error in onNoMatch effect:', error);
      }
    });
  }

  /**
   * Notify all registered effects that turn changed
   */
  notifyTurnChange(playerName: string, playerId: number): void {
    this.effects.forEach(effect => {
      try {
        effect.onTurnChange?.(playerName, playerId);
      } catch (error) {
        console.error('Error in onTurnChange effect:', error);
      }
    });
  }

  /**
   * Notify all registered effects that the game ended
   */
  notifyGameOver(winner: Player | null, isTie: boolean): void {
    this.effects.forEach(effect => {
      try {
        effect.onGameOver?.(winner, isTie);
      } catch (error) {
        console.error('Error in onGameOver effect:', error);
      }
    });
  }

  /**
   * Notify all registered effects that the game started
   */
  notifyGameStart(firstPlayerName: string, firstPlayerId: number): void {
    this.effects.forEach(effect => {
      try {
        effect.onGameStart?.(firstPlayerName, firstPlayerId);
      } catch (error) {
        console.error('Error in onGameStart effect:', error);
      }
    });
  }

  /**
   * Clear all registered effects
   */
  clear(): void {
    this.effects = [];
  }

  /**
   * Get the number of registered effects (useful for testing)
   */
  get effectCount(): number {
    return this.effects.length;
  }
}
