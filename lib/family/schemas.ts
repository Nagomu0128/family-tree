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

const yearOpt = z.number().int().min(0).max(9999).optional()

const parentChildSchema = z.object({
  kind: z.literal('parent-child'),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  subtype: z.enum(['biological', 'adoptive', 'step', 'foster']).optional(),
  startedYear: yearOpt,
  endedYear: yearOpt,
})

const spouseSchema = z.object({
  kind: z.literal('spouse'),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  subtype: z.enum(['married', 'partnered', 'engaged']).optional(),
  startedYear: yearOpt,
  endedYear: yearOpt,
})

const siblingSchema = z.object({
  kind: z.literal('sibling'),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  subtype: z.enum(['full', 'half', 'step', 'twin']).optional(),
  startedYear: yearOpt,
  endedYear: yearOpt,
})

export const relationInputSchema = z
  .discriminatedUnion('kind', [parentChildSchema, spouseSchema, siblingSchema])
  .refine((d) => d.fromId !== d.toId, { message: '同じ人物同士は指定できません' })

export type RelationInput = z.infer<typeof relationInputSchema>
