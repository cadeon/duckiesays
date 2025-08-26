const { createPermalink, parsePermalink } = require('./permalink');

// Test cases
describe('Permalink Utility', () => {
  test('should create and parse a simple permalink', () => {
    const prompt = "What is the meaning of life?";
    const response = "The meaning of life is to find your purpose and live authentically.";
    
    const permalink = createPermalink(prompt, response);
    expect(permalink).toBeDefined();
    expect(typeof permalink).toBe('string');
    
    const parsed = parsePermalink(permalink);
    expect(parsed).not.toBeNull();
    expect(parsed.prompt).toBe(prompt);
    expect(parsed.response).toBe(response);
  });

  test('should handle empty response', () => {
    const prompt = "Hello world";
    const response = "";
    
    const permalink = createPermalink(prompt, response);
    const parsed = parsePermalink(permalink);
    
    expect(parsed.prompt).toBe(prompt);
    expect(parsed.response).toBe(response);
  });

  test('should handle special characters', () => {
    const prompt = "What's up? & more > less < symbols";
    const response = "Response with \"quotes\" and 'apostrophes'";
    
    const permalink = createPermalink(prompt, response);
    const parsed = parsePermalink(permalink);
    
    expect(parsed.prompt).toBe(prompt);
    expect(parsed.response).toBe(response);
  });

  test('should return null for invalid permalink', () => {
    const parsed = parsePermalink("invalid-permalink");
    expect(parsed).toBeNull();
  });

  test('should return null for empty permalink', () => {
    const parsed = parsePermalink("");
    expect(parsed).toBeNull();
  });
});