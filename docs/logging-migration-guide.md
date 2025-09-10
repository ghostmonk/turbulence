# Logging Migration Guide

This guide explains how to migrate from the current GCP-coupled logging implementation to the new platform-agnostic logging abstraction.

## Overview

The new logging system provides:
- **Platform Independence**: Easy switching between GCP, console, remote APIs, and other providers
- **Structured Logging**: Consistent log format across all environments
- **Backward Compatibility**: Minimal code changes required
- **Environment Detection**: Automatic provider selection based on deployment environment
- **Type Safety**: Full TypeScript support in frontend

## Architecture

### Current (GCP-Coupled)
```
Application Code → GCP Cloud Logging
                ↓ (fallback)
                Console Logging
```

### New (Abstracted)
```
Application Code → Logger Interface → Provider (GCP/Console/Remote/etc.)
```

## Migration Steps

### 1. Backend Migration

#### Old Code (backend/logger.py)
```python
from logger import logger, info, error

# Direct usage
info("User logged in", {"user_id": "123"})
error("Login failed", {"error": "invalid credentials"})

# With context
logger.info_with_context("Processing request", {"request_id": "req-456"})
```

#### New Code (backend/logger_new.py)
```python
from logger_new import get_component_logger, logger

# Direct usage - backward compatible
info("User logged in", {"user_id": "123"})
error("Login failed", {"error": "invalid credentials"})

# Modern approach - recommended
auth_logger = get_component_logger('auth')
auth_logger.info("User logged in", user_id="123")
auth_logger.error("Login failed", error="invalid credentials")

# Request context
request_logger = get_request_logger("req-456", user_id="123")
request_logger.info("Processing request")
```

#### Migration Steps:
1. Add the new logging package to your imports
2. Replace `from logger import` with `from logger_new import`
3. Gradually migrate to component-specific loggers
4. Test in development environment
5. Deploy and verify in staging/production

### 2. Frontend Migration

#### Old Code (frontend/src/utils/logger/)
```typescript
import { appLogger } from '@/utils/logger';

appLogger.info("Page loaded", { page: "/dashboard" });
appLogger.error("API call failed", new Error("Network error"), { endpoint: "/api/users" });
```

#### New Code (frontend/src/utils/logger-new.ts)
```typescript
import { getComponentLogger, apiLogger } from '@/utils/logger-new';

// Component-specific logging
const pageLogger = await getComponentLogger('dashboard');
pageLogger.info("Page loaded", { page: "/dashboard" });

// API logging
apiLogger.logError("GET", "/api/users", new Error("Network error"));

// Backward compatible
import { logger } from '@/utils/logger-new';
logger.info("Page loaded", { page: "/dashboard" });
```

#### Migration Steps:
1. Install new logging utilities
2. Update imports gradually
3. Use component loggers for better organization
4. Test in development environment

### 3. Cloud Functions Migration

#### Old Code (cloud-functions/video-processor/main.py)
```python
import logging
from google.cloud import logging as cloud_logging

# Setup
cloud_logging_client = cloud_logging.Client()
cloud_logging_client.setup_logging()
logger = logging.getLogger(__name__)

# Usage
logger.info(f"Processing video: {file_name}")
logger.error(f"FFmpeg error: {error_msg}")
```

#### New Code
```python
from logging import setup_logging, get_logger

# Setup
logger = setup_logging('video-processor')

# Usage
logger.info("Processing video", file_name=file_name)
logger.error("FFmpeg error", error_message=error_msg)
```

## Provider Configuration

### Environment-Based Auto-Configuration

The system automatically detects your environment and selects the appropriate provider:

- **Development**: Console logging with human-readable format
- **GCP Cloud Run**: GCP Cloud Logging with structured format
- **Other Production**: Structured console logging (JSON)

### Manual Configuration

#### Backend
```python
from logging import auto_configure_logging, setup_production_logging

# Auto-detect
factory = auto_configure_logging()

# Force specific environment
factory = setup_production_logging()

# Custom configuration
factory = auto_configure_logging(
    force_provider='gcp',
    provider_config={'project_id': 'my-project'}
)
```

