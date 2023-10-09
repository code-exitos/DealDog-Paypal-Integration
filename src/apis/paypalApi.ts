import Config from 'react-native-config';
const base64 = require('base-64');

const clientId = Config.PAYPAL_CLIENT_ID;
const secretKey = Config.PAYPAL_SECRET_KEY;

const orderDetail = {
  intent: 'CAPTURE',
  purchase_units: [
    {
      items: [
        {
          name: 'T-Shirt',
          description: 'Green XL',
          quantity: '1',
          unit_amount: {
            currency_code: 'USD',
            value: '100.00',
          },
        },
      ],
      amount: {
        currency_code: 'USD',
        value: '100.00',
        breakdown: {
          item_total: {
            currency_code: 'USD',
            value: '100.00',
          },
        },
      },
    },
  ],
  application_context: {
    return_url: 'https://example.com/return',
    cancel_url: 'https://example.com/cancel',
  },
};

const generateToken = (): Promise<string> => {
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
        resolve(result.access_token.toString());
      })
      .catch(error => {
        reject(error);
      });
  });
};

const createOrder = ({token = ''}) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Authorization', `Bearer ${token}`);

  var requestOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(orderDetail),
  };

  return new Promise((resolve, reject) => {
    fetch(`${Config.PAYPAL_BASE_URL}/v2/checkout/orders`, requestOptions)
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
  createOrder,
};
