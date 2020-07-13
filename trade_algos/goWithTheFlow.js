require('isomorphic-fetch');
require('dotenv').config();
const moment = require('moment');
const { API_KEY } = process.env;

// settings
const lookBackPeriodsNum = 1;
const lookBackPeriodString = 'year';
const fromDate = parseInt(moment().subtract(lookBackPeriodsNum, lookBackPeriodString).valueOf() / 1000)
const toDate = parseInt(moment().valueOf() / 1000);
const resolution = 'W'
// const toDate = moment().valueOf();
console.log('now toDate: ',moment().valueOf() / 1000)
const company = 'TDOC';

const getCandlesUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${company}&resolution=${resolution}&from=${fromDate}&to=${toDate}&token=${API_KEY}`;

const reportResult = string => {
  console.log(string)
}

const goWithTheFlow = candlesData => {
  const { c } = candlesData;
  if (!Array.isArray(c) || c.length < 2) {
    throw `candles data is incorrect.  Here it is: ${candlesData}`
  }

  const currentClose = c[c.length - 1];
  const prevClose = c[c.length - 2];

  if (currentClose > prevClose) {
    reportResult('goWithTheFlow: success')
  } else {
    reportResult('goWithTheFlow: fail')
  }
}


fetch(getCandlesUrl)
  .then(async response => {
    const data = await response.json()
    // console.log('data ', data)
    goWithTheFlow(data)
  })
  .catch(async response => {
    const error = await response.json()
    console.log('error: ', error)
  })
