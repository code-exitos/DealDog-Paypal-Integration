import Config from 'react-native-config';
const base64 = require('base-64');

const clientId = Config.PAYPAL_CLIENT_ID;
const secretKey = Config.PAYPAL_SECRET_KEY;

const generateToken = () => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/x-www-form-urlencoded');
  headers.append(
    'Authorization',
    'Basic ' + base64.encode(`${clientId}:${secretKey}`),
  );

  var requestOptions = {
    method: 'POST',
    headers: headers,
    body: 'grant_type=client_credentials',
  };

  return new Promise((resolve, reject) => {
    fetch(`${Config.PAYPAL_BASE_URL}/v1/oauth2/token`, requestOptions)
      .then(response => response.json())
      .then(result => {
        resolve(result.access_token);
      })
      .catch(error => {
        reject(error);
      });
  });
};

export default {
  generateToken,
};
