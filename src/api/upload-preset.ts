// src/api/upload-preset.ts
import axios from 'axios'
import { z } from 'zod'

//
// 1) Your two raw base schemas (with & without breakdownNotes)
//
const baseSchemaInventory = z.object({
  label:          z.string().min(1, 'Label is required'),
  image:          z.string().min(1, 'Image path is required'),
  breakdownNotes: z.string().optional(),
})

const baseSchemaRelicFamiliar = z.object({
  name:           z.string().min(1, 'Name is required'),
  label:          z.string().min(1, 'Label is required'),
  image:          z.string().min(1, 'Image path is required'),
  description:    z.string().optional(),
  breakdownNotes: z.string().optional(),
  energy:         z.number().optional()
})

//
// 2) Build a “maybe” wrapper that allows null/undefined or real objects
//
function makeMaybe<T extends z.ZodTypeAny>(base: T) {
  const unionSchema = z.union([ base, z.null(), z.undefined() ])
  return z.preprocess((val) => {
    if (val == null) return undefined
    if (
      typeof val === 'object' &&
      // @ts-ignore
      !(val.label?.length) &&
      // @ts-ignore
      !(val.image?.length)
    ) {
      return undefined
    }
    return val
  }, unionSchema)
}

const maybeInventoryItem    = makeMaybe(baseSchemaInventory)
const maybeRelicFamiliar = makeMaybe(baseSchemaRelicFamiliar)

//
// 3) The full preset schema
//
export const presetSchema = z.object({
  presetName:     z.string().min(1, 'Name is required'),
  presetNotes:    z.string().optional(),

  inventorySlots: z.array(maybeInventoryItem).length(28),
  equipmentSlots: z.array(maybeInventoryItem).length(13),

  relics: z.object({
    primaryRelics:     z.array(maybeRelicFamiliar).optional(),
    alternativeRelics: z.array(maybeRelicFamiliar).optional(),
  }),

  familiars: z.object({
    primaryFamiliars:     z.array(maybeRelicFamiliar).optional(),
    alternativeFamiliars: z.array(maybeRelicFamiliar).optional(),
  }),
})

export type Preset = z.infer<typeof presetSchema>

//
// 4) Call the API
//
const {
  VITE_FIREBASE_EMULATOR_HOST,
  VITE_FIREBASE_PROJECT_ID,
  VITE_API_BASE_URL,
} = import.meta.env

const useEmulator =
  import.meta.env.DEV &&
  !!VITE_FIREBASE_EMULATOR_HOST &&
  !!VITE_FIREBASE_PROJECT_ID

const API_BASE = useEmulator
  ? `http://${VITE_FIREBASE_EMULATOR_HOST}/${VITE_FIREBASE_PROJECT_ID}/us-central1`
  : VITE_API_BASE_URL

export async function uploadPreset(
  data: unknown,
  id?: string
): Promise<string> {
  let payload = data
  if (typeof data === 'string') {
    try { payload = JSON.parse(data) }
    catch { throw new Error('Invalid JSON string') }
  }

  const preset = presetSchema.parse(payload)

  const url = `${API_BASE}/uploadPreset${id ? `?id=${encodeURIComponent(id)}` : ''}`

  const resp = await axios.post<string>(
    url,
    preset,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

  return resp.data
}