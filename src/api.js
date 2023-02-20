const API_KEY =
  "bc114e8d5a851c5ff1b5bd8eeeae629d2141bbd1d6a12f08b0fc38aee0e76a34";

const cardHandlers = new Map();

// todo: refactor to use URLSearchParams
export const loadCards = () => {
  if (!cardHandlers.size) {
    return;
  }

  fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
      ...cardHandlers.keys(),
    ].join(",")}&tsyms=USD&api_key=${API_KEY}`,
  )
    .then((res) => res.json())
    .then((rowData) => {
      const updatedPrices = Object.fromEntries(
        Object.entries(rowData).map(([key, value]) => [key, value.USD]),
      );

      Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
        const handlers = cardHandlers.get(currency) ?? [];
        handlers.forEach((fn) => fn(newPrice));
      });
    });
};

export const getAllCards = () =>
  fetch("https://min-api.cryptocompare.com/data/all/coinlist?summary=true")
    .then((res) => res.json())
    .then((json) => Object.keys(json.Data));

export const subscribeToCard = (cardNme, cb) => {
  const subscribers = cardHandlers.get(cardNme) || [];

  cardHandlers.set(cardNme, [...subscribers, cb]);
};

export const unsubscribeToCard = (cardNme, cb) => {
  const subscribers = cardHandlers.get(cardNme) || [];
  cardHandlers.set(
    cardNme,
    subscribers.filter((item) => item !== cb),
  );
};

setInterval(loadCards, 5000);
