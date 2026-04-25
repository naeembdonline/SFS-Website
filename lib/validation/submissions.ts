import { z } from "zod";

export const submissionSchema = z.object({
  kind: z.enum(["contact", "advisory"]),
  name: z.string().min(2, "Name is required").max(200),
  email: z.string().email("Valid email is required").max(320),
  subject: z.string().max(300).optional().nullable(),
  message: z.string().min(10, "Message is too short").max(5000),
  locale: z.enum(["bn", "en", "ar"]).optional().nullable(),
  honeypot: z.string().max(0, "Spam detected").optional().default(""),
  turnstileToken: z.string().min(1, "CAPTCHA verification is required"),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

export const updateSubmissionSchema = z.object({
  submissionId: z.number().int().positive(),
  status: z.enum(["new", "reviewed", "handled", "archived"]),
  adminNotes: z.string().max(2000).optional().nullable(),
});

export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
