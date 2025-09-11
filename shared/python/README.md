# glogger - Platform-Independent Logging

A clean logging abstraction that automatically detects your environment and chooses the appropriate provider (GCP Cloud Logging, Console, etc.) without coupling your application code to any specific platform.

## Quick Start

### Basic Usage

```python
from glogger import logger

# Simple logging
logger.info("Application started")
logger.error("Something went wrong", exception=some_error)

# With context
logger.info("User action", user_id="123", action="login")
```

### Component-Specific Loggers

```python
from glogger import get_component_logger

# Create loggers for different parts of your app
auth_logger = get_component_logger('auth')
api_logger = get_component_logger('api')
video_logger = get_component_logger('video-processor')

auth_logger.info("User authenticated", user_id="123")
api_logger.info("Request received", endpoint="/api/users")
```

### Request Logging

```python
from glogger import get_request_logger

# For tracking requests with context
req_logger = get_request_logger("req-456", user_id="123", path="/api/users")
req_logger.info("Processing request")
req_logger.info("Request completed", status=200, latency_ms=45.2)
```

## Log Methods

All loggers support these methods:

- `debug(message, **context)` - Debug information
- `info(message, **context)` - General information  
- `warn(message, **context)` - Warning messages
- `error(message, exception=None, **context)` - Error messages
- `critical(message, exception=None, **context)` - Critical errors
- `log_request(method, url, status=None, latency_ms=None, response_size=None, **context)` - HTTP request logging

## Context and Exceptions

```python
# Add context to any log
logger.info("Database query", table="users", query_time_ms=120)

# Log exceptions properly
try:
    risky_operation()
except Exception as e:
    logger.error("Operation failed", exception=e, operation="risky_operation")

# Add dynamic context
user_logger = logger.with_context(user_id="123", session="abc")
user_logger.info("User performed action", action="upload")
```

## Environment Detection

The logger automatically detects your environment:

- **GCP Cloud Run/Functions**: Uses structured JSON logging with GCP fields
- **Development**: Pretty-printed console output  
- **Production (non-GCP)**: Structured JSON to console

No configuration needed - it just works!

## Advanced Usage

### Manual Configuration

```python
from glogger import auto_configure_logging

# Get the factory for advanced usage
factory = auto_configure_logging()
custom_logger = factory.create_logger('my-service', version="2.0", region="us-west")
```

### Available Providers

- **GCP Provider**: Full Google Cloud Logging integration with labels, trace context
- **Console Provider**: Pretty development output or structured JSON for production

## Output Examples

### Development (Console)
```
[2025-09-11 08:50:20] INFO [auth] User authenticated
  user_id: 123
  session: abc123
```

### Production (GCP)
```json
{
  "timestamp": "2025-09-11T12:50:20.000152",
  "severity": "INFO", 
  "message": "User authenticated",
  "component": "auth",
  "logging.googleapis.com/labels": {
    "component": "auth",
    "environment": "production"
  },
  "user_id": "123",
  "session": "abc123"
}
```

## Installation

The package is installed as an editable dependency:

```bash
# Already included in requirements.txt as:
-e ./shared/python
```
