from flask import Flask, request, render_template, redirect, flash, url_for
import flask_login
import json
import uuid
import psycopg2
import os
from plotly.offline import plot
import plotly.graph_objs as go
import logging
import quandl
import stockdb
import userdb
import emailing
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = "\x8e\xea\x1f\xf8\x10I\x16\xbf\x85|\x8bQ>a\xaam\xff:+\x1d\xf8,(\xdf)ku\xa0\xe9x\xb9@"

login_manager = flask_login.LoginManager()
login_manager.init_app(app)

cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.before_request
def before_request():
    xforwarded_exists = 'X-Forwarded-Proto' in request.headers
    xforwarded_proto = ""
    if xforwarded_exists:
        forwarded_proto = request.headers.get('X-Forwarded-Proto')
    if xforwarded_exists and forwarded_proto == 'http':
        url = request.url.replace('http://', 'https://', 1)
        code = 301
        return redirect(url, code=code)

@login_manager.user_loader
def user_loader(email):
    if not userdb.userExists(DATABASE_URL,email):
        return
    user = userdb.User()
    user.id = email
    return user

# need to check docs for what this is for...
@login_manager.request_loader
def request_loader(request):
    email = request.form.get('email')
    # should replace with a db query
    if not userdb.userExists(DATABASE_URL,email):
        return
    user = userdb.User()
    user.id = email
    user.is_authenticated = userdb.authenticateUser(DATABASE_URL,email,request.form['password'])
    return user

if __name__ !=  "__main__":
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

app.logger.info("Logging...")

DATABASE_URL = os.environ['DATABASE_URL']
IEXTOKEN = os.environ['IEXTOKEN']

try:
    conn = psycopg2.connect(DATABASE_URL)
except:
    app.logger.warn(str.format("I am unable to connect to database url {}",DATABASE_URL))
    exit()

@app.route("/test")
def test():
    confirmationid = str(uuid.uuid4()).replace('-','')
    emailing.sendWelcomeEmail("oshea00@gmail.com")
    return redirect(url_for('get_index'))

@app.route("/",methods=['GET'])
def get_index():
    symbols = stockdb.getSymbols(DATABASE_URL)
    return render_template('index.html',symbols=symbols)

@app.route("/signin",methods=['GET','POST'])
def signin():
    symbols = stockdb.getSymbols(DATABASE_URL)
    if request.method == 'GET':
        return render_template('signin.html',symbols=symbols)  
    email = request.form['email']
    userConfirmed, confirmationid, _ = userdb.userConfirmed(DATABASE_URL,email)
    if not userConfirmed:
        flash('Account unconfirmed. Please check your email for confirmation link.')
        return redirect(url_for('signin'))       
    if userdb.authenticateUser(DATABASE_URL,email,request.form['password']):
        user = userdb.User()
        user.id = email
        flask_login.login_user(user)
        return redirect(url_for('get_index'))
    flash('Bad login')
    return redirect(url_for('signin'))
      
@app.route("/resetlogin",methods=['GET','POST'])
def reset():
    symbols = stockdb.getSymbols(DATABASE_URL)
    if request.method == 'GET':
        return render_template('reset.html',symbols=symbols)  
    userConfirmed, confirmationid, id = userdb.userConfirmed(DATABASE_URL,request.form['email'])
    if userConfirmed:
        resetid = str(uuid.uuid4()).replace('-','')
        userdb.setUserAccountToReset(DATABASE_URL,id,resetid)
        emailing.sendResetEmail(request.form['email'],resetid)
    flash('Reset email on its way!')
    return redirect(url_for('reset'))

@app.route("/resetrequest/<string:resetid>",methods=['GET'])
def reset_request(resetid):
    symbols = stockdb.getSymbols(DATABASE_URL)

    userRequestReset, email = userdb.getResetRequest(DATABASE_URL,resetid)
    if userRequestReset:
        return render_template('changepass.html',resetid=resetid,email=email,symbols=symbols)
    else:
        return redirect(url_for('get_index'))

