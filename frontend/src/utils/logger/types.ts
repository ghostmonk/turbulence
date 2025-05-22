// Log levels that match Google Cloud Logging severity levels
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

export interface LogContext {
    [key: string]: any;
}

export interface StructuredLog {
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
