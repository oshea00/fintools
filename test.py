import os
from rq import Queue
from worker import conn
from stockdb import getLast30days
import logging

log = logging.getLogger()
log.setLevel(logging.INFO)

log.info("Logging...")

q = Queue(connection=conn)

result = q.enqueue(getLast30days,'GOOG')

log.info(result)


