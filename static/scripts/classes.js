var fintools = (function() {
    'use strict';

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
            })
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
            )
        }
    }
             
    return {
        SymbolList: SymbolList
    };

}());
