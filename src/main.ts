import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'
import { parserEnvOrigins } from './utils/parse-env-origins';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino'

const getCorsAllowList = (config: ConfigService) => {
  return parserEnvOrigins(config.get<string>('CLIENT_URL'))
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {bufferLogs: true});
  app.useLogger(app.get(Logger))

  app.use(cookieParser())

  const config = app.get(ConfigService)
  const logger = app.get(Logger)

  const allowList = getCorsAllowList(config)

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

  await app.listen(config.get<number>('PORT') ?? 3000);
  logger.log(`Application running on port: ${config.get<number>('PORT')}`)
}
bootstrap();
