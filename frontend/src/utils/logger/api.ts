import { NextApiRequest, NextApiResponse } from 'next';
import { Logger } from './base';
import { LogContext } from './types';

export class ApiLogger extends Logger {
    constructor() {
        super('api');
    }

    logApiRequest(req: NextApiRequest, res: NextApiResponse, error?: Error) {
        const startTime = process.hrtime();

        // Create request context
        const requestContext: LogContext = {
            method: req.method,
            url: req.url,
            headers: {
                ...req.headers,
                // Remove sensitive headers
                authorization: undefined,
                cookie: undefined
            },
            query: req.query
        };

        // Log request
        this.info('API Request', requestContext);

        // Log response when it's sent
        res.on('finish', () => {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const latency = `${seconds}s${Math.floor(nanoseconds / 1000000)}ms`;

            const responseContext: LogContext = {
                ...requestContext,
                statusCode: res.statusCode,
                latency
            };

            if (error) {
                this.error('API Error', error, responseContext);
            } else if (res.statusCode >= 400) {
                this.warn('API Response Error', responseContext);
            } else {
                this.info('API Response', responseContext);
            }
        });
    }
}

export const apiLogger = new ApiLogger();
