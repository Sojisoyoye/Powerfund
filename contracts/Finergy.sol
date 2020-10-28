// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;
// pragma solidity ^0.5.2;

interface ERC20Interface {

    function totalSupply() external view returns (uint);
    function balanceOf(address tokenOwner) external view returns (uint balance);
    function transfer(address to, uint tokens) external returns (bool success);
    

    function allowance(address tokenOwner, address spender) external view returns (uint remaining);
    function approve(address spender, uint tokens) external returns (bool success);
    function transferFrom(address from, address to, uint tokens) external returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}


contract FinergyToken is ERC20Interface {
    string public name = 'Finergo';
    string public symbol = 'FNER';
    uint public decimals = 0;

    uint public supply; // the no of Cryptos wanted by the founder
    address public founder; // the account that deploys this contract(Cryptos)

    mapping(address => uint) public balances;
    
    // allowed[0x111...][0x222...] = 100;  allowed[owner's address][spender's address] = 100;
    mapping(address => mapping(address => uint)) allowed;
    
    // event Transfer(address indexed from, address indexed to, uint tokens);
    
    constructor() public {
        supply = 300000; // can be an argument. here its 300000 Finergo
        founder = msg.sender;
        balances[founder] = supply; // at the beginning the founder has all the tokens (300000 Finergo). and can transfer to other accts.
    }
    
    function allowance(address tokenOwner, address spender) public override view returns (uint) {
        return allowed[tokenOwner][spender];
    }
    
    function approve(address spender, uint tokens) public override returns (bool) {
        require(balances[msg.sender] >= tokens);
        require(tokens > 0);
        allowed[msg.sender][spender] = tokens;
        
        emit Approval(msg.sender, spender, tokens);
        
        return true;
    }
    
    function transferFrom(address from, address to, uint tokens) public override virtual returns (bool) {
        require(allowed[from][to] >= tokens);
        require(balances[from] >= tokens);
        
        balances[from] -= tokens;
        balances[to] += tokens;
        
        allowed[from][to] -= tokens;
        
        return true;
    }

    
    function totalSupply() public override view returns (uint) {
        return supply;
    }
    
    function balanceOf(address tokenOwner) public override view returns (uint balance) {
        return balances[tokenOwner];
    }
    
    function transfer(address to, uint tokens) public override virtual returns (bool success) {
        require(balances[msg.sender] > tokens && tokens > 0);
        
        balances[to] += tokens;
        balances[msg.sender] -= tokens;
        emit Transfer(msg.sender, to, tokens);
        return true;
    }
}

