require('dotenv').load();
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./compile');
const provider = new HDWalletProvider(
  `${process.env.MNEMONIC}`,
  `https://rinkeby.infura.io/${process.env.INFURA_API_KEY}`
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];

  console.log('Starting deployment from account', account);

  const result = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ gas: '1000000', from: account });
  console.log('interface', interface);
  console.log('Contract succesfully deployed to', result.options.address);
};

deploy();