#### Frontend
```typescript
import { autoConfigureLogging } from '@/lib/logging';

// Auto-detect
const factory = await autoConfigureLogging();

// Custom configuration
const factory = await autoConfigureLogging({
    provider: 'remote',
    remote: {
        endpoint: 'https://api.example.com/logs',
        apiKey: 'your-api-key',
        batchSize: 10
    }
});
```

## Provider Options

### 1. Console Provider
Best for development and simple deployments.

**Backend:**
```python
from logging.providers import ConsoleLogProvider
provider = ConsoleLogProvider(json_format=True, include_source=True)
```

**Frontend:**
```typescript
import { ConsoleLogProvider } from '@/lib/logging';
const provider = new ConsoleLogProvider(true, true); // jsonFormat, includeSource
```

### 2. GCP Provider
Integrates with Google Cloud Logging.

**Backend:**
```python
from logging.providers import GCPLogProvider
provider = GCPLogProvider(project_id='my-project', fallback_to_console=True)
```

### 3. Remote Provider (Frontend Only)
Sends logs to remote APIs (Datadog, custom endpoints, etc.).

```typescript
import { RemoteLogProvider } from '@/lib/logging';
const provider = new RemoteLogProvider({
    endpoint: 'https://api.datadoghq.com/v1/logs',
    apiKey: 'your-datadog-api-key',
    batchSize: 20,
    batchTimeout: 5000
});
```

## Best Practices

### 1. Use Component-Specific Loggers
```python
# Backend
auth_logger = get_component_logger('auth', service='user-service')
api_logger = get_component_logger('api', version='v1')

# Frontend
const dashboardLogger = await getComponentLogger('dashboard');
const apiLogger = await getComponentLogger('api-client');
```

### 2. Include Structured Context
```python
# Good
logger.info("User action completed", 
    user_id="123", 
    action="profile_update", 
    duration_ms=250
)

# Avoid
logger.info("User 123 updated profile in 250ms")
```

### 3. Use Request Loggers for Tracing
```python
# Backend
request_logger = get_request_logger("req-789", user_id="123", endpoint="/api/users")
request_logger.info("Processing request")
request_logger.info("Database query completed", query_time_ms=45)

# Frontend
const requestLogger = await getRequestLogger("req-789", { user_id: "123" });
requestLogger.info("API call started");
```

### 4. Error Logging with Context
```python
try:
    process_payment(amount, card_id)
except PaymentError as e:
    logger.error("Payment processing failed", 
        exception=e,
        amount=amount,
        card_id=card_id,
        merchant_id=merchant_id
    )
```

## Testing the Migration

### 1. Development Testing
```bash
# Backend
cd backend
python -c "
from logger_new import get_component_logger
logger = get_component_logger('test')
logger.info('Test message', test_field='test_value')
"

# Frontend
npm run dev
# Check browser console for structured logs
```

### 2. Production Testing
1. Deploy to staging environment
2. Verify logs appear in your logging platform
3. Check log structure and content
4. Verify error tracking works correctly

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure new logging modules are in your Python path
2. **Missing Logs**: Check provider initialization and configuration
3. **Performance**: Adjust batch sizes for remote providers
4. **GCP Permissions**: Verify service account has logging permissions

### Debugging
```python
# Enable debug logging to see what's happening
from logging import get_available_providers, detect_environment

print(f"Environment: {detect_environment()}")
print(f"Available providers: {get_available_providers()}")

# Test provider initialization
from logging.providers import GCPLogProvider
provider = GCPLogProvider()
success = provider.initialize({})
print(f"GCP provider initialized: {success}")
```

## Rollback Plan

If you need to rollback:

1. **Backend**: Change imports back to `from logger import`
2. **Frontend**: Revert imports to old logger utilities
3. **Cloud Functions**: Restore original logging setup

The old logging system will continue to work during the migration period.

## Future Providers

The abstraction makes it easy to add new providers:

- **AWS CloudWatch**: For AWS deployments
- **Azure Monitor**: For Azure deployments  
- **Datadog**: Direct integration
- **Sentry**: Error tracking integration
- **Custom APIs**: Your own logging endpoints

Each provider implements the same interface, so switching is just a configuration change.
