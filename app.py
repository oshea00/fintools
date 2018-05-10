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
    symbols = stockdb.getSymbols(DATABASE_URL)
    return render_template('index.html',symbols=symbols)

@app.route("/portfolio",methods=['GET'])
def get_portfolio():
    symbols = stockdb.getSymbols(DATABASE_URL)
    return render_template('portfolio.html',
        symbols=symbols,
        title='Portfolio Analysis')

@app.route("/plotportfolio",methods=['POST'])
def plot_portfolio():
    if 'ticker' not in request.form:
        return 'No Portfolio Chosen', 405
    tickers = request.form.getlist('ticker')
    symbols = stockdb.getSymbols(DATABASE_URL)
    if len(tickers) > 0:
        df = stockdb.normPortfolio(tickers,DATABASE_URL)
        traces = stockdb.createTraces(df)
        div = stockdb.plotTraces(traces,'Returns','Data','Return')
        return render_template('portfolio.html',
            symbols=symbols,
            title='Portfolio Analysis',
            chart=div,
            annotation='Source: Future Trends Consulting')
    else:
        return render_template('portfolio.html',
            symbols=[],
            title='Portfolio Analysis',
            chart="No Data",
            annotation='Source: Future Trends Consulting')

@app.route("/symdata",methods=['PUT'])
def sym_data():
    if request.content_length < 50000:
        r=""
        try:
            r = json.loads(request.data)
            if 'symbol' in r:
                symbol = r['symbol']
                js = r['js']
                stockdb.saveData(symbol,js,DATABASE_URL)
                msg = str.format("added {}",symbol)
                app.logger.info(msg)
                return msg, 200
            else:
                return "bad file", 413
        except Exception as ex:
            app.logger.warn(ex)
    else:
        return "bad file", 413

@app.route("/stockchart/<string:ticker>",methods=['GET'])
def stock_chart(ticker):
    title = "Stock Chart"
    symbol = ticker.upper()
    chartname = ticker
    symbols = stockdb.getSymbols(DATABASE_URL)
    name = [n for s,n in symbols if s == symbol]
    if (len(name)>0):
        chartname = name[0]
    df = stockdb.getSymbolData(symbol,DATABASE_URL)
    if df is not None:
        df20 = df.iloc[-20:]
        df40 = df.iloc[-40:]
        df60 = df.iloc[-60:]
        div = stockdb.getPlot(symbol,chartname,[df,df20,df40,df60])
        return render_template('stock.html',title=title,chart=div,annotation='Source: Yahoo Finance')
    else:
        return render_template('stock.html',
            title=title,
            chart=str.format('No Data For Ticker {}',symbol),
            annotiation='Source: Yahoo Finance')

app.logger.info("Started!")

if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=False)

