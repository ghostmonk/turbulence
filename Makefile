.PHONY: format format-check test test-unit test-integration test-coverage test-ci clean docker-build docker-up docker-down docker-logs install venv env venv-clean docker-nuke deps deps-dev deps-compile deps-upgrade dev dev-backend dev-frontend

# Virtual environment configuration
VENV_DEFAULT := $(HOME)/Documents/venvs/turbulence
VENV_PATH ?= $(VENV_DEFAULT)
VENV_ACTIVATE := $(VENV_PATH)/bin/activate
SYSTEM_PYTHON := $(shell which python)

# Show environment information
env:
	@echo "Python environment information:"
	@echo "------------------------------"
	@echo "Virtual environment path: $(VENV_PATH)"
	@echo "System Python: $(SYSTEM_PYTHON)"
	@if [ -d "$(VENV_PATH)" ]; then \
		echo "Virtual environment exists: Yes"; \
		. $(VENV_ACTIVATE) && echo "Python path: $$(which python)" && \
		echo "Python version: $$(python --version)" && \
		echo "Pip version: $$(pip --version)"; \
	else \
		echo "Virtual environment exists: No"; \
		echo "System Python version: $$(python --version)"; \
	fi

# Virtual environment setup
venv:
	@if [ -d "$(VENV_PATH)" ]; then \
		echo "Virtual environment already exists at $(VENV_PATH)" && \
		echo "Checking Python version..." && \
		. $(VENV_ACTIVATE) && \
		if [ "$$(python --version)" != "$$($(SYSTEM_PYTHON) --version)" ]; then \
			echo "Warning: Virtual environment Python version differs from system Python" && \
			echo "Consider removing the virtual environment and recreating it" && \
			echo "Run: make venv-clean && make venv"; \
		fi && \
		echo "Installing pip-tools..." && \
		pip install pip-tools && \
		echo "Installing development dependencies..." && \
		pip install -r backend/requirements-dev.txt; \
	else \
		echo "Creating virtual environment at $(VENV_PATH)" && \
		$(SYSTEM_PYTHON) -m venv $(VENV_PATH) && \
		. $(VENV_ACTIVATE) && \
		pip install pip-tools && \
		pip install -r backend/requirements-dev.txt; \
	fi
	@echo "\nTo activate the virtual environment, run:"
	@echo "source $(VENV_ACTIVATE)"

# Remove virtual environment
venv-clean:
	@echo "Removing virtual environment at $(VENV_PATH)"
	rm -rf $(VENV_PATH)

# Dependency management with pip-tools
deps-compile:
	@echo "Compiling requirements files..."
	. $(VENV_ACTIVATE) && cd backend && pip-compile requirements.in
	. $(VENV_ACTIVATE) && cd backend && pip-compile requirements-dev.in

deps-upgrade:
	@echo "Upgrading all dependencies..."
	. $(VENV_ACTIVATE) && cd backend && pip-compile --upgrade requirements.in
	. $(VENV_ACTIVATE) && cd backend && pip-compile --upgrade requirements-dev.in

deps:
	@echo "Installing production dependencies..."
	. $(VENV_ACTIVATE) && pip install -r backend/requirements.txt

deps-dev:
	@echo "Installing development dependencies..."
	. $(VENV_ACTIVATE) && pip install -r backend/requirements-dev.txt

# Python formatting
format:
	. $(VENV_ACTIVATE) && isort backend/
	. $(VENV_ACTIVATE) && black backend/
	cd frontend && npx eslint --fix .

format-check:
	. $(VENV_ACTIVATE) && isort backend/ --check-only
	. $(VENV_ACTIVATE) && black backend/ --check

# Testing
test:
	. $(VENV_ACTIVATE) && pytest

test-unit:
	. $(VENV_ACTIVATE) && pytest -v -m unit

test-integration:
	. $(VENV_ACTIVATE) && pytest -v -m integration

test-coverage:
	. $(VENV_ACTIVATE) && pytest --cov=backend --cov-report=html --cov-report=term-missing

test-ci:
	@echo "Running CI-style tests with formatting checks..."
	. $(VENV_ACTIVATE) && cd backend && \
	echo "Checking import sorting..." && \
	isort . --check-only --diff && \
	echo "Checking code formatting..." && \
	black . --check --diff && \
	echo "Running linting..." && \
	flake8 . --statistics && \
	echo "Running tests with coverage..." && \
	pytest -v --tb=short --cov=. --cov-report=term-missing

# Docker operations
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Development server
dev:
	@echo "Starting development servers..."
	@echo "Backend will run on http://localhost:5001"
	@echo "Frontend will run on http://localhost:3000"
	@echo "Press Ctrl+C to stop both servers"
	@trap 'kill %1 %2' INT; \
	make dev-backend & \
	make dev-frontend & \
	wait

dev-backend:
	. $(VENV_ACTIVATE) && cd backend && uvicorn app:app --reload --port 5001

dev-frontend:
	cd frontend && npm run dev

# Cleanup
clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -r {} +
	find . -type d -name "*.egg" -exec rm -r {} +
	find . -type d -name ".pytest_cache" -exec rm -r {} +
	find . -type d -name ".coverage" -exec rm -r {} +
	find . -type d -name "htmlcov" -exec rm -r {} +
	find . -type d -name "dist" -exec rm -r {} +
	find . -type d -name "build" -exec rm -r {} +

# Nuke all Docker resources for a clean slate
docker-nuke:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -af --volumes

# Help
help:
	@echo "Available targets:"
	@echo "  env              - Show Python environment information"
	@echo "  venv             - Create or update virtual environment (default: $(VENV_DEFAULT))"
	@echo "                    Override with: make venv VENV_PATH=/path/to/venv"
	@echo "  venv-clean       - Remove virtual environment"
	@echo "  deps-compile     - Compile requirements.in files to requirements.txt"
	@echo "  deps-upgrade     - Upgrade all dependencies and recompile"
	@echo "  deps             - Install production dependencies only"
	@echo "  deps-dev         - Install development dependencies"
	@echo "  format           - Format code using black and isort (backend only)"
	@echo "  format-check     - Check code formatting without making changes (backend only)"
	@echo "  test             - Run all tests"
	@echo "  test-unit        - Run only unit tests"
	@echo "  test-integration - Run only integration tests"
	@echo "  test-coverage    - Run tests with coverage report"
	@echo "  test-ci          - Run CI-style tests with formatting and linting checks"
	@echo "  docker-build     - Build Docker images"
	@echo "  docker-up        - Start Docker containers"
	@echo "  docker-down      - Stop Docker containers"
	@echo "  docker-logs      - Show Docker container logs"
	@echo "  dev              - Start both backend and frontend development servers"
	@echo "  dev-backend      - Start backend development server"
	@echo "  dev-frontend     - Start frontend development server"
	@echo "  clean            - Clean up Python cache files and build artifacts"
	@echo "  docker-nuke      - Nuke all Docker resources for a clean slate" 