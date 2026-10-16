import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfileDto } from '../dto/auth-response.dto.js';

export const CurrentUser = createParamDecorator(
  (data: keyof UserProfileDto | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
