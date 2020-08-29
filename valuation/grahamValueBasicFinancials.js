require('isomorphic-fetch');
require('dotenv').config()
const moment = require('moment');
const { API_KEY } = process.env;

const companyFromArgs = process.argv[2];

const company = companyFromArgs || 'UFO';
const yearsBackNum = 3;
const yearsForwardNum = 7;
const futureGrowthRate = 3;
const basicFinancialsUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${company}&metric=all&token=${API_KEY}`;


// helper
const calculateDecimalFromRate = rate => {
  return rate / 100;
}

const logNameAndValue = (name, value = '') => {
  let string = name + ' ';
  while (string.length < 45) {
    string += '. ';
  }
  string += value;

  console.log(string)
}

// The Graham Magic Formula
// ( 8.5 + 2 x g ) x EPS
const calculateGrahamValueFromGrowthAndEPS = (eps, growth) => {
  const value = ( 8.5 + ( 2 * growth ) ) * eps;
  return value;
}

// this starts the magic here
const calculateCurrentValueFromBasicFinancials = data => {
  const eps = data.metric.epsNormalizedAnnual;
  const growth = data.metric.epsGrowth3Y;
  const value = calculateGrahamValueFromGrowthAndEPS(eps, growth);

  console.log('=========')
  console.log('GRAHAM VALUE CURRENT')
  logNameAndValue('most recent eps', eps)
  logNameAndValue(`${yearsBackNum} years normalized growth`, growth)
  logNameAndValue('result current stock value', value)
  console.log(' ')

  return value;
}

const calculateFutureValueFromBasicFinancials = data => {
  const eps = data.metric.epsNormalizedAnnual;
  const growth = futureGrowthRate;
  const factor = 1 + calculateDecimalFromRate(growth);
  let futureEPS = eps;
  let years = yearsForwardNum;

  while (years--) {
    const sign = futureEPS > 0 ? 1 : -1;
    futureEPS = sign === 1 ? futureEPS * factor : futureEPS - ( futureEPS / factor );
  }

  const value = calculateGrahamValueFromGrowthAndEPS(futureEPS, growth)

  console.log('=========')
  console.log('GRAHAM VALUE FUTURE')

  logNameAndValue('most recent eps', eps)
  logNameAndValue(`assumed/ forecasted growth over next ${yearsForwardNum} years`, growth)
  logNameAndValue(`future eps`, futureEPS)
  logNameAndValue('result future stock value', value)
  console.log(' ')

  return value;
}

const logOtherUsefulStuffs = data => {
  console.log('=========')
  console.log('OTHER USEFUL STUFFS')
  const usefulStuffs = [
    '52WeekHigh',
    'ebitdAnnual',
    'epsGrowthQuarterlyYoy',
    'netIncomeCommonAnnual',
    '52WeekHighDate',
    '52WeekLow',
    '52WeekLowDate',
  ]

  usefulStuffs.forEach(name => {
    console.log(name, ': ', data.metric[name])
  });

}

const doit = data => {
  console.log('data: ')
  console.log(data)
  calculateCurrentValueFromBasicFinancials(data);
  calculateFutureValueFromBasicFinancials(data);
  logOtherUsefulStuffs(data)
}

fetch(basicFinancialsUrl)
  .then(async response => {
    const data = await response.json();
    doit(data)
  })
  .catch(async response => {
    console.log('error: ', response)
  })
