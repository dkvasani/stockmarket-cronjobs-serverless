const EMAIL_ADDRESS = 'dharmeshkvasani@gmail.com';
const MAILGUN_API_KEY = 'key-';
const MAINGUN_DOMAIN = 'sandboxbbb469baa09a406da641cd9d8dcbd13f.mailgun.org';
const NIFTY_BASE_URL = 'https://www.nseindia.com';
const NIFTY_STOCKWATCH = 'https://www.nseindia.com/live_market/dynaContent/live_watch/stock_watch/';
const NIFTY_SYMBOL_DETAILS = 'https://www.nseindia.com/products/dynaContent/common/productsSymbolMapping.jsp';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0';

module.exports.run = (event, context, callback) => {
  var stocksArr = ["CAPACITE", "DHANUKA", "SBIN", "TATAMOTORS", "RAIN", "YESBANK", "INFY", "RELIANCE",
    "CDSL", "ICICIPRULI", "LUPIN", "CAPF", "COCHINSHIP", "TITAN", "TCS", "ICICIBANK", "LICHSGFIN", , "UPL",
    "HAVELLS", "DELTACORP", "RBLBANK", "GNFC", "JUSTDIAL", "AARTIIND", "EXIDEIND", "TATACOFFEE", "GRASIM",
    "LT", "TATASTEEL", "WIPRO", "ITC"
  ];
  stocksArr.forEach(stockCode => {
    fetchDataAndSendEmail(stockCode)
  });
};

module.exports.stockWatch = (event, context, callback) => {
  var niftyTypesArr = ['niftyStockWatch.json', 'niftyMidcap50StockWatch.json', 'juniorNiftyStockWatch.json', 'cnxitStockWatch.json', 'cnxPharmaStockWatch.json'];
  niftyTypesArr.forEach(niftyType => {
    getNiftyStocksDailyData(niftyType)
  });
};

function getNiftyStocksDailyData(niftyIndicesType) {
  var request = require("request");
  var options = {
    method: 'GET',
    url: NIFTY_STOCKWATCH + niftyIndicesType,
    headers: setHeaders()
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    var data = JSON.parse(body);
    var time = data.time;
    var latestNiftyData = data.latestData[0];
    let stockData = data.data;
    var asyncLoop = require('node-async-loop');
    var niftyTable = '<table style="text-align: center;border: 1px solid #131212;font-size: 15px;"><thead><tr style="line-height: 25px;background-color:blue;color:white;"><th>indexName</th><th>Open</th><th>High</th><th>Low</th><th>LastTr.</th><th>change</th><th>PerCh.</th><th>yHigh</th><th>yLow</th></tr><thead><tbody>';

    if (latestNiftyData.ch < 0) {
      var style = '<tr style="background-color:red;color:white;line-height: 25px;"><td>';
    } else {
      var style = '<tr style="background-color:green;color:white;"><td>';
    }
    niftyTable += style + latestNiftyData.indexName + '</td><td>' + latestNiftyData.open + '</td><td>' + latestNiftyData.high + '</td><td>' + latestNiftyData.low + '</td><td>' + latestNiftyData.ltp + '</td><td>' + latestNiftyData.ch + '</td><td>' + latestNiftyData.per + '</td><td>' + latestNiftyData.yHigh + '</td><td>' + latestNiftyData.yLow + '</td></tr></tbody></table>';

    var table = '<table style="text-align: center;border: 1px solid #131212;font-size: 15px;"><thead><tr style="line-height: 25px;background-color:blue;color:white;"><th>Symbol</th><th>Open</th><th>High</th><th>Low</th><th>LastTr.</th><th>priceC</th><th>PerCh.</th><th>52wkhi</th><th>52wklo</th><th>yPC</th><th>mPC</th><th>Dt Declare</th><th>cAct.</th></tr><thead><tbody>';
    asyncLoop(stockData, function (row, next) {

      if (row.iislPercChange < 0) {
        var style = '<tr style="background-color:red;color:white;line-height: 25px;"><td>';
      } else {
        var style = '<tr style="background-color:green;color:white;"><td>';
      }
      table += style + row.symbol + '</td><td>' + row.open + '</td><td>' + row.high + '</td><td>' + row.low + '</td><td>' + row.ltP + '</td><td>' + row.iislPtsChange + '</td><td>' + row.iislPercChange + '</td><td>' + row.wkhi + '</td><td>' + row.wklo + '</td><td>' + row.yPC + '</td><td>' + row.mPC + '</td><td>' + row.xDt + '</td><td>' + row.cAct + '</td></tr>';
      next();
    }, function (err) {
      table += '</tbody></table>';
      var mailgun = require('mailgun-js')({ apiKey: MAILGUN_API_KEY, domain: MAINGUN_DOMAIN });
      var data = {
        from: EMAIL_ADDRESS,
        to: EMAIL_ADDRESS,
        subject: "Stock Market " + latestNiftyData.indexName + " " + time + " Report",
        html: niftyTable + "<br/>" + table
      };
      mailgun.messages().send(data, function (error, body) {
        console.log(body);
      });
    });
  });
}

