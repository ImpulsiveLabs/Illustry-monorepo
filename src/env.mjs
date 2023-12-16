import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production'])
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_BACKEND_PUBLIC_URL: z.string().url()
  },

  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BACKEND_PUBLIC_URL: process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL,
    NODE_ENV: process.env.NODE_ENV
  }
});
