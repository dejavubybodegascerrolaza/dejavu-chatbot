import { z } from 'zod'

/**
 * Shape of the Open-Meteo forecast response when requesting
 * `current=uv_index` and `hourly=uv_index`.
 * See https://open-meteo.com/en/docs
 */
export const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    time: z.string(),
    uv_index: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    uv_index: z.array(z.number()),
  }),
})

export type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>
