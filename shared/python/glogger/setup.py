"""
Logging setup utilities for automatic provider detection and configuration.

This module provides convenient functions to set up logging based on
environment detection, making it easy to configure logging in different
deployment scenarios.
"""

import os
from typing import Any, Dict, List

from .factory import create_logger_factory
from .interfaces import LoggerFactory, LogProvider
from .providers.console import ConsoleLogProvider
from .providers.gcp import GCPLogProvider


def detect_environment() -> str:
    """
    Detect the deployment environment based on environment variables.

    Returns:
        Environment name: 'gcp-cloud-run', 'gcp', 'development', or 'unknown'
    """
    if os.getenv("K_SERVICE"):
        return "gcp-cloud-run"
    elif os.getenv("GOOGLE_CLOUD_PROJECT"):
        return "gcp"
    elif os.getenv("NODE_ENV") == "development" or os.getenv("ENVIRONMENT") == "development":
        return "development"
    else:
        return "unknown"


def create_provider_from_config(provider_type: str, config: Dict[str, Any]) -> LogProvider:
    """
    Create a logging provider from configuration.

    Args:
        provider_type: Provider type ('console', 'gcp', etc.)
        config: Provider-specific configuration

    Returns:
        Configured LogProvider instance

    Raises:
        ValueError: If provider_type is not supported
    """
    if provider_type == "console":
        return ConsoleLogProvider(
            json_format=config.get("json_format", False),
            include_source=config.get("include_source", True),
        )
    elif provider_type == "gcp":
        return GCPLogProvider(
            project_id=config.get("project_id"),
            fallback_to_console=config.get("fallback_to_console", True),
        )
    else:
        raise ValueError(f"Unsupported provider type: {provider_type}")


def auto_configure_logging(
    force_provider: Optional[str] = None, provider_config: Optional[Dict[str, Any]] = None
) -> LoggerFactory:
    """
    Automatically configure logging based on environment detection.

    This is the main entry point for setting up logging in applications.
    It detects the environment and chooses the most appropriate provider.

    Args:
        force_provider: Force a specific provider ('console', 'gcp')
        provider_config: Additional configuration for the provider

    Returns:
        Configured LoggerFactory instance

    Example:
        # Auto-detect and configure
        factory = auto_configure_logging()
        logger = factory.create_logger('my-app')

        # Force console logging with JSON format
        factory = auto_configure_logging(
            force_provider='console',
            provider_config={'json_format': True}
        )
    """
    config = provider_config or {}

    if force_provider:
        provider_type = force_provider
    else:
        # Auto-detect provider based on environment
        env = detect_environment()
        if env in ["gcp-cloud-run", "gcp"]:
            provider_type = "gcp"
        else:
            provider_type = "console"
            # Use JSON format in production-like environments
            if env != "development":
                config.setdefault("json_format", True)

    provider = create_provider_from_config(provider_type, config)

    # Initialize the provider
    if not provider.initialize(config):
        # Fallback to console if provider initialization fails
        print(f"Failed to initialize {provider_type} provider, falling back to console")
        provider = ConsoleLogProvider()
        provider.initialize({})

    return create_logger_factory(provider)


def setup_logging_for_environment(environment: str) -> LoggerFactory:
    """
    Set up logging for a specific environment with sensible defaults.

    Args:
        environment: Environment name ('development', 'staging', 'production', etc.)

    Returns:
        Configured LoggerFactory instance
    """
    if environment == "development":
        # Human-readable console logs for development
        return auto_configure_logging(
            force_provider="console", provider_config={"json_format": False, "include_source": True}
        )
    elif environment in ["staging", "production"]:
        # Structured JSON logs for production environments
        return auto_configure_logging(
            provider_config={
                "json_format": True,
                "include_source": False,
                "fallback_to_console": True,
            }
        )
    else:
        # Default to auto-detection
        return auto_configure_logging()


# Convenience functions for common patterns
def setup_development_logging() -> LoggerFactory:
    """Set up human-readable logging for development."""
    return setup_logging_for_environment("development")


def setup_production_logging() -> LoggerFactory:
    """Set up structured logging for production."""
    return setup_logging_for_environment("production")


def get_available_providers() -> List[str]:
    """Get list of available logging providers."""
    providers = ["console"]

    try:
        from .providers.gcp import GCP_AVAILABLE

        if GCP_AVAILABLE:
            providers.append("gcp")
    except ImportError:
        pass

    return providers
