require('isomorphic-fetch');
require('dotenv').config();
const { API_KEY } = process.env;
const moment = require('moment');

const companyFromArgs = process.argv[2];

const company = companyFromArgs || 'UFO';
const units = 'days'; // for moment

console.log('Getting news for company: ', company)


const nowDate = moment().format('YYYY-MM-DD');
const fromDate = moment().subtract(14, units).format('YYYY-MM-DD');

console.log('nowDate: ', nowDate)
console.log('fromDate: ', fromDate)

const newsUrl = `https://finnhub.io/api/v1/company-news?symbol=${company}&from=${fromDate}&to=${nowDate}&token=${API_KEY}`;

console.log(' ')

const printNameAndValue = (name, value) => {
  let spacer = ':';
  while (name.length + spacer.length < 12) {
    spacer += ' ';
  }

  console.log(`${name}${spacer}${value}`);
}

const printNewsData = item => {
  const { datetime, headline, source, summary, url } = item;
  console.log('==========')
  printNameAndValue('Date', moment(datetime * 1000).format('YYYY-MM-DD'));
  printNameAndValue('Headline', headline);
  printNameAndValue('Source', source);
  printNameAndValue('Summary', summary);
  printNameAndValue('Url', url);

  console.log(' ')
}

const doit = data => {
  console.log('Number of results:', data.length)

  data.reverse().forEach(item => printNewsData(item))
}

fetch(newsUrl)
  .then(async response => {
    const data = await response.json();
    doit(data);
    // console.log('data: ', data)
  })
