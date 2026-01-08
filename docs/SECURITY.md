# Security Documentation

This document outlines the security measures implemented in HypeShelf.

## Authentication & Authorization

### User Roles

- **Default Role**: All new users are created with the `"user"` role by default (not `"admin"`).
- **Admin Promotion**: Only existing admins can promote users to admin status.
- **Self-Demotion Protection**: Admins cannot demote themselves from admin role.

### Authentication Flow

1. Users authenticate via Clerk
2. On first mutation, a user record is created with `"user"` role
3. Admins must be explicitly promoted by existing admins

## Input Validation

### Backend Validation

All user inputs are validated and sanitized on the backend:

- **Title**: 2-200 characters, comprehensive XSS prevention
- **Blurb**: 10-1000 characters, comprehensive XSS prevention
- **URL**: Must be http/https, validated format, max 2048 characters, dangerous protocols blocked
- **Genre**: Must be from allowed list (whitelist approach)
- **Author Name**: Sanitized when stored in database
- **User Name**: Sanitized when stored in database
- **Images**: Validated file types and sizes (frontend + backend)

**All sanitization happens in `convex/validation.ts`** - see [Sanitization Documentation](./SANITIZATION.md) for details.

### XSS Prevention

Comprehensive sanitization is applied to all text inputs:

- **HTML/XML tags**: All angle brackets (`<`, `>`) are removed
- **Script tags**: `<script>` tags are removed (case insensitive)
- **JavaScript protocol**: `javascript:` protocol is stripped
- **Event handlers**: Event handlers like `onclick=`, `onerror=`, `onload=` are removed
- **Dangerous protocols**: `data:`, `vbscript:`, `file:` protocols are blocked
- **Style attributes**: `style=` attributes are removed
- **Control characters**: Null bytes and control characters are removed
- **SQL patterns**: SQL-like patterns are removed (defensive, Convex handles this)
- **Whitespace normalization**: Multiple spaces are normalized

See [Sanitization Documentation](./SANITIZATION.md) for detailed information.

## Data Access Control

### Recommendations

- **Create**: Any authenticated user
- **Read**: Public recommendations visible to all, full list requires authentication
- **Update**: Users can update their own, admins can update any
- **Delete**: Users can delete their own, admins can delete any

### Staff Picks

- Only admins can mark/unmark recommendations as staff picks

### User Management

- Only admins can view all users
- Only admins can update user roles
- Only admins can run cleanup/migration functions

## Environment Variables

Required environment variables are validated at startup:

- `NEXT_PUBLIC_CONVEX_URL`: Convex backend URL (required)

## Best Practices

1. **Never trust client-side validation alone** - Always validate on the backend
2. **Principle of least privilege** - Users default to lowest privilege level
3. **Input sanitization** - All user inputs are sanitized before storage
4. **Authorization checks** - Every mutation checks user permissions
5. **Error messages** - Don't leak sensitive information in error messages

## Security Considerations

### Current Limitations

1. **Rate Limiting**: Not yet implemented (consider adding for production)
2. **Image Validation**: Frontend validation exists, but backend validation after upload could be enhanced
3. **CSRF Protection**: Handled by Convex framework
4. **SQL Injection**: Not applicable (Convex uses its own query system)

### Recommendations for Production

1. Implement rate limiting on mutations
2. Add image virus scanning
3. Implement audit logging for admin actions
4. Add two-factor authentication for admins
5. Regular security audits
6. Implement content moderation for user-generated content
