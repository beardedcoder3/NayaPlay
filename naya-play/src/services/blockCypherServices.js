import axios from 'axios';

const BLOCKCYPHER_TOKEN = '4f723f0d6369421d87d3766f396bc546';
const BLOCKCYPHER_API = 'https://api.blockcypher.com/v1';

export const checkAddressBalance = async (address, crypto = 'btc') => {
  try {
    const response = await axios.get(
      `${BLOCKCYPHER_API}/${crypto}/main/addrs/${address}/balance`,
      {
        params: { token: BLOCKCYPHER_TOKEN }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking balance:', error);
    throw error;
  }
};

export const getCryptoPrice = async (crypto = 'btc') => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: crypto === 'btc' ? 'bitcoin' : 'tether',
          vs_currencies: 'usd'
        }
      }
    );
    return response.data[crypto === 'btc' ? 'bitcoin' : 'tether'].usd;
  } catch (error) {
    console.error('Error fetching price:', error);
    return crypto === 'btc' ? 40000 : 1;
  }
};