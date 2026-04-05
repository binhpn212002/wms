import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('internal.apiKey');
    if (!expected) {
      throw new UnauthorizedException('Internal API is not configured');
    }
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const raw = req.headers?.['x-internal-api-key'];
    const header = Array.isArray(raw) ? raw[0] : raw;
    if (!header || header !== expected) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
