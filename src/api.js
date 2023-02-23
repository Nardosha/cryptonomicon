const API_KEY =
  "bc114e8d5a851c5ff1b5bd8eeeae629d2141bbd1d6a12f08b0fc38aee0e76a34";
const AGREGATE_INDEX = "5";
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
  if (type !== AGREGATE_INDEX || !newPrice) return;

  // debugger;
  const handlers = cardHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
  console.log(e);
});

function subscribeToCardOnWs(cardName) {
  const message = JSON.stringify({
    action: "SubAdd",
    subs: [`5~CCCAGG~${cardName}~USD`],
  });

  if (socket.readyState === socket.OPEN) {
    socket.send(message);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(message);
    },
    { once: true },
  );
}

export const getAllCards = () =>
  fetch("https://min-api.cryptocompare.com/data/all/coinlist?summary=true")
    .then((res) => res.json())
    .then((json) => Object.keys(json.Data));

export const subscribeToCard = (cardNme, cb) => {
  const subscribers = cardHandlers.get(cardNme) || [];

  cardHandlers.set(cardNme, [...subscribers, cb]);
  subscribeToCardOnWs(cardNme);
};

export const unsubscribeToCard = (cardNme, cb) => {
  const subscribers = cardHandlers.get(cardNme) || [];
  cardHandlers.set(
    cardNme,
    subscribers.filter((item) => item !== cb),
  );
};

window.cards = cardHandlers;
//socket.send(JSON.stringify({"action": "SubAdd", subs: ["5~CCCAGG~BTC~USD"]}))
