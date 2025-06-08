# Makefile for Backend Development and Testing

.PHONY: help install test test-unit test-integration test-coverage clean lint format run dev-setup

# Default target
help:
	@echo "Available commands:"
	@echo "  install         - Install dependencies"
	@echo "  test           - Run all tests"
	@echo "  test-unit      - Run only unit tests"
	@echo "  test-integration - Run only integration tests"
	@echo "  test-coverage  - Run tests with coverage report"
	@echo "  lint           - Run linting checks"
	@echo "  format         - Format code with black"
	@echo "  run            - Run the application"
	@echo "  dev-setup      - Set up development environment"
	@echo "  clean          - Clean up cache and temp files"

# Install dependencies
install:
	pip install -r requirements.txt

# Run all tests
test:
	pytest -v

# Run only unit tests
test-unit:
	pytest -v -m unit

# Run only integration tests  
test-integration:
	pytest -v -m integration

# Run tests with coverage
test-coverage:
	pytest --cov=. --cov-report=html --cov-report=term-missing

# Run linting (if you want to add flake8 or similar later)
lint:
	@echo "Linting not configured yet. Add flake8 or pylint to requirements.txt"

# Format code (if you want to add black later)
format:
	@echo "Code formatting not configured yet. Add black to requirements.txt"

# Run the application
run:
	python app.py

# Set up development environment
dev-setup: install
	@echo "Development environment ready!"
	@echo "Run 'make test' to verify everything works"

# Clean up cache and temporary files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true 