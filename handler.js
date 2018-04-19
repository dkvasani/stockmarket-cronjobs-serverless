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


function fetchDataAndSendEmail(stockCode) {
  const SEND_GRID_API_KEY = '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';
  var moment = require('moment');
  var startdate = moment();
  var toDate = startdate.format("DD-MM-YYYY");
  var fromdate = startdate.subtract(40, "days");
  var fromDate = fromdate.format("DD-MM-YYYY");
  var request = require("request");
  const cheerio = require('cheerio')

  var options = {
    method: 'GET',
    url: 'https://www.nseindia.com/products/dynaContent/common/productsSymbolMapping.jsp',
    qs:
      {
        symbol: stockCode,
        segmentLink: '3',
        symbolCount: '2',
        series: 'EQ',
        dateRange: '',
        fromDate: fromDate,
        toDate: toDate,
        dataType: 'PRICEVOLUMEDELIVERABLE'
      },
    headers:
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0',
        'referer': 'https://www.nseindia.com',
      }
  };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    const $ = cheerio.load(body)

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

        // responseData.push(
        //   {
        //     //symbol: row,
        //    // series: data[1][i],
        //     date: data[2][i],
        //     prev_close: data[3][i],
        //     open_price: data[4][i],
        //     high_price: data[5][i],
        //     low_price: data[6][i],
        //     last_price: data[7][i],
        //     close_price: data[8][i],
        //     VWAP: data[9][i],
        //     TotalTradedQuantity: data[10][i],
        //   //  Turnover: data[11][i],
        //     NoofTrades: data[12][i],
        //     DeliverableQty: data[13][i],
        //     //PercentageDlyQttoTradedQty: data[14][i],
        //   }
        // );
        i++;
        next();
      }
    }, function (err) {
      table += '</tbody></table>';
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(SEND_GRID_API_KEY);
      const msg = {
        to: 'dharmeshkvasani@live.com',
        from: 'dharmeshkvasani@live.com',
        subject: stockCode + ' Stock Market Historical Data',
        //  text: 'and easy to do anywhere, even with Node.js',
        html: '<h2>' + stockCode + ' Historical Data ' + toDate + ' </h2><br>' + table,
      };
      sgMail.send(msg);
    });
  });
}