var fintools = (function() {
    'use strict';

    class StockList extends React.Component {
        constructor(props) {
            super(props);
            this.handleClick = this.handleClick.bind(this);
        }

        handleClick(event) {
            const ticker = event.target.value;
            axios.get(`https://api.iextrading.com/1.0/stock/${ticker}/price`)
            .then(res => {
                this.props.addAsset({'ticker': ticker, price: res.data});
            })
            .catch(error=> {
            });                        
        }

        render() {
            const symbols = this.props.charts;
            if (symbols.length==0)
                return null;
            return (
                e('table',{className:'assetList table-striped'},
                    e('thead',null,
                    e('tr',null,
                        e('th',null,''),
                        e('th',null,'Ticker'),
                        e('th',null,'30 Day'),
                        e('th',null,'Company')
                    )),
                    e('tbody',null,
                    symbols.map(
                        (s) => {
                            return (
                                e('tr',null,
                                    e('td',null,e('button',{type:'button',className:'btn btn-link oi oi-plus',value:s.ticker,
                                        onClick: this.handleClick.bind(this)})),
                                        e('td',null,s.ticker),
                                        e('td',null,
                                            e('span',{className:'sparklines',values:getChartValues(s.chart,'close')}),
                                        ),
                                        e('td',null,s.name)
                                ));
                        }
                    ))      
                )
            );
        }
    }

    function getChartValues(chart,item) {
        if (chart == undefined)
            return null;
        
        if (typeof(chart) == 'string') {
            chart = eval(chart);
        }

        if (chart.length === 0)
            return null;

        var vals = chart.map(r=>{
            return r[item];
        })
        var valStr = vals.reduce((p,c)=>{
            return p+','+c;
        })
        return valStr;
    }

    class PortfolioView extends React.Component {
        constructor(props) {
            super(props);
            this.handleClick = this.handleClick.bind(this);
        }

        handleClick(event) {
            this.props.removeAsset(event.target.value);
        }

        totalBalance() {
            var bal=0;
            this.props.assets.forEach(a=>{
                var price = parseFloat(a.lastPrice);
                var shares = parseFloat(a.shares);
                bal = bal + (price * shares);
            });
            return bal.toFixed(2);
        }

        totalWeights() {
            var bal=0;
            this.props.assets.forEach(a=>{
                bal = bal + parseFloat(a.weight);
            });

            return (bal).toFixed(1)+'%';
        }

        weightedBalance(ticker) {
            var bal=0;
            var tickerTotal=0;
            this.props.assets.forEach(a=>{
                var price = parseFloat(a.lastPrice);
                var shares = parseFloat(a.shares);
                if (a.ticker === ticker){
                    tickerTotal = price * shares;
                }
                bal = bal + (price * shares);
            });

            return ((tickerTotal/bal)*100).toFixed(1)+'%';
        }

        render() {
            const assets = this.props.assets;
            return (
                (assets.length > 0) ?
                e('div',null,
                e('table',{className:'portfolioTable table-striped'},
                    e('thead',null,
                    e('tr',null,
                        e('th',null,''),
                        e('th',null,'Symbol'),
                        e('th',null,'30 Days'),
                        e('th',null,'Type'),
                        e('th',null,'Sector'),
                        e('th',null,'Price'),
                        e('th',null,'Shares'),
                        (this.props.showWeights) ?
                        e('th',null,'Target') : null,
                        e('th',null,'Weight'),
                    )),
                    e('tbody',null,
                    assets.map(
                        (asset) => {
                            return (
                                e('tr',null,
                                e('td',null,e('button',{type:'button', value: asset.ticker, className:'btn btn-link oi oi-x',
                                   onClick: this.handleClick.bind(this)})),
                                e('td',null,
                                    e('button',{type:'button',
                                        className:'btn btn-link',
                                        'data-toggle':'modal',
                                        'data-target':'#companyinfo'+asset.ticker},asset.ticker)),
                                e('td',null,
                                    e('span',{className:'sparklines',values:getChartValues(asset.chart,'close')}),
                                ),
                                e('td',null,asset.issueType),
                                e('td',null,asset.sector),
                                e('td',null,parseFloat(asset.lastPrice).toFixed(2)),
                                e('td',null,
                                e(EditText,{value:asset.shares, width:65, align:'right', id:asset.ticker, field:'shares', onUpdate: this.props.onUpdate })),
                                (this.props.showWeights) ?
                                e('td',null,
                                e(EditText,{value:asset.weight, width:65, align:'right', id:asset.ticker, field:'weight', onUpdate: this.props.onUpdate })) : null,
                                e('td',null,this.weightedBalance(asset.ticker))
                            ));
                        }
                    ),
                    (this.props.showWeights) ?
                    e('tr',{style:{'background-color':'#d2dbe2'}},
                            e('td',{colspan:1},'Balance:'),
                            e('td',{colspan:6,
                                },e(AnnounceStrobe,{value:this.totalBalance()})),
                            e('td',{colspan:2},this.totalWeights())
                        ) 
                        : 
                    e('tr',{style:{'background-color':'#d2dbe2'}},
                            e('td',{colspan:1},'Balance:'),
                            e('td',{colspan:7,
                                },e(AnnounceStrobe,{value:this.totalBalance()}))
                        )
                )),
                assets.map((asset)=>{
                    return (
                        e('div',{className:'modal fade', id:'companyinfo'+asset.ticker,tabindex:-1},
                            e('div',{className:'modal-dialog modal-dialog-centered'},
                                e('div',{className:'modal-content'},
                                    e('div',{className:'modal-header'},
                                        e('h5',{className:'modal-title'},asset.companyName),
                                        e('button',{type:'button',className:'close','data-dismiss':'modal'},'\u00d7')),
                                    e('div',{className:'modal-body'},
                                        e('div',{className:'assetCEO'},'CEO: '+asset.ceo),
                                        e('div',null,'Exchange: '+asset.exchange),
                                        e('div',null,'Industry: '+asset.industry),
                                        e('div',null,
                                            e('span',null,'Homepage: ',e('a',{className:'assetUrl',target:'_blank',href:asset.website},asset.website))
                                        ),
                                        e('div',{className:'assetDescription'},asset.description),

                                    ),
                                    e('div',{className:'modal-footer'},
                                        e('button',{className:'btn btn-secondary','data-dismiss':'modal'},'Close')
                                    )
                                )
                            )
                        )
                    );
                }),
            ) : null)
        }
    }

    class StockPicker extends React.Component {
        constructor(props) {
            super(props);
            this.state = { symbols: [], charts: [], search: ''};
            this.handleClick = this.handleClick.bind(this);        
            this.handleChange = this.handleChange.bind(this);        
            this.handleOnFocus = this.handleOnFocus.bind(this);
        }

        handleClick(event) {
            const srch = this.state.search;
            axios.get(this.props.url,{ params: { search: srch} })
            .then(res => {
                this.setState({ symbols: res.data});
                res.data.map(r=>{
                    var ticker = r[0];
                    var companyName = r[1];
                    axios.get(`https://api.iextrading.com/1.0/stock/${ticker}/chart`)
                    .then(res=>{
                        var newChart = [{
                            'ticker': ticker,
                            name: companyName,
                            chartDate: Date.today().toString("yyyy-MM-dd"),
                            chart: res.data
                        }];
                        this.setState((prevState,props)=>({
                            charts: prevState.charts.concat(newChart)
                        }));
                    });
                });    
            })
            .catch(error=> {
            });                        
        }

        componentDidUpdate() {
            $('.sparklines').sparkline('html', { enableTagOptions: true });
        }

        handleChange(event) {
            this.setState({search: event.target.value});
        }

        handleOnFocus(event) {
            this.setState({search: ''});
            this.setState({charts: []})
            this.setState({symbols: []})
        }

        render() {
            return (
                e('div',null,
                e('h4',null,'Stock Picker'),
                e('form',{className:'form-inline'},
                    e('input',{type:'text', className: 'form-control', placeholder:'Name or Ticker',
                        value: this.state.search, 
                        onChange: this.handleChange.bind(this),
                        onFocus: this.handleOnFocus.bind(this)
                    }),
                    e('button',{type: 'button', className: "btn btn-primary", 
                        onClick: this.handleClick.bind(this)},'Lookup')
                ),
                (this.state.symbols.length > 10) ? 
                    e('span',null,'Limited to 20 results. You may want to narrow search.') : null,
                (this.state.symbols.length > 0) ? 
                    e(StockList,{symbols:this.state.symbols,charts: this.state.charts, addAsset: this.props.addAsset }) : null
            ));
        }
    }

    class PortfolioManager extends React.Component {
        constructor(props) {
            super(props);
            this.repriceDelay = this.props.repriceDelay || 10000;
            this.state = { assets: [], message: "" };
            this.addAsset = this.addAsset.bind(this);
            this.removeAsset = this.removeAsset.bind(this);
            this.saveAssets = this.saveAssets.bind(this);
            this.onUpdate = this.onUpdate.bind(this);
            this.rebalancePortfolio = this.rebalancePortfolio.bind(this);
        }

        reprice() {
            var promises = [];
            var currAssets =[];
            this.state.assets.forEach((a)=>{ currAssets.push(Object.assign({},a))});

            currAssets.forEach((a)=>{
                if (utils.isMarketOpen())
                {
                    promises.push(axios.get(`https://api.iextrading.com/1.0/stock/${a.ticker}/quote`));
                }
                if (a.chartDate==undefined || !Date.parse(a.chartDate).equals(Date.today())) {
                    promises.push(axios.get(`https://api.iextrading.com/1.0/stock/${a.ticker}/chart`));
                }
            });

            axios.all(promises)
                .then(results=>{
                    results.forEach((r,i)=>{
                        var respUrl = r.request.responseURL;
                        var ticker = "";
                        var assetfor = "";
                        if (respUrl.lastIndexOf("/quote")>0) {
                            ticker = respUrl.replace("https://api.iextrading.com/1.0/stock/","")
                            .replace("/quote",'');
                            assetfor = currAssets.filter(a=>a.ticker===ticker);
                            if (assetfor.length>0) {
                                assetfor[0].lastPrice = r.data.latestPrice;
                            }
                        } else {
                            ticker = respUrl.replace("https://api.iextrading.com/1.0/stock/","")
                            .replace("/chart",'');
                            assetfor = currAssets.filter(a=>a.ticker===ticker);
                            if (assetfor.length>0) {
                                assetfor[0].chartDate = Date.today().toString("yyyy-MM-dd");
                                assetfor[0].chart = r.data;
                            }
                        }
                    });    
                    this.setState({ assets: currAssets, message: '' });            
                })
        }

        addAsset (event) {
            // prevent duplicates being added
            if (this.state.assets.filter(a=>{return a.ticker == event.ticker}).length>0)
                return;

            // lookup info about ticker and add it - this.props.url
            axios.get(`https://api.iextrading.com/1.0/stock/${event.ticker}/company`)
                .then(res => {
                    var asset = res.data;
                    var ticker = event.ticker;
                    var price = event.price;
                    axios.get(`https://api.iextrading.com/1.0/stock/${ticker}/chart`)
                    .then(res=>{
                        var newasset = [
                            {
                                companyName: asset.companyName,
                                ceo: asset.CEO,
                                issueType: asset.issueType,
                                sector: asset.sector,
                                industry: asset.industry,
                                weight: '0.0%',
                                ticker: ticker,
                                lastPrice: price,
                                shares: '1',
                                exchange: asset.exchange,
                                description: asset.description,
                                website: asset.website,
                                chartDate: Date.today().toString("yyyy-MM-dd"),
                                chart: res.data
                            }
                        ]
                        this.setState((prevState,props)=> ({
                            assets: prevState.assets.concat(newasset)
                        }));
                    });
                })
                .catch(error=>{

                });
        }

        componentDidMount() {
            if (this.props.saveLocal === false) {
                axios.get(this.props.urlLoad)
                .then((res)=>{
                    this.setState({ assets: res.data });
                })
            } else {
                // load from localStorage
                var watchlist = localStorage.getItem('watchList');
                if (watchlist == null) {
                    if (this.props.watchlist != undefined)
                        watchlist = this.props.watchlist; 
                    else
                        watchlist = [];
                }
                else {
                    watchlist = JSON.parse(watchlist);
                }
                this.setState({ assets: watchlist });
            }
            if (this.props.reprice) {
                this.timerID = setInterval(()=>this.reprice(),this.repriceDelay);          
            }
        }

        componentWillUnmount() {
            clearInterval(this.timerID);
        }

        componentDidUpdate() {
            $('.sparklines').sparkline('html', { enableTagOptions: true });
        }

        onUpdate(ticker,value,field) {
            var currAssets = [];
            this.state.assets.forEach((a)=>{ currAssets.push(Object.assign({},a))});
            var w = parseFloat(value);
            currAssets.forEach(a=>{
                if (a.ticker === ticker)
                {
                    if (field==='weight') {
                        if (!isNaN(w)) {
                            a.weight = w.toFixed(1)+'%';
                        }
                    }
                    if (field==='shares') {
                        if (!isNaN(w)) {
                            a.shares = w.toFixed(0);
                        }
                    }
                }
            });
            this.setState({assets:currAssets});            
        }

        saveAssets() {
            if (this.props.saveLocal === false) {
                axios.put(this.props.urlSave,this.state.assets)
                .catch((error)=>{
                    console.log(error);
                });
            } else {
                // save to localStorage
                localStorage.setItem('watchList',JSON.stringify(this.state.assets));
            }
        }

        removeAsset(ticker) {
            // updates asset array - at some point we'll update db on another user control input
            this.setState((prevState,props)=> ({
                assets: prevState.assets.filter((a)=>{ return a.ticker != ticker })
            }));
        }

        rebalancePortfolio() {
            this.setState({ message: ""});
            var assets = this.state.assets;
            var minbal = assets.map(a=>a.lastPrice*a.shares).reduce((p,c)=>p+c);
            var totaltarget = assets.map(a=>parseFloat(a.weight)/100.0).reduce((p,c)=>p+c);
            if (isNaN(totaltarget)) {
                this.setState({message: 'Fill-in Target weights - must total 100%'});
                return;
            } else 
            if (Math.abs(totaltarget - 1.0)>Number.EPSILON) {
                this.setState({message: 'Target weights must total 100%'});
                return;
            }
            var reqdata = {
                minbal: minbal,
                maxbal: minbal,
                tol: 0.01,
                ax: assets.map(a=>parseFloat(a.weight)/100.0),
                px: assets.map(a=>a.lastPrice)
            }
            axios.put(this.props.urlRebalance,reqdata)
                .then(res=>{
                    var currAssets = [];
                    this.state.assets.forEach((a)=>{currAssets.push(Object.assign({},a))});
                    var positions = res.data.positions;
                    var result = res.data.result;
                    var message = res.data.message;
                    currAssets.forEach((a,i)=>a.shares = positions[i]);
                    this.setState({assets:currAssets});
                });
        }

        render() {
            return (
                e('div',{className:'portfolio'},
                e(StockPicker,{url:this.props.url, addAsset: this.addAsset.bind(this)}),
                (this.props.saveLocal === false) ?
                e('h4',null,'Portfolio Assets') :
                e('h4',null,'Watchlist'),
                e(PortfolioView,{assets: this.state.assets, 
                    removeAsset: this.removeAsset.bind(this),
                    saveAssets: this.saveAssets.bind(this),
                    showWeights: this.props.showWeights,
                    onUpdate: this.onUpdate.bind(this)
                }),
                (this.props.saveLocal === false) ?
                e('button',{type:'button', className: 'btn btn-primary portfolioButton',
                    onClick: this.saveAssets.bind(this)
                    },'Save Portfolio') : 
                e('button',{type:'button', className: 'btn btn-primary portfolioButton',
                onClick: this.saveAssets.bind(this)
                },'Save Watchlist'),
                (this.props.allowRebalance) ?
                e('button',{type:'button', className: 'btn btn-primary portfolioButton',
                onClick: this.rebalancePortfolio.bind(this)
                },'Rebalance') : null,
                e('span',null,this.state.message)
                )
            );
        }
    }

    class AnnounceStrobe extends React.Component {
        constructor(props) {
            super(props);
            this.isOn = true;
        }

        componentDidUpdate() {
            this.isOn = !this.isOn;
        }

        render() {
            if (utils.isMarketOpen())
            {
                return (
                    (this.isOn) ?
                    e('span',{style:{'animation-name':'strobeGreenOff','animation-duration':'2s'}},this.props.value)
                    : 
                    e('span',{style:{'animation-name':'strobeGreenOn','animation-duration':'2s'}},this.props.value)
                );
                } else {
                    return (e('span',null,this.props.value));
            }
        } 
    }

    class EditText extends React.Component {
        constructor(props) {
            super(props);
            this.width = this.props.width || 150; 
            this.state = { editing: false, value: this.props.value };
            this.handleClick = this.handleClick.bind(this);
            this.handleChange = this.handleChange.bind(this);
            this.handleFocus = this.handleFocus.bind(this);
            this.handleBlur = this.handleBlur.bind(this);
        }

        handleFocus(event) {
            event.target.select();
        }

        handleBlur(event) {
            this.setState({ editing: false });
            if (this.props.onUpdate != undefined)
            {
                this.props.onUpdate(this.props.id,this.state.value,this.props.field);
            }
        }

        handleClick(event) {
            var editing = !this.state.editing;
            this.setState({ editing: editing });
            if (!editing && this.props.onUpdate != undefined)
            {
                this.props.onUpdate(this.props.id,this.state.value,this.props.field);
            }
        }

        handleChange(event) {
            this.setState({value: event.target.value});
        }

          render() {
            return (
                e('div',{className:'edittext'},
                    (this.state.editing) ? 
                        e('input',{type:'text', style: {width:this.width}, 
                            value: this.state.value, 
                            onChange:this.handleChange.bind(this), 
                            onFocus:this.handleFocus.bind(this),
                            onBlur:this.handleBlur.bind(this)}) : 
                        e('span',{ style: {display:'inline-block', 'vertical-align':'middle','text-align':this.props.align, overflow:'hidden', width:this.width}},this.props.value),
                        e('span',{className:'oi oi-pencil editpencil', onClick:this.handleClick.bind(this)})
                )
            );
        }
    }

    return {
        PortfolioManager: PortfolioManager,
        EditText: EditText
    };

}());
