import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Introduce un email válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
})

export const registerSchema = z
  .object({
    email: z.string().email('Introduce un email válido.'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
