import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: GAME_CONFIG.AWS.REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  },
  API: {
    endpoints: [{
      name: 'crashAPI',
      endpoint: GAME_CONFIG.AWS.API_ENDPOINT,
      region: GAME_CONFIG.AWS.REGION
    }]
  }
});
