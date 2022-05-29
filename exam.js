const fs = require("fs");

const amounts = [4, -2, -1, 5, -3, 1, 2.5, -2, 5, 1, -5.6];
const prices = [
  5000, 6500, 7000, 6000, 8000, 9000, 6500, 5200, 4500, 6500, 9000,
];

// -------------------------------------------- CODIGO HECHO EN VIVO DURANTE EL EXAMEN -------------------------------------------------------- //

let total_inversion = 0;

if (amounts.length == prices.length) {
  for (let i = 0; i < amounts.length; i++) {
    if (amounts[i] > 0) {
      // after the examam  i noticed i had to use amount instead of price[i] I changed it post exam
      const inversion_by_period = amounts[i] * prices[i];
      total_inversion = total_inversion + inversion_by_period;
    }
  }

  console.log("total cost is ", total_inversion);
} else {
  console.log("there is some data missing");
}

const total_inventory = amounts.reduce((x, y) => x + y, 0);
console.log(
  "total_BTC ", // HERE IN THE EXAM I loged total_cost which i saw is lissleading, I changed it post exam
  total_inventory
);

const buys = amounts.filter((x) => x >= 0).reduce((x, y) => x + y, 0);

const sells = -amounts.filter((x) => x <= 0).reduce((x, y) => x + y, 0);
console.log("sold btc", sells);
console.log("bought btc", buys);

//const check = buys - sells == amounts.reduce((x, y) => x + y, 0);

//console.log(check);

// -------------Aqui estaba intentando carcular COGS Usando exactamente la formaula del ejemplo, la cual me explico posteriormente Carlos que no aplica------------------

/*let CostofGoodsSold_FIFO = 0;
let partialSell = 0;

const sells_events = amounts.filter((x) => x <= 0);

const sells_prices = buy_events.map((x, i) => prices[i]);

console.log(buy_events, buy_prices);



for (let i = 0; i < buy_events.length; i++) {
  if (partialSell <= sells) {
    const partialCOGS = buy_events[i] * buy_prices[i];

    CostofGoodsSold_FIFO = CostofGoodsSold_FIFO + partialCOGS;
    partialSell = partialSell + 

    //partialSell =
  }
} */

// --------------------------------------------------CODIGO HECHO POSTERIOR AL EXAMEN--------------------------------------------------------------------------//

// -----------------------NUEVO CALCULO DE COGS tomando en cuenta el precio de venta -------------------------------------//

const MODELS = ["FIFO", "LIFO"];

// This class keeps record of each time we Bought BTC and keeps track of how much have we sold of the amount

class BTC_purchase {
  constructor(timeOfEntry, priceOfEntry, amountOfBTC) {
    this.price_of_entry = priceOfEntry; // the price at the moment we bought
    this.time_of_entry = timeOfEntry; // the time at wich we bought  We are asuming the time is the index of both series and treating it as unitary
    this.amountOFentry = amountOfBTC; // the amount we bought
    this.amountSold = 0;
    // how much have we sold
  }
  remaining_amount() {
    //method for fetching the amount remaining from this entry
    return this.amountOFentry + this.amountSold;
  }

  sell_btc(amount) {
    // amount is a negative number wich absolute value is the selled amount
    // method for selling it updates the amount it returns the amount that was not posible to cover with this purchase, maybe we are asked to sell 5 when this purchase was only of 4 then it returns 1 its the "change"
    if (amount < 0) {
      // Check for avoiding misleading results
      if (this.remaining_amount() + amount >= 0) {
        // if there
        this.amountSold = this.amountSold + amount;
        return 0;
      }

      if (this.remaining_amount() + amount < 0) {
        const change = this.remaining_amount() + amount;
        this.amountSold = -this.amountOFentry;
        return change;
      }
    } else {
      throw Error("The buy method expects a negative number");
    }
  }
}

/*  //Run to test the class methods

const test = new BTC_purchase(1, 6000, 5);
console.log(test);
console.log(test.sell_btc(-6));
console.log(test.sell_btc(-8));
console.log(test);
console.log(test.remaining_amount());

*/

