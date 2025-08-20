.PHONY: format format-check test clean docker-build docker-up docker-down docker-logs install venv env venv-clean docker-nuke

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
		echo "Updating dependencies..." && \
		pip install -r backend/requirements.txt; \
	else \
		echo "Creating virtual environment at $(VENV_PATH)" && \
		$(SYSTEM_PYTHON) -m venv $(VENV_PATH) && \
		. $(VENV_ACTIVATE) && pip install -r backend/requirements.txt; \
	fi
	@echo "\nTo activate the virtual environment, run:"
	@echo "source $(VENV_ACTIVATE)"

# Remove virtual environment
venv-clean:
	@echo "Removing virtual environment at $(VENV_PATH)"
	rm -rf $(VENV_PATH)

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

# Docker operations
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

# Development servers
# 
# dev-backend: Start Python backend server on port 5001
# - Activates virtual environment 
# - Loads all .env variables (excluding comments and empty lines)
# - Runs uvicorn with hot reload for development
dev-backend:
	. $(VENV_ACTIVATE) && export $$(cat .env | grep -v '^#' | grep -v '^$$' | xargs) && cd backend && uvicorn app:app --reload --port 5001

# dev-frontend: Start Next.js frontend server on port 3000
# - Loads .env variables but excludes PORT to avoid conflicts
# - Explicitly sets PORT=3000 to prevent frontend from using backend's port (5001)
# - The grep filters ensure only valid env vars are exported (no comments/empty lines)
dev-frontend:
	export $$(cat .env | grep -v '^#' | grep -v '^$$' | grep -v PORT | xargs) && cd frontend && PORT=3000 npm run dev

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
nuke:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -af --volumes

# Help
help:
	@echo "Available targets:"
	@echo "  env          - Show Python environment information"
	@echo "  venv         - Create or update virtual environment (default: $(VENV_DEFAULT))"
	@echo "                Override with: make venv VENV_PATH=/path/to/venv"
	@echo "  venv-clean   - Remove virtual environment"
	@echo "  format       - Format code using black and isort (backend only)"
	@echo "  format-check - Check code formatting without making changes (backend only)"
	@echo "  test         - Run tests"
	@echo "  docker-build - Build Docker images"
	@echo "  docker-up    - Start Docker containers"
	@echo "  docker-down  - Stop Docker containers"
	@echo "  docker-logs  - Show Docker container logs"
	@echo "  dev-backend  - Start backend development server"
	@echo "  dev-frontend - Start frontend development server"
	@echo "  clean        - Clean up Python cache files and build artifacts"
	@echo "  docker-nuke  - Nuke all Docker resources for a clean slate" 