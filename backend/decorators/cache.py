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

        wrapper.invalidate = lambda *args, **kwargs: cache.pop((args, frozenset(kwargs.items())), None)
        wrapper.clear = cache.clear

        return wrapper

    return decorator