import { z } from "zod";
import { GAME_IDS, GAME_MODES, MAX_METADATA_KEYS, MAX_SAVE_BYTES } from "./constants";

const metadataValue = z.union([z.string().max(120), z.number().finite(), z.boolean()]);

export const ScoreMetadataSchema = z
  .record(z.string().max(40), metadataValue)
  .refine((obj) => Object.keys(obj).length <= MAX_METADATA_KEYS, { message: "metadata_too_large" });

export const DeviceClassSchema = z.enum(["desktop", "laptop", "tablet", "mobile"]);

export const StartSessionSchema = z.object({
  gameId: z.enum(GAME_IDS),
  gameVersion: z.string().min(1).max(32),
  device: DeviceClassSchema.optional(),
  buildVersion: z.string().max(64).optional(),
  idempotencyKey: z.string().uuid().optional(),
});

export const SubmitScoreSchema = z.object({
  sessionId: z.string().uuid().optional(),
  gameId: z.enum(GAME_IDS),
  gameVersion: z.string().min(1).max(32),
  mode: z.string().min(1).max(32),
  score: z.number().finite(),
  durationMs: z.number().int().min(0).max(30 * 60 * 1000),
  startedAt: z.number().int().nonnegative(),
  endedAt: z.number().int().nonnegative(),
  metadata: ScoreMetadataSchema.default({}),
  offline: z.boolean().optional(),
  offlineSubmission: z.boolean().optional(),
  localSessionId: z.string().max(80).optional(),
  idempotencyKey: z.string().max(80).optional(),
});

export const PresenceSchema = z.object({
  status: z.enum(["online", "away", "playing", "offline"]),
  gameId: z.enum(GAME_IDS).nullable().optional(),
});

export const FriendRequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
});

export const FriendActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["accept", "decline", "remove", "block", "unblock"]),
});

export const ProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(32).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  avatar: z.string().max(32).optional(),
  shareActivity: z.boolean().optional(),
});

export const GuestMergeSchema = z
  .object({
    offlineRuns: z
      .array(
        z.object({
          gameId: z.enum(GAME_IDS),
          mode: z.string().max(32),
          score: z.number().finite(),
          durationMs: z.number().int().min(0).max(30 * 60 * 1000),
          startedAt: z.number().int(),
          endedAt: z.number().int(),
          metadata: ScoreMetadataSchema.default({}),
        }),
      )
      .max(40)
      .optional(),
  })
  .strict();

export const AuthMagicLinkSchema = z.object({
  email: z.string().trim().email().max(254),
  captchaToken: z.string().max(2048).optional(),
});

export const GameSaveSchema = z.object({
  gameId: z.enum(GAME_IDS),
  version: z.string().min(1).max(32),
  payload: z.record(z.string().max(40), z.unknown()),
  updatedAt: z.number().int().optional(),
});

export const UsernameSearchSchema = z.object({
  q: z.string().trim().min(3).max(20),
});

export const LeaderboardQuerySchema = z.object({
  game: z.enum(GAME_IDS),
  mode: z.string().min(1).max(32),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export function assertMode(gameId: (typeof GAME_IDS)[number], mode: string): boolean {
  return (GAME_MODES[gameId] as readonly string[]).includes(mode);
}

export function boundedJsonSize(value: unknown, max = MAX_SAVE_BYTES): boolean {
  try {
    return JSON.stringify(value).length <= max;
  } catch {
    return false;
  }
}

export type StartSessionInput = z.infer<typeof StartSessionSchema>;
export type SubmitScoreInput = z.infer<typeof SubmitScoreSchema>;
export type GuestMergeInput = z.infer<typeof GuestMergeSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
