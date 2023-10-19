import Config from 'react-native-config';
const base64 = require('base-64');

const clientId = Config.PAYPAL_CLIENT_ID;
const secretKey = Config.PAYPAL_SECRET_KEY;
const bnCode = Config.PAYPAL_BN_CODE;

export interface CreateOrderResponse {
  id: string;
  links: Link[];
  status: string;
}

export interface Link {
  href: string;
  method: string;
  rel: string;
}

export type CapturePaymentParams = {
  id: string;
  token?: string;
  sellerPayerId: string;
};

const orderDetail = {
  intent: 'CAPTURE',
  purchase_units: [
    {
      items: [
        {
          name: 'T-Shirt',
          description: 'Red XL',
          quantity: '1',
          unit_amount: {
            currency_code: 'USD',
            value: '80.00',
          },
        },
        {
          name: 'Socks',
          description: 'Coca-Cola socks',
          quantity: '2',
          unit_amount: {
            currency_code: 'USD',
            value: '10.00',
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

const bodyPartner = {
  // tracking_id: 'TRACKING-ID',
  operations: [
    {
      operation: 'API_INTEGRATION',
      api_integration_preference: {
        rest_api_integration: {
          integration_method: 'PAYPAL',
          integration_type: 'THIRD_PARTY',
          third_party_details: {
            features: ['PAYMENT', 'REFUND'],
          },
        },
      },
    },
  ],
  products: ['EXPRESS_CHECKOUT'],
  legal_consents: [
    {
      type: 'SHARE_DATA_CONSENT',
      granted: true,
    },
  ],
};

const generateToken = async (): Promise<string> => {
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

const createOrder = async ({
  token = '',
  sellerPayerId = '',
}): Promise<CreateOrderResponse> => {
  const headers = new Headers();
  const assertionToken = await authAssertion(sellerPayerId);
  headers.append('Content-Type', 'application/json');
  headers.append('Authorization', `Bearer ${token}`);
  headers.append('PayPal-Auth-Assertion', assertionToken);
  headers.append('PayPal-Partner-Attribution', bnCode || '');

  var requestOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(orderDetail),
  };

  return new Promise((resolve, reject) => {
    fetch(`${Config.PAYPAL_BASE_URL}/v2/checkout/orders`, requestOptions)
      .then(response => response.json())
      .then(result => {
        resolve(result);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const capturePayment = async ({
  id,
  token = '',
  sellerPayerId = '',
}: CapturePaymentParams): Promise<CreateOrderResponse> => {
  const headers = new Headers();
  const assertionToken = await authAssertion(sellerPayerId);
  headers.append('Content-Type', 'application/json');
  headers.append('Authorization', `Bearer ${token}`);
  headers.append('PayPal-Auth-Assertion', assertionToken);
  headers.append('PayPal-Partner-Attribution', bnCode || '');

  var requestOptions = {
    method: 'POST',
    headers: headers,
  };

  return new Promise((resolve, reject) => {
    fetch(
      `${Config.PAYPAL_BASE_URL}/v2/checkout/orders/${id}/capture`,
      requestOptions,
    )
      .then(response => response.json())
      .then(result => {
        resolve(result);
      })
      .catch(error => {
        reject(error);
      });
  });
};

// generate Auth Assertion
async function authAssertion(sellerPayerId: string): Promise<string> {
  const jwt = getAuthAssertionValue(sellerPayerId);
  return jwt;
}
function getAuthAssertionValue(sellerPayerId: string) {
  const header = {
    alg: 'none',
  };
  const encodedHeader = base64url(header);
  const payload = {
    iss: clientId,
    payer_id: sellerPayerId,
  };
  const encodedPayload = base64url(payload);
  return `${encodedHeader}.${encodedPayload}.`;
}

function base64url(json: {alg?: string; iss?: string; payer_id?: string}) {
  return btoa(JSON.stringify(json))
    .replace(/[=]+$/, '')
    .replace(/+/g, '-')
    .replace(/\//g, '_');
}

const addPartner = async ({token = ''}): Promise<CreateOrderResponse> => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Authorization', `Bearer ${token}`);

  var requestOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(bodyPartner),
  };

  return new Promise((resolve, reject) => {
    fetch(
      `${Config.PAYPAL_BASE_URL}/v2/customer/partner-referrals`,
      requestOptions,
    )
      .then(response => response.json())
      .then(result => {
        resolve(result);
      })
      .catch(error => {
        reject(error);
      });
  });
};

export default {
  generateToken,
  createOrder,
  capturePayment,
  addPartner,
};
