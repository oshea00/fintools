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
                e('table',{className:'assetList table-bordered table-striped'},
                    e('thead',null,
                    e('tr',null,
                        e('th',null,'Action'),
                        e('th',null,'Ticker'),
                        e('th',null,'30 Day'),
                        e('th',null,'Company')
                    )),
                    e('tbody',null,
                    symbols.map(
                        (s) => {
                            return (
                                e('tr',null,
                                    e('td',null,e('button',{type:'button',className:'btn btn-link',value:s.ticker,
                                        onClick: this.handleClick.bind(this)},'Add')),
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

        render() {
            const assets = this.props.assets;
            return (
                (assets.length > 0) ?
                e('div',null,
                e('table',{className:'portfolioTable table-bordered table-striped'},
                    e('thead',null,
                    e('tr',null,
                        e('th',null,'Symbol'),
                        e('th',null,'30 Days'),
                        e('th',null,'Type'),
                        e('th',null,'Sector'),
                        e('th',null,'Price'),
                        (this.props.showWeights) ?
                        e('th',null,'Weight') : null,
                        e('th',null,'Action')
                    )),
                    e('tbody',null,
                    assets.map(
                        (asset) => {
                            return (
                                e('tr',null,
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
                                e('td',null,asset.lastPrice),
                                (this.props.showWeights) ?
                                e('td',null,asset.weight) : null,
                                e('td',null,e('button',{type:'button', value: asset.ticker, className:'btn btn-link',
                                   onClick: this.handleClick.bind(this)}, 'Remove'))
                            ));
                        }
                    ))      
                ),
                assets.map((asset)=>{
                    return (
                        e('div',{className:'modal fade', id:'companyinfo'+asset.ticker,tabindex:-1},
                            e('div',{className:'modal-dialog'},
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
            this.state = { assets: [] };
            this.addAsset = this.addAsset.bind(this);
            this.removeAsset = this.removeAsset.bind(this);
            this.saveAssets = this.saveAssets.bind(this);
        }

        reprice() {
            var promises = [];
            var currAssets =[];
            this.state.assets.forEach((a)=>{ currAssets.push(Object.assign({},a))});

            currAssets.forEach((a)=>{
                promises.push(axios.get(`https://api.iextrading.com/1.0/stock/${a.ticker}/quote`));
            });

            axios.all(promises)
                .then(results=>{
                    results.forEach((r,i)=>{
                        var ticker = r.request.responseURL.replace("https://api.iextrading.com/1.0/stock/","")
                                                     .replace("/quote",'');
                        var assetfor = currAssets.filter(a=>a.ticker===ticker);
                        if (assetfor.length>0) {
                            assetfor[0].lastPrice = r.data.latestPrice;
                        }
                    });    
                    this.setState({ assets: currAssets });            
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
                                exchange: asset.exchange,
                                description: asset.description,
                                website: asset.website,
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
                this.timerID = setInterval(()=>this.reprice(),2000);          
            }
        }

        componentWillUnmount() {
            clearInterval(this.timerID);
        }

        componentDidUpdate() {
            $('.sparklines').sparkline('html', { enableTagOptions: true });
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
                    showWeights: this.props.showWeights
                }),
                (this.props.saveLocal === false) ?
                e('button',{type:'button', className: 'btn btn-primary savePortfolio',
                    onClick: this.saveAssets.bind(this)
                    },'Save Portfolio') : 
                e('button',{type:'button', className: 'btn btn-primary savePortfolio',
                onClick: this.saveAssets.bind(this)
                },'Save Watchlist'),                
                )
            );
        }
    }

    return {
        PortfolioManager: PortfolioManager
    };

}());
