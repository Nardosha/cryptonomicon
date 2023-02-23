const API_KEY =
  "bc114e8d5a851c5ff1b5bd8eeeae629d2141bbd1d6a12f08b0fc38aee0e76a34";
const AGGREGATE_INDEX = "5";
const cardHandlers = new Map();

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`,
);

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
  } = JSON.parse(e.data);
  if (type !== AGGREGATE_INDEX || !newPrice) return;

  const handlers = cardHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
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
