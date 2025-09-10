"""
Simplified logging abstraction for Cloud Functions.

This module provides a lightweight logging interface specifically designed
for Cloud Functions, which typically have simpler logging requirements.
"""

from .logger import setup_logging, get_logger

__all__ = ['setup_logging', 'get_logger']
