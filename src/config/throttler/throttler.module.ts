import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler'
import throttlerConfig, { THROTTER_CONFIG } from './throttler.config';

@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule.forFeature(throttlerConfig)],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const cfg = config.getOrThrow<{ ttl: number; limit: number}>(THROTTER_CONFIG)

                return {
                    throttlers: [
                        {
                            name: 'default',
                            ttl: cfg.ttl,
                            limit: cfg.limit
                        }
                    ]
                }
            }
        })
    ]
})
export class AppThrottlerModule { }
