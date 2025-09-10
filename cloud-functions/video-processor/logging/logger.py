"""
Cloud Functions logging implementation.

Provides a simple, provider-agnostic interface for logging in Cloud Functions
with automatic GCP integration when available.
"""

import os
import sys
import json
import logging
from typing import Dict, Any, Optional, Union
from datetime import datetime


class CloudFunctionLogger:
    """
    Simplified logger for Cloud Functions.
    
    Automatically detects GCP environment and configures appropriate logging.
    Falls back to structured console logging when GCP is not available.
    """
    
    def __init__(self, component: str = "cloud-function"):
        self.component = component
        self.is_gcp = self._detect_gcp_environment()
        self.logger = self._setup_logger()
    
    def _detect_gcp_environment(self) -> bool:
        """Detect if running in GCP Cloud Functions."""
        return bool(os.getenv('FUNCTION_NAME') or os.getenv('K_SERVICE'))
    
    def _setup_logger(self) -> logging.Logger:
        """Set up the underlying logger."""
        logger = logging.getLogger(self.component)
        logger.setLevel(logging.INFO)
        
        # Remove existing handlers
        for handler in logger.handlers[:]:
            logger.removeHandler(handler)
        
        if self.is_gcp:
            try:
                from google.cloud import logging as cloud_logging
                client = cloud_logging.Client()
                client.setup_logging()
                
                # Create handler for structured logging
                handler = cloud_logging.handlers.CloudLoggingHandler(client)
                logger.addHandler(handler)
                return logger
            except ImportError:
                # Fall back to console logging
                pass
        
        # Console logging fallback
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter('%(message)s'))
        logger.addHandler(handler)
        return logger
    
    def _create_log_entry(
        self, 
        level: str, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None
    ) -> Dict[str, Any]:
        """Create a structured log entry."""
        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'severity': level,
            'component': self.component,
            'message': message
        }
        
        # Add function metadata if available
        function_name = os.getenv('FUNCTION_NAME') or os.getenv('K_SERVICE')
        if function_name:
            entry['function'] = function_name
        
        # Add environment info
        entry['environment'] = {
            'project': os.getenv('GOOGLE_CLOUD_PROJECT'),
            'region': os.getenv('FUNCTION_REGION') or os.getenv('CLOUD_RUN_REGION'),
            'memory': os.getenv('FUNCTION_MEMORY_MB'),
            'timeout': os.getenv('FUNCTION_TIMEOUT_SEC')
        }
        
        # Add context
        if context:
            entry['context'] = context
        
        # Add exception details
        if exception:
            entry['error'] = {
                'type': type(exception).__name__,
                'message': str(exception),
                'stack': self._get_stack_trace(exception)
            }
        
        return entry
    
    def _get_stack_trace(self, exception: Exception) -> Optional[str]:
        """Get stack trace from exception."""
        import traceback
        try:
            return ''.join(traceback.format_exception(
                type(exception), exception, exception.__traceback__
            ))
        except Exception:
            return None
    
    def _log(self, level: str, message: str, context: Optional[Dict[str, Any]] = None, exception: Optional[Exception] = None):
        """Internal logging method."""
        if self.is_gcp:
            # For GCP, log structured data
            entry = self._create_log_entry(level, message, context, exception)
            
            # Map to Python logging level
            py_level = getattr(logging, level, logging.INFO)
            self.logger.log(py_level, entry)
        else:
            # For console, use formatted output
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            log_line = f"[{timestamp}] [{level}] [{self.component}] {message}"
            
            if context:
                context_str = ', '.join(f"{k}={v}" for k, v in context.items())
                log_line += f" | {context_str}"
            
            print(log_line)
            
            if exception:
                print(f"  Error: {type(exception).__name__}: {exception}")
                stack = self._get_stack_trace(exception)
                if stack:
                    for line in stack.strip().split('\n'):
                        print(f"  {line}")
    
    def debug(self, message: str, **context):
        """Log debug message."""
        self._log('DEBUG', message, context if context else None)
    
    def info(self, message: str, **context):
        """Log info message."""
        self._log('INFO', message, context if context else None)
    
    def warning(self, message: str, **context):
        """Log warning message."""
        self._log('WARNING', message, context if context else None)
    
    def error(self, message: str, exception: Optional[Exception] = None, **context):
        """Log error message."""
        self._log('ERROR', message, context if context else None, exception)
    
    def critical(self, message: str, exception: Optional[Exception] = None, **context):
        """Log critical message."""
        self._log('CRITICAL', message, context if context else None, exception)
    
    def exception(self, message: str, **context):
        """Log current exception."""
        import sys
        exc_info = sys.exc_info()
        if exc_info[1]:
            self.error(message, exc_info[1], **context)
        else:
            self.error(message, **context)


# Global logger instance
_default_logger: Optional[CloudFunctionLogger] = None


def setup_logging(component: str = "cloud-function") -> CloudFunctionLogger:
    """
    Set up logging for a Cloud Function.
    
    Args:
        component: Component name for the logger
        
    Returns:
        Configured logger instance
    """
    global _default_logger
    _default_logger = CloudFunctionLogger(component)
    return _default_logger


def get_logger(component: Optional[str] = None) -> CloudFunctionLogger:
    """
    Get a logger instance.
    
    Args:
        component: Component name (uses default if not specified)
        
    Returns:
        Logger instance
    """
    if component:
        return CloudFunctionLogger(component)
    
    if _default_logger is None:
        return setup_logging()
    
    return _default_logger


# Convenience functions for backward compatibility
def log_info(message: str, **context):
    """Log info message using default logger."""
    logger = get_logger()
    logger.info(message, **context)


def log_error(message: str, exception: Optional[Exception] = None, **context):
    """Log error message using default logger."""
    logger = get_logger()
    logger.error(message, exception, **context)


def log_warning(message: str, **context):
    """Log warning message using default logger."""
    logger = get_logger()
    logger.warning(message, **context)