MODELS.forEach((MODEL) => {
  let logOut = `./Cogs_and_Profit_Calculations_${MODEL}.txt`;
  let BTC_total_entries_record = [];

  let total_COGS = 0;
  let total_profit = 0;

  for (let i = 0; i < amounts.length; i++) {
    // We iterate over time
    let COGS = 0;
    if (amounts[i] > 0) {
      // When amount is positive we add a new entry to the record

      if (MODEL === "FIFO") {
        // We apend the  purchase at last in the list of purchased to be filled

        BTC_total_entries_record = [
          ...BTC_total_entries_record,
          new BTC_purchase(i, prices[i], amounts[i]),
        ];
      }
      if (MODEL === "LIFO") {
        // We apend   purchase at the begining in the list of purchased to be filled

        BTC_total_entries_record = [
          new BTC_purchase(i, prices[i], amounts[i]),
          ...BTC_total_entries_record,
        ];
      }
    }
    if (amounts[i] < 0) {
      let remainingAmountTosell = amounts[i]; // the amount we want to sell at the time i

      //console.log(BTC_total_entries_record[0].remaining_amount());

      const BTC_amount_available = BTC_total_entries_record.reduce((x, y) => {
        // We sum over all our purchase the amount in each one

        //console.log(y);
        return x + y.remaining_amount();
      }, 0);

      if (amounts[i] + BTC_amount_available < 0) {
        // A quick check to see if we had enought BTC to sell at that moment
        throw Error(
          "Something is wrong with historical data  it  was not posible to sell this amount of BTC at this time !"
        );
      } else {
        let COGS = 0;

        fs.writeFileSync(
          logOut,
          `------------------   At time ${i} we had the following sales from the inventory  ---------------------- ` +
            "\n",
          { flag: "a" }
        );
        for (let j = 0; j < BTC_total_entries_record.length; j++) {
          //console.log(BTC_total_entries_record);
          // We go one by one of our purchases at that time to cover the remaining amount to Sell
          //console.log(i, j, BTC_total_entries_record);
          //console.log(remainingAmountTosell, j);

          const requestedAmount = remainingAmountTosell;

          // Here we update each purchase in the order acording to each model the fist purchases are sol first in FIFO. And  the last are spend first in LIFO

          remainingAmountTosell = BTC_total_entries_record[j].sell_btc(
            remainingAmountTosell
          );

          const amount_sold = requestedAmount - remainingAmountTosell;
          //console.log(i, j, BTC_total_entries_record);

          const price_of_sell = prices[i];
          const prices_of_entry = BTC_total_entries_record[j].price_of_entry;
          COGS = COGS + prices_of_entry * amount_sold;

          fs.writeFileSync(
            logOut,
            `Whe sold  ${-amount_sold} BTC of the BTC bought at time ${
              BTC_total_entries_record[j].time_of_entry
            } at a price of ${price_of_sell}.
           ` + "\n",
            { flag: "a" }
          );

          if (remainingAmountTosell === 0) {
            break;
          }
        }

        const profit = -amounts[i] * prices[i] + COGS; // We withdraw from the total money of the BTC Sold, the money needed to generate this BTC sold
        total_profit = profit + total_profit; //Update the total profit
        total_COGS = total_COGS - COGS;
        fs.writeFileSync(
          logOut,
          `---------------The invetory resume for this period----------------- ` +
            "\n",
          { flag: "a" }
        );

        fs.writeFileSync(
          logOut,
          `The initial BTC inventory is ${BTC_amount_available}. We sold a total of ${-amounts[
            i
          ]} BTC, the cost for adquiring the sold BTC (COGS) is ${-COGS}. The profit generated in this period is ${profit} ` +
            "\n",
          { flag: "a" }
        );
      }
    }
  }

  fs.writeFileSync(
    logOut,
    `---------------TOTAL INVENTORY RESUME ----------------- ` + "\n",
    { flag: "a" }
  );

  fs.writeFileSync(
    logOut,
    `The the total COGS  is   ${total_COGS}.` +
      "\n" +
      `The total Profit taking into acount at wich price we sold each BTC is ${total_profit}`,
    { flag: "a" }
  );
});
/* console.log(
  `The the total COGS  is   ${total_COGS}.` +
    "\n"`The total Profit is ${total_profit}`
); */

//console.log(BTC_total_entries_record);

//console.log(BTC_total_entries_record);

//throw Error;

//Run this commands in order to test the Class method sell_btc
