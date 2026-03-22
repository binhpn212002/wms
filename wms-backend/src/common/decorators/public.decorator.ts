import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Đánh dấu route không cần JWT (dùng kèm `JwtAuthGuard` global hoặc để tài liệu rõ ý định). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
