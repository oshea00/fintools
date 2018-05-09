from rq import Queue
from worker import conn
from stockdb import getLast30days

q = Queue(connection=conn)

result = q.enqueue(getLast30days('GOOG', 'http://heroku.com'))

print(result)

