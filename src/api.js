const API_KEY =
  "bc114e8d5a851c5ff1b5bd8eeeae629d2141bbd1d6a12f08b0fc38aee0e76a34";

// TODO URL.searchParams
export const loadCards = (cardName) =>
  // const url = new URL('https://min-api.cryptocompare.com/data/price')
  // url.searchParams.set('fsym', cardName)
  fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=${cardName}&tsyms=USD&api_key=${API_KEY}`,
  ).then((res) => res.json());
