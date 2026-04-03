export const env = {
  appName: "global-bird-api",
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
} as const;
