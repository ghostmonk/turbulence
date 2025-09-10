"""
Logging abstraction layer for platform-independent logging.

This package provides a clean interface for logging that can be backed by
different providers (GCP Cloud Logging, AWS CloudWatch, Console, etc.)
without requiring application code changes.

Example usage:
    from logging import get_logger
    
    logger = get_logger('my-component')
    logger.info("Application started", version="1.0.0")
    
    # With request context
    request_logger = logger.with_context(request_id="123", user_id="user456")
    request_logger.info("Processing request")
"""

from .factory import create_logger_factory, get_logger
from .interfaces import LogLevel, LogContext, LogEntry, Logger, LogProvider, LoggerFactory
from .setup import (
    auto_configure_logging,
    setup_logging_for_environment, 
    setup_development_logging,
    setup_production_logging,
    detect_environment,
    get_available_providers
)

__all__ = [
    'LogLevel',
    'LogContext', 
    'LogEntry',
    'Logger',
    'LogProvider',
    'LoggerFactory',
    'create_logger_factory',
    'get_logger',
    'auto_configure_logging',
    'setup_logging_for_environment',
    'setup_development_logging',
    'setup_production_logging',
    'detect_environment',
    'get_available_providers'
]
