import logging
import traceback
import sys
from functools import wraps

class DetailedFormatter(logging.Formatter):
    def formatException(self, exc_info):
        formatted = super().formatException(exc_info)
        return f"{formatted}\n\nFull traceback:\n{''.join(traceback.format_exception(*exc_info))}"
    
    def format(self, record):
        record_dict = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
            "path": record.pathname,
            "line": record.lineno,
            "function": record.funcName
        }
        
        if record.exc_info:
            record_dict["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, "extra") and record.extra:
            record_dict["extra"] = record.extra

        output = f"{self.formatTime(record, self.datefmt)} - {record.levelname} - {record.name} - {record.getMessage()}"
        
        if record.exc_info:
            return f"{output}\n{self.formatException(record.exc_info)}"
        
        return output


logger = logging.getLogger("ghostmonk-turbulence")
logger.setLevel(logging.INFO)
logger.propagate = False

for handler in logger.handlers[:]:
    logger.removeHandler(handler)

console_handler = logging.StreamHandler(sys.stdout)
console_formatter = DetailedFormatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)


def log_with_context(level, message, context=None, exc_info=None):
    """Log with additional context information."""
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
        req_info = {
            "method": getattr(request, "method", "UNKNOWN"),
            "url": str(getattr(request, "url", "UNKNOWN")),
            "client": getattr(request, "client", None) and str(getattr(request, "client")),
            "headers": dict(getattr(request, "headers", {})),
        }
        
        if hasattr(request, "body") and request.body:
            try:
                if isinstance(request.body, bytes):
                    req_info["body"] = request.body.decode('utf-8')[:1000]  # Limit size
                else:
                    req_info["body"] = str(request.body)[:1000]
            except Exception:
                req_info["body"] = "[Binary data]"
        
        log_data = {"request": req_info}
        
        if response:
            resp_info = {
                "status_code": getattr(response, "status_code", 0),
                "headers": dict(getattr(response, "headers", {})),
            }
            log_data["response"] = resp_info
        
        if error:
            err_info = {
                "type": type(error).__name__,
                "message": str(error),
            }
            log_data["error"] = err_info
        
        if error:
            error("Request failed", log_data, exc_info=error)
        elif response and getattr(response, "status_code", 200) >= 400:
            warning("Request resulted in error response", log_data)
        else:
            info("Request processed", log_data)
            
    except Exception as e:
        logger.error(f"Error in log_request_response: {e}")


logger.debug_with_context = debug
logger.info_with_context = info
logger.warning_with_context = warning
logger.error_with_context = error
logger.critical_with_context = critical
logger.exception_with_context = exception
logger.log_request_response = log_request_response
