import { z } from "zod";

// ─── inviteUserSchema ─────────────────────────────────────────────────────────

export const inviteUserSchema = z.object({
  email: z
    .string()
    .email("Must be a valid email address.")
    .max(254, "Email must be 254 characters or fewer."),
  displayName: z
    .string()
    .min(1, "Display name is required.")
    .max(100, "Display name must be 100 characters or fewer."),
  role: z.enum(["admin", "editor"] as const, {
    message: "Role must be admin or editor.",
  }),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

// ─── setUserActiveSchema ──────────────────────────────────────────────────────

export const setUserActiveSchema = z.object({
  userId: z.number().int().positive(),
  isActive: z.boolean(),
});

// ─── changeUserRoleSchema ─────────────────────────────────────────────────────

export const changeUserRoleSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(["admin", "editor"] as const),
});
