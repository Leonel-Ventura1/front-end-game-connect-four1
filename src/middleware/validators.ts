import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6),
});

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  avatar: z.string().url().optional(),
});

export const MakeMoveSchema = z.object({
  column: z.number().int().min(0).max(6),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(1).max(50),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(500),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type MakeMoveInput = z.infer<typeof MakeMoveSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
