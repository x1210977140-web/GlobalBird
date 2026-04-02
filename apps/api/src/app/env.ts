export const env = {
  appName: "global-bird-api",
  port: Number(process.env.PORT ?? 3000),
} as const;

