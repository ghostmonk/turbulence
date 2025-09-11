"""
Logging abstraction interfaces for platform-independent logging.

This module defines the core interfaces that allow the application to log
without being coupled to any specific logging provider (GCP, AWS, Datadog, etc.).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional, Union


class LogLevel(Enum):
    """Standard log levels that map to most logging providers."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class LogContext:
    """
    Platform-agnostic log context that can be enriched by providers.

    This contains the core context information that should be available
    across all logging providers, with provider-specific fields added
    during serialization.
    """

    # Core application context
    component: str
    environment: Optional[str] = None
    service_name: Optional[str] = None
    service_version: Optional[str] = None

    # Request/operation context
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    operation_id: Optional[str] = None

    # Error context
    error_type: Optional[str] = None
    error_code: Optional[str] = None

    # Custom fields for application-specific context
    custom: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values."""
        result = {}
        for key, value in self.__dict__.items():
            if value is not None:
                if key == "custom":
                    result.update(value)
                else:
                    result[key] = value
        return result


@dataclass
class LogEntry:
    """
    Platform-agnostic log entry that contains all information needed for logging.

    Providers will transform this into their specific format.
    """

    level: LogLevel
    message: str
    timestamp: datetime
    context: LogContext

    # Optional exception information
    exception: Optional[Exception] = None
    stack_trace: Optional[str] = None

    # Optional HTTP request information
    http_method: Optional[str] = None
    http_url: Optional[str] = None
    http_status: Optional[int] = None
    http_user_agent: Optional[str] = None
    http_referer: Optional[str] = None
    http_latency_ms: Optional[float] = None
    http_response_size: Optional[int] = None

    # Source location information
    source_file: Optional[str] = None
    source_line: Optional[int] = None
    source_function: Optional[str] = None


class LogProvider(ABC):
    """
    Abstract base class for logging providers.

    Each provider (GCP, AWS CloudWatch, Datadog, Console, etc.) implements
    this interface to handle platform-specific logging logic.
    """

    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> bool:
        """
        Initialize the logging provider with configuration.

        Args:
            config: Provider-specific configuration

        Returns:
            True if initialization successful, False otherwise
        """
        pass

    @abstractmethod
    def log(self, entry: LogEntry) -> bool:
        """
        Log an entry using the provider's implementation.

        Args:
            entry: The log entry to be logged

        Returns:
            True if log was successful, False otherwise
        """
        pass

    @abstractmethod
    def flush(self) -> None:
        """Flush any pending logs (useful for batch providers)."""
        pass

    @abstractmethod
    def close(self) -> None:
        """Clean up resources and close connections."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the name of the provider (e.g., 'gcp', 'console', 'datadog')."""
        pass

    @property
    @abstractmethod
    def supports_structured_logging(self) -> bool:
        """Return True if the provider supports structured/JSON logging."""
        pass


class Logger(ABC):
    """
    Abstract logger interface that applications use for logging.

    This provides a clean, provider-agnostic API for logging while
    allowing the underlying provider to be swapped out.
    """

    @abstractmethod
    def with_context(self, **context_fields) -> "Logger":
        """
        Create a new logger instance with additional context.

        This allows for chaining context without modifying the original logger.

        Example:
            request_logger = logger.with_context(request_id="123", user_id="user456")
            request_logger.info("Processing request")
        """
        pass

    @abstractmethod
    def debug(self, message: str, **context) -> None:
        """Log a debug message."""
        pass

    @abstractmethod
    def info(self, message: str, **context) -> None:
        """Log an info message."""
        pass

    @abstractmethod
    def warning(self, message: str, **context) -> None:
        """Log a warning message."""
        pass

    @abstractmethod
    def error(self, message: str, exception: Optional[Exception] = None, **context) -> None:
        """Log an error message, optionally with exception details."""
        pass

    @abstractmethod
    def critical(self, message: str, exception: Optional[Exception] = None, **context) -> None:
        """Log a critical message, optionally with exception details."""
        pass

    @abstractmethod
    def log_request(
        self,
        method: str,
        url: str,
        status: Optional[int] = None,
        latency_ms: Optional[float] = None,
        response_size: Optional[int] = None,
        user_agent: Optional[str] = None,
        referer: Optional[str] = None,
        **context,
    ) -> None:
        """Log HTTP request information."""
        pass


class LoggerFactory(ABC):
    """
    Factory for creating logger instances.

    This allows for different logger configurations and provider selection
    based on environment or other factors.
    """

    @abstractmethod
    def create_logger(self, component: str, **default_context) -> Logger:
        """
        Create a logger for a specific component.

        Args:
            component: Component name (e.g., 'api', 'auth', 'video-processor')
            **default_context: Default context to include in all logs from this logger

        Returns:
            Logger instance configured for the component
        """
        pass

    @abstractmethod
    def set_provider(self, provider: LogProvider) -> None:
        """Set the logging provider to use for new loggers."""
        pass

    @abstractmethod
    def get_provider(self) -> LogProvider:
        """Get the current logging provider."""
        pass
