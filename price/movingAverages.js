require('isomorphic-fetch');
require('dotenv').config();
const { API_KEY } = process.env;
const moment = require('moment');

console.log('API_KEY: ', API_KEY);

const company = 'TDOC';
const resolution = 'D'; // for the API
const units = 'days'; // for moment

const lookBacks = [
  360, // important! The furthest back becomes the 'from date' in url
  180,
  90,
  30,
  0
];

// very helpful helper

const calculateAverageFromArray = array => {
  return (array.reduce((accum, num) => accum + num) / array.length);
}

const diffPercent = (start, end) => {
  const diff = end - start;
  const growth = (diff / start);

  return growth;
}

const roundToTwoDecimals = num => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}


// very specific helper
const makeLookBackIndices = resultsLength => (item, itemIndex, lookBacksArray) => {
  if (itemIndex === 0) return 0;
  const furthestBack = lookBacksArray[0];
  const percent = item / furthestBack;

  return resultsLength - 1 - Math.floor( resultsLength * percent);
}


const doit = data => {
  const prices = data.c
  const indices = lookBacks
    .map(makeLookBackIndices(prices.length));

  const mostRecentPrice = prices[prices.length - 1];

  console.log('prices.length:', prices.length);
  console.log('indices: ', indices);
  // console.log('most recent price: ', mostRecentPrice);
  for (let i = 0; i < indices.length; i++) {
    const startIndex = indices[i];
    const thisSet = prices.slice(startIndex, prices.length);
    const thisAverage = calculateAverageFromArray(thisSet);
    const thisAverage2Decimals = roundToTwoDecimals(thisAverage);
    const diffFromAverage = diffPercent(thisAverage, mostRecentPrice) * 100;
    const diffFromAverage2Decimals = roundToTwoDecimals(diffFromAverage);

    let spacerOne = '';
    while (spacerOne.length + String(lookBacks[i]).length < 5) {
      spacerOne += ' '
    }

    let spacerTwo = '';
    while (spacerTwo.length + String(thisAverage2Decimals).length < 10) {
      spacerTwo += ' '
    }


    console.log(`Average at ${lookBacks[i]} ${units}: ${spacerOne} ${thisAverage2Decimals}${spacerTwo}|| Current diff from: ${diffFromAverage2Decimals}%`);
  }
}


const nowDate = parseInt(moment().valueOf() / 1000);
const fromDate = parseInt(moment().subtract(lookBacks[0], units).valueOf() / 1000)
const candlesUrl = `https://finnhub.io/api/v1/forex/candle?symbol=${company}&resolution=${resolution}&from=${fromDate}&to=${nowDate}&token=${API_KEY}`;

console.log('getting data for url: ', candlesUrl);

fetch(candlesUrl)
  .then(async response => {
    const data = await response.json();
    doit(data);
    // console.log('data: ', data)
  })
