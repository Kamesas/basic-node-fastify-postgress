import { z } from "zod";

export const UserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(100),
  email: z.email({ message: "Invalid email format" }),
});

export const CreateUserResponseSchema = z.object({
  id: z.string(),
  data: UserSchema,
});

export const GetUsersResponseSchema = z.array(z.string());

// Type exports
export type User = z.infer<typeof UserSchema>;