contract Finergy is FinergyToken {
    address payable public provider;
    address payable public depositAddress; // external acct where ether sent to this ICO will be deposited, controlled by admin
    
    // token price in wei: 1FNER = 0.001 ETHER, 1 ETHER = 1000 FNER
    
    uint tokenPrice = 1000000000000000; // in wei
    
    // max amount of ether accepted by the funding 300 ETHER
    uint public hardCap = 300000000000000000000; // in wei
    
    uint public raisedAmount;
    
    uint public fundingStart = block.timestamp;
    uint public fundingEnd = block.timestamp + 604800; // one week
    
    // freeze the token for an amount of time because early investors could damp the token this way their price will decrease
    
    uint coinTradeStart = fundingEnd + 604800; // transferable in a week after salesEnd
    
    uint public maxInvestment = 5000000000000000000; // 5 ETHER
    uint public minInvestment = 10000000000000000; // 0.001 ETHER
    
    enum State { beforeStart, running, afterEnd, stopped }
    
    State public icoState;
    
    uint public noOfFunders;
    mapping (address => uint) funders;
    
    struct Request {
        string description;
        uint value;
        bool completed;
        uint noOfVoters;
        mapping (address => bool) voters;
    }

    Request[] public requests;
    
    event Invest(address investor, uint value, uint tokens);
    event CreateRequest(string _description, uint _value);
    event MakePayment(string description, uint value);
    
    modifier onlyProvider() {
        require(msg.sender == provider);
        _;
    }
    
    
    constructor (address payable _deposit) public {
        depositAddress = _deposit;
        provider = msg.sender; // acct that deploys the ico contract
        icoState = State.beforeStart; // ico start after deployment
    }
    
    // emergency stop of the ico
    function stopIco() public onlyProvider {
        icoState = State.stopped;
    }
    
    // restart
    function restartIco() public onlyProvider {
        icoState = State.running;
    }
    
    function changeDepositAddress(address payable newDeposit) public onlyProvider {
        depositAddress = newDeposit;
    }
    
    function getDepositBalance() public view returns (uint) {
        return depositAddress.balance;
    }
    
    function getCurrentState() public view returns (State) {
        if(icoState == State.stopped) {
            return State.stopped;
        } else if (block.timestamp < fundingStart) {
            return State.beforeStart;
        } else if (block.timestamp >= fundingStart && block.timestamp <= fundingEnd) {
            return State.running;
        } else {
            return State.afterEnd;
        }
    }
    
    /*
    Two possibilies investors can participate in our ico
    - they can send ether to contract address
    - from web app or from another dapp, they can call the invest function sending some ether
    */
    
    function invest() public payable returns (bool) {
        // invest only when ico is running
        icoState = getCurrentState();
        require(icoState == State.running);
        require(msg.value >= minInvestment && msg.value <= maxInvestment);
        
        uint tokens = msg.value / tokenPrice;
        
        // hardCap not reached
        require(raisedAmount + msg.value <= hardCap);
        
        raisedAmount += msg.value;
        
        if (funders[msg.sender] == 0) {
            noOfFunders++;
        }
        
        funders[msg.sender] += msg.value;
        
        // add tokens to investor balance from provider's balance
        balances[msg.sender] += tokens;
        balances[founder] -= tokens; // subtract tokens from the contract address owner founder or provider
        
        depositAddress.transfer(msg.value); // transfer ether to the deposit address
        
        emit Invest(msg.sender, msg.value, tokens);
        
        return true;
    }
    
    function createRequest(string memory  _description, uint _value) public onlyProvider {
        Request memory newRequest = Request({
            description: _description,
            value: _value,
            completed: false,
            noOfVoters: 0
        });
        requests.push(newRequest);
        emit CreateRequest(_description, _value);
    }

    // function getRequests() public view returns (Request[] memory) {
    //     Request storage thisRequests = requests;
    //     return thisRequests;
    // }
    
    function voteRequest(uint index) public {
        Request storage thisRequest = requests[index];
        require(funders[msg.sender] > 0);
        require(thisRequest.voters[msg.sender] == false);
        
        thisRequest.voters[msg.sender] = true;
        thisRequest.noOfVoters++;
    }
    
    function withdrawFund(uint index) public onlyProvider {
       Request storage thisRequest = requests[index];
       require(thisRequest.completed == false);
       require(thisRequest.noOfVoters > noOfFunders / 2); // more than 50% voted
       
       provider.transfer(thisRequest.value); // transfer the fund required for the Request to the provider
       
       thisRequest.completed = true;
       
       emit MakePayment(thisRequest.description, thisRequest.value);
   }
   
    
    function burn() public returns (bool) {
        icoState = getCurrentState();
        require(icoState == State.afterEnd);
        balances[founder] = 0;
    }
    
    // allows investor to sell shares buy trasferring their token
    function transfer(address to, uint value) public override returns (bool) {
        require(block.timestamp > coinTradeStart);
        super.transfer(to, value);
    }
    
    
    // allows transfer of tokens
    function transferFrom(address _from, address _to, uint _value) public override returns (bool) {
        require(block.timestamp > coinTradeStart);
        super.transferFrom(_from, _to, _value);
    }
    
    
    fallback() external payable {
        invest();
    }

    receive() external payable { 
        revert(); 
    }
    
}
