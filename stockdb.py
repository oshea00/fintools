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

def getLastNdays(symbol,days,src = 'yahoo'):
    end = dt.datetime.now()
    start = end - dt.timedelta(days=days)
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

def getPlot(symbol,df,output_type='div'):
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
             x=0.1,
             y=1.2
        )
    ])

    layout = dict(
        hovermode = 'closest',
        showlegend = False,
        title = str.format('{} Price',symbol),
        yaxis = dict(title = 'Adj Close Price'),
        xaxis = dict(title = 'Date'),
        plot_bgcolor = '#E2E3E5',
        updatemenus=updatemenus
    )
    
    data = traces
    fig = dict(data=data, layout=layout)
    div = plot(fig, output_type=output_type,config=dict(displayModeBar=True,showLink=False))
    return div  

def update_prices(symbol,url):
    js = getLastNdays(symbol,90)
    if jsstr != None:
        saveData(symbol,jsstr,url)

