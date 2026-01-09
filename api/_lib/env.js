import { z } from "zod";

const schema = z.object({
  MP_ACCESS_TOKEN: z.string().min(10),
  MP_WEBHOOK_SECRET: z.string().min(6).optional().default(""),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  RESEND_API_KEY: z.string().min(10),
  RESEND_FROM: z.string().min(5),
  APP_LOGIN_URL: z.string().url(),
  APP_BASE_URL: z.string().url()
});

export const ENV = schema.parse({
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  APP_LOGIN_URL: process.env.APP_LOGIN_URL,
  APP_BASE_URL: process.env.APP_BASE_URL
});