@app.route("/changepass",methods=['GET','POST'])
def change_password():
    
    if request.form['password'] != request.form['passwordconfirm']:
        flash('Passwords must match')
        return redirect(url_for('reset_request',resetid=request.form['resetid']))
    
    confirmationid = str(uuid.uuid4()).replace('-','')
    userExists = userdb.userExists(DATABASE_URL,request.form['email'])
    if userExists and userdb.resetUser(DATABASE_URL, request.form['password'],confirmationid,request.form['resetid']):
        emailing.sendWelcomeEmail(request.form['email'],confirmationid)
        flash('Email confirmation sent.')
        return redirect(url_for('signin'))

@app.route("/register",methods=['GET','POST'])
def register():
    symbols = stockdb.getSymbols(DATABASE_URL)
    confirmationid = str(uuid.uuid4()).replace('-','')

    if request.method == 'GET':
        return render_template('register.html',symbols=symbols)  
    if request.form['password'] != request.form['passwordconfirm']:
        flash("Passwords don't match")
        return redirect(url_for('register'))
    if userdb.createUser(DATABASE_URL,request.form['email'],request.form['password'],confirmationid):
        emailing.sendWelcomeEmail(request.form['email'],confirmationid)
        flash("Email confirmation on its way!")
        return redirect(url_for('signin'))
    else:
        flash("User email already registered.")
        return redirect(url_for('register'))

@app.route("/confirm/<string:confirmationid>",methods=['GET'])
def confirm(confirmationid):
    isValid, email = userdb.confirmUser(DATABASE_URL,confirmationid)
    if isValid:
        flash('Account confirmed. Please signin.')
        return redirect(url_for('signin'))
    else:
        return redirect(url_for('get_index'))

@app.route('/protected')
@flask_login.login_required
def protected():
    return redirect(url_for('get_index'))

@app.route('/regression')
def regression():
    return render_template('regression.html')

@app.route('/signout')
def signout():
    flask_login.logout_user()
    return redirect(url_for('get_index'))    

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
        div = stockdb.plotTraces(traces,'Returns','Date','Return',800)
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

@app.route('/api/v1/symbols',methods=['GET'])
def symbols():
    return json.dumps(stockdb.getSymbols(DATABASE_URL))

@app.route('/api/v1/iex',methods=['GET'])
def iextoken():
    return IEXTOKEN

@app.route('/api/v1/symbollookup',methods=['GET'])
def symbol_lookup():
    search = request.args.get('search')
    r = stockdb.symbolLookup(DATABASE_URL,search)
    if r:
        return json.dumps(r)
    else:
        return json.dumps([])

@app.route("/portfoliomgr",methods=['GET','POST'])
@flask_login.login_required
def portfoliomgr():
    symbols = stockdb.getSymbols(DATABASE_URL)
    return render_template('portfoliomgr.html',symbols=symbols)

@app.route('/api/v1/saveportfolio',methods=['PUT'])
@flask_login.login_required
def save_portfolio():
    p = ""
    if len(request.data) > 50000:
        return "bad file", 405
    try:
        stockdb.savePortfolio(DATABASE_URL,flask_login.current_user.id,request.json)
    except Exception as ex:
        app.logger.error(ex)
    return "OK"

@app.route('/rebalance',methods=['PUT'])
def rebalance():
    p = ""
    jsondoc = ""
    if len(request.data) > 50000:
        return "bad file", 405
    try:
        jsondoc = stockdb.getrebalance(request.json,app.logger)
    except Exception as ex:
        app.logger.error(ex)
    return jsondoc

@app.route('/api/v1/portfolio',methods=['GET'])
@flask_login.login_required
def load_portfolio():
    dfjson = stockdb.loadPortfolio(DATABASE_URL,flask_login.current_user.id)
    if dfjson:
        return dfjson
    else:
        return "Error", 404

app.logger.info("Started!")

if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=False)

