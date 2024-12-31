from functools import wraps

from cachetools import TTLCache

def dynamic_cached(maxsize: int, ttl: int):
    def decorator(func):
        cache = TTLCache(maxsize=maxsize, ttl=ttl)

        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = (args, frozenset(kwargs.items()))
            if key in cache:
                return cache[key]
            result = await func(*args, **kwargs)
            cache[key] = result
            return result

        return wrapper

    return decorator