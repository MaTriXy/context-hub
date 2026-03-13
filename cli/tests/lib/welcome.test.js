import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { showWelcomeIfNeeded } from '../../src/lib/welcome.js';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('../../src/lib/config.js', () => ({
  getChubDir: () => '/tmp/test-chub',
}));

describe('showWelcomeIfNeeded', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('shows welcome message on first run', () => {
    existsSync.mockReturnValue(false);

    showWelcomeIfNeeded();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('Welcome to Context Hub (chub)!');
    expect(output).toContain('Terms of Service');
    expect(output).toContain('feedback: false');
  });

  it('creates marker file after showing message', () => {
    existsSync.mockReturnValue(false);

    showWelcomeIfNeeded();

    // Called twice: once for marker check, once for dir check
    expect(existsSync).toHaveBeenCalledTimes(2);
    expect(mkdirSync).toHaveBeenCalledWith('/tmp/test-chub', { recursive: true });
    expect(writeFileSync).toHaveBeenCalledWith(
      '/tmp/test-chub/.welcome_shown',
      expect.any(String),
      'utf8'
    );
  });

  it('does not show message if marker exists', () => {
    existsSync.mockReturnValueOnce(true); // marker exists

    showWelcomeIfNeeded();

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it('does not throw if marker write fails', () => {
    existsSync.mockReturnValue(false);
    writeFileSync.mockImplementation(() => { throw new Error('EACCES'); });

    expect(() => showWelcomeIfNeeded()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
