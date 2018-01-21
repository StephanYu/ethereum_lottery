const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' });

  lottery.setProvider(provider);
});

describe('Lottery contract', () => {
  it('successfully deploys the contract', () => {
    assert.ok(lottery.options.address);
  });

  it('allows one player to enter the draw', async () => {
    let first_player = accounts[0];
    let sufficient_amount = web3.utils.toWei('0.1', 'ether');

    await lottery.methods.enterDraw().send({
      from: first_player,
      value: sufficient_amount
    });

    const players = await lottery.methods.fetchPlayers().call({
      from: first_player
    });

    assert.equal(first_player, players[0]);
    assert.equal(1, players.length);
  });

  it('allows multiple plays to enter the draw', async () => {
    let first_player = accounts[0];
    let second_player = accounts[1];
    let third_player = accounts[2];
    let sufficient_amount = web3.utils.toWei('0.1', 'ether');
    
    await lottery.methods.enterDraw().send({
      from: first_player,
      value: sufficient_amount
    });
    await lottery.methods.enterDraw().send({
      from: second_player,
      value: sufficient_amount
    });
    await lottery.methods.enterDraw().send({
      from: third_player,
      value: sufficient_amount
    });

    const players = await lottery.methods.fetchPlayers().call({
      from: first_player
    });

    assert(first_player, players[0]);
    assert(second_player, players[1]);
    assert(third_player, players[2]);
    assert(3, players.length);
  });
  
  it('requires a sufficient amount of ether to enter the draw', async () => {
    let first_player = accounts[0];
    let insufficient_amount = web3.utils.toWei('0', 'ether');

    try {
      await lottery.methods.enterDraw().send({
        from: first_player,
        value: insufficient_amount
      });
      assert(false);
    } catch(err) {
      assert(err);
    }
  });

  it('only the admin can pick the winner', async () => {
    let non_admin = accounts[1];
  
    try {
      await lottery.methods.pickWinner().send({
        from: non_admin
      });
      assert(false);
    } catch(err) {
      assert(err);
    }
  });

  it('sends the final balance to the winner', async () => {
    let player = accounts[0];
    let totalAmount = web3.utils.toWei('2', 'ether');

    await lottery.methods.enterDraw().send({
      from: player,
      value: totalAmount
    });
    const initialBalance = await web3.eth.getBalance(player);
    await lottery.methods.pickWinner().send({ from: player });
    const finalBalance = await web3.eth.getBalance(player);
    const difference = finalBalance - initialBalance;
    
    // check to see if the final balance is greater by the totalAmount balance minus gas costs
    assert(difference > web3.utils.toWei('1.9', 'ether'));
  });
})