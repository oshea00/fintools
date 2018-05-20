var fintools = (function() {
    'use strict';

    class PriceLookup extends React.Component {
        constructor(props) {
            super(props);
            this.state = { symbol: '', price: '0.00', hasprice: false, tickerfound: true};
            this.handleClick = this.handleClick.bind(this);
            this.handleChange = this.handleChange.bind(this);
            this.handleOnFocus = this.handleOnFocus.bind(this);
        }

        handleOnFocus(event) {
            this.setState({symbol: "",hasprice: false, tickerfound: true});
        }

        handleChange(event) {
            this.setState({hasprice: false, tickerfound: true});
            this.setState({symbol: event.target.value});
        }

        handleClick(event) {
            this.setState({hasprice: false, tickerfound: true});
            axios.get(`https://api.iextrading.com/1.0/stock/${this.state.symbol}/price`)
                .then(res => {
                    this.setState({ price: res.data, hasprice: true, tickerfound: true});
                })
                .catch(error=> {
                    this.setState({ hasprice: false, tickerfound: false });
                });                        
        }

        render() {
            return e('form',null,
                e('label',null,'Stock:',
                    e('input', { 
                        type:'text', placeholder: 'Ticker', name: 'symbol', 
                        value: this.state.symbol, 
                        onChange: this.handleChange.bind(this),
                        onFocus: this.handleOnFocus.bind(this) 
                    })),
                e('button', {
                    type: 'button', className:'btn btn-primary',
                    onClick: this.handleClick.bind(this)
                },'Lookup'),
                e(Price, {
                    symbol: this.state.symbol, 
                    hasprice: this.state.hasprice, 
                    tickerfound: this.state.tickerfound, 
                    price: this.state.price
                })
            );
        }
    }

    function Price(props) {
        if (!props.tickerfound) {
            return (
                e('div',null,
                    e('span',null,`Ticker Not Found`)));
        }
        if (!props.hasprice) {
          return null;
        }
        return (
            e('div',null,
                e('span',null,`${props.symbol} : ${props.price}`)));
    }

    class StockList extends React.Component {
        constructor(props) {
            super(props);
            this.handleClick = this.handleClick.bind(this);        
        }

        handleClick(event) {
            const ticker = event.target.value;
            axios.get(`https://api.iextrading.com/1.0/stock/${ticker}/price`)
            .then(res => {
                this.props.addAsset({value: ticker, price: res.data});
            })
            .catch(error=> {
            });                        
        }

        render() {
            const symbols = this.props.symbols;
            return (
                e('table',{className:'assetList table-bordered table-striped'},
                    e('thead',null,
                    e('tr',null,
                        e('th',null,'Action'),
                        e('th',null,'Ticker'),
                        e('th',null,'Company')
                    )),
                    e('tbody',null,
                    symbols.map(
                        (s) => {
                            return (
                                e('tr',null,
                                    e('td',null,e('button',{type:'button',className:'btn btn-link',value:s[0],
                                        onClick: this.handleClick.bind(this)},'Add')),
                                        e('td',null,s[0]),
                                        e('td',null,s[1])
                                ));
                        }
                    ))      
                )
            );
        }
    }

    class PortfolioView extends React.Component {
        constructor(props) {
            super(props);
            this.handleClick = this.handleClick.bind(this);
            this.handleSave = this.handleSave.bind(this);
        }

        handleClick(event) {
            this.props.removeAsset(event.target.value);
        }

        handleSave(event) {
            this.props.saveAssets();
        }

        render() {
            const assets = this.props.assets;
            return (
                e('div',null,
                e('h4',null,'Portfolio Assets'),
                e('table',{className:'portfolioTable table-bordered table-striped'},
                    e('thead',null,
                    e('tr',null,
                        e('th',null,'Company'),
                        e('th',null,'Type'),
                        e('th',null,'Sector'),
                        e('th',null,'Price'),
                        e('th',null,'Weight'),
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
                                        'data-target':'#companyinfo'+asset.ticker},asset.companyName)),
                                e('td',null,asset.issueType),
                                e('td',null,asset.sector),
                                e('td',null,asset.lastPrice),
                                e('td',null,asset.weight),
                                e('td',null,e('button',{type:'button', value: asset.ticker, className:'btn btn-link',
                                   onClick: this.handleClick.bind(this)}, 'Remove'))
                            ));
                        }
                    ))      
                ),
                e('button',{type:'button', className: 'btn btn-primary savePortfolio',
                    onClick: this.handleSave.bind(this)
                    },'Save Portfolio'),
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
            ))
        }
    }

    class StockPicker extends React.Component {
        constructor(props) {
            super(props);
            this.state = { symbols: [], search: ''};
            this.handleClick = this.handleClick.bind(this);        
            this.handleChange = this.handleChange.bind(this);        
            this.handleOnFocus = this.handleOnFocus.bind(this);
        }

        handleClick(event) {
            const srch = this.state.search;
            axios.get(this.props.url,{ params: { search: srch} })
            .then(res => {
                this.setState({ symbols: res.data});
            })
            .catch(error=> {
            });                        
        }

        handleChange(event) {
            this.setState({search: event.target.value});
        }

        handleOnFocus(event) {
            this.setState({search: ''});
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
                    e(StockList,{symbols:this.state.symbols, addAsset: this.props.addAsset }) : null
            ));
        }
    }

    class PortfolioManager extends React.Component {
        constructor(props) {
            super(props);
            this.state = { assets: []}
            this.addAsset = this.addAsset.bind(this);
            this.removeAsset = this.removeAsset.bind(this);
            this.saveAssets = this.saveAssets.bind(this);
        }

        addAsset (event) {
            // lookup info about ticker and add it - this.props.url
            axios.get(`https://api.iextrading.com/1.0/stock/${event.value}/company`)
                .then(r => {
                    var newasset = [
                        {
                            companyName: r.data.companyName,
                            ceo: r.data.CEO,
                            issueType: r.data.issueType,
                            sector: r.data.sector,
                            industry: r.data.industry,
                            weight: '0.0%',
                            ticker: event.value,
                            lastPrice: event.price,
                            exchange: r.data.exchange,
                            description: r.data.description,
                            website: r.data.website
                        }
                    ]
                    this.setState((prevState,props)=> ({
                        assets: prevState.assets.concat(newasset)
                    }));
                })
                .catch(error=>{

                });
        }

        componentDidMount() {
            axios.get(this.props.urlLoad)
                .then((res)=>{
                    this.setState({ assets: res.data });
                })
        }

        saveAssets() {
            axios.put(this.props.urlSave,this.state.assets)
             .catch((error)=>{
                 console.log(error);
             });
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
                e(PortfolioView,{assets: this.state.assets, 
                    removeAsset: this.removeAsset.bind(this),
                    saveAssets: this.saveAssets.bind(this)
                })
                )
            );
        }
    }
             
    return {
        Symbol: Symbol,
        PriceLookup: PriceLookup,
        PortfolioManager: PortfolioManager
    };

}());
