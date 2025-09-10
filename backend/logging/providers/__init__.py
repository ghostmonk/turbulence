"""
Logging providers for different platforms and services.

This package contains implementations of LogProvider for various
logging backends like GCP Cloud Logging, AWS CloudWatch, Console, etc.
"""

from .console import ConsoleLogProvider
from .gcp import GCPLogProvider

__all__ = ['ConsoleLogProvider', 'GCPLogProvider']
