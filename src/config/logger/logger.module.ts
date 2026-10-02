import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { LoggerModule } from 'nestjs-pino' 

@Module({
    imports: [
        LoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const isDev = config.get('NODE_ENV') === 'development'
                return {
                    pinoHttp: {
                        level: isDev ? 'debug' : 'info',
                        transport: isDev ? {target: 'pino-pretty',
                            options: {
                                singleLine: true,
                                translateTime: 'SYS:standard'
                            }
                        } : undefined,
                        genReqId: (req, res) => {
                            const existing = req.headers['x-request-id']
                            const id = existing ?? randomUUID()
                            res.setHeader('x-request-id', id)
                            return id
                        },
                        redact: {
                            paths: [
                                'req.headers.authorization',
                                'req.headers.cookies',
                                'req.body.password',
                                'req.headers["set-cookie"]',
                            ],
                            censor: '[REDACTED]',
                        },
                        customProps: (req: IncomingMessage) => ({
                            userId: (req as IncomingMessage & { user?: { id: string }}).user?.id,
                        })
                    }
                }
            }
        })
    ],
    exports: [LoggerModule]
})
export class PinoLoggerModule {}
