/**
 * New logging implementation using the abstraction layer.
 * 
 * This file demonstrates how to use the new logging abstraction and provides
 * a migration path from the old logger implementation. Once the migration is complete,
 * this can replace the old logger files.
 */

import { Logger, LoggerFactory, autoConfigureLogging, getLogger } from '@/lib/logging';

// Initialize logging based on environment
let _factory: LoggerFactory | null = null;
let _initPromise: Promise<LoggerFactory> | null = null;

async function getFactory(): Promise<LoggerFactory> {
    if (_factory) return _factory;
    
    if (!_initPromise) {
        _initPromise = autoConfigureLogging();
    }
    
    _factory = await _initPromise;
    return _factory;
}

// Create a default logger for backward compatibility
let _defaultLogger: Logger | null = null;

async function getDefaultLogger(): Promise<Logger> {
    if (_defaultLogger) return _defaultLogger;
    
    const factory = await getFactory();
    _defaultLogger = factory.createLogger('app');
    return _defaultLogger;
}

export async function getComponentLogger(component: string, defaultContext: any = {}): Promise<Logger> {
    const factory = await getFactory();
    return factory.createLogger(component, defaultContext);
}

export async function getRequestLogger(requestId: string, context: any = {}): Promise<Logger> {
    const logger = await getDefaultLogger();
    return logger.withContext({ request_id: requestId, ...context });
}

// Backward compatibility - create a proxy that initializes lazily
export const logger = {
    debug: (message: string, context?: any) => {
        getDefaultLogger().then(l => l.debug(message, context)).catch(console.error);
    },
    info: (message: string, context?: any) => {
        getDefaultLogger().then(l => l.info(message, context)).catch(console.error);
    },
    warn: (message: string, context?: any) => {
        getDefaultLogger().then(l => l.warn(message, context)).catch(console.error);
    },
    error: (message: string, error?: Error, context?: any) => {
        getDefaultLogger().then(l => l.error(message, error, context)).catch(console.error);
    },
    critical: (message: string, error?: Error, context?: any) => {
        getDefaultLogger().then(l => l.critical(message, error, context)).catch(console.error);
    },
    logRequest: (method: string, url: string, status?: number, latencyMs?: number, responseSize?: number, context?: any) => {
        getDefaultLogger().then(l => l.logRequest(method, url, status, latencyMs, responseSize, context)).catch(console.error);
    }
};

// Enhanced API for better usage patterns
export class LoggerManager {
    private static instance: LoggerManager;
    private factory: LoggerFactory | null = null;
    private loggers: Map<string, Logger> = new Map();

    static getInstance(): LoggerManager {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    }

    async initialize(): Promise<void> {
        if (!this.factory) {
            this.factory = await autoConfigureLogging();
        }
    }

    async getLogger(component: string, defaultContext: any = {}): Promise<Logger> {
        await this.initialize();
        
        const key = `${component}:${JSON.stringify(defaultContext)}`;
        if (!this.loggers.has(key)) {
            const logger = this.factory!.createLogger(component, defaultContext);
            this.loggers.set(key, logger);
        }
        
        return this.loggers.get(key)!;
    }

    async createRequestLogger(requestId: string, context: any = {}): Promise<Logger> {
        const baseLogger = await this.getLogger('request');
        return baseLogger.withContext({ request_id: requestId, ...context });
    }

    async createApiLogger(endpoint: string, method: string): Promise<Logger> {
        const baseLogger = await this.getLogger('api');
        return baseLogger.withContext({ endpoint, method });
    }

    async createErrorLogger(component: string): Promise<Logger> {
        const baseLogger = await this.getLogger('error');
        return baseLogger.withContext({ error_component: component });
    }
}

// Convenience exports
export const loggerManager = LoggerManager.getInstance();

// Pre-configured loggers for common use cases
export const apiLogger = {
    async logRequest(method: string, url: string, status?: number, latencyMs?: number, context?: any) {
        const logger = await loggerManager.createApiLogger(url, method);
        logger.logRequest(method, url, status, latencyMs, undefined, context);
    },
    
    async logError(method: string, url: string, error: Error, context?: any) {
        const logger = await loggerManager.createApiLogger(url, method);
        logger.error(`API call failed: ${method} ${url}`, error, context);
    },
    
    async logSuccess(method: string, url: string, latencyMs?: number, context?: any) {
        const logger = await loggerManager.createApiLogger(url, method);
        logger.info(`API call succeeded: ${method} ${url}`, { latency_ms: latencyMs, ...context });
    }
};

export const errorLogger = {
    async logError(component: string, message: string, error: Error, context?: any) {
        const logger = await loggerManager.createErrorLogger(component);
        logger.error(message, error, context);
    },
    
    async logWarning(component: string, message: string, context?: any) {
        const logger = await loggerManager.createErrorLogger(component);
        logger.warn(message, context);
    }
};

// Initialize the logging system
loggerManager.initialize().catch(console.error);
