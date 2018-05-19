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
                        function(s) {
                            return e('li',null,`${s[0]} - ${s[1]}`)
                        }
                    )
                )
            );
        }
    }
             
    return {
        SymbolList: SymbolList,
        Symbol: Symbol,
        PriceLookup: PriceLookup
    };

}());