function setHeaders() {
  return {
    'User-Agent': USER_AGENT,
    'referer': NIFTY_BASE_URL,
  }
}

function setQueryStringSymbolDetails(stockCode, fromDate, toDate) {
  return {
    symbol: stockCode,
    segmentLink: '3',
    symbolCount: '2',
    series: 'EQ',
    dateRange: '',
    fromDate: fromDate,
    toDate: toDate,
    dataType: 'PRICEVOLUMEDELIVERABLE'
  }
}

function fetchDataAndSendEmail(stockCode) {
  var moment = require('moment');
  var startdate = moment();
  var toDate = startdate.format("DD-MM-YYYY");
  var fromdate = startdate.subtract(40, "days");
  var fromDate = fromdate.format("DD-MM-YYYY");
  var request = require("request");
  const cheerio = require('cheerio')

  var options = {
    method: 'GET',
    url: NIFTY_SYMBOL_DETAILS,
    qs: setQueryStringSymbolDetails(),
    headers: setHeaders()
  };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    const $ = cheerio.load(body)
console.log($);
    var cheerioTableparser = require('cheerio-tableparser');

    cheerioTableparser($);
    var data = $("table").parsetable(true, true, true);

    var asyncLoop = require('node-async-loop');
    var i = 0;
    var responseData = [];
    var table = '<table style="text-align: center;border: 1px solid #131212;font-size: 15px;"><thead><tr style="line-height: 25px;background-color:blue;color:white;"><th>Date</th><th>Close Price</th><th>Open Price</th><th>High Price</th><th>Low Price</th><th>NoofTrades</th><th>Percentage Del Qty</th></tr><thead><tbody>';
    asyncLoop(data[0], function (row, next) {
      //console.log(row)
      if (i == 0) {
        i++;
        next();
      } else {
        if (data[3][i] > data[7][i]) {
          var style = '<tr style="background-color:red;color:white;line-height: 25px;"><td>';
        } else {
          var style = '<tr style="background-color:green;color:white;"><td>';
        }
        table += style + data[2][i] + '</td><td>' + data[7][i] + '</td><td>' + data[4][i] + '</td><td>' + data[5][i] + '</td><td>' + data[6][i] + '</td><td>' + data[12][i] + '</td><td>' + data[14][i] + '</td></tr>';
        i++;
        next();
      }
    }, function (err) {
      table += '</tbody></table>';
      var mailgun = require('mailgun-js')({ apiKey: MAILGUN_API_KEY, domain: MAINGUN_DOMAIN });
      let subject = stockCode + ' Stock Market Historical Data';
      let html = '<h2>' + stockCode + ' Historical Data ' + toDate + ' </h2><br>' + table
      sednEmail(subject, html);
    });
  });
}

function sednEmail(subject, html) {
  var mailgun = require('mailgun-js')({ apiKey: MAILGUN_API_KEY, domain: MAINGUN_DOMAIN });
  var data = {
    from: EMAIL_ADDRESS,
    to: EMAIL_ADDRESS,
    subject: subject,
    html: html
  };
  mailgun.messages().send(data, function (error, body) {
    console.log(body);
  });
}