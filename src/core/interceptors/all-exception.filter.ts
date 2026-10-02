import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from "@nestjs/common";
import { Request, Response } from "express";
import { PinoLogger } from "nestjs-pino";
import { buildApiErrorPayload, extractFromHttpExceptionBody, payloadFromUnknownException } from "src/shared/helpers/api-error-response";

@Catch()
@Injectable()
export class AllExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: PinoLogger) {
        this.logger.setContext(AllExceptionFilter.name)
    }

    catch(exception: any, host: ArgumentsHost) {
        if (host.getType() !== 'http') return
        const httpCtx = host.switchToHttp()
        const req = httpCtx.getRequest<Request>()
        const res = httpCtx.getResponse<Response>()
        
        const ctx = {
            requestId: (req.header['x-request-id'] as string) ?? '',
            path: req.url
        }

        // Trường hợp HTTP Exception
        if (exception instanceof HttpException) {
            const statusCode = exception.getStatus()
            const rawErrorResponse = exception.getResponse()

            // Nếu là chuỗi
            if (typeof rawErrorResponse === 'string') {
                res.status(statusCode).json(buildApiErrorPayload(statusCode, rawErrorResponse, undefined, ctx))
                return
            }

            // Nếu là object
            const { message, error } = extractFromHttpExceptionBody(
                rawErrorResponse,
                exception.message
            ) 

            res
                .status(statusCode)
                .json(buildApiErrorPayload(statusCode, message, error, ctx))

            return

        }

        // Trường hợp khác ví dụ database....
        this.logger.error({
            msg: 'unhandled.exception',
            requestId: ctx.requestId,
            path: ctx.path,
            error: exception instanceof Error ? exception.message : 'Unknown Exception',
            stack: exception instanceof Error ? exception.stack : undefined, //log ra dòng nào lỗi
        })

        const payload = payloadFromUnknownException(exception, ctx)
        res.status(payload.statusCode).json(payload)
        return

    }
}