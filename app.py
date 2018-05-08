from flask import Flask, request, render_template
import json
import uuid
import psycopg2
import os
from plotly.offline import plot
import plotly.graph_objs as go
import logging
import quandl
import stockdb

app = Flask(__name__)

if __name__ !=  "__main__":
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

app.logger.info("Logging...")

DATABASE_URL = os.environ['DATABASE_URL']

try:
    conn = psycopg2.connect(DATABASE_URL)
except:
    app.logger.warn(str.format("I am unable to connect to database url {}",DATABASE_URL))
    exit()

@app.route("/",methods=['GET'])
def get_index():
    return render_template('index.html')

@app.route("/stockchart/<string:ticker>",methods=['GET'])
def stock_chart(ticker):
    title = "Stock Chart"
    symbol = ticker.upper()
    df = stockdb.getSymbolData(symbol,DATABASE_URL)
    if df is None:
        app.logger.warn(str.format("{} not found. Attempting to retrieve...",symbol))
        js = stockdb.getLast30days(symbol)
        if js != None:
            app.logger.info(str.format("{} retrieved.",symbol))
            stockdb.saveData(symbol,js,DATABASE_URL)
            df = stockdb.getSymbolData(symbol,DATABASE_URL)
        else:
            app.logger.warn(str.format("{} could not be retrieved.",symbol))
            
    if df is not None:
        div = stockdb.getPlot(symbol,df)
        return render_template('stock.html',title=title,chart=div,annotiation='Source: Yahoo Finance')
    else:
        return render_template('stock.html',
            title=title,
            chart=str.format('No Data For Ticker {}',symbol),
            annotiation='Source: Yahoo Finance')

app.logger.info("Started!")

if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True)

