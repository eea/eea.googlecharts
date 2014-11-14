""" Caching module
"""
try:
    from eea.cache import event
    from eea.cache import cache as eeacache
    # pyflakes
    flush = event.flushEverything
    flushRelatedItems = event.flushRelatedItems
    flushBackRefs = event.flushBackRefs
    ramcache = eeacache
    InvalidateCacheEvent = event.InvalidateEverythingEvent
except ImportError:
    # Fail quiet if required cache packages are not installed in order to use
    # this package without caching
    from eea.googlecharts.cache.nocache import ramcache
    from eea.googlecharts.cache.nocache import flush
    from eea.googlecharts.cache.nocache import flushBackRefs, flushRelatedItems
    from eea.googlecharts.cache.nocache import InvalidateCacheEvent

from eea.googlecharts.cache.cache import cacheKey

__all__ = [
    ramcache.__name__,
    cacheKey.__name__,
    flush.__name__,
    flushBackRefs.__name__,
    flushRelatedItems.__name__,
    InvalidateCacheEvent.__name__,
]
