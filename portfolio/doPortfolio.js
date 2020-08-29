require('isomorphic-fetch');
require('dotenv').config();
const { API_KEY } = process.env;
const moment = require('moment');

const asteriskWidth = 50;

const resolution = 'D'; // for the API
const units = 'days'; // for moment

const nowDate = parseInt(moment().valueOf() / 1000);
const fromDate = parseInt(moment().subtract(5, units).valueOf() / 1000)

const portfolioOne = {
  date: nowDate,
  portfolio: [
    { company: 'TDOC', quantity: 12 },
    { company: 'IAU', quantity: 175 },
    { company: 'IHI', quantity: 8 },
    { company: 'IVV', quantity: 51 }
  ]
}

const getRawPortfolioItemData = (portfolioItem, date) => {
  const { company } = portfolioItem;
  const candlesUrl = `https://finnhub.io/api/v1/forex/candle?symbol=${company}&resolution=${resolution}&from=${date}&to=${nowDate}&token=${API_KEY}`;
  return fetch(candlesUrl).then(async response => await response.json());
}

const getMaxPortfolioPositionValue = portfolioDataArray => {
  const positionValues = portfolioDataArray.map(item => item.quantity * item.c[0]);
  let maxPositionValue = 0;
  for (let i = 0; i < positionValues.length; i++) {
    const thisPositionValue = positionValues[i];
    if (thisPositionValue > maxPositionValue) {
      maxPositionValue = thisPositionValue;
    }
  }

  return maxPositionValue;
}

const getTotalPortfolioValue = portfolioDataArray => {
  const positionValues = portfolioDataArray.map(item => item.quantity * item.c[0]);
  const totalPortfolioValue = positionValues.reduce((accum, value) => accum + value);
  return totalPortfolioValue;
}

const roundToTwoDecimals = num => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}


const printFinalPortfolioItem = (finalPortfolioItem, maxPositionValue) => {
  const { quantity, c, company } = finalPortfolioItem;
  const price = c[0];
  const positionValue = quantity * c[0];
  const asterisksToPrintNum = Math.floor((positionValue / maxPositionValue) * asteriskWidth);

  let spacerOne = '';
  while (company.length + spacerOne.length < 4) {
    spacerOne += ' ';
  }
  const infoTextOne = `${company}${spacerOne}: ${quantity} * $${price} =`;

  let spacerTwo = '';
  while (infoTextOne.length + spacerTwo.length < 22) {
    spacerTwo += ' ';
  }

  let asterisks = '';
  while (asterisks.length < asterisksToPrintNum) {
    asterisks += '*';
  }

  const infoTextTwo = `${infoTextOne}${spacerTwo}$${roundToTwoDecimals(positionValue)}`;

  let spacerThree = '';
  while (infoTextTwo.length + spacerThree.length < 32) {
    spacerThree += ' ';
  }
  const infoTextThree = `${infoTextTwo}${spacerThree}|| ${asterisks}`;

  console.log(infoTextThree)

}



const printPortfolio = (portfolioDataArray, date) => {
  const maxPositionValue = getMaxPortfolioPositionValue(portfolioDataArray);
  const totalPortfolioValue = getTotalPortfolioValue(portfolioDataArray);
  console.log('=========')
  console.log('portfolio on date: ', moment(date).format('YYYY-MM-DD'))
  console.log(`totalPortfolioValue: $${totalPortfolioValue}`);
  console.log(`maxPositionValue: $${maxPositionValue}`);
  console.log(' ');

  portfolioDataArray.forEach(finalPortfolioItem => {
    printFinalPortfolioItem(finalPortfolioItem, maxPositionValue);
  });

  console.log('=========')
  console.log(' ')
}


const doPortfolio = portfolioObj => {
  const { date, portfolio } = portfolioObj;
  const rawPortfolioPromises = portfolio.map(portfolioItem => getRawPortfolioItemData(portfolioItem, date));

  const mergeApiDataWithPortfolioObj = (item, i) => {
    return Object.assign({}, item, portfolio[i]);
  }

  Promise.all(rawPortfolioPromises).then(rawPortfolioApiDataArray => {
    const portfolioDataArray = rawPortfolioApiDataArray.map(mergeApiDataWithPortfolioObj);
    printPortfolio(portfolioDataArray);
  });
}

doPortfolio(portfolioOne);
