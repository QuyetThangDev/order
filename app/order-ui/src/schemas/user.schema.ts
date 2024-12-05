import { z } from 'zod'

export const userInfoSchema = z.object({
  slug: z.string(),
  image: z.string().optional(),
  phonenumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dob: z.string(),
  email: z.string(),
  address: z.string(),
  branch: z.string(),
})

export type TUserInfoSchema = z.infer<typeof userInfoSchema>