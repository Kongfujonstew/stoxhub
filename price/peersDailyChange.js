require('isomorphic-fetch');
require('dotenv').config();
const { API_KEY } = process.env;
const moment = require('moment');

const companyFromArgs = process.argv[2];

const company = companyFromArgs || 'UFO';
const resolution = 'D'; // for the API
const units = 'days'; // for moment

const nowDate = parseInt(moment().valueOf() / 1000);
const fromDate = parseInt(moment().subtract(10, units).valueOf() / 1000)

const diffPercent = (start, end) => {
  const diff = end - start;
  const growth = (diff / start);

  return growth;
}

const roundToTwoDecimals = num => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}


const calculateChangeMostRecent = data => {
  if (!data.o || !data.c) {
    console.log('nope no data!');
    return 'XY'
  }
  const open = data.o[data.o.length - 1];
  const close = data.c[data.c.length - 1];
  const rawPercentChange = diffPercent(open, close);
  const percentChangeTwoDecimals = roundToTwoDecimals(rawPercentChange * 100);
  return percentChangeTwoDecimals;
}

const doit = (data, peerCompany) => {
  const mostRecentChange = calculateChangeMostRecent(data);
  let spacer = company === peerCompany ? '*:' : ' :';
  while (peerCompany.length + spacer.length < 10) {
    spacer += ' ';
  }
  console.log(`${peerCompany}${spacer}${mostRecentChange}%`);
}

const doOneCompany = peerCompany => {
  const candlesUrl = `https://finnhub.io/api/v1/forex/candle?symbol=${peerCompany}&resolution=${resolution}&from=${fromDate}&to=${nowDate}&token=${API_KEY}`;
  fetch(candlesUrl)
    .then(async response => {
      const data = await response.json();
      doit(data, peerCompany);
    });
}

const peersUrl = `https://finnhub.io/api/v1/stock/peers?symbol=${company}&token=${API_KEY}`;

fetch(peersUrl)
  .then(async response => {
    const data = await response.json(); // this will be an array of ticker symbols
    if (!Array.isArray(data)) {
      throw 'Weird peers data!';
    }

    data.forEach(peerCompany => {
      doOneCompany(peerCompany);
    });
  })
  .catch(err => console.log('err: ', err))
