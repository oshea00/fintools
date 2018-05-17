import os
import time
from rq import Queue
from worker import conn
from stockdb import update_prices

dburl = os.getenv('DATABASE_URL')

q = Queue(connection=conn)

q.enqueue(update_prices,'GOOG','Google',dburl)
time.sleep(30)
q.enqueue(update_prices,'PG','Proctor & Gamble',dburl)
time.sleep(30)
q.enqueue(update_prices,'GE','General Electric',dburl)
time.sleep(30)
q.enqueue(update_prices,'CSCO','Cisco',dburl)
time.sleep(30)
q.enqueue(update_prices,'AMZN','Amazon',dburl)
time.sleep(30)
q.enqueue(update_prices,'CAT','Caterpillar',dburl)
time.sleep(30)
q.enqueue(update_prices,'FB','Facebook',dburl)
time.sleep(30)
q.enqueue(update_prices,'AAPL','Apple',dburl)


