//THIS IS AN MPES LOGIC CONTROLLER

const axios = require('axios'); // Ensure axios is imported
require("dotenv").config();
const moment = require("moment");
const Payment = require("../models/mpesaModel");
const fs = require("fs");

class mpesaController {
  // Fix the getAccessToken method
  getAccessToken = async () => {
    const consumer_key = process.env.MPESA_CONSUMER_KEY; // Use process.env
    const consumer_secret = process.env.MPESA_CONSUMER_SECRET; // Use process.env
    const url =
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth =
      "Basic " +
      Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: auth,
        },
      });
      const accessToken = response.data.access_token;
      return accessToken;
    } catch (error) {
      throw error;
    }
  };

  generateSecurityCredential = async () => {
    var cert = fs.readFileSync("cert.cer");
    var encrypted = crypto.publicEncrypt(
    {
      key: cert,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },

    Buffer.from(password)
  );

  return encrypted.toString("base64");
  }

  // Fix the accessToken method using an arrow function
  getAccessTokenGenerate = async (req, res) => {
    this.getAccessToken() // Call the method with `this`
      .then((accessToken) => {
        res.json({ message: "😀 Your access token is " + accessToken });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve access token' , error });
      });
  };

  // Define stkPush route using an arrow function
  stkPush = async (req, res) => {
    try {
      let { phone, amount, accountReference } = req.body;
  
      // CHECK IF REQUESTED FIELDS ARE EMPTY
      if (!phone || !amount || !accountReference) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      // FORMAT PHONE NUMBER
      if (phone.startsWith("0")) {
        phone = "254" + phone.slice(1);
      }
  
      // GET ACCESS TOKEN
      const accessToken = await this.getAccessToken();
      console.log("Access Token : " + accessToken);
  
      const url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      const auth = "Bearer " + accessToken;
      const timestamp = moment().format("YYYYMMDDHHmmss");
      const businessShortCode = process.env.BUSINESS_SHORTCODE;
      const passKey = process.env.LIPA_NA_MPESA_PASSKEY;
  
      const password = new Buffer.from(
        businessShortCode + passKey + timestamp
      ).toString("base64");
  
      const payload = {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline", // Update this with the correct transaction type
        Amount: amount,
        PartyA: phone,
        PartyB: businessShortCode,
        PhoneNumber: phone,
        CallBackURL: "https://249e-105-60-226-239.ngrok-free.app/api/callback",
        AccountReference: accountReference,
        TransactionDesc: "Mpesa Daraja API stk push test",
      };
  
      // SEND STK PUSH REQUEST
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: auth,
        },
      });
      var CheckoutRequestID = response.data.CheckoutRequestID;
      console.log("CheckoutRequestID : " + CheckoutRequestID);
      //SAVE TO DATABASE
      const newPayment = new Payment({
        'user': '60b3b3b3b3b3b3b3b3b3b3b3',
        phone,
        amount,
        accountReference,
        'TransactionID': '',
        CheckoutRequestID,
        'status': 'pending',
      });
      await newPayment.save();
  
      // HANDLE SUCCESSFUL RESPONSE
      res.status(200).json({
        msg: "Request is successful. Please enter your M-Pesa PIN to complete the transaction.",
        status: true,
        data: response.data,
      });
    } catch (error) {
      console.error(error);
  
      // HANDLE ERROR RESPONSE
      res.status(500).json({
        msg: "Request failed. Please try again later.",
        status: false,
        error: error.message,
      });
    }
  };

  stkPushQuery = async (req, res) => {0
    try {
      let { CheckoutRequestID } = req.body;
  
      // CHECK IF REQUESTED FIELDS ARE EMPTY
      if (!CheckoutRequestID) {
        return res.status(400).json({ error: "CheckoutRequestID is required" });
      }
  
      // GET ACCESS TOKEN
      const accessToken = await this.getAccessToken();
  
      const url = "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query";
      const auth = "Bearer " + accessToken;
      const payload = {
        BusinessShortCode: process.env.BUSINESS_SHORTCODE,
        CheckoutRequestID: CheckoutRequestID,
        Timestamp: moment().format("YYYYMMDDHHmmss"),
      };
  
      // SEND STK PUSH QUERY REQUEST
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: auth,
        },
      });
  
      // HANDLE SUCCESSFUL RESPONSE
      res.status(200).json({
        msg: "Request is successful. Please enter your M-Pesa PIN to complete the transaction.",
        status: true,
        data: response.data,
      });
    } catch (error) {
      console.error(error);
  
      // HANDLE ERROR RESPONSE
      res.status(500).json({
        msg: "Request failed. Please try again later.",
        status: false,
        error: error.message,
      });
    }
  };

  stkPushCallback = async (req, res) => {
    console.log("STK PUSH CALLBACK");
    const CheckoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
    const ResultCode = req.body.Body.stkCallback.ResultCode;
    var json = JSON.stringify(req.body);
    fs.writeFile("stkcallback.json", json, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("STK PUSH CALLBACK JSON FILE SAVED");
    });
    console.log(req.body);
  }
  
  registerUrl = async (req, res) => {
    try {
      const accessToken = await this.getAccessToken();
      const url =
        "https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl";
      const auth = "Bearer " + accessToken;
      const payload = {
        ShortCode: process.env.BUSINESS_SHORTCODE,
        ResponseType: "Completed",
        ConfirmationURL: process.env.CONFIRMATION_URL,
        ValidationURL: process.env.VALIDATION_URL,
      };
  
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: auth,
        },
      });
  
      res.status(200).json({
        msg: "Confirmation and Validation URLs registered successfully",
        data: response.data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        msg: "Failed to register Confirmation and Validation URLs",
        error: error.message,
      });
    }
  }

  simulateTransaction = async (req, res) => {
    try {
      let phone = '254768168060';
      let amount = 100;
      let accountReference = 'Test';
      const accessToken = await this.getAccessToken();
      const url = "https://api.safaricom.co.ke/mpesa/c2b/v1/simulate";
      const auth = "Bearer " + accessToken;
      const payload = {
        ShortCode: process.env.BUSINESS_SHORTCODE,
        CommandID: "CustomerPayBillOnline",
        Amount: amount,
        Msisdn: phone,
        BillRefNumber: accountReference,
      };
  
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: auth,
        },
      });
  
      res.status(200).json({
        msg: "Transaction simulated successfully",
        data: response.data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        msg: "Failed to simulate transaction",
        error: error.message,
      });
    }
  }

  confirmationUrl = async (req, res) => {
    console.log("C2B CONFIRMATION URL");
    var json = JSON.stringify(req.body);
    fs.writeFile("c2bconfirmation.json", json, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("C2B CONFIRMATION URL JSON FILE SAVED");
      //DO THE LOGIC HERE


    });
    console.log(req.body);
  }

  validationUrl = async (req, res) => {
    console.log("C2B VALIDATION URL");
    var json = JSON.stringify(req.body);
    fs.writeFile("c2bvalidation.json", json, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("C2B VALIDATION URL JSON FILE SAVED");
    });
    console.log(req.body);
  }

  b2cRequest = async (req, res) => {
    try {
      let [phone, amount] = req.body;
      const accessToken = await this.getAccessToken();
      const securityCredential = await this.generateSecurityCredential();
      const url = "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
      const auth = "Bearer " + accessToken;
      const payload = {
        InitiatorName: process.env.B2C_INITIATOR_NAME,
        SecurityCredential: securityCredential,
        CommandID: "commandID",
        Amount: amount,
        PartyA: process.env.B2C_SHORTCODE,
        PartyB: phone,
        Remarks: "Payment to customer",
        QueueTimeOutURL: process.env.QUEUE_TIMEOUT_URL,
        ResultURL: process.env.RESULT_URL,
        Occasion: "Payment",
      };
    
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: auth,
        },
      });

      res.status(200).json({
        msg: "B2C request sent successfully",
        data: response.data,
      });
    }catch (error) {
      console.error(error);
      res.status(500).json({
        msg: "Failed to send B2C request",
        error: error.message,
      });
    }
  }

  timeoutUrl = async (req, res) => {
    console.log("B2C TIMEOUT URL");
    var json = JSON.stringify
    fs.writeFile("b2ctimeout.json", json, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("B2C TIMEOUT URL JSON FILE SAVED");
    });
    console.log(req.body);
  }

  resultUrl = async (req, res) => {
    console.log("B2C RESULT URL");
    var json = JSON.stringify(req.body);
    fs.writeFile("b2cresult.json", json, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("B2C RESULT URL JSON FILE SAVED");
    });
  } 



}

module.exports = new mpesaController();
