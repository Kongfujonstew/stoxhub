require('isomorphic-fetch');
require('dotenv').config();
const moment = require('moment');
const { API_KEY } = process.env;

// tweakable settings
const company = 'GOOG';
const yearsBackNum = 3;
const yearsForwardNum = 7;
const futureGrowthRate = 10;

const financialsUrl = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${company}&token=${API_KEY}`;

// these should go into a helpers file
const matchNetIncomeLoss = item => {
  return Boolean (
    item.concept === 'NetIncomeLoss' ||
    item.label === 'Net income'
  )
}

const matchShares = item => {
  return Boolean (
    item.unit === 'shares'
  )
}

const matchEarningsPerShare = item => {
  return Boolean (
    item.concept === 'EarningsPerShareBasic' ||
    item.label === 'Basic (in dollars per share)' ||
    item.label.match('Earnings Per Share')
  )
}

const getEPSFromReport = report => {
  // TODO
  const { ic, cf, bs } = report;
  const epsObj = ic.find(matchEarningsPerShare);
  if (!epsObj) {
    console.log('* No EPS found in ic, doing calc from ic and bs . . .')
    // for some reason, shares outstanding is in ic for BYND
    const icAndBsTogether = ic.concat(bs);
    // ic does not have eps!
    const sharesOutstanding = icAndBsTogether.find(matchShares).value;
    // console.log('sharesOutstanding: ', sharesOutstanding)
    const earnings = cf.find(matchNetIncomeLoss).value;
    // console.log('earnings: ', earnings)

    if (sharesOutstanding && earnings) {
      const epsValue = earnings / sharesOutstanding;
      console.log('weirdly calculated eps val: ', epsValue);
      return epsValue;
    }
  }

  return epsObj.value;
}

const getEarningsFromReport = report => {
  const { ic, cf } = report;

  // TODO
  const earningsObj =
    ic.find(matchNetIncomeLoss) ||
    cf.find(matchNetIncomeLoss);

  if (!earningsObj) {
    console.log('here is this ic:')
    console.log(ic)
    throw 'No earnings data or income statement in this report'
  }

  return earningsObj.value;
}

const calcuateGrowthFromStartAndEnd = (start, end) => {
  const sign = start > 0 ? 1 : -1;
  const diff = end - start;
  const growth = (diff / start) * sign;
  return growth;
}

const calculateAverageFromTotalAndNumber = (total, number) => {
  return total / number;
}

const calculatePercentageFromDecimal = decimal => {
  return decimal * 100;
}

const calculateDecimalFromRate = rate => {
  return rate / 100;
}

const calculateGrowthRateFromTwoValuesAndNumberPeriods = (valueOne, valueTwo, periods) => {
  const ratio = valueTwo / valueOne;
  const resultPlusOne = Math.pow(ratio, 1 / periods);
  const result = resultPlusOne - 1;
  console.log('=========');
  console.log('RETURN RATE: ', result);
  console.log(' ');

  return result;
}

// this starts the magic here
const calculateGrowthFromTenKData = tenKData => {
  let periods = yearsBackNum;
  let totalGrowth = 0;
  let noDataOffset = 0;

  console.log(`1) Reviewing 10k data for prior ${yearsBackNum}  years and adding growth`)

  while (periods) {
    console.log('periods: ', periods)
    const currentPeriodIndex = yearsBackNum - periods;
    const prevPeriodIndex = yearsBackNum - periods + 1;
    if (!tenKData.data[currentPeriodIndex] || !tenKData.data[prevPeriodIndex]) {
      break;
    }
    const currentEarnings = getEarningsFromReport(tenKData.data[currentPeriodIndex].report);
    const prevEarnings = getEarningsFromReport(tenKData.data[prevPeriodIndex].report);
    console.log('=========')
    console.log('current year: ', tenKData.data[currentPeriodIndex].year)
    console.log('currentEarnings: ', currentEarnings)
    console.log('prev year: ', tenKData.data[prevPeriodIndex].year)
    console.log('prevEarnings: ', prevEarnings)
    const thisPeriodGrowth = calcuateGrowthFromStartAndEnd(prevEarnings, currentEarnings);
    console.log('thisPeriodGrowth: ', thisPeriodGrowth)
    console.log(' ')
    totalGrowth += thisPeriodGrowth;
    periods--;
  }



  const averageGrowth = calculateAverageFromTotalAndNumber(totalGrowth, yearsBackNum - periods);
  const growthInDecimal = calculatePercentageFromDecimal(averageGrowth);

  return growthInDecimal;
}

const calculateGrahamValueFromGrowthAndEPS = (eps, growth) => {
  const value = ( 8.5 + ( 2 * growth ) ) * eps;
  return value;
}

// ( 8.5 + 2 x g ) x EPS
const calculateGrahamValueFromTenKData = tenKData => {
  if (tenKData.data.length < 2) {
    throw 'Less than two years of data in 10k, cannot perform calculateGrahamValueFromTenKData'
  }
  const mostRecentReport = tenKData.data[0].report;
  console.log('mostRecentReport: ', mostRecentReport)
  const eps = getEPSFromReport(mostRecentReport); // number
  const growth = calculateGrowthFromTenKData(tenKData)
  const value = calculateGrahamValueFromGrowthAndEPS(eps, growth)

  console.log('=========')
  console.log('GRAHAM VALUE CURRENT')
  console.log('most recent eps: ', eps)
  console.log(`calculated growth over next ${yearsBackNum} years:`, growth)
  console.log('result current stock value: ', value)
  console.log(' ')

  return value;
}

const calculateFutureValueFromTenKDataGivenYearsAndGrowthRate = (tenKData, growth = futureGrowthRate, years = yearsForwardNum) => {
  const mostRecentReport = tenKData.data[0].report;
  const eps = getEPSFromReport(mostRecentReport); // number
  const factor = 1 + calculateDecimalFromRate(growth);
  let futureEPS = eps;


  while (years--) {
    // console.log('futureEPS:', futureEPS)
    const sign = futureEPS > 0 ? 1 : -1;
    futureEPS = sign === 1 ? futureEPS * factor : futureEPS - ( futureEPS / factor );
  }

  const value = calculateGrahamValueFromGrowthAndEPS(futureEPS, growth)

  console.log('=========')
  console.log('GRAHAM VALUE FUTURE')
  console.log('most recent eps: ', eps)
  console.log(`assumed/ forecasted growth over next ${yearsForwardNum} years:`, growth)
  console.log(`future eps: `, futureEPS)
  console.log('result future stock value: ', value)
  console.log(' ')

  return value;
}

fetch(financialsUrl)
  .then(async response => {
    const data = await response.json();
    console.log('Data retrieved with number of years: ', data.data.length);
    const currentValue = calculateGrahamValueFromTenKData(data);
    const futureValue = calculateFutureValueFromTenKDataGivenYearsAndGrowthRate(data);
    const returnRate = calculateGrowthRateFromTwoValuesAndNumberPeriods(currentValue, futureValue, futureGrowthRate);
  })
  .catch(async response => {
    console.log('error: ', response)
  })
