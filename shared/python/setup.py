"""
Setup script for the shared glogger package.
"""

from setuptools import find_packages, setup

setup(
    name="glogger",
    version="1.0.0",
    description="Platform-independent logging abstraction",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "google-cloud-logging>=3.0.0",
    ],
    extras_require={
        "dev": [
            "pytest",
            "black",
            "mypy",
        ],
    },
)
