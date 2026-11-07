import { z } from "zod";



export const loginWithGoogleIdInput = z.object({
  googleId: z.string().describe("Google ID of the User"),
  fullName: z.string().describe("Full name of the User"),
  email: z.string().email().describe("Email of the User"),
  emailVerified: z.boolean().describe("Whether the email is verified or not"),
  profileImageUrl: z.string().url().nullish().describe("Profile image URL of the User"),
})

export type LoginWithGoogleIdInputType = z.infer<typeof loginWithGoogleIdInput>;

export const generateUserTokenPayload = z.object({
  id: z.string().describe("UUID of the User")
})

export type GenerateUserTokenPayloadType = z.infer<typeof generateUserTokenPayload>


