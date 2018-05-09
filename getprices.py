import os
from rq import Queue
from worker import conn
from stockdb import update_prices

dburl = os.getenv('DATABASE_URL')

q = Queue(connection=conn)

q.enqueue(update_prices,'GOOG',dburl)
q.enqueue(update_prices,'AAPL',dburl)
q.enqueue(update_prices,'FB',dburl)


