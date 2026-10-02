import { registerAs } from "@nestjs/config"; // Đóng gói các hàm liên quan thành namespace

export const THROTTER_CONFIG = 'throttler'

export default registerAs(THROTTER_CONFIG, () => ({
    ttl: parseInt(process.env.THROTTER_TTL_MS ?? '1000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '60', 10)
}))