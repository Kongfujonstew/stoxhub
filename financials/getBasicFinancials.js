require('isomorphic-fetch');
require('dotenv').config()
const moment = require('moment');
const { API_KEY } = process.env;

// settings
const companyFromArgs = process.argv[2];

const company = companyFromArgs || 'UFO';
// const yearsBackNum = 3;
// const yearsForwardNum = 7;
// const futureGrowthRate = 3;
const basicFinancialsUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${company}&metric=all&token=${API_KEY}`;



const doit = data => {
  console.log('data: ')
  console.log(data)
  console.log(data.series.annual)

}

fetch(basicFinancialsUrl)
  .then(async response => {
    const data = await response.json();
    doit(data)
  })
  .catch(async response => {
    console.log('error: ', response)
  })
