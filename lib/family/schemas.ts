import { z } from 'zod'

export const personInputSchema = z.object({
  name: z.string().trim().min(1, '名前を入力してください').max(100),
  maidenName: z.string().trim().max(100).optional().or(z.literal('')),
  reading: z.string().trim().max(200).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', 'unknown']),
  birthYear: z.number().int().min(0).max(9999).optional(),
  deathYear: z.number().int().min(0).max(9999).optional(),
  memo: z.string().max(2000).optional().or(z.literal('')),
})

export type PersonInput = z.infer<typeof personInputSchema>

export const relationInputSchema = z
  .object({
    kind: z.enum(['parent-child', 'spouse']),
    fromId: z.string().min(1),
    toId: z.string().min(1),
    subtype: z.enum(['biological', 'adoptive']).optional(),
    startedYear: z.number().int().min(0).max(9999).optional(),
    endedYear: z.number().int().min(0).max(9999).optional(),
  })
  .refine((d) => d.fromId !== d.toId, { message: '同じ人物同士は指定できません' })

export type RelationInput = z.infer<typeof relationInputSchema>
