from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, status

_LOCK = Lock()
_BUCKETS: dict[str, deque[float]] = defaultdict(deque)


def enforce_rate_limit(
    scope: str,
    key: str,
    *,
    limit: int,
    window_seconds: int,
) -> None:
    bucket_key = f"{scope}:{key}"
    now = monotonic()

    with _LOCK:
        bucket = _BUCKETS[bucket_key]
        while bucket and now - bucket[0] > window_seconds:
            bucket.popleft()

        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many {scope} requests for this session",
            )

        bucket.append(now)

        if not bucket:
            _BUCKETS.pop(bucket_key, None)
