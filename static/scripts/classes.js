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

    class SymbolList extends React.Component {
        constructor(props) {
            super(props);
            this.url = props.url;
            this.state = {
                symbols: []
            };
        }    
    
        componentDidMount() {
            axios.get(this.url)
                .then(res => {
                    const symbols = res.data;
                    this.setState({ 'symbols' : symbols });
            });
        }
    
        render() {
            return (
                e('ul',null,
                    this.state.symbols.map(
                        (s) => {
                            return e('li',null,`${s[0]} - ${s[1]}`)
                        }
                    )
                )
            );
        }
    }

    class AssetList extends React.Component {
        constructor(props) {
            super(props);
            this.handleClick = this.handleClick.bind(this);        
        }

        handleClick(event) {
            this.props.addAsset(event.target.value);
        }

        render() {
            const symbols = this.props.symbols;
            return (
                e('table',{className:'assetList table-bordered table-striped'},
                    e('thead',null,
                    e('tr',null,
                        e('th',null,'Symbol'),
                        e('th',null,'Company'),
                        e('th',null,'')
                    )),
                    e('tbody',null,
                    symbols.map(
                        (s) => {
                            return (
                                e('tr',null,
                                    e('td',null,s[0]),
                                    e('td',null,s[1]),
                                    e('td',null,e('button',{type:'button',className:'btn btn-link',value:s[0],
                                        onClick: this.handleClick.bind(this)},'Add'))
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
        }

        handleClick(event) {
            alert('Remove '+event.target.value);
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
                        e('th',null,'Weight'),
                        e('th',null,'')
                    )),
                    e('tbody',null,
                    assets.map(
                        (asset) => {
                            return (
                                e('tr',null,
                                e('td',null,asset[0]),
                                e('td',null,asset[1]),
                                e('td',null,asset[2]),
                                e('td',null,asset[3]),
                                e('td',null,e('button',{type:'button', value: asset[4], className:'btn btn-link',
                                   onClick: this.handleClick.bind(this)}, 'Remove'))
                            ));
                        }
                    ))      
                ))
            );
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
                e('fieldset',null,
                    e('label',null,'Stock:',
                        e('input',{type:'text', className: 'form-control', placeholder:'Name or Ticker',
                            value: this.state.search, 
                            onChange: this.handleChange.bind(this),
                            onFocus: this.handleOnFocus.bind(this)
                        })),
                e('button',{type: 'button', className: "btn btn-primary", 
                    onClick: this.handleClick.bind(this)},'Lookup')),
                (this.state.symbols.length > 10) ? 
                    e('span',null,'Limited to 20 results. You may want to narrow search.') : null,
                (this.state.symbols.length > 0) ? 
                    e(AssetList,{symbols:this.state.symbols, addAsset: this.props.addAsset }) : null
            ));
        }
    }

    class PortfolioManager extends React.Component {
        constructor(props) {
            super(props);
            this.state = { assets: []}
            this.addAsset = this.addAsset.bind(this);
        }

        addAsset (ticker) {
            // lookup info and add it
            const newAsset = [[ticker,'Equity','Defensive Industrials','20.0%',ticker]];
            this.setState((prevState,props)=> ({
                assets: prevState.assets.concat(newAsset)
            }));
        }

        render() {
            return (
                e('div',{className:'portfolio'},
                e(StockPicker,{url:this.props.url, addAsset: this.addAsset.bind(this)}),
                e(PortfolioView,{assets: this.state.assets})
                )
            );
        }
    }
             
    return {
        SymbolList: SymbolList,
        Symbol: Symbol,
        PriceLookup: PriceLookup,
        PortfolioManager: PortfolioManager
    };

}());
