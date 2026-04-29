import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — bypasses the global JwtAuthGuard.
 * Usage: @Public() on controller class or individual route method.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
