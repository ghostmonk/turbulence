import logging
import sys
import traceback
from functools import wraps
from google.cloud import logging as cloud_logging
import os


def setup_cloud_logging():
    """Setup Google Cloud Logging if running in Cloud Run"""
    try:
        # Check if running in Cloud Run
        if os.getenv('K_SERVICE'):
            # Get project ID from environment or metadata server
            project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
            
            # Initialize client with explicit project
            client = cloud_logging.Client(project=project_id)
            
            # Configure handler with service name for better filtering
            handler = cloud_logging.handlers.CloudLoggingHandler(
                client,
                name=os.getenv('K_SERVICE'),
                labels={
                    'service': os.getenv('K_SERVICE'),
                    'revision': os.getenv('K_REVISION', 'unknown'),
                    'configuration': os.getenv('K_CONFIGURATION', 'unknown')
                }
            )
            
            # Setup handler with formatter
            handler.setFormatter(logging.Formatter('%(message)s'))
            logger.addHandler(handler)
            
            # Set logging level
            logger.setLevel(logging.INFO)
            return True
        return False
    except Exception as e:
        print(f"Failed to setup Cloud Logging: {e}", file=sys.stderr)
        return False


def create_structured_log(record, message, context=None, exc_info=None):
    """Create a structured log entry for Cloud Logging"""
    log_dict = {
        "severity": record.levelname,
        "component": record.name,
        "message": message,
        "logging.googleapis.com/sourceLocation": {
            "file": record.pathname,
            "line": str(record.lineno),
            "function": record.funcName
        }
    }

    if context:
        log_dict["context"] = context

    if exc_info:
        log_dict["exception"] = {
            "type": type(exc_info[1]).__name__,
            "message": str(exc_info[1]),
            "traceback": ''.join(traceback.format_exception(*exc_info))
        }

    return log_dict


# Initialize logger
logger = logging.getLogger("ghostmonk-turbulence")
logger.setLevel(logging.INFO)

# Remove any existing handlers
for handler in logger.handlers[:]:
    logger.removeHandler(handler)

# Setup Cloud Logging if in Cloud Run, otherwise use standard logging
if not setup_cloud_logging():
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)


def log_with_context(level, message, context=None, exc_info=None):
    """Log with additional context information."""
    if os.getenv('K_SERVICE'):  # If running in Cloud Run
        record = logging.LogRecord(
            name=logger.name,
            level=level,
            pathname=sys._getframe().f_back.f_code.co_filename,
            lineno=sys._getframe().f_back.f_lineno,
            msg=message,
            args=(),
            exc_info=exc_info,
            func=sys._getframe().f_back.f_code.co_name
        )
        structured_log = create_structured_log(record, message, context, exc_info)
        logger.log(level, structured_log)
    else:
        extra = {"extra": context} if context else {}
        logger.log(level, message, extra=extra, exc_info=exc_info)


def debug(message, context=None, exc_info=None):
    log_with_context(logging.DEBUG, message, context, exc_info)


def info(message, context=None):
    log_with_context(logging.INFO, message, context)


def warning(message, context=None, exc_info=None):
    log_with_context(logging.WARNING, message, context, exc_info)


def error(message, context=None, exc_info=None):
    log_with_context(logging.ERROR, message, context, exc_info)


def critical(message, context=None, exc_info=None):
    log_with_context(logging.CRITICAL, message, context, exc_info)


def exception(message, context=None):
    """Log an exception with full traceback."""
    log_with_context(logging.ERROR, message, context, exc_info=sys.exc_info())


def log_request_response(request, response=None, error=None):
    """Log detailed request and response information."""
    try:
        trace_header = request.headers.get('X-Cloud-Trace-Context')
        
        req_info = {
            "httpRequest": {  # Special field for Cloud Logging
                "requestMethod": getattr(request, "method", "UNKNOWN"),
                "requestUrl": str(getattr(request, "url", "UNKNOWN")),
                "remoteIp": getattr(request, "client", None) and str(getattr(request, "client")),
                "protocol": getattr(request, "scope", {}).get("type", "UNKNOWN"),
            },
            "requestHeaders": dict(getattr(request, "headers", {}))
        }

        if trace_header:  # Add trace context for Cloud Logging
            req_info['logging.googleapis.com/trace'] = trace_header

        if hasattr(request, "body") and request.body:
            try:
                if isinstance(request.body, bytes):
                    req_info["requestBody"] = request.body.decode("utf-8")[:1000]
                else:
                    req_info["requestBody"] = str(request.body)[:1000]
            except Exception:
                req_info["requestBody"] = "[Binary data]"

        if response:
            req_info["httpRequest"]["status"] = getattr(response, "status_code", 0)
            req_info["httpRequest"]["responseSize"] = len(str(getattr(response, "body", "")))
            req_info["responseHeaders"] = dict(getattr(response, "headers", {}))

        if error:
            req_info["error"] = {
                "@type": type(error).__name__,
                "message": str(error)
            }
            if isinstance(error, Exception):
                req_info["error"]["stack_trace"] = ''.join(traceback.format_exception(type(error), error, error.__traceback__))

        # Log with appropriate severity
        if error:
            error("Request failed", req_info, exc_info=error)
        elif response and getattr(response, "status_code", 200) >= 400:
            warning("Request resulted in error response", req_info)
        else:
            info("Request processed", req_info)

    except Exception as e:
        logger.error(f"Error in log_request_response: {e}", exc_info=e)


logger.debug_with_context = debug
logger.info_with_context = info
logger.warning_with_context = warning
logger.error_with_context = error
logger.critical_with_context = critical
logger.exception_with_context = exception
logger.log_request_response = log_request_response
