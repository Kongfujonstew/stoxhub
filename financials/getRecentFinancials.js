require('isomorphic-fetch');
require('dotenv').config();
const moment = require('moment');
const { API_KEY } = process.env;

// tweakable settings
const companyFromArgs = process.argv[2];

const company = companyFromArgs || 'UFO';
const yearsBackNum = 3;
const yearsForwardNum = 7;
const futureGrowthRate = 10;

const financialsUrl = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${company}&token=${API_KEY}`;

// ic helpers
const matchRevenue = item => {
  return Boolean(
    item.concept === 'RevenueFromContractWithCustomerExcludingAssessedTax' ||
    item.label === 'Revenues' ||
    item.label === 'Revenue' ||
    item.concept === 'SalesRevenueNet'
  )
}

const matchOperatingIncome = item => {
  // console.log('item: ', item)
  return Boolean(
    item.label === 'Income from operations' ||
    item.concept === 'OperatingIncomeLoss' ||
    item.label === 'Gross profit'
  )
}


const matchNetIncomeLoss = item => {
  return Boolean (
    item.concept === 'NetIncomeLoss' ||
    item.label === 'Net income' ||
    item.lable === 'NET INCOME'
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

const getRevenue = ic => {
  const revenue = ic.find(matchRevenue);
  // if (!revenue) {
  //   console.log('missing revenue: ')
  //   console.log(ic)
  // }

  return revenue ? revenue.value : 'not available';
}

const getOperatingIncome = ic => {
  const operatingIncome = ic.find(matchOperatingIncome);
  return operatingIncome ? operatingIncome.value : 'not available'
}

const getNetIncome = ic => {
  const netIncome = ic.find(matchNetIncomeLoss);
  return netIncome ? netIncome.value : 'not available';
}

const roundToTwoDecimals = num => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

const printNameAndValue = (name, value) => {
  let spacer = ':';
  while (name.length + spacer.length < 19) {
    spacer += ' ';
  }

  console.log(`${name}${spacer}${value}`);
}

const printReport = item => {
  const { report: { ic = [] }, year =' ', quarter = '', form = '', startDate = '' } = item;
  const revenue = getRevenue(ic);
  const operatingIncome = getOperatingIncome(ic);
  const netIncome = getNetIncome(ic);


  console.log(`============= ${year} - ${form === '10-Q' ? 'Q-' + quarter : ''} ${form} - (starting ${startDate.slice(0, 10)}):`);

  printNameAndValue('Revenue', revenue / 1000000)
  printNameAndValue('Operating income', operatingIncome / 1000000);
  printNameAndValue('Gross margin ', `${roundToTwoDecimals((operatingIncome / revenue) * 100)}%`)
  printNameAndValue('Net income', netIncome / 1000000)
  printNameAndValue('Net margin ', `${roundToTwoDecimals((netIncome / revenue) * 100)}%`)

  console.log('=============')
  console.log(' ')

}

const doQuarters = data => {
  console.log('********** QUARTER DATA - RECENT FIVE QUARTERS **********')
  const lastFiveQuarters = data.filter(item => item.form === '10-Q').slice(0, 5).reverse();

  lastFiveQuarters.forEach(item => printReport(item));
  console.log(' ')
}

const doYears = data => {
  console.log('********** Year DATA - RECENT FIVE Years **********')
  const lastFiveYears = data.filter(item => item.form === '10-K').slice(0, 5).reverse();

  lastFiveYears.forEach(item => printReport(item));
}




fetch(financialsUrl + '&freq=quarterly')
  .then(async response => {
    const data = await response.json();
    // console.log('Data retrieved with number of years: ', data.data.length);
    // console.log(data.data)
    if (data.data.length) {
      doQuarters(data.data);
      // doYears(data.data);
    }
    // data.data.forEach(item => console.log(item))
  })
  .catch(async response => {
    console.log('error: ', response)
  })



fetch(financialsUrl)
  .then(async response => {
    const data = await response.json();
    // console.log('Data retrieved with number of years: ', data.data.length);
    // console.log(data.data)
    if (data.data.length) {
      // doQuarters(data.data);
      doYears(data.data);
    }
    // data.data.forEach(item => console.log(item))
  })
  .catch(async response => {
    console.log('error: ', response)
  })
