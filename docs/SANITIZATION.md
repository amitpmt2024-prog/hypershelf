# Input Sanitization Documentation

This document details what inputs are sanitized and how sanitization works in HypeShelf.

## ✅ Yes, All User Inputs Are Sanitized

**All user inputs are sanitized before being stored in the database.** This includes:

1. **Title** - Sanitized via `validateString()`
2. **Blurb** - Sanitized via `validateString()`
3. **Link/URL** - Validated and sanitized via `validateUrl()`
4. **Genre** - Validated against allowed list (whitelist approach)
5. **Author Name** - Sanitized via `validateString()`

## What Gets Sanitized

The `validateString()` function performs comprehensive sanitization:

### 1. HTML/XML Injection Prevention
- **Removes**: All angle brackets `<` and `>`
- **Prevents**: HTML tag injection like `<script>`, `<img>`, etc.

### 2. JavaScript Injection Prevention
- **Removes**: `javascript:` protocol
- **Removes**: `<script>` tags (case insensitive)
- **Removes**: Event handlers like `onclick=`, `onerror=`, `onload=`, etc.

### 3. Other Dangerous Protocols
- **Removes**: `data:` protocol (prevents data URI injection)
- **Removes**: `vbscript:` protocol
- **Removes**: `file:` protocol

### 4. CSS Injection Prevention
- **Removes**: `style=` attributes that could contain malicious CSS

### 5. Control Character Removal
- **Removes**: Null bytes (`\x00`) and other control characters
- **Prevents**: Parsing errors and potential security issues

### 6. SQL Injection Prevention (Defensive)
- **Removes**: SQL-like patterns (DROP, DELETE, INSERT, etc.)
- **Removes**: SQL comment markers (`--`, `/*`, `*/`)
- **Note**: Convex handles SQL injection at the framework level, but this adds defense-in-depth

### 7. Whitespace Normalization
- **Normalizes**: Multiple spaces to single space
- **Prevents**: Excessive whitespace attacks

## URL Validation

The `validateUrl()` function ensures URLs are safe:

1. **Protocol Validation**: Only allows `http://` and `https://`
2. **Blocks Dangerous Protocols**: Rejects `javascript:`, `data:`, `file:`, etc.
3. **Length Limits**: Maximum 2048 characters
4. **Format Validation**: Must be a valid URL format

## Genre Validation

Genres use a **whitelist approach**:
- Only values from the allowed list are accepted
- This prevents injection of arbitrary values
- List: `["Action", "Adventure", "Comedy", "Drama", "Horror", "Romance", "Documentary", "Sports", "Biopic"]`

## Where Sanitization Happens

### Backend (Primary Defense)
All sanitization happens in `convex/validation.ts` and is applied in:
- `createRecommendation` mutation
- `updateRecommendation` mutation
- User name handling

### Frontend (Secondary Defense)
Frontend validation provides immediate user feedback but **should never be trusted alone**. All inputs are re-validated and sanitized on the backend.

## Example: What Gets Sanitized

### Input:
```
Title: "<script>alert('XSS')</script>Great Movie"
```

### After Sanitization:
```
Title: "Great Movie"
```

### Input:
```
Blurb: "Check this out! javascript:alert('XSS') onclick=evil()"
```

### After Sanitization:
```
Blurb: "Check this out! alert('XSS') evil()"
```

### Input:
```
Link: "javascript:alert('XSS')"
```

### After Validation:
```
Error: "Link must use http:// or https:// protocol"
```

## Security Best Practices

1. **Defense in Depth**: Multiple layers of protection
   - Frontend validation (UX)
   - Backend validation (Security)
   - Framework-level protection (Convex)

2. **Whitelist Over Blacklist**: Where possible, use whitelists (like genres) instead of blacklists

3. **Never Trust Client**: All validation must happen on the backend

4. **Escape on Output**: When displaying user content, React automatically escapes HTML, providing additional protection

## Limitations

1. **Plain Text Only**: Current sanitization is designed for plain text. For rich text/HTML content, consider:
   - Using a library like DOMPurify
   - Using a markdown parser with sanitization
   - Using a WYSIWYG editor with built-in sanitization

2. **No Content Moderation**: Sanitization prevents code injection but doesn't moderate content for:
   - Profanity
   - Spam
   - Hate speech
   - Other inappropriate content

3. **No Rate Limiting**: Currently no rate limiting on mutations (consider adding for production)

## Testing Sanitization

To verify sanitization is working:

1. Try submitting a recommendation with:
   - `<script>alert('XSS')</script>` in the title
   - `javascript:alert('XSS')` in the link
   - `onclick=evil()` in the blurb

2. Check the database - these should be removed or rejected

3. View the recommendation - it should display safely without executing code

## Conclusion

✅ **All user inputs are sanitized** before storage. The sanitization is comprehensive and covers:
- XSS prevention
- HTML injection prevention
- JavaScript injection prevention
- Protocol injection prevention
- Control character removal
- SQL injection prevention (defensive)

The code follows security best practices with defense-in-depth and never trusts client-side validation alone.
