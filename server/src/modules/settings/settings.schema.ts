import { z } from "zod";

export const gdriveConfigSchema = z.object({
  clientId: z.string().optional().default(""),
  clientSecret: z.string().optional().default(""),
  redirectUri: z.string().optional().default(""),
  refreshToken: z.string().optional().default(""),
  autoUpload: z.boolean().optional().default(false),
  connected: z.boolean().optional().default(false),
});

export type GDriveConfig = z.infer<typeof gdriveConfigSchema>;
