describe('eslint-plugin-test-flakiness', () => {
  const plugin = require('../../lib');

  it('should export rules object', () => {
    expect(plugin.rules).toBeDefined();
    expect(typeof plugin.rules).toBe('object');
  });

  it('should export configs object', () => {
    expect(plugin.configs).toBeDefined();
    expect(typeof plugin.configs).toBe('object');
  });

  it('should export recommended config', () => {
    expect(plugin.configs.recommended).toBeDefined();
    expect(plugin.configs.recommended.plugins).toEqual(['test-flakiness']);
    expect(plugin.configs.recommended.rules).toBeDefined();
  });

  it('should export strict config', () => {
    expect(plugin.configs.strict).toBeDefined();
    expect(plugin.configs.strict.plugins).toEqual(['test-flakiness']);
    expect(plugin.configs.strict.rules).toBeDefined();
  });

  it('should export all config', () => {
    expect(plugin.configs.all).toBeDefined();
    expect(plugin.configs.all.plugins).toEqual(['test-flakiness']);
    expect(plugin.configs.all.rules).toBeDefined();
  });

  it('should load configs without errors', () => {
    const recommendedConfig = require('../../lib/configs/recommended');
    const strictConfig = require('../../lib/configs/strict');

    expect(recommendedConfig).toBeDefined();
    expect(strictConfig).toBeDefined();
    expect(recommendedConfig.plugins).toEqual(['test-flakiness']);
    expect(strictConfig.plugins).toEqual(['test-flakiness']);
  });
});