import { registerAs } from '@nestjs/config';

export default registerAs('internal', () => ({
  apiKey: process.env.INTERNAL_API_KEY ?? '',
}));
