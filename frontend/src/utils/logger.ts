import { NextApiRequest, NextApiResponse } from 'next';

// Log levels that match Google Cloud Logging severity levels
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

interface LogContext {
    [key: string]: any;
}

interface StructuredLog {
    severity: string;
    message: string;
    timestamp: string;
    'logging.googleapis.com/labels'?: {
        component?: string;
        environment?: string;
    };
    'logging.googleapis.com/operation'?: {
        id?: string;
        producer?: string;
        first?: boolean;
        last?: boolean;
    };
    context?: LogContext;
    error?: {
        stack?: string;
        message?: string;
        name?: string;
    };
    httpRequest?: {
        requestMethod?: string;
        requestUrl?: string;
        status?: number;
        userAgent?: string;
        referer?: string;
        latency?: string;
        responseSize?: number;
    };
}

class Logger {
    private component: string;
    private isServer: boolean;
    private isCloudRun: boolean;

    constructor(component: string) {
        this.component = component;
        this.isServer = typeof window === 'undefined';
        this.isCloudRun = process.env.K_SERVICE !== undefined;
    }

    private createLog(level: LogLevel, message: string, context?: LogContext, error?: Error): StructuredLog {
        const log: StructuredLog = {
            severity: level,
            message,
            timestamp: new Date().toISOString(),
            'logging.googleapis.com/labels': {
                component: this.component,
                environment: process.env.NODE_ENV
            }
        };

        if (context) {
            log.context = context;
        }

        if (error) {
            log.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }

        return log;
    }

    private output(log: StructuredLog) {
        if (this.isServer) {
            if (this.isCloudRun) {
                // In Cloud Run, output as JSON for structured logging
                console.log(JSON.stringify(log));
            } else {
                // In development, format for readability
                const { severity, message, context, error } = log;
                console.log(`[${severity}] ${message}`, context || '', error || '');
            }
        } else {
            // In browser, use appropriate console method
            const consoleMethod = log.severity.toLowerCase();
            switch (consoleMethod) {
                case 'error':
                    console.error(log.message, log);
                    break;
                case 'warning':
                    console.warn(log.message, log);
                    break;
                case 'debug':
                    console.debug(log.message, log);
                    break;
                default:
                    console.log(log.message, log);
            }
        }
    }

    debug(message: string, context?: LogContext) {
        this.output(this.createLog(LogLevel.DEBUG, message, context));
    }

    info(message: string, context?: LogContext) {
        this.output(this.createLog(LogLevel.INFO, message, context));
    }

    warn(message: string, context?: LogContext) {
        this.output(this.createLog(LogLevel.WARNING, message, context));
    }

    error(message: string, error?: Error, context?: LogContext) {
        this.output(this.createLog(LogLevel.ERROR, message, context, error));
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

// Create loggers for different components
export const apiLogger = new Logger('api');
export const authLogger = new Logger('auth');
export const appLogger = new Logger('app');
