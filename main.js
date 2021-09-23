// connect to Moralis server
Moralis.initialize("T6WKh57TyasHZOBP9AP9MMW9ATVzeWDvLRUozCq4");
Moralis.serverURL = "https://hfmv8828kftz.bigmoralis.com:2053/server";


let dex;
let userSelectedChain;
let tokenOptionsList = [];
let swapFromTokenAddress;
let swapToTokenAddress;

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
        const userAddress = user.get('ethAddress');
        const chainIdDec = await web3.eth.getChainId(); // 56 BSC - 1 ETH - 137 MATIC
        userSelectedChain = chainIdDec == 56 ? 'bsc' : chainIdDec == 1 ? 'eth' : chainIdDec == 137 ? 'polygon' : 'eth';
        console.log('Connected to: '+userSelectedChain);
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

async function selectedSwapFromToken() {
    document.querySelector("#swap-from-image-box").innerHTML = '';
    swapFromTokenAddress = document.querySelector("#swap-from").value;
    let image = document.createElement('img');
    image.src = document.querySelector("#swap-from").selectedOptions[0].getAttribute('tokenImage');
    image.alt = document.querySelector("#swap-from").selectedOptions[0].getAttribute('name');
    image.classList = 'selected-token-image'
    document.querySelector("#swap-from-image-box").appendChild(image);

    console.log(swapFromTokenAddress)
}
async function selectedSwapToToken() {
    document.querySelector("#swap-to-image-box").innerHTML = '';
    swapToTokenAddress = document.querySelector("#swap-to").value;
    let image = document.createElement('img');
    image.src = document.querySelector("#swap-to").selectedOptions[0].getAttribute('tokenImage');
    image.alt = document.querySelector("#swap-to").selectedOptions[0].getAttribute('name');
    image.classList = 'selected-token-image'
    document.querySelector("#swap-to-image-box").appendChild(image);

    console.log(swapToTokenAddress)
}

/*LISTENERS*/
document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;
document.querySelector("#swap-from").addEventListener("change", selectedSwapFromToken);
document.querySelector("#swap-to").addEventListener("change", selectedSwapToToken);