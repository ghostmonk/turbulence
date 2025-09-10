"""
Platform-independent logging implementation.

This module provides a clean logging interface that automatically detects your
environment and chooses the appropriate provider (GCP Cloud Logging, Console, etc.)
without coupling your application code to any specific platform.

Usage:
    from logger import logger, get_component_logger
    
    # Basic logging (same as before)
    logger.info("Application started")
    
    # Component-specific logger (recommended)
    auth_logger = get_component_logger('auth')
    auth_logger.info("User authenticated", user_id="123")
    
    # Request logging
    logger.log_request("GET", "/api/users", status=200, latency_ms=45.2)
    
    # Backward compatibility - all your existing code works unchanged
    from logger import info, error, debug, warning, critical, exception
    info("This works exactly like before")
"""

import os
from logging import auto_configure_logging, get_logger, LoggerFactory, Logger

# Initialize logging based on environment
_factory: LoggerFactory = auto_configure_logging()

# Create a default logger for backward compatibility
logger: Logger = _factory.create_logger('turbulence')

def get_component_logger(component: str, **default_context) -> Logger:
    """
    Get a logger for a specific component.
    
    This is the preferred way to create loggers for different parts of the application.
    
    Args:
        component: Component name (e.g., 'auth', 'api', 'video-processor')
        **default_context: Default context to include in all logs
        
    Returns:
        Logger configured for the component
        
    Example:
        auth_logger = get_component_logger('auth', service='authentication-service')
        auth_logger.info("User logged in", user_id="123")
    """
    return _factory.create_logger(component, **default_context)


def get_request_logger(request_id: str, **context) -> Logger:
    """
    Get a logger configured for a specific request.
    
    Args:
        request_id: Unique request identifier
        **context: Additional request context
        
    Returns:
        Logger with request context pre-configured
        
    Example:
        req_logger = get_request_logger("req-123", user_id="456", path="/api/users")
        req_logger.info("Processing request")
    """
    return logger.with_context(request_id=request_id, **context)


# Backward compatibility functions that map to the old logger.py interface
def debug(message, context=None, exc_info=None):
    """Backward compatibility function for debug logging."""
    kwargs = {}
    if context:
        kwargs.update(context)
    if exc_info:
        # Convert exc_info tuple to exception
        if isinstance(exc_info, tuple) and len(exc_info) == 3 and exc_info[1]:
            exception = exc_info[1]
        else:
            exception = None
        logger.debug(message, exception=exception, **kwargs)
    else:
        logger.debug(message, **kwargs)


def info(message, context=None):
    """Backward compatibility function for info logging."""
    kwargs = context or {}
    logger.info(message, **kwargs)


def warning(message, context=None, exc_info=None):
    """Backward compatibility function for warning logging."""
    kwargs = context or {}
    if exc_info:
        if isinstance(exc_info, tuple) and len(exc_info) == 3 and exc_info[1]:
            exception = exc_info[1]
        else:
            exception = None
        logger.warning(message, exception=exception, **kwargs)
    else:
        logger.warning(message, **kwargs)


def error(message, context=None, exc_info=None):
    """Backward compatibility function for error logging."""
    kwargs = context or {}
    if exc_info:
        if isinstance(exc_info, tuple) and len(exc_info) == 3 and exc_info[1]:
            exception = exc_info[1]
        else:
            exception = None
        logger.error(message, exception=exception, **kwargs)
    else:
        logger.error(message, **kwargs)


def critical(message, context=None, exc_info=None):
    """Backward compatibility function for critical logging."""
    kwargs = context or {}
    if exc_info:
        if isinstance(exc_info, tuple) and len(exc_info) == 3 and exc_info[1]:
            exception = exc_info[1]
        else:
            exception = None
        logger.critical(message, exception=exception, **kwargs)
    else:
        logger.critical(message, **kwargs)


def exception(message, context=None):
    """Backward compatibility function for exception logging."""
    import sys
    exc_info = sys.exc_info()
    if exc_info[1]:
        error(message, context, exc_info)
    else:
        error(message, context)


def log_request_response(request, response=None, error=None):
    """
    Backward compatibility function for request/response logging.
    
    This function adapts the old interface to the new logging system.
    """
    try:
        # Extract request information
        method = getattr(request, 'method', 'UNKNOWN')
        url = str(getattr(request, 'url', 'UNKNOWN'))
        
        # Extract response information
        status = None
        response_size = None
        if response:
            status = getattr(response, 'status_code', None)
            response_body = getattr(response, 'body', '')
            response_size = len(str(response_body)) if response_body else None
        
        # Extract additional context
        context = {}
        if hasattr(request, 'headers'):
            context['request_headers'] = dict(request.headers)
            
        if hasattr(request, 'client') and request.client:
            context['client_ip'] = str(request.client)
            
        if hasattr(request, 'body') and request.body:
            try:
                if isinstance(request.body, bytes):
                    context['request_body'] = request.body.decode('utf-8')[:1000]
                else:
                    context['request_body'] = str(request.body)[:1000]
            except Exception:
                context['request_body'] = '[Binary data]'
        
        if response and hasattr(response, 'headers'):
            context['response_headers'] = dict(response.headers)
            
        # Add trace context if available
        trace_header = None
        if hasattr(request, 'headers'):
            trace_header = request.headers.get('X-Cloud-Trace-Context')
        if trace_header:
            context['trace_id'] = trace_header
        
        # Log the request
        if error:
            context['error_type'] = type(error).__name__
            context['error_message'] = str(error)
            logger.log_request(method, url, status, **context)
            logger.error(f"Request failed: {method} {url}", exception=error, **context)
        else:
            logger.log_request(method, url, status, **context)
            
    except Exception as e:
        # Fallback logging if request parsing fails
        logger.error(f"Error in log_request_response: {e}", exception=e)


# Add backward compatibility methods to the logger object
logger.debug_with_context = debug
logger.info_with_context = info  
logger.warning_with_context = warning
logger.error_with_context = error
logger.critical_with_context = critical
logger.exception_with_context = exception
logger.log_request_response = log_request_response
