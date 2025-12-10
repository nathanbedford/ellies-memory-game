import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectManager, type GameEffect } from './EffectManager';
import { createTTSEffect, type TTSHook } from './TTSEffect';

describe('EffectManager', () => {
  let effectManager: EffectManager;

  beforeEach(() => {
    effectManager = new EffectManager();
  });

  describe('register', () => {
    it('adds effect to the manager', () => {
      const effect: GameEffect = {};
      effectManager.register(effect);
      expect(effectManager.effectCount).toBe(1);
    });

    it('returns unregister function', () => {
      const effect: GameEffect = {};
      const unregister = effectManager.register(effect);
      expect(typeof unregister).toBe('function');
    });

    it('unregister removes the effect', () => {
      const effect: GameEffect = {};
      const unregister = effectManager.register(effect);
      unregister();
      expect(effectManager.effectCount).toBe(0);
    });

    it('can register multiple effects', () => {
      effectManager.register({});
      effectManager.register({});
      effectManager.register({});
      expect(effectManager.effectCount).toBe(3);
    });
  });

  describe('notifyMatchFound', () => {
    it('calls onMatchFound on all registered effects', () => {
      const effect1: GameEffect = { onMatchFound: vi.fn() };
      const effect2: GameEffect = { onMatchFound: vi.fn() };

      effectManager.register(effect1);
      effectManager.register(effect2);

      effectManager.notifyMatchFound('Alice', 1);

      expect(effect1.onMatchFound).toHaveBeenCalledWith('Alice', 1);
      expect(effect2.onMatchFound).toHaveBeenCalledWith('Alice', 1);
    });

    it('does not throw if effect has no onMatchFound', () => {
      const effect: GameEffect = {};
      effectManager.register(effect);

      expect(() => effectManager.notifyMatchFound('Alice', 1)).not.toThrow();
    });

    it('continues calling other effects if one throws', () => {
      const effect1: GameEffect = {
        onMatchFound: vi.fn(() => {
          throw new Error('Test error');
        }),
      };
      const effect2: GameEffect = { onMatchFound: vi.fn() };

      effectManager.register(effect1);
      effectManager.register(effect2);

      effectManager.notifyMatchFound('Alice', 1);

      expect(effect2.onMatchFound).toHaveBeenCalled();
    });
  });

  describe('notifyNoMatch', () => {
    it('calls onNoMatch on all registered effects', () => {
      const effect: GameEffect = { onNoMatch: vi.fn() };
      effectManager.register(effect);

      effectManager.notifyNoMatch();

      expect(effect.onNoMatch).toHaveBeenCalled();
    });
  });

  describe('notifyTurnChange', () => {
    it('calls onTurnChange on all registered effects', () => {
      const effect: GameEffect = { onTurnChange: vi.fn() };
      effectManager.register(effect);

      effectManager.notifyTurnChange('Bob', 2);

      expect(effect.onTurnChange).toHaveBeenCalledWith('Bob', 2);
    });
  });

  describe('notifyGameOver', () => {
    it('calls onGameOver with winner', () => {
      const effect: GameEffect = { onGameOver: vi.fn() };
      effectManager.register(effect);

      const winner = { id: 1, name: 'Alice', score: 5, color: '#fff' };
      effectManager.notifyGameOver(winner, false);

      expect(effect.onGameOver).toHaveBeenCalledWith(winner, false);
    });

    it('calls onGameOver with null winner on tie', () => {
      const effect: GameEffect = { onGameOver: vi.fn() };
      effectManager.register(effect);

      effectManager.notifyGameOver(null, true);

      expect(effect.onGameOver).toHaveBeenCalledWith(null, true);
    });
  });

  describe('notifyGameStart', () => {
    it('calls onGameStart with first player info', () => {
      const effect: GameEffect = { onGameStart: vi.fn() };
      effectManager.register(effect);

      effectManager.notifyGameStart('Alice', 1);

      expect(effect.onGameStart).toHaveBeenCalledWith('Alice', 1);
    });
  });

  describe('clear', () => {
    it('removes all registered effects', () => {
      effectManager.register({});
      effectManager.register({});
      effectManager.register({});

      effectManager.clear();

      expect(effectManager.effectCount).toBe(0);
    });
  });
});

