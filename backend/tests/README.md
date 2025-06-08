# Backend Testing Documentation

This directory contains the test suite for the FastAPI backend application.

## Test Structure

```
tests/
├── conftest.py          # Test configuration and fixtures
├── test_models.py       # Unit tests for Pydantic models
├── test_utils.py        # Unit tests for utility functions
├── test_stories_api.py  # Integration tests for Stories API
└── README.md           # This file
```

## Test Categories

### Unit Tests (`@pytest.mark.unit`)
- Test individual functions and classes in isolation
- Fast execution, no external dependencies
- Mock all database and network calls
- Focus on business logic and data validation

### Integration Tests (`@pytest.mark.integration`)
- Test API endpoints and request/response flows
- Mock external services (database, auth) but test the full request cycle
- Verify proper error handling and status codes
- Test authentication and authorization flows

## Running Tests

### Prerequisites
```bash
# Install test dependencies
pip install -r requirements.txt
```

### Run All Tests
```bash
# Using pytest directly
pytest -v

# Using Makefile
make test
```

### Run Specific Test Categories
```bash
# Unit tests only
pytest -v -m unit
make test-unit

# Integration tests only  
pytest -v -m integration
make test-integration
```

### Run Tests with Coverage
```bash
# Generate coverage report
pytest --cov=. --cov-report=html --cov-report=term-missing
make test-coverage

# View HTML coverage report
open htmlcov/index.html
```

### Run Specific Test Files
```bash
# Test models only
pytest tests/test_models.py -v

# Test utils only
pytest tests/test_utils.py -v

# Test stories API only
pytest tests/test_stories_api.py -v
```

## Test Configuration

### Environment Variables
Tests use mock environment variables defined in `conftest.py`. Real environment variables are not needed for testing.

### Database Mocking
- Uses `mongomock-motor` to mock MongoDB operations
- No real database connection required
- Each test gets a fresh mock database instance

### Authentication Mocking
- Mocks Google OAuth token validation
- No real tokens or API calls to Google services
- Tests both authorized and unauthorized scenarios

## Fixtures Available

### Database Fixtures
- `mock_database`: Mock MongoDB database
- `override_database`: Overrides app database dependency
- `sample_story_data`: Test story data
- `sample_unpublished_story_data`: Test draft story data

### Client Fixtures
- `client`: Synchronous test client
- `async_client`: Asynchronous test client for async endpoints

### Mock Fixtures
- `mock_google_storage`: Mock Google Cloud Storage
- `mock_logger`: Mock logger for testing

## Writing New Tests

### Unit Test Example
```python
@pytest.mark.unit
def test_function_name(sample_story_data):
    """Test description"""
    # Arrange
    input_data = sample_story_data
    
    # Act
    result = function_under_test(input_data)
    
    # Assert
    assert result.field == expected_value
```

### Integration Test Example
```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_api_endpoint(async_client, override_database):
    """Test API endpoint"""
    # Arrange
    test_data = {"key": "value"}
    
    # Act
    response = await async_client.post("/endpoint", json=test_data)
    
    # Assert
    assert response.status_code == 200
    assert response.json()["key"] == "value"
```

## Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Follow AAA pattern** (Arrange, Act, Assert) in test structure
3. **Test edge cases** and error conditions, not just happy paths
4. **Use appropriate test markers** (`@pytest.mark.unit` or `@pytest.mark.integration`)
5. **Mock external dependencies** to keep tests isolated and fast
6. **Keep tests independent** - each test should be able to run in isolation
7. **Use fixtures** for common test data and setup
8. **Write tests for new features** before or alongside implementation

## Continuous Integration

Tests are designed to run in CI environments without external dependencies:
- No real database required
- No network calls to external services
- All environment variables mocked
- Fast execution suitable for CI pipelines 