from functools import wraps

from cachetools import TTLCache

def cached(maxsize=50, ttl=3600):
    cache = TTLCache(maxsize=maxsize, ttl=ttl)
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            if cache_key in cache:
                return cache[cache_key]

            result = func(*args, **kwargs)
            cache[cache_key] = result
            return result

        return wrapper

    return decorator