describe('createTTSEffect', () => {
  let mockTtsHook: TTSHook;
  let isEnabled: () => boolean;

  beforeEach(() => {
    mockTtsHook = {
      isAvailable: vi.fn(() => true),
      speakPlayerTurn: vi.fn(),
      speakMatchFound: vi.fn(),
      speak: vi.fn(),
      cancel: vi.fn(),
    };
    isEnabled = () => true;
  });

  it('creates a valid GameEffect', () => {
    const effect = createTTSEffect(mockTtsHook, isEnabled);
    expect(effect).toHaveProperty('onMatchFound');
    expect(effect).toHaveProperty('onTurnChange');
    expect(effect).toHaveProperty('onGameStart');
    expect(effect).toHaveProperty('onGameOver');
  });

  describe('onMatchFound', () => {
    it('calls speakMatchFound after delay when enabled', async () => {
      vi.useFakeTimers();
      const effect = createTTSEffect(mockTtsHook, isEnabled, 100);

      effect.onMatchFound?.('Alice', 1);

      expect(mockTtsHook.speakMatchFound).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(mockTtsHook.speakMatchFound).toHaveBeenCalledWith('Alice');
      vi.useRealTimers();
    });

    it('does not call speakMatchFound when disabled', async () => {
      vi.useFakeTimers();
      const effect = createTTSEffect(mockTtsHook, () => false, 100);

      effect.onMatchFound?.('Alice', 1);
      vi.advanceTimersByTime(100);

      expect(mockTtsHook.speakMatchFound).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('does not call speakMatchFound when TTS unavailable', async () => {
      vi.useFakeTimers();
      mockTtsHook.isAvailable = vi.fn(() => false);
      const effect = createTTSEffect(mockTtsHook, isEnabled, 100);

      effect.onMatchFound?.('Alice', 1);
      vi.advanceTimersByTime(100);

      expect(mockTtsHook.speakMatchFound).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('onTurnChange', () => {
    it('calls speakPlayerTurn after delay', async () => {
      vi.useFakeTimers();
      const effect = createTTSEffect(mockTtsHook, isEnabled, 100);

      effect.onTurnChange?.('Bob', 2);
      vi.advanceTimersByTime(100);

      expect(mockTtsHook.speakPlayerTurn).toHaveBeenCalledWith('Bob');
      vi.useRealTimers();
    });
  });

  describe('onGameStart', () => {
    it('calls speakPlayerTurn for first player', async () => {
      vi.useFakeTimers();
      const effect = createTTSEffect(mockTtsHook, isEnabled, 100);

      effect.onGameStart?.('Alice', 1);
      vi.advanceTimersByTime(100);

      expect(mockTtsHook.speakPlayerTurn).toHaveBeenCalledWith('Alice');
      vi.useRealTimers();
    });
  });

  describe('onGameOver', () => {
    it('speaks tie message when tie', async () => {
      vi.useFakeTimers();
      const effect = createTTSEffect(mockTtsHook, isEnabled, 100);

      effect.onGameOver?.(null, true);
      vi.advanceTimersByTime(100);

      expect(mockTtsHook.speak).toHaveBeenCalledWith("It's a tie!");
      vi.useRealTimers();
    });

    it('speaks winner name when there is a winner', async () => {
      vi.useFakeTimers();
      const effect = createTTSEffect(mockTtsHook, isEnabled, 100);

      const winner = { id: 1, name: 'Alice', score: 5, color: '#fff' };
      effect.onGameOver?.(winner, false);
      vi.advanceTimersByTime(100);

      expect(mockTtsHook.speak).toHaveBeenCalledWith('Alice wins!');
      vi.useRealTimers();
    });
  });
});
