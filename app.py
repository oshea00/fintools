from flask import Flask, request, render_template
import json
import uuid
import psycopg2
import os
from plotly.offline import plot
import plotly.graph_objs as go
import logging
import quandl

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
    return render_template('stock.html',title='Google',chart=ticker)

@app.route('/charting',methods=['PUT'])
def store_chart():
    d = ""
    if len(request.data) > 50000:
        return "bad file", 405
    try:
        d = json.loads(request.data)
    except:
        app.logger.warn(request.data)
    if 'ChartName' not in d:
        app.logger.info('missing attribute')
        return "bad file", 405
    else:
        chartId = str(uuid.uuid4()).replace('-','')
        # Create a trace
        if d['ChartType']=='Scatter':
            trace = go.Scatter(
                x = d['X'],
                y = d['Y'],
                mode = 'markers'
            )
        elif d['ChartType']=='Line':
            trace = go.Scatter(
                x = d['X'],
                y = d['Y'],
                mode = 'lines+markers'
            )
        elif d['ChartType']=='Spline':
            trace = go.Scatter(
                x = d['X'],
                y = d['Y'],
                mode = 'lines',
                line=dict(shape="spline")
            )
        elif d['ChartType']=='Bar':
            trace = go.Bar(
                x=d['X'],
                y=d['Y'])
        else:
            trace = go.Scatter(
                x = d['X'],
                y = d['Y'],
                mode = 'markers'
            )
            
        layout = dict(
              hovermode = 'closest',
              showlegend = d['ShowLegend'],
              title = d['ChartName'],
              yaxis = dict(title = d['XLabel']),
              xaxis = dict(title = d['YLabel'])
             )
        data = [trace]
        fig = dict(data=data, layout=layout)
        div = plot(fig, output_type='div',config=dict(displayModeBar=True))
        output_from_parsed_template = render_template('chart.html', chart=div, annotation=d['Annotation'], title=d['ChartName'])
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute('INSERT INTO charts (id,chart) VALUES (%s, %s)',(chartId,output_from_parsed_template))
        conn.commit()
        cur.close()
        conn.close()
        return chartId

app.logger.info("Started!")

if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True)

