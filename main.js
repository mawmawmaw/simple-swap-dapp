// connect to Moralis server
Moralis.initialize("T6WKh57TyasHZOBP9AP9MMW9ATVzeWDvLRUozCq4");
Moralis.serverURL = "https://hfmv8828kftz.bigmoralis.com:2053/server";

let dex;
let userSelectedChain;
let userAddress;
let tokenOptionsList = [];
let amountChosenToSwap;
let swapFromTokenAddress;
let swapToTokenAddress;
let swapQuote;

//LOGIN FUNCTION WITH MORALIS
async function login() {
    const web3 = await Moralis.Web3.enable();
    let user = Moralis.User.current();
    try{
        if (!user) {
            //USER NOT LOGGED IN
            user = await Moralis.Web3.authenticate();
        }
        //USER LOGGED IN
        userAddress = user.get('ethAddress');
        const chainIdDec = await web3.eth.getChainId(); // 56 BSC - 1 ETH - 137 MATIC - 4 RinkebyTest 
        userSelectedChain = chainIdDec == 56 ? 'bsc' : chainIdDec == 1 ? 'eth' : chainIdDec == 137 ? 'polygon' : 'eth';
        //console.log('Connected to: '+userSelectedChain+' ('+chainIdDec+')');
        getAvailableTokens(userSelectedChain);
        //HIDE
        document.querySelector(".btn-login-container").style.display = "none";
        document.querySelector("#welcome").style.display = "none";
        //SHOW
        document.querySelector(".btn-logout-container").style.display = "block";
        document.querySelector("#user-data").style.display = "block";
        document.querySelector("#swap").style.display = "block";
        document.querySelector("#user-id").innerHTML = userAddress;
    }
    catch{
        console.log("no metamask");
        document.querySelector("#main-banner").style.display = "none";
        document.querySelector("#metamask-warning").style.display = "block";
    }
}

//LOGOUT FUNCTION WITH MORALIS
async function logOut() {
    await Moralis.User.logOut();
    //HIDE
    document.querySelector(".btn-logout-container").style.display = "none";
    document.querySelector("#user-data").style.display = "none";
    document.querySelector("#swap").style.display = "none";
    //SHOW
    document.querySelector(".btn-login-container").style.display = "block";
    document.querySelector("#welcome").style.display = "block";
    console.log("logged out");
}

//ONCE LOGGED IN GET AVAILABLE TOKENS FOR SWAPPING
async function getAvailableTokens(userSelectedChain) {
    //INITIALIZE 1INCH PLUGIN
    await Moralis.initPlugins();
    dex = Moralis.Plugins.oneInch;
    //GET AVAILABLE TOKENS FOR SWAPPING
    const availableTokens = await Moralis.Plugins.oneInch.getSupportedTokens({
        chain: userSelectedChain, // The blockchain you want to use (eth/bsc/polygon)
    });
    Object.keys(availableTokens.tokens).forEach(token => {
        let name = availableTokens.tokens[token].name;
        let symbol = availableTokens.tokens[token].symbol;
        let logoURI = availableTokens.tokens[token].logoURI;
        let address = availableTokens.tokens[token].address;
        option1 = document.createElement("option");
        option1.setAttribute("value", address);
        option1.setAttribute("name", name);
        option1.setAttribute('tokenImage', logoURI)
        option1.innerHTML = '<img src="'+logoURI+'"/>'+ name +' ('+symbol+')';
        option2 = document.createElement("option");
        option2.setAttribute("value", address);
        option2.setAttribute("name", name);
        option2.setAttribute('tokenImage', logoURI)
        option2.innerHTML = '<img src="'+logoURI+'"/>'+ name +' ('+symbol+')&nbsp;';

        document.querySelector("#swap-from").appendChild(option1);
        document.querySelector("#swap-to").appendChild(option2);

        //tokenOptionsList.push(option);
    })
    //buildDropDowns(tokenOptionsList);
}

 /*
function buildDropDowns(tokenOptionsList){
    let selects = document.getElementsByClassName("select-token-dropdown");
    for(var i=0; i<selects.length; i++) {
        for(var j= 0; j<tokenOptionsList.length; j++) {
          selects[i].options.add(tokenOptionsList[j]);
        }
      }
}
*/

(function () {
    // the IIFE lets us use a local variable store information
    var optionsCache = [];

    // add option values to the cache
    function optionsArray(select) {
        var reduce = Array.prototype.reduce;
        return reduce.call(select.options, function addToCache(options, option) {
            options.push(option);
            return options;
        }, []);
    }
    // give a list of options matching the filter value
    function filterOptions(filterValue, optionsCache) {
        return optionsCache.reduce(function filterCache(options, option) {
            var optionText = option.textContent;
            if (option.text.toLowerCase().match(filterValue.toLowerCase())) {
                options.push(option);
            }
            return options;
        }, []);
    }
    // replace the current options with the new options
    function replaceOptions(select, options) {
        while (select.options.length > 0) {
            select.remove(0);
        }
        options.forEach(function addOption(option) {
            select.add(option);
        });
    }
    // cache the options (if need be), and filter the options
    function filterFromOptionsHandler(evt) {
        var filterField = evt.target;
        var targetSelect = document.getElementById("swap-from");
        if (optionsCache.length < 1) {
            optionsCache = optionsArray(targetSelect);
        }
        var options = filterOptions(filterField.value, optionsCache);
        replaceOptions(targetSelect, options);
    }
    function filterToOptionsHandler(evt) {
        var filterField = evt.target;
        var targetSelect = document.getElementById("swap-to");
        if (optionsCache.length < 1) {
            optionsCache = optionsArray(targetSelect);
        }
        var options = filterOptions(filterField.value, optionsCache);
        replaceOptions(targetSelect, options);
    }
    // attach filter event to trigger on keyup
    var filterFrom = document.getElementById("filterFrom");
    filterFrom.addEventListener("keyup", filterFromOptionsHandler, false);
    var filterTo = document.getElementById("filterTo");
    filterTo.addEventListener("keyup", filterToOptionsHandler, false);
}());

