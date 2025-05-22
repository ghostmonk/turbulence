import { LogLevel, LogContext, StructuredLog } from './types';

export class Logger {
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
}

// Create loggers for different components
export const appLogger = new Logger('app');
