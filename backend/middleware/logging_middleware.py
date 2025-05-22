import time
import traceback

from fastapi import Request
from logger import logger
from starlette.middleware.base import BaseHTTPMiddleware


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = f"{time.time()}-{request.client.host if request.client else 'unknown'}"

        logger.info_with_context(
            f"Request started: {request.method} {request.url.path}",
            {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_host": request.client.host if request.client else "unknown",
                "headers": dict(request.headers),
            },
        )

        start_time = time.time()

        try:
            response = await call_next(request)

            process_time = time.time() - start_time

            logger.info_with_context(
                f"Request completed: {request.method} {request.url.path}",
                {
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "processing_time_ms": round(process_time * 1000, 2),
                    "response_headers": dict(response.headers),
                },
            )

            return response
        except Exception as exc:
            process_time = time.time() - start_time
            logger.exception_with_context(
                f"Request failed: {request.method} {request.url.path}",
                {
                    "request_id": request_id,
                    "processing_time_ms": round(process_time * 1000, 2),
                    "error_type": type(exc).__name__,
                    "error_message": str(exc),
                    "traceback": traceback.format_exc(),
                },
            )
            raise
