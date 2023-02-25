const API_KEY =
  "bc114e8d5a851c5ff1b5bd8eeeae629d2141bbd1d6a12f08b0fc38aee0e76a34";
const AGGREGATE_INDEX = "5";
const INVALID__SUB_INDEX = "500";

const cardHandlers = new Map();
const invalidCards = new Map();

const getCard = (cardName, price) => {
  return {
    name: cardName,
    price: price,
    isUpdated: false,
  };
};

const btcCard = getCard("BTC", 1);

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`,
);

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    PARAMETER: params,
  } = JSON.parse(e.data);

  if (type === INVALID__SUB_INDEX) {
    const invalidCard = params.split("~")[2];
    // debugger;
    if (!invalidCards.has("BTC")) {
      subscribeToCardOnWs(btcCard.name);
    }

    if (!invalidCards.has(invalidCard) && invalidCard !== btcCard.name) {
      const currentInvalidCard = getCard(invalidCard, 1);
      invalidCards.set(currentInvalidCard.name, currentInvalidCard);
      subscribeOnCardToBtcOnWs(invalidCard);
      return;
    }
  }

  if (type === AGGREGATE_INDEX) {
    // debugger;
    if (btcCard.name === currency) {
      btcCard.price = newPrice;
      btcCard.isUpdated = true;

      invalidCards.forEach((card) => {
        if (!card.isUpdated) return;
        const handlers = cardHandlers.get(card.name);

        handlers?.forEach((fn) => {
          fn(card.price * btcCard.price);
        });
      });
    }

    const handlers = cardHandlers.get(currency) ?? [];

    if (invalidCards.has(currency) && currency !== btcCard.name) {
      if (!btcCard.isUpdated) return;

      const convertedPrice = btcCard.price * newPrice;
      const editedInvalidCard = invalidCards.get(currency);

      editedInvalidCard.price = newPrice;
      editedInvalidCard.isUpdated = true;

      invalidCards.set(currency, editedInvalidCard);
      handlers.forEach((fn) => fn(convertedPrice));
      return;
    }

    handlers.forEach((fn) => fn(newPrice));
  }
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === socket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true },
  );
}

export const subscribeToCard = (cardNme, cb) => {
  const subscribers = cardHandlers.get(cardNme) || [];

  cardHandlers.set(cardNme, [...subscribers, cb]);
  subscribeToCardOnWs(cardNme);
};

export const unsubscribeToCard = (cardNme) => {
  cardHandlers.delete(cardNme);
  unsubscribeToCardOnWs(cardNme);
};

function subscribeToCardOnWs(cardName) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${cardName}~USD`],
  });
}

function subscribeOnCardToBtcOnWs(cardName) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${cardName}~BTC`],
  });
}

function unsubscribeToCardOnWs(cardName) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${cardName}~USD`],
  });
}

export const getAllCards = async () => {
  const response = await fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true",
  );
  const json = await response.json();
  return Object.keys(json.Data);
};

window.cards = cardHandlers;
window.invalidCards = invalidCards;
