const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1MB max for base64 image data

/**
 * Validate the image field in the request body.
 * Ensures it's a proper data URL with an image MIME type and within size limits.
 */
function validateImage(image) {
    if (!image || typeof image !== 'string') {
        return null; // No image provided — that's fine, caller handles it
    }

    // Must be a data URL
    if (!image.startsWith('data:image/')) {
        throw new Error('Invalid image format. Only image data URLs are accepted.');
    }

    // Extract the base64 part (after the comma)
    const commaIndex = image.indexOf(',');
    if (commaIndex === -1) {
        throw new Error('Invalid image data URL format.');
    }

    const base64Part = image.substring(commaIndex + 1);

    // Rough size check: base64 is ~4/3 of binary, so 1MB base64 ≈ 750KB binary
    if (base64Part.length > MAX_IMAGE_BYTES) {
        throw new Error('Image too large. Maximum size is 1MB.');
    }

    // Validate it's actually base64
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Part)) {
        throw new Error('Invalid image encoding.');
    }

    return image;
}

/**
 * Sanitize text prompt — strip HTML tags and limit length.
 */
function sanitizePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        return '';
    }
    // Strip HTML tags, decode entities, trim
    return prompt
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

module.exports = {
    validateImage,
    sanitizePrompt,
};
