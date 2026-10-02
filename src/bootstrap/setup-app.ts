import { ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {NestExpressApplication} from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'
import { APP_CONFIG } from 'src/config/app/app.config'

export function setupApp(app: NestExpressApplication, logger: Logger, config: ConfigService) {
    app.use(cookieParser())

    const appCfg = config.getOrThrow<{corsOrigins: string[]}>(APP_CONFIG)

    const allowList = appCfg.corsOrigins

    app.enableCors({
        origin: (requestOrigin, callback) => {
            if (!requestOrigin) {
                callback(null, true)
                return
            }

            if (allowList.includes(requestOrigin)) {
                callback(null, true)
                return
            }

            logger.warn(`CORS: BLOCKED REQUEST FROM ORIGIN "${requestOrigin}" (not in allowList)`)

            callback(null, false)
        },
        methods: ['GET', 'HEAD', 'PUI', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'X-Requested-With',
        ],
        credentials: true
    })

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: { enableImplicitConversion: true }, // Đoán kiểu dữ liệu
            whitelist: true, // Loại bỏ trường thừa
            forbidNonWhitelisted: true //Trả lỗi 400 nếu có trường thừa
        })
    )

    app.setGlobalPrefix('api')
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1'
    })

    app.enableShutdownHooks()
}