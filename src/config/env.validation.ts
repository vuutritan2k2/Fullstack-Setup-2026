import {number, z} from 'zod'

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(8080),
    CLIENT_URL: z.string()
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>) : Env {
    const parsed = envSchema.safeParse(config)

    if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => ` - ${i.path.join('.')} : ${i.message}`).join('/n')

        throw new Error(`Invalid enviroment configuration:\n${issues}`)
    }

    return parsed.data
}