async function selectedSwapFromToken() {
    document.querySelector("#swap-from-image-box").innerHTML = '';
    swapFromTokenAddress = document.querySelector("#swap-from").value;
    let image = document.createElement('img');
    image.src = document.querySelector("#swap-from").selectedOptions[0].getAttribute('tokenImage');
    image.alt = document.querySelector("#swap-from").selectedOptions[0].getAttribute('name');
    image.classList = 'selected-token-image'
    document.querySelector("#swap-from-image-box").appendChild(image);
    getBalance(swapFromTokenAddress);
    //console.log(swapFromTokenAddress)
    getQuote()
}
async function selectedSwapToToken() {
    document.querySelector("#swap-to-image-box").innerHTML = '';
    swapToTokenAddress = document.querySelector("#swap-to").value;
    let image = document.createElement('img');
    image.src = document.querySelector("#swap-to").selectedOptions[0].getAttribute('tokenImage');
    image.alt = document.querySelector("#swap-to").selectedOptions[0].getAttribute('name');
    image.classList = 'selected-token-image'
    document.querySelector("#swap-to-image-box").appendChild(image);
    //console.log(swapToTokenAddress)
    getQuote()
}

document.querySelector("#swap-from-amount").addEventListener("change", ()=>{
    if(swapFromTokenAddress !== '' && swapToTokenAddress !== '' && document.querySelector("#swap-from-amount").value > 0){
        document.querySelector("#swap-to-amount").value = "Loading..."
        getQuote()
    }
});

async function getBalance(token) {
    console.log(token);
    const options = {
        owner_address: userAddress,
        spender_address: userAddress,
        address: token
    };
    const allowance = await Moralis.Web3API.token.getTokenAllowance(options);
    console.log(allowance);
}

async function getQuote() {
    if(swapFromTokenAddress !== '' && swapToTokenAddress !== '' && document.querySelector("#swap-from-amount").value > 0){
        amountChosenToSwap = document.querySelector("#swap-from-amount").value;
        const quote = await Moralis.Plugins.oneInch.quote({
            chain: userSelectedChain, // The blockchain you want to use (eth/bsc/polygon)
            fromTokenAddress: swapFromTokenAddress, // The token you want to swap
            toTokenAddress: swapToTokenAddress, // The token you want to receive
            amount: Number.parseFloat(amountChosenToSwap),
        });
        swapQuote = quote;
        if(swapQuote.error){
            document.querySelector("#swap-error").innerHTML = "Error: "+swapQuote.message+'('+swapQuote.error+')';
        }else{
            hasAllowance();
            document.querySelector("#swap-error").innerHTML = '';
            document.querySelector("#swap-to-amount").value = swapQuote.toTokenAmount;
            document.querySelector("#estimated-gas").innerHTML = 'Estimated Gas Fee: '+swapQuote.estimatedGas;
            document.querySelector("#start-swap").disabled = false;
            //console.log(swapQuote.protocols);
        }
    }
  }

  async function hasAllowance() {
    const allowance = await Moralis.Plugins.oneInch.hasAllowance({
      chain: userSelectedChain, // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: swapFromTokenAddress, // The token you want to swap
      fromAddress: swapToTokenAddress, // Your wallet address
      amount: Number.parseFloat(amountChosenToSwap),
    });
    console.log(`The user has enough allowance: ${allowance}`);
  }

  async function approve() {
    await Moralis.Plugins.oneInch.approve({
      chain: userSelectedChain, // The blockchain you want to use (eth/bsc/polygon)
      tokenAddress: swapFromTokenAddress, // The token you want to swap
      fromAddress: userAddress, // Your wallet address
    });
    swap();
  }

  async function swap() {
    const receipt = await Moralis.Plugins.oneInch.swap({
      chain: userSelectedChain, // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: swapFromTokenAddress, // The token you want to swap
      toTokenAddress: swapToTokenAddress, // The token you want to receive
      amount: Number.parseFloat(amountChosenToSwap),
      fromAddress: userAddress, // Your wallet address
      slippage: 1,
    });
    console.log(receipt);
  }

/*LISTENERS*/
document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;
document.querySelector("#swap-from").addEventListener("change", selectedSwapFromToken);
document.querySelector("#swap-to").addEventListener("change", selectedSwapToToken);
document.querySelector("#start-swap").addEventListener("click", approve);