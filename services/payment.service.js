/**
 * Title: Write a program using JavaScript on Payment Service
 * Author: Hasibul Islam
 * Portfolio: https://devhasibulislam.vercel.app
 * Linkedin: https://linkedin.com/in/devhasibulislam
 * GitHub: https://github.com/devhasibulislam
 * Facebook: https://facebook.com/devhasibulislam
 * Instagram: https:/instagram.com/devhasibulislam
 * Twitter: https://twitter.com/devhasibulislam
 * Pinterest: https://pinterest.com/devhasibulislam
 * WhatsApp: https://wa.me/8801906315901
 * Telegram: devhasibulislam
 * Date: 19, January 2024
 *

const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Purchase = require("../models/purchase.model");
const User = require("../models/user.model");

/* external import *
require("dotenv").config();

/* stripe setup *
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// create payment
exports.createPayment = async (req, res) => {
  const lineItems = req.body.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.thumbnail],
          description: item.description,
          metadata: {
            id: item.pid,
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.ORIGIN_URL}`,
    cancel_url: `${process.env.ORIGIN_URL}`,
  });

  // create purchase for user
  const purchase = await Purchase.create({
    customer: req.user._id,
    customerId: session.id,
    orderId: session.id,
    totalAmount: session.amount_total,
    products: req.body.map((item) => ({
      product: item.pid,
      quantity: item.quantity,
    })),
  });

  // add purchase._id to user's purchases array, add pid from req.body array of object to user's products array and empty user's cart array
  await User.findByIdAndUpdate(req.user._id, {
    $push: { purchases: purchase._id },
    $set: { cart: [] },
  });

  // add pid from req.body array of object to user's products array
  req.body.forEach(async (item) => {
    await User.findByIdAndUpdate(req.user._id, {
      $push: { products: item.pid },
    });
  });

  // remove all carts that cart._id match with cid from req.body's array of object
  req.body.forEach(async (cart) => {
    await Cart.findByIdAndDelete(cart.cid);
  });

  // add user to products buyers array
  req.body.forEach(async (product) => {
    await Product.findByIdAndUpdate(product.pid, {
      $push: { buyers: req.user._id },
    });
  });

  res.status(201).json({
    acknowledgement: true,
    message: "Ok",
    description: "Payment created successfully",
    url: session.url,
  });
};*/


const axios = require('axios');
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Purchase = require("../models/purchase.model");
const User = require("../models/user.model");

require("dotenv").config();

// M-Pesa payment and callback handler

// Helper function to generate a base64-encoded password for M-Pesa
const generatePassword = () => {
  const shortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
  return password;
};

// Helper function to get current timestamp for M-Pesa (YYYYMMDDHHMMSS)
const getTimestamp = () => {
  const date = new Date();
  return date.getFullYear().toString() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);
};

// Function to get the M-Pesa OAuth token
const getAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    console.log("Access token received:", response.data.access_token); // Logging the token
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching M-Pesa access token:', error.response?.data || error.message);
    throw error;
  }
};

// Create payment
exports.createPayment = async (req, res) => {
  try {
    console.log("Creating payment...");

    // Get M-Pesa access token
    const token = await getAccessToken();

    // Calculate total amount for the order
    const totalAmount = req.body.reduce((total, item) => total + item.price * item.quantity, 0);
    console.log("Total amount calculated:", totalAmount);

    // M-Pesa STK Push request
    const mpesaRequestData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: generatePassword(),
      Timestamp: getTimestamp(),
      TransactionType: "CustomerPayBillOnline",
      Amount: totalAmount,
      PartyA: 254758527054,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: 254758527054,
      CallBackURL: `https://www.shaddyna.com/api/mpesa-callback`,
      AccountReference: `Order-${new Date().getTime()}`,
      TransactionDesc: "Payment for your order"
    };

    console.log("M-Pesa STK Push Request Data:", mpesaRequestData);

    const mpesaResponse = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', mpesaRequestData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    

    console.log("M-Pesa Response:", mpesaResponse.data);

    // Check for successful M-Pesa STK push response
    if (mpesaResponse.data.ResponseCode !== "0") {
      console.error("M-Pesa payment request failed:", mpesaResponse.data);
      return res.status(400).json({
        message: "M-Pesa payment request failed",
        error: mpesaResponse.data
      });
    }

    // Create a purchase record
    const purchase = await Purchase.create({
      customer: req.user._id,
      customerId: mpesaResponse.data.CheckoutRequestID,
      orderId: mpesaResponse.data.CheckoutRequestID,
      totalAmount: totalAmount * 100,
      products: req.body.map((item) => ({
        product: item.pid,
        quantity: item.quantity,
      })),
    });

    console.log("Purchase created:", purchase);

    await User.findByIdAndUpdate(req.user._id, {
      $push: { purchases: purchase._id },
      $set: { cart: [] },
    });

    console.log("Purchase added to user's purchases array and cart emptied.");

    // Add purchased products to user's products array and remove them from the cart
    for (let item of req.body) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { products: item.pid },
      });

      await Cart.findByIdAndDelete(item.cid);

      await Product.findByIdAndUpdate(item.pid, {
        $push: { buyers: req.user._id },
      });

      console.log(`Product ${item.pid} added to user's products and cart deleted.`);
    }

     // Redirect user to the specified URL after payment initiation
     res.status(201).json({
      acknowledgement: true,
      message: "Payment created successfully",
      description: "Please check your phone to complete the payment",
      requestId: mpesaResponse.data.CheckoutRequestID,
      redirect_url: "http://localhost:3000", // URL to redirect the user after payment
    });
  } catch (error) {
    console.error('Error during payment creation:', error.message);

    // If error response is available, log it
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }

    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};


// M-Pesa Callback handler
exports.mpesaCallback = async (req, res) => {
  console.log("M-Pesa callback received:", req.body); // Log the callback data

  const { Body } = req.body;

  const resultCode = Body.stkCallback.ResultCode;
  const checkoutRequestId = Body.stkCallback.CheckoutRequestID;

  if (resultCode === 0) {
    // Payment successful
    await Purchase.updateOne({ customerId: checkoutRequestId }, { status: 'completed' });
    console.log(`Payment successful for requestId: ${checkoutRequestId}`); // Log success

    return res.status(200).json({
      message: "Payment successful",
      result: Body.stkCallback
    });
  } else {
    // Payment failed
    await Purchase.updateOne({ customerId: checkoutRequestId }, { status: 'failed' });
    console.log(`Payment failed for requestId: ${checkoutRequestId}, resultCode: ${resultCode}`); // Log failure

    return res.status(400).json({
      message: "Payment failed",
      result: Body.stkCallback
    });
  }
};
