import pandas as pd
import pandas_datareader as pdr
import datetime as dt
import psycopg2 as pg
import psycopg2.extras
import numpy as np
from plotly.offline import plot, iplot
import plotly.figure_factory as ff
import plotly.graph_objs as go
from scipy.optimize import minimize
import numpy as np

def getLast30days(symbol,src = 'yahoo'):
    end = dt.datetime.now()
    start = end - dt.timedelta(days=30)
    df = pdr.DataReader(symbol, src, start, end)
    js = df.to_json()
    return js

def getLastNdays(symbol,days,src = 'yahoo'):
    end = dt.datetime.now()
    start = end - dt.timedelta(days=days)
    df = pdr.DataReader(symbol, src, start, end)
    js = df.to_json()
    return js

def saveData(symbol,name,jsstr,dburl):
    conn = pg.connect(dburl)
    cur = conn.cursor()
    cur.execute('insert into stockdata (symbol,name,csvdata) values (%s,%s,%s)',(symbol,name,jsstr))
    conn.commit()
    cur.close()
    conn.close()

def getSymbolData(symbol,dburl):
    try:
        conn = pg.connect(dburl)
        cur = conn.cursor()
        cur.execute('select symbol, csvdata from stockdata where symbol = %s order by created desc limit 1',(symbol,))
        rows = cur.fetchall()
        cur.close()
        conn.close()   
        df = pd.read_json(rows[0][1])
    except:
        return None
    else:
        return df

def getSymbols(dburl):
    try:
        conn = pg.connect(dburl)
        cur = conn.cursor()
        cur.execute('select distinct symbol, name from stockdata order by symbol')
        rows = cur.fetchall()
        cur.close()
        conn.close()
        symbols = [(r[0],r[1]) for r in rows]   
    except:
        return None
    else:
        return symbols

def frontierPlot(vol_arr,ret_arr,sharpe_arr,height,width,max_sr_vol,max_sr_ret,output_type='div'):
    trace = go.Scatter(
        x = vol_arr,
        y = ret_arr,
        mode='markers',
        marker=dict(
            size='8',
            color = sharpe_arr, #set color equal to a variable
            colorscale='Portland',
            colorbar = dict(title='Sharpe Ratio'),
            showscale=True
        )
    )

    xsize = vol_arr.max()-vol_arr.min()
    ysize = ret_arr.max()-ret_arr.min()
    markerxradius = 0.015 * xsize 
    markeryradius = 0.015 * ysize * (width/height)

    layout = dict(
        hovermode = 'closest',
        height = height,
        width = width,
        yaxis = dict(title = 'Return', fixedrange = True),
        xaxis = dict(title = 'Risk', fixedrange = True),
        title = 'Efficient Frontier',
        plot_bgcolor = '#E2E3E5',
        shapes = [
            dict(
                type='circle',
                x0=max_sr_vol-(markerxradius),
                x1=max_sr_vol+(markerxradius),
                y0=max_sr_ret-(markeryradius),
                y1=max_sr_ret+(markeryradius),
                xref='x',
                yref='y',
                fillcolor='rgba(255,0,0,1)',
                line=dict(
                    width=3,
                    color='rgba(0,0,0,1)'
                )
            )
        ]
    )

    data = [trace]

    fig = dict(
        data=data, 
        layout=layout)    

    div = plot(fig, output_type=output_type,config=dict(displayModeBar=True,showLink=False))
    return div  

def getPlot(symbol,name,df,output_type='div'):
    labels = ["All Days","Last 30","Last 60","Last 90"]
    vis = [[True,False,False,False],
           [False,True,False,False],
           [False,False,True,False],
           [False,False,False,True]]
    traces = []
    for i,d in enumerate(df):
        traces.append(go.Scatter(
            x = d.index,
            y = d['Adj Close'],
            mode = 'lines',
            name = str.format('Adj Close {}',labels[i]),
            visible = True if i==0 else False
        ))

    buttons = []
    for i,t in enumerate(traces):
        buttons.append(
            dict(label = t.name,
                 method = 'update',
                 args = [{'visible': vis[i]}])
        )
        
    updatemenus = list([
        dict(active=0,
             buttons=buttons,
             x=0.23,
             y=1.2
        )
    ])

    layout = dict(
        hovermode = 'closest',
        showlegend = False,
        width = 800,
        title = str.format('{} Price',name),
        yaxis = dict(title = 'Adj Close Price', fixedrange = True),
        xaxis = dict(title = 'Date', fixedrange = True),
        plot_bgcolor = '#E2E3E5',
        updatemenus=updatemenus
    )
    
    data = traces
    fig = dict(data=data, layout=layout)
    div = plot(fig, output_type=output_type,config=dict(displayModeBar=True,showLink=False))
    return div  

