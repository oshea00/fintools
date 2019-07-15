    
    class StockList extends React.Component {
        constructor(props) {
            super(props);
        }

        handleClick = (event) => {
            const ticker = event.target.value;
            axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/price?token=${IEXTOKEN}`)
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
                <table className='assetList table-striped'>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Ticker</th>
                            <th>30 Day</th>
                            <th>Company</th>
                        </tr>
                    </thead>
                    <tbody>
                    {symbols.map(
                        (s) => {
                            return (
                                <tr>
                                    <td>
                                        <button className='btn btn-link oi oi-plus' 
                                                value={s.ticker} 
                                                onClick={this.handleClick}/>
                                    </td>
                                    <td>{s.ticker}</td>
                                    <td>
                                        <span className='sparklines' values={getChartValues(s.chart,'close')}></span>
                                    </td>
                                    <td>{s.name}</td>
                                </tr>
                            );
                        }
                    )}
                    </tbody>      
                </table>
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
        }

        handleClick = (event) => {
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

        renderTableRow = asset => {
            return (
                <tr key={asset.ticker}>
                    <td>
                        <button className='btn btn-link oi oi-x' value={asset.ticker}
                            onClick={this.handleClick}></button>
                    </td>
                    <td>
                        <button className='btn btn-link'
                          data-toggle='modal'
                          data-target={'#companyinfo'+asset.ticker}>{asset.ticker}</button>
                    </td>
                    <td>
                        <span className='sparklines' values={getChartValues(asset.chart,'close')}></span>
                    </td>
                    <td>{asset.issueType}</td>
                    <td>{asset.sector}</td>
                    <td style={{'textAlign':'right'}}>{parseFloat(asset.lastPrice).toFixed(2)}</td>
                    <td><EditText value={asset.shares} width={65} align='right' id={asset.ticker} field='shares' onUpdate={this.props.onUpdate}/></td>
                    <td>
                        {this.props.showWeights ?
                            <EditText value={asset.weight} width={65} align='right' id={asset.ticker} field='weight' onUpdate={this.props.onUpdate}/>
                            : null
                        }
                    </td>
                    <td style={{'textAlign':'right'}}>{this.weightedBalance(asset.ticker)}</td>
                </tr>
            );
        }

        renderTableRowCompanyInfoPopup = asset => {
            return (
                <div className='modal fade' key={asset.ticker} id={'companyinfo'+asset.ticker} tabIndex={-1}>
                    <div className='modal-dialog modal-dialog-centered'>
                        <div className='modal-content'>
                            <div className='modal-header'>
                                <h5 className='modal-title'>{asset.companyName}</h5>
                                <button type='button' className='close' data-dismiss='modal'>{'\u00d7'}</button>
                            </div>
                            <div className='modal-body'>
                                <div className='assetCEO'>{'CEO: '+asset.ceo}</div>
                                <div>{asset.exchange}</div>
                                <div>{'Industry: '+asset.industry}</div>
                                <div>
                                    <span>
                                       Homepage: <a className='assetUrl' target='_blank' href={asset.website}>{asset.website}</a>
                                    </span>
                                </div>
                                <div className='assetDescription'>
                                    {asset.description}
                                </div>
                            </div>
                            <div className='modal-footer'>
                                <button className='btn btn-secondary' data-dismiss='modal'>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        renderTableFooter = () => {
            return (
                (this.props.showWeights) ?
                <tr style={{'backgroundColor':'#d2dbe2'}}>
                    <td colSpan='1'>Balance:</td>
                    <td colSpan='6'><AnnounceStrobe value={this.totalBalance()}/></td>
                    <td colSpan='2'>{this.totalWeights()}</td>
                </tr> 
                    : 
                    <tr style={{'backgroundColor':'#d2dbe2'}}>
                    <td colSpan='1'>Balance:</td>
                    <td colSpan='7'><AnnounceStrobe value={this.totalBalance()}/></td>
                </tr> 
            );
        }

        render() {
            const assets = this.props.assets;
            return (
                (assets.length > 0) ?
                <div>
                    <table className='portfolioTable table-striped'>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Symbol</th>
                            <th>30 Days</th>
                            <th>Type</th>
                            <th>Sector</th>
                            <th>Price</th>
                            <th>Shares</th>
                            {(this.props.showWeights) ? <th>Target</th> : null}
                            <th>Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset=>this.renderTableRow(asset))}
                        {this.renderTableFooter()}
                    </tbody>
                    </table>
                    {assets.map(asset=>this.renderTableRowCompanyInfoPopup(asset))}
                </div> 
                : null);
        }
    }

    class StockPicker extends React.Component {
        constructor(props) {
            super(props);
            this.state = { symbols: [], charts: [], search: ''};
        }

        handleClick = (event) => {
            const srch = this.state.search;
            axios.get(this.props.url,{ params: { search: srch} })
            .then(res => {
                this.setState({ symbols: res.data});
                res.data.map(r=>{
                    var ticker = r[0];
                    var companyName = r[1];
                    axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/chart?token=${IEXTOKEN}`)
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

        handleChange = (event) => {
            this.setState({search: event.target.value});
        }

        handleOnFocus = (event) => {
            this.setState({search: ''});
            this.setState({charts: []})
            this.setState({symbols: []})
        }

        render() {
            return (
                <div>
                    <h4>Stock Picker</h4>
                    <form className='form-inline'>
                        <input className='form-control' 
                               placeholder='Name or Ticker'
                               value={this.state.search}
                               onChange={this.handleChange}
                               onFocus={this.handleOnFocus}
                        />
                        <button className='btn btn-primary' onClick={this.handleClick}>Lookup</button>
                    </form>
                    {(this.state.symbols.length > 10) ? <span>'Limited to 20 results. You may want to narrow search.'</span> : null}
                    {(this.state.symbols.length > 0) ? <StockList symbols={this.state.symbols} charts={this.state.charts} addAsset={this.props.addAsset}/> : null}
                </div>
            );
        }
    }

    class TradeView extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            var trades = this.props.trades;
            if (trades.length == 0)
                return null;
            return (
                <div>
                    <h4>Proposed Trades</h4>
                    <table className='tradeTable table-striped'>
                        <thead>
                            <tr>
                                <td>Order</td>
                                <td>Symbol</td>
                                <td>Quantity</td>
                                <td>Amount</td>
                            </tr>
                        </thead>
                        <tbody>
                        {trades.map(t=>{
                            return (
                                <tr>
                                    <td>{t.type}</td>
                                    <td>{t.symbol}</td>
                                    <td>{t.qty}</td>
                                    <td style={{'textAlign':'right'}}>{t.amount}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    </table>
                    <button className='btn btn-primary portfolioButton' onClick={this.props.onApplyTrades}>Apply Trades</button>
                    <button className='btn btn-primary portfolioButton' onClick={this.props.onCancelTrades}>Cancel Trades</button>
                </div>
            );
        }
    }

    class PortfolioManager extends React.Component {
        constructor(props) {
            super(props);
            this.repriceDelay = this.props.repriceDelay || 10000;
            this.state = { assets: [], trades: [], message: "" };
        }

        reprice() {
            var promises = [];
            var currAssets =[];
            this.state.assets.forEach((a)=>{ currAssets.push(Object.assign({},a))});

            currAssets.forEach((a)=>{
                if (utils.isMarketOpen())
                {
                    promises.push(axios.get(`https://cloud.iexapis.com/stable/stock/${a.ticker}/quote?token=${IEXTOKEN}`));
                }
                if (a.chartDate==undefined || !Date.parse(a.chartDate).equals(Date.today())) {
                    promises.push(axios.get(`https://cloud.iexapis.com/stable/stock/${a.ticker}/chart?token=${IEXTOKEN}`));
                }
            });

            axios.all(promises)
                .then(results=>{
                    results.forEach((r,i)=>{
                        var respUrl = r.request.responseURL;
                        var ticker = "";
                        var assetfor = "";
                        if (respUrl.lastIndexOf("/quote")>0) {
                            ticker = respUrl.replace("https://cloud.iexapis.com/stable/stock/","")
                            .replace("/quote",'');
                            assetfor = currAssets.filter(a=>a.ticker===ticker);
                            if (assetfor.length>0) {
                                assetfor[0].lastPrice = r.data.latestPrice;
                            }
                        } else {
                            ticker = respUrl.replace("https://cloud.iexapis.com/stable/stock/","")
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

        addAsset = (event) => {
            // prevent duplicates being added
            if (this.state.assets.filter(a=>{return a.ticker == event.ticker}).length>0)
                return;

            // lookup info about ticker and add it - this.props.url
            axios.get(`https://cloud.iexapis.com/stable/stock/${event.ticker}/company?token=${IEXTOKEN}`)
                .then(res => {
                    var asset = res.data;
                    var ticker = event.ticker;
                    var price = event.price;
                    axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/chart?token=${IEXTOKEN}`)
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
                                shares: 1,
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

        onUpdate = (ticker,value,field) => {
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

        saveAssets = () => {
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

        removeAsset = (ticker) => {
            this.setState((prevState,props)=> ({
                assets: prevState.assets.filter((a)=>{ return a.ticker != ticker })
            }));
        }

        rebalancePortfolio = () => {
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
                    var trades = this.proposeTrades(currAssets,res.data.positions);
                    this.setState({assets:currAssets,trades:trades});
                });
        }

        applyTrades = () => {
            var currAssets = [];
            this.state.assets.forEach((a)=>{currAssets.push(Object.assign({},a))});
            var trades = this.state.trades;
            currAssets.forEach((a,i)=>{
                var trade = trades.filter(t=>t.symbol == a.ticker);
                if (trade.length>0)
                {
                    switch (trade[0].type)
                    {
                        case "buy": 
                            a.shares = Number(a.shares) + Number(trade[0].qty);
                            break;
                        case "sell": 
                            a.shares = Number(a.shares) - Number(trade[0].qty);
                        break;
                    }
                }
            });
            trades = [];
            this.setState({assets:currAssets,trades:trades});            
        }

        makeTrade(ticker,currPosition,newPosition,currPrice) {
            if (Math.abs(newPosition-currPosition)>Number.EPSILON) {
                if (currPosition < newPosition){
                    return (
                        {
                            type: "buy",
                            symbol: ticker,
                            qty: newPosition-currPosition,
                            amount: (currPrice * (newPosition-currPosition)).toFixed(2)
                        }  
                    );
                } else                   
                if (currPosition > newPosition){
                    return (
                        {
                            type: "sell",
                            symbol: ticker,
                            qty: currPosition-newPosition,
                            amount: (currPrice * (currPosition-newPosition)).toFixed(2)
                        }
                    );
                }
            }
            return { type: "none" };
        }

        proposeTrades(currAssets,positions) {
            var trades = [];
            currAssets.forEach((a,i)=>{
                if (positions[i]>0)
                {
                    var trade = this.makeTrade(a.ticker,a.shares,positions[i],a.lastPrice);
                    if (trade.type != "none") {
                        trades.push(trade);
                    }
                }
            });
            trades.sort((a,b)=>{
                if (a.type==b.type) {
                    return 0;
                }
                else {
                    if (a.type === 'sell' && b.type == 'buy'){
                        return -1;
                    }
                    else {
                        return 1;
                    }
                }
            })
            return trades;
        }

        cancelRebalance = () => {
            this.setState({trades:[]});
        }

        render() {
            return (
                <div className='portfolio'>
                    <StockPicker url={this.props.url} addAsset={this.addAsset}/>
                    {(this.props.saveLocal === false) ? <h4>Portfolio Assets</h4> : <h4>Watchlist</h4>}
                    <PortfolioView assets={this.state.assets}
                        removeAsset={this.removeAsset}
                        saveAssets={this.saveAssets}
                        showWeights={this.props.showWeights}
                        onUpdate={this.onUpdate}/>
                    {(this.props.saveLocal === false) ?
                    <button className='btn btn-primary portfolioButton' onClick={this.saveAssets}>Save Portfolio</button> :
                    <button className='btn btn-primary portfolioButton' onClick={this.saveAssets}>Save Watchlist</button>}
                    {(this.props.allowRebalance) ?
                    <button className='btn btn-primary portfolioButton' onClick={this.rebalancePortfolio}>Rebalance</button> : null}
                    <span>{this.state.message}</span>
                    <TradeView 
                        trades={this.state.trades}
                        onApplyTrades={this.applyTrades}
                        onCancelTrades={this.cancelRebalance}
                    />
                </div>                    
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
                    <span style={{'animation-name':'strobeGreenOff','animation-duration':'2s'}}>{this.props.value}</span>
                    : 
                    <span style={{'animation-name':'strobeGreenOn','animation-duration':'2s'}}>{this.props.value}</span>
                );
                } else {
                    return <span>{this.props.value}</span>;
            }
        } 
    }

    class EditText extends React.Component {
        constructor(props) {
            super(props);
            this.width = this.props.width || 150; 
            this.state = { editing: false, value: this.props.value };
        }

        handleFocus = (event) => {
            event.target.select();
        }

        handleBlur = (event) => {
            this.setState({ editing: false });
            if (this.props.onUpdate != undefined)
            {
                this.props.onUpdate(this.props.id,this.state.value,this.props.field);
            }
        }

        handleClick = (event) => {
            var editing = !this.state.editing;
            this.setState({ editing: editing });
            if (!editing && this.props.onUpdate != undefined)
            {
                this.props.onUpdate(this.props.id,this.state.value,this.props.field);
            }
        }

        handleChange = (event) => {
            this.setState({value: event.target.value});
        }
        
        renderOnEdit = editing => {
            let notEditing = 
            <div className='edittext' >
                <span style={{
                    display:'inline-block', 
                    'verticalAlign':'middle',
                    'textAlign':this.props.align, 
                    overflow:'hidden', width:this.width}}>
                    {this.props.value}
                </span>
                <span className='oi oi-pencil editpencil' onClick={this.handleClick}></span>
            </div>;
            
            let edit = 
            <div className='edittext'>
                <input type='text' style={{width:this.width}} 
                        value={this.state.value} 
                        onChange={this.handleChange} 
                        onFocus={this.handleFocus}
                        onBlur={this.handleBlur}/>
                <span className='oi oi-pencil editpencil' onClick={this.handleClick}></span>
            </div>
            return (editing) ? edit : notEditing;
        }

        render() {
            return this.renderOnEdit(this.state.editing);
        }
    }
