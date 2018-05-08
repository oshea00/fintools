import pandas as pd
import pandas_datareader as pdr
import datetime as dt
import psycopg2 as pg
import psycopg2.extras
from plotly.offline import plot, iplot
import plotly.graph_objs as go

def getLast30days(symbol,src = 'yahoo'):
    end = dt.datetime.now()
    start = end - dt.timedelta(days=30)
    df = pdr.DataReader(symbol, src, start, end)
    js = df.to_json()
    return js

def saveData(symbol,jsstr,dburl):
    conn = pg.connect(dburl)
    cur = conn.cursor()
    cur.execute('insert into stockdata (symbol,csvdata) values (%s,%s)',(symbol,jsstr))
    conn.commit()
    cur.close()
    conn.close()

def getSymbolData(symbol,dburl):
    try:
        conn = pg.connect(dburl)
        cur = conn.cursor()
        cur.execute('select * from stockdata where symbol = %s order by created desc limit 1',(symbol,))
        rows = cur.fetchall()
        cur.close()
        conn.close()   
        df = pd.read_json(rows[0][1])
    except:
        return None
    else:
        return df

def getPlot(symbol,df,days,output_type='div'):
    trace = go.Scatter(
        x = df.index,
        y = df['Adj Close'],
        mode = 'lines',
        name = 'Adj Close'
    )
    layout = dict(
        hovermode = 'closest',
        showlegend = True,
        title = str.format('{} Last {} Days',symbol,days),
        yaxis = dict(title = 'Date'),
        xaxis = dict(title = 'Adj Close Price')
    )
    data = [trace]
    fig = dict(data=data, layout=layout)
    div = plot(fig, output_type=output_type,config=dict(displayModeBar=True))
    return div  



