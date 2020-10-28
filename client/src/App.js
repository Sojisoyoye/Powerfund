import React, { Component, Fragment } from "react";
import FinergyContract from "./contracts/Finergy.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      account: null,
      myBalanceEther: "",
      depositAddress: "",
      finergyInstance: null,
      raisedAmount: "",
      contributors: "",
      icoState: "",
      etherValue: "",
      description: "",
      descriptionValue: "",
      statusError: false,
      isLoading: false,
      success: false,
      errorMessage: "",
      descError: "",
      isDescLoading: "",
      descSuccess: "",
      descErrorMessage: "",
      fund: "",
      withLoading: "",
      withSuccess: "",
      withError: "",
      withErrorMessage: "",
    };

    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onRequestSubmit = this.onRequestSubmit.bind(this);
    this.withdrawFund = this.withdrawFund.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = FinergyContract.networks[networkId];
      const instance = new web3.eth.Contract(
        FinergyContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      let myBalanceEther = await web3.eth.getBalance(accounts[0]);
      myBalanceEther = web3.utils.fromWei(myBalanceEther, "ether");

      const depositAddress = await instance.methods.depositAddress().call();
      let raisedAmount = await instance.methods.raisedAmount().call();
      raisedAmount = web3.utils.fromWei(raisedAmount, "ether");

      let contributors = await instance.methods.noOfFunders().call();
      let icoState = await instance.methods.icoState().call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3,
        account: accounts[0],
        myBalanceEther,
        depositAddress,
        finergyInstance: instance,
        raisedAmount,
        contributors,
        icoState,
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  onSubmit = async (e) => {
    e.preventDefault();
    const contract = await this.state.finergyInstance;
    let web = this.state.web3;
    const account = this.state.account;

    try {
      this.setState({ statusError: false, isLoading: true });

      await contract.methods.invest().send({
        from: account,
        value: web.utils.toWei(this.state.etherValue, "ether"),
      });
      let raisedAmount = await contract.methods.raisedAmount().call();
      raisedAmount = web.utils.fromWei(raisedAmount, "ether");

      let contributors = await contract.methods.noOfFunders().call();

      this.setState({
        isLoading: false,
        success: true,
        raisedAmount,
        contributors,
      });
    } catch (err) {
      this.setState({
        errorMessage: "ERROR " + err.message,
        isLoading: false,
        success: false,
        statusError: true,
      });
    }
  };

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  onRequestSubmit = async (e) => {
    e.preventDefault();

    const contract = await this.state.finergyInstance;

    try {
      this.setState({ descError: false, isDescLoading: true });

      const value = this.state.web3.utils.toWei(
        this.state.descriptionValue,
        "ether"
      );

      await contract.methods.createRequest(this.state.description, value).send({
        from: this.state.account,
      });
      this.setState({ isDescLoading: false, descSuccess: true });
    } catch (err) {
      this.setState({
        descErrorMessage: "ERROR " + err.message,
        isDescLoading: false,
        descSuccess: false,
        descError: true,
      });
    }
  };

  withdrawFund = async (e) => {
    e.preventDefault();
    const contract = await this.state.finergyInstance;

    try {
      this.setState({ withError: false, withLoading: true });

      await contract.methods.withdrawFund(this.state.fund).send({
        from: this.state.account,
      });
      this.setState({ withLoading: false, withSuccess: true });
    } catch (err) {
      this.setState({
        withErrorMessage: "ERROR " + err.message,
        withLoading: false,
        withSuccess: false,
        withError: true,
      });
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <Fragment>
        <div className="jumbotron jumbotron-fluid">
          <div className="container">
            <h1 className="display-4">FINERGY</h1>
            <p className="lead">
              Finergy is a smart payments and financing solution that uses
              tokenization and smart contracts to make financing and tracking of
              energy projects very easy, transparent, traceable and accountable.
            </p>
          </div>
        </div>

        <div className="container">
          <div className="row">
            <div className="col card m-3">
              <h3 className="card-header">INITIAL COIN OFFERING DETAILS</h3>
              <div className="card-body">
                <div className="mb-4">
                  <div className="pr-4 d-flex flex-column text-center">
                    <span className="chip">Deposit Address</span>
                    <span className="value2">{this.state.depositAddress}</span>
                  </div>

                  <div className="pr-4 d-flex flex-column text-center">
                    <span className="chip">Amount Raised</span>
                    <span className="value2">
                      {this.state.raisedAmount} ETH
                    </span>
                  </div>
                </div>
              </div>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <span className="label1">Contributors </span>
                  <span className="value1 ml-4">{this.state.contributors}</span>
                </li>
                <li className="list-group-item">
                  <span className="label1">ICO State </span>
                  <span className="value1 ml-4">
                    {this.state.icoState === 0 ? "Running" : "Running"}
                  </span>
                </li>
                <li className="list-group-item">
                  <span className="label1">Start Date </span>
                  <span className="value1 ml-4">2nd Nov, 2020</span>
                </li>
                <li className="list-group-item">
                  <span className="label1">End Date </span>
                  <span className="value1 ml-4">20th Nov, 2020</span>
                </li>
                <li className="list-group-item">
                  <span className="label1">Hard Cap </span>
                  <span className="value1 ml-4"> 300 ETHER </span>
                </li>
                <li className="list-group-item">
                  <span className="label1">Maximum Investment </span>
                  <span className="value1 ml-4"> 5 ETHER </span>
                </li>
                <li className="list-group-item">
                  <span className="label1">Minimum Investment </span>
                  <span className="value1 ml-4"> 0.001 ETHER </span>
                </li>
              </ul>
            </div>
            <div className="col card m-3">
              <h3 className="card-header">FINERGY</h3>
              <div className="card-body">
                <div className="mb-4">
                  <div className="pr-4 d-flex flex-column text-center">
                    <span className="chip">My Account</span>
                    <span className="value2">{this.state.account}</span>
                  </div>

                  <div className="pr-4 d-flex flex-column text-center">
                    <span className="chip">My Balance</span>
                    <span className="value2">
                      {this.state.myBalanceEther} ETH
                    </span>
                  </div>
                </div>
                <form onSubmit={this.onSubmit} className="invest-form">
                  <h5 className="mt-4">BUY FINERGO TOKENS (FNER)</h5>

                  <div className="form-group">
                    <label>Amount of Ether to Buy:</label>
                    <input
                      type="number"
                      className="form-control"
                      id="etherValue"
                      name="etherValue"
                      value={this.state.etherValue}
                      onChange={this.handleChange}
                    />
                    <small id="ether" className="form-text text-muted">
                      ≈ {this.state.etherValue * 1000} FNER (0.001 ETHER = 1
                      FNER)
                    </small>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </form>

                {this.state.isLoading ? (
                  <div className="text-center">
                    <div className="text-muted">
                      Waiting For Confirmation ......
                    </div>
                    <div className="text-muted">
                      (this can take up to 30 seconds)
                    </div>
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : null}

                {this.state.success ? (
                  <div className="alert alert-success mt-4" role="alert">
                    You successfully bought FNER tokens!
                  </div>
                ) : null}

                {this.state.statusError ? (
                  <div className="alert alert-danger mt-4" role="alert">
                    {this.state.errorMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="row">
            <div className="col card m-3">
              <h5 className="card-header">Request</h5>
              <div className="card-body">
                <h5 className="card-title">
                  Enter your request description with the value needed for the
                  execution
                </h5>
                <small className="form-text text-muted mb-4">
                  Note: Only a Mini-grid Provider can make a Request
                </small>
                <form onSubmit={this.onRequestSubmit}>
                  <div className="form-group">
                    <label>Description: </label>
                    <input
                      className="form-control"
                      id="description"
                      name="description"
                      value={this.state.description}
                      onChange={this.handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Value:</label>
                    <input
                      type="number"
                      className="form-control"
                      id="descriptionValue"
                      name="descriptionValue"
                      value={this.state.descriptionValue}
                      onChange={this.handleChange}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Request
                  </button>
                </form>

                {this.state.isDescLoading ? (
                  <div className="text-center">
                    <div className="text-muted">
                      Waiting For Confirmation ......
                    </div>
                    <div className="text-muted">
                      (this can take up to 30 seconds)
                    </div>
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : null}

                {this.state.descSuccess ? (
                  <div className="alert alert-success mt-4" role="alert">
                    You successfully submitted a request!
                  </div>
                ) : null}

                {this.state.descError ? (
                  <div className="alert alert-danger mt-4" role="alert">
                    {this.state.descErrorMessage}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="col card m-3">
              <h5 className="card-header">Vote a Request</h5>
              <div className="card-body">
                <h5 className="card-title">List of Requests</h5>
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Description</th>
                      <th scope="col">Value</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">1</th>
                      <td>Procurement of more batteries</td>
                      <td>25 ETHER</td>
                      <td>
                        <button className="btn btn-primary">Vote</button>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">2</th>
                      <td>Need for expansion of solar panels</td>
                      <td>40 ETHER</td>
                      <td>
                        <button className="btn btn-primary">Vote</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="row">
            <div className="col card m-3">
              <h5 className="card-header">Withdraw Fund</h5>
              <div className="card-body">
                <small className="form-text with-text text-muted mb-4">
                  <strong>Note: </strong>Only a Mini-grid Provider can withdraw
                  Fund and Funds can only be withdrawn if more than 50% of
                  investors have voted.
                </small>
                <form onSubmit={this.withdrawFund}>
                  <div className="form-group">
                    <label>Enter Request ID: </label>
                    <input
                      type="number"
                      className="form-control"
                      id="fund"
                      name="fund"
                      value={this.state.fund}
                      onChange={this.handleChange}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Withdraw
                  </button>
                </form>

                {this.state.withLoading ? (
                  <div className="text-center">
                    <div className="text-muted">
                      Waiting For Confirmation ......
                    </div>
                    <div className="text-muted">
                      (this can take up to 30 seconds)
                    </div>
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : null}

                {this.state.withSuccess ? (
                  <div className="alert alert-success mt-4" role="alert">
                    Withdrawal Successful
                  </div>
                ) : null}

                {this.state.withError ? (
                  <div className="alert alert-danger mt-4" role="alert">
                    {this.state.withErrorMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default App;