def normPortfolio(symbols,dburl):
    dfs = []
    for s in symbols:
        dfs.append(getSymbolData(s,dburl)['Adj Close'])
    df = pd.concat(dfs,axis=1)
    df.columns = symbols
    df = df.dropna()
    df = np.log(df/df.iloc[0])
    return df

def createTraces(df):
    traces = []
    for c in df:
        traces.append(go.Scatter(
            x = df.index,
            y = df[c],
            mode = 'lines',
            name = c,
            visible = True
        ))
    return traces

def plotTraces(traces,title,xaxis_label,yaxis_label,width,output_type='div'):
    layout = dict(
        hovermode = 'closest',
        showlegend = True,
        width = width,
        title = title,
        yaxis = dict(title = yaxis_label, fixedrange=True),
        xaxis = dict(title = xaxis_label, fixedrange=True),
        plot_bgcolor = '#E2E3E5'
    )
    data = traces
    fig = dict(data=data, layout=layout)
    div = plot(fig, output_type=output_type,config=dict(displayModeBar=True,showLink=False))
    return div  

def update_prices(symbol,name,url):
    js = getLastNdays(symbol,90)
    if js != None:
        saveData(symbol,name,js,url)

def get_ret_vol_sr(weights,stocks):
    """
    Takes in weights, returns array of return, volatility, sharpe ratio.
    assumes data is daily - conversion 252
    """
    log_ret = np.log(stocks/stocks.shift(1))
    weights = np.array(weights)
    ret = np.sum(log_ret.mean() * weights) * 252
    vol = np.sqrt(np.dot(weights.T, np.dot(log_ret.cov() * 252, weights)))
    shrp = ret/vol
    return np.array([ret,vol,shrp])

def neg_sharpe(weights,stocks):
    ''' Given some weights we calculate the sharp ratio. Since this is a minimization problem. we express
        the negative result
    '''
    return  get_ret_vol_sr(weights,stocks)[2] * -1

# Contraints - on the the input weights
def check_sum(weights):
    '''
    Returns 0 (ok) if sum of weights is 1.0
    '''
    return np.sum(weights) - 1

def getPortfolioPrices(symbols,dburl):
    dfs = []
    for s in symbols:
        dfs.append(getSymbolData(s,dburl)['Adj Close'])
    df = pd.concat(dfs,axis=1)
    df.columns = symbols
    df = df.dropna()
    return df

def normPortfolio(symbols,dburl):
    df = getPortfolioPrices(symbols,dburl)
    df = df/df.shift(1)
    return df.iloc[1:]

def monteCarloPortfolios(stocks,num_ports):
    all_weights = np.zeros((num_ports,len(stocks.columns)))
    ret_arr = np.zeros(num_ports)
    vol_arr = np.zeros(num_ports)
    sharpe_arr = np.zeros(num_ports)
    log_ret = np.log(stocks/stocks.shift(1))

    for ind in range(num_ports):

        # Create Random Weights
        weights = np.array(np.random.random(len(stocks.columns)))

        # Rebalance Weights
        weights = weights / np.sum(weights)

        # Save Weights
        all_weights[ind,:] = weights

        # Expected Return
        ret_arr[ind] = np.sum((log_ret.mean() * weights) *252)

        # Expected Variance
        vol_arr[ind] = np.sqrt(np.dot(weights.T, np.dot(log_ret.cov() * 252, weights)))

        # Sharpe Ratio
        sharpe_arr[ind] = ret_arr[ind]/vol_arr[ind]
        
    maxidx = sharpe_arr.argmax()
    max_sr_ret = ret_arr[maxidx]
    max_sr_vol = vol_arr[maxidx]
    
    return (vol_arr,ret_arr,sharpe_arr,max_sr_vol,max_sr_ret)

def getOptimalAllocation(stocks):
    cons = ({'type':'eq','fun': check_sum})
    bounds = [(0,1)]*len(stocks.columns)
    init_guess = np.array(([1.0]*len(stocks.columns)))/len(stocks.columns)
    opt_results = minimize(neg_sharpe,init_guess,args=(stocks,),method='SLSQP',bounds=bounds,constraints=cons)
    optimal_allocation = [a for a in zip(stocks.columns,np.round(opt_results.x*100,decimals=2))]
    return optimal_allocation

def plotScatter(df, height, width):
    fig = ff.create_scatterplotmatrix(df.pct_change(1), diag='histogram', height=height, width=width)
    # customize xaxisn and yaxisn  
    for k in fig['layout']:
        if k.startswith('xaxis') or k.startswith('yaxis'):
            fig['layout'][k].update(fixedrange=True)
            #logger.warn(fig['layout'][k])
    div = plot(fig, output_type='div',config=dict(displayModeBar=True,showLink=False))
    return div

