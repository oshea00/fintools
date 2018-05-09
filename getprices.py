import os
import time
from rq import Queue
from worker import conn
from stockdb import update_prices

dburl = os.getenv('DATABASE_URL')

q = Queue(connection=conn)

q.enqueue(update_prices,'GOOG',dburl)
time.sleep(5)
q.enqueue(update_prices,'AAPL',dburl)
time.sleep(5)
q.enqueue(update_prices,'FB',dburl)


