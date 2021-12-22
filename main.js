// connect to Moralis server
Moralis.initialize("T6WKh57TyasHZOBP9AP9MMW9ATVzeWDvLRUozCq4");
Moralis.serverURL = "https://hfmv8828kftz.bigmoralis.com:2053/server";

let user;
let selectedChain = "bsc"; // The blockchain you want to use (eth/bsc/polygon)
let native_token = "BNB"; // ETH/BNB/MATIC
let currentTrade = {};
let currentSelectSide;
let tokens;

//LOGIN FUNCTION WITH MORALIS
async function logIn() {
    try {
        user = Moralis.User.current();
        if(!user){
            user = await Moralis.Web3.authenticate();
        }
        init();

        document.querySelector("#main_banner").style.display = "none";
        document.querySelector("#login_button").style.display = "none";
        document.querySelector("#logout_button").style.display = "block";
        document.querySelector("#swap_container").style.display = "block";
    } catch (error) {
        console.log(error);
    }
}

//LOGOUT FUNCTION WITH MORALIS
async function logOut() {
    await Moralis.User.logOut();
    //HIDE
        document.querySelector("#logout_button").style.display = "none";
        document.querySelector("#swap_container").style.display = "none";
    //SHOW
        document.querySelector("#main_banner").style.display = "block";
        document.querySelector("#login_button").style.display = "block";
}

async function init(){
    await Moralis.initPlugins();
    await Moralis.enable();
    await listAvailableTokens();
    currentUser = Moralis.User.current();
    if(currentUser){
        document.getElementById("swap_button").disabled = false;
    }
}

async function listAvailableTokens(){
    const result = await Moralis.Plugins.oneInch.getSupportedTokens({
        chain: selectedChain, // The blockchain you want to use (eth/bsc/polygon)
      });
    tokens = result.tokens;
    let parent = document.getElementById("token_list");
    for( const address in tokens){
        let token = tokens[address];
        let div = document.createElement("div");
        div.setAttribute("data-address", address)
        div.className = "token_row";
        let html = `
        <img class="token_list_img" src="${token.logoURI}">
        <span class="token_list_text">${token.symbol}</span>
        `
        div.innerHTML = html;
        div.onclick = (() => {selectToken(address)});
        parent.appendChild(div);
    }
}

function selectToken(address){
    closeModal();
    currentTrade[currentSelectSide] = tokens[address];
    console.log(currentTrade);
    renderInterface();
    getQuote();
}

function renderInterface(){
    if(currentTrade.from){
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
    }
    if(currentTrade.to){
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }
}

function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}
function closeModal(){
    document.getElementById("token_modal").style.display = "none";
}

async function getQuote(){
    if(!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    
    let amount = Number( 
        document.getElementById("from_amount").value * 10**currentTrade.from.decimals 
    )

    const quote = await Moralis.Plugins.oneInch.quote({
        chain: selectedChain, 
        fromTokenAddress: currentTrade.from.address, // The token you want to swap
        toTokenAddress: currentTrade.to.address, // The token you want to receive
        amount: amount,
    })
    console.log(quote);
    document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
    document.getElementById("to_amount").value = quote.toTokenAmount / (10**quote.toToken.decimals)
}

async function trySwap(){
    let address = Moralis.User.current().get("ethAddress");
    let amount = Number( 
        document.getElementById("from_amount").value * 10**currentTrade.from.decimals 
    )
    if(currentTrade.from.symbol !== native_token ){
        const allowance = await Moralis.Plugins.oneInch.hasAllowance({
            chain: selectedChain, 
            fromTokenAddress: currentTrade.from.address, // The token you want to swap
            fromAddress: address, // Your wallet address
            amount: amount,
        })
        console.log(allowance);
        if(!allowance){
            await Moralis.Plugins.oneInch.approve({
                chain: selectedChain, 
                tokenAddress: currentTrade.from.address, // The token you want to swap
                fromAddress: address, // Your wallet address
              });
        }
    }
    try {
        let receipt = doSwap(address, amount);
        console.log("Receipt: "+receipt);
        alert("Swap Complete");
    
    } catch (error) {
        console.log(error);
    }

}

function doSwap(userAddress, amount){
    console.log(userAddress, amount);
    return Moralis.Plugins.oneInch.swap({
        chain: selectedChain, 
        fromTokenAddress: currentTrade.from.address, // The token you want to swap
        toTokenAddress: currentTrade.to.address, // The token you want to receive
        amount: amount,
        fromAddress: userAddress, // Your wallet address
        slippage: 1,
      });
}

document.getElementById("login_button").onclick = logIn;
document.getElementById("logout_button").onclick = logOut;
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_token_select").onclick = (() => {openModal("from")});
document.getElementById("to_token_select").onclick = (() => {openModal("to")});
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;