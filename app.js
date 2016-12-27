const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');
const { BONDORA_CLIENT_ID, BONDORA_CLIENT_SECRET } = require('./envs.json');

const PORT = process.env.PORT || 3000;

const app = express();

const sleep = async (timeout) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
};

app.use(bodyParser.json());

app.get('/oauth', (req, res) => {
  res.redirect(`https://www.bondora.com/oauth/authorize?response_type=code&client_id=${ BONDORA_CLIENT_ID }&scope=Investments%20ReportCreate%20ReportRead`);
});

app.get('/callback', async (req, res) => {
  try {
    const response = await axios.post('https://api.bondora.com/oauth/access_token', {
      'grant_type': 'authorization_code',
      'client_id': BONDORA_CLIENT_ID,
      'client_secret': BONDORA_CLIENT_SECRET,
      'code': req.query.code
    });
    res.send({ accessToken: response.data.access_token });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.post('/report', async (req, res) => {
  const now = moment();
  const periodStart = req.body.periodStart || now.startOf('day').format();
  const periodEnd = req.body.periodEnd || now.endOf('day').format();

  const resFuturePayments = await axios.post('https://api.bondora.com/api/v1/report', {
    ReportType: '3',
    PeriodStart: periodStart,
    PeriodEnd: periodEnd
  }, { headers: { Authorization: req.headers.authorization } });
  await sleep(1500);

  const resRepayments = await axios.post('https://api.bondora.com/api/v1/report', {
    ReportType: '4',
    PeriodStart: periodStart,
    PeriodEnd: periodEnd
  }, { headers: { Authorization: req.headers.authorization } });

  res.send({
    futurePaymentsReportId: resFuturePayments.data.Payload.ReportId,
    repaymentsReportId: resRepayments.data.Payload.ReportId,
    periodStart,
    periodEnd
  });
});

app.get('/report/:reportId', async (req, res) => {
  const resReport = await axios.get(`https://api.bondora.com/api/v1/report/${ req.params.reportId }`,
    { headers: { Authorization: req.headers.authorization } });

  res.send(resReport.data);
});

app.listen(PORT, () => {
  console.log('Listening to 0.0.0.0:' + PORT);
});