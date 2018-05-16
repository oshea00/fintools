from flask import Flask, request, render_template, redirect, flash, url_for
#import flask_login
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
app.secret_key = "\x8e\xea\x1f\xf8\x10I\x16\xbf\x85|\x8bQ>a\xaam\xff:+\x1d\xf8,(\xdf)ku\xa0\xe9x\xb9@"

# users = {'foo@bar.tld': {'password': 'secret'}}

# class User(flask_login.UserMixin):
#     pass

# login_manager = flask_login.LoginManager()
# login_manager.init_app(app)

# @login_manager.user_loader
# def user_loader(email):
#     if email not in users:
#         return
#     user = User()
#     user.id = email
#     return user

# @login_manager.request_loader
# def request_loader(request):
#     email = request.form.get('email')
#     # should replace with a db query
#     if email not in users:
#         return
#     user = User()
#     user.id = email
#     # DO NOT ever store passwords in plaintext and always compare password
#     # hashes using constant-time comparison!
#     user.is_authenticated = request.form['password'] == users[email]['password']
#     return user

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

@app.route("/signin")
def signin():
    symbols = stockdb.getSymbols(DATABASE_URL)
    if flask.request.method == 'GET':
        return render_template('signin.html',symbols=symbols)  
    # email = flask.request.form['email']
    # # replace password check by unencrypting password from user record
    # if flask.request.form['password'] == users[email]['password']:
    #     user = User()
    #     user.id = email
    #     flask_login.login_user(user)
    #     return flask.redirect(flask.url_for('protected'))

    flash('Bad login')
    return redirect(url_for('signin'))
      
@app.route('/protected')
#@flask_login.login_required
def protected():
    return 'Logged in as: ' + flask_login.current_user.id

@app.route('/signout')
def logout():
    flask_login.logout_user()
    return 'Logged out'      

@app.route("/corr",methods=['GET'])
def get_correlation():
    symbols = stockdb.getSymbols(DATABASE_URL)
    return render_template('corr.html',
        symbols=symbols,
        title='Asset Correlation')

@app.route("/corr",methods=['POST'])
def plot_correlation():
    if 'ticker' not in request.form:
        flash('No Assets Chosen')
        return redirect(url_for('get_correlation'))
    tickers = request.form.getlist('ticker')
    if len(tickers)<2:
        flash('Choose at least two stocks.')
        return redirect(url_for('get_correlation'))
    symbols = stockdb.getSymbols(DATABASE_URL)
    if len(tickers) > 0:
        df = stockdb.getPortfolioPrices(tickers,DATABASE_URL)
        scatter = stockdb.plotScatter(df,800,800)
        return render_template('corr.html',
            symbols=symbols,
            title='Asset Correlation',
            scatter=scatter,
            annotation='Source: Future Trends Consulting')

@app.route("/portfolio",methods=['GET'])
def get_portfolio():
    symbols = stockdb.getSymbols(DATABASE_URL)
    return render_template('portfolio.html',
        symbols=symbols,
        title='Portfolio Analysis')

@app.route("/plotportfolio",methods=['POST'])
def plot_portfolio():
    if 'ticker' not in request.form:
        flash('No Portfolio Chosen')
        return redirect(url_for('get_portfolio'))
    tickers = request.form.getlist('ticker')
    symbols = stockdb.getSymbols(DATABASE_URL)
    if len(tickers) > 0:
        df = stockdb.getPortfolioPrices(tickers,DATABASE_URL)
        traces = stockdb.createTraces(df/df.iloc[0])
        div = stockdb.plotTraces(traces,'Returns','Date','Return')
        vol_arr, ret_arr, sharpe_arr, max_sr_vol, max_sr_ret = stockdb.monteCarloPortfolios(df,1000)
        divfr = stockdb.frontierPlot(vol_arr,ret_arr,sharpe_arr,500,800,max_sr_vol,max_sr_ret)
        allocations = stockdb.getOptimalAllocation(df)
        return render_template('portfolio.html',
            symbols=symbols,
            title='Portfolio Analysis',
            chart=div,
            frontier=divfr,
            allocations=[a for a in allocations if a[1] > 0],
            annotation='Source: Future Trends Consulting')

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
        return render_template('stock.html',title=title,chart=div,symbols=symbols,annotation='Source: Yahoo Finance')
    else:
        return render_template('stock.html',
            title=title,
            chart=str.format('No Data For Ticker {}',symbol),
            annotiation='Source: Yahoo Finance')

app.logger.info("Started!")

if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=False)

