const axios = require('axios').default;
const AWS = require('aws-sdk');

const lambda = new AWS.Lambda();

module.exports.handler = async (event, context) => {
  let nextPage = event.nextPage || 1;
  let totalPages;

  try {
    do {
      console.log('Processing next page...')

      const response = await axios.get(
        `https://reqres.in/api/users?page=${nextPage}`
      );

      nextPage = response.data.page + 1;
      totalPages = response.data.total_pages;

      console.log(`Response for ${response.data.page}:`, response.data.data);
    } while (
      nextPage <= totalPages &&
      context.getRemainingTimeInMillis() > 10000
    );

    if (nextPage <= totalPages) {
      const newEvent = Object.assign(event, { nextPage });

      await recurse(newEvent);

      return `Invoking for page ${nextPage}`;
    }

    return 'All Done';
  } catch (error) {
    throw error;
  }
};

const recurse = async payload => {
  const req = {
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    InvocationType: 'Event',
    Payload: JSON.stringify(payload),
  };

  console.log('Recursing...', req);
  const response = await lambda.invoke(req).promise();
  console.log('Invocation complete', response);

  return response;
};
