import { z } from "zod";

const nonEmpty = (v: string | undefined) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://dummy:dummy@localhost:5432/dummy"),
  DATABASE_URL_POOLED: z.string().default(""),
  DATABASE_URL_UNPOOLED: z.string().default(""),

  NEON_AUTH_BASE_URL: z.string().default(""),
  NEON_AUTH_COOKIE_SECRET: z
    .string()
    .min(32)
    .default("dev-secret-change-me-32-chars-long!!"),
  NEON_AUTH_JWKS_URL: z.string().default(""),
  NEXT_PUBLIC_NEON_AUTH_URL: z.string().default(""),

  AWS_ENDPOINT_URL_S3: z.string().default(""),
  AWS_ACCESS_KEY_ID: z.string().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().default(""),
  AWS_REGION: z.string().default(""),
  S3_BUCKET: z.string().default("uploads"),

  NEON_REALTIME_URL: z.string().default(""),
  NEON_REALTIME_SECRET: z.string().default(""),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse({
  DATABASE_URL: nonEmpty(process.env.DATABASE_URL),
  DATABASE_URL_POOLED: nonEmpty(process.env.DATABASE_URL_POOLED),
  DATABASE_URL_UNPOOLED: nonEmpty(process.env.DATABASE_URL_UNPOOLED),
  NEON_AUTH_BASE_URL: nonEmpty(process.env.NEON_AUTH_BASE_URL),
  NEON_AUTH_COOKIE_SECRET: nonEmpty(process.env.NEON_AUTH_COOKIE_SECRET),
  NEON_AUTH_JWKS_URL: nonEmpty(process.env.NEON_AUTH_JWKS_URL),
  NEXT_PUBLIC_NEON_AUTH_URL: nonEmpty(process.env.NEXT_PUBLIC_NEON_AUTH_URL),
  AWS_ENDPOINT_URL_S3: nonEmpty(process.env.AWS_ENDPOINT_URL_S3),
  AWS_ACCESS_KEY_ID: nonEmpty(process.env.AWS_ACCESS_KEY_ID),
  AWS_SECRET_ACCESS_KEY: nonEmpty(process.env.AWS_SECRET_ACCESS_KEY),
  AWS_REGION: nonEmpty(process.env.AWS_REGION),
  S3_BUCKET: nonEmpty(process.env.S3_BUCKET),
  NEON_REALTIME_URL: nonEmpty(process.env.NEON_REALTIME_URL),
  NEON_REALTIME_SECRET: nonEmpty(process.env.NEON_REALTIME_SECRET),
  NEXT_PUBLIC_APP_URL: nonEmpty(process.env.NEXT_PUBLIC_APP_URL),
  NODE_ENV: nonEmpty(process.env.NODE_ENV),
});

export type Env = z.infer<typeof envSchema>;
