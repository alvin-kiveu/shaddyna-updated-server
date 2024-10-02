/*const striptModel = require('../models/stripeModel')
const sellerModel = require('../models/sellerModel')
const withdrowRequest = require('../models/withdrowModel')
const sellerWallet = require('../models/sellerWallet')
const { responseReturn } = require('../utiles/response')
const { v4: uuidv4 } = require('uuid')
const { mongo: { ObjectId } } = require('mongoose')

const stripe = require("stripe")(
    "sk_test_51N8amPIt63Wcx3eVr72l77kfPTDgInVEaTT9d4G1JgngM0YEgAIwocli1hC0sKidMuzPiUNimOpqxXtIKeFkhnQo00EQgFUaDA"
);

class paymentController {
    create_stripe_connect_account = async (req, res) => {
        const { id } = req
        const uid = uuidv4()

        try {
            const stripInfo = await striptModel.findOne({ sellerId: id })

            if (stripInfo) {
                await striptModel.deleteOne({ sellerId: id })
                const account = await stripe.accounts.create({ type: 'express' })

                const accountLink = await stripe.accountLinks.create({
                    account: account.id,
                    refresh_url: 'http://localhost:3000/refresh',
                    return_url: `http://localhost:3000/success?activeCode=${uid}`,
                    type: 'account_onboarding'
                })
                await striptModel.create({
                    sellerId: id,
                    stripeId: account.id,
                    code: uid
                })
                responseReturn(res, 201, { url: accountLink.url })
            } else {
                const account = await stripe.accounts.create({ type: 'express' })

                const accountLink = await stripe.accountLinks.create({
                    account: account.id,
                    refresh_url: 'http://localhost:3000/refresh',
                    return_url: `http://localhost:3000/success?activeCode=${uid}`,
                    type: 'account_onboarding'
                })
                await striptModel.create({
                    sellerId: id,
                    stripeId: account.id,
                    code: uid
                })
                responseReturn(res, 201, { url: accountLink.url })
            }
        } catch (error) {
            console.log('stripe connect account create error ' + error.message)
        }
    }

    active_stripe_connect_account = async (req, res) => {
        const { activeCode } = req.params
        const { id } = req
        try {
            const userStripeInfo = await striptModel.findOne({ code: activeCode })
            if (userStripeInfo) {
                await sellerModel.findByIdAndUpdate(id, {
                    payment: 'active'
                })
                responseReturn(res, 200, { message: 'payment active' })
            } else {
                responseReturn(res, 404, { message: 'payment active failed' })
            }
        } catch (error) {
            responseReturn(res, 500, { message: 'Internal server error' })
        }
    }

    sunAmount = (data) => {
        let sum = 0;

        for (let i = 0; i < data.length; i++) {
            sum = sum + data[i].amount
        }
        return sum
    }

    get_seller_payemt_details = async (req, res) => {
        const { sellerId } = req.params
        try {
            const payments = await sellerWallet.find({ sellerId })

            const pendingWithdrows = await withdrowRequest.find({
                $and: [
                    {
                        sellerId: {
                            $eq: sellerId
                        }
                    }, {
                        status: {
                            $eq: 'pending'
                        }
                    }
                ]
            })

            const successWithdrows = await withdrowRequest.find({
                $and: [
                    {
                        sellerId: {
                            $eq: sellerId
                        }
                    }, {
                        status: {
                            $eq: 'success'
                        }
                    }
                ]
            })

            const pendingAmount = this.sunAmount(pendingWithdrows)
            const withdrowAmount = this.sunAmount(successWithdrows)
            const totalAmount = this.sunAmount(payments)

            let availableAmount = 0;

            if (totalAmount > 0) {
                availableAmount = totalAmount - (pendingAmount + withdrowAmount)
            }
            responseReturn(res, 200, {
                totalAmount,
                pendingAmount,
                withdrowAmount,
                availableAmount,
                successWithdrows,
                pendingWithdrows
            })

        } catch (error) {
            console.log(error.message)
        }
    }

    withdrowal_request = async (req, res) => {
        const { amount, sellerId } = req.body
        console.log(req.body)
        try {
            const withdrowal = await withdrowRequest.create({
                sellerId,
                amount: parseInt(amount)
            })
            responseReturn(res, 200, { withdrowal, message: 'withdrowal request send' })
        } catch (error) {
            responseReturn(res, 500, { message: 'Internal server error' })
        }
    }

    get_payment_request = async (req, res) => {

        try {
            const withdrowalRequest = await withdrowRequest.find({ status: 'pending' })
            responseReturn(res, 200, { withdrowalRequest })
        } catch (error) {
            responseReturn(res, 500, { message: 'Internal server error' })
        }
    }

    payment_request_confirm = async (req, res) => {
        const { paymentId } = req.body

        try {
            const payment = await withdrowRequest.findById(paymentId)
            const { stripeId } = await striptModel.findOne({
                sellerId: new ObjectId(payment.sellerId)
            })

            await stripe.transfers.create({
                amount: payment.amount * 100,
                currency: 'usd',
                destination: stripeId
            })
            await withdrowRequest.findByIdAndUpdate(paymentId, { status: 'success' })
            responseReturn(res, 200, { payment, message: 'request confirm success' })
        } catch (error) {
            console.log(error.message)
            responseReturn(res, 500, { message: 'Internal server error or Account Not Connected' })
        }

    }

}

module.exports = new paymentController()*/
const sellerModel = require('../models/sellerModel')
const withdrowRequest = require('../models/withdrowModel')
const sellerWallet = require('../models/sellerWallet')
const { responseReturn } = require('../utiles/response')
const { v4: uuidv4 } = require('uuid')
const { mongo: { ObjectId } } = require('mongoose')
const axios = require('axios');

const PAYSTACK_SECRET_KEY = 'sk_test_b4350cdbcc88f8bf6d8984de76945b1b7c34ab13';

class paymentController {
    create_paystack_connect_account = async (req, res) => {
        const { id } = req;
        const uid = uuidv4();

        try {
            // No need for a similar approach like Stripe Express accounts in Paystack.
            // You would typically create a sub-account for the seller in Paystack.
            const subAccountResponse = await axios.post('https://api.paystack.co/subaccount', {
                business_name: `Seller_${id}`,
                settlement_bank: "044", // Bank code for the seller's bank
                account_number: "0000000000", // Seller's bank account number
                percentage_charge: 2.5
            }, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            });

            const subAccountId = subAccountResponse.data.data.subaccount_code;

            await sellerModel.findByIdAndUpdate(id, {
                paystackSubAccountId: subAccountId,
                code: uid
            });

            responseReturn(res, 201, { message: 'Paystack account created', subAccountId });
        } catch (error) {
            console.log('Paystack account creation error: ' + error.message);
            responseReturn(res, 500, { message: 'Error creating Paystack account' });
        }
    }

    active_paystack_connect_account = async (req, res) => {
        const { activeCode } = req.params;
        const { id } = req;

        try {
            const seller = await sellerModel.findOne({ code: activeCode });

            if (seller) {
                await sellerModel.findByIdAndUpdate(id, {
                    payment: 'active'
                });
                responseReturn(res, 200, { message: 'Payment activated' });
            } else {
                responseReturn(res, 404, { message: 'Payment activation failed' });
            }
        } catch (error) {
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    sunAmount = (data) => {
        let sum = 0;
        data.forEach(item => {
            sum += item.amount;
        });
        return sum;
    }

    get_seller_payemt_details = async (req, res) => {
        const { sellerId } = req.params;
        try {
            const payments = await sellerWallet.find({ sellerId });

            const pendingWithdrows = await withdrowRequest.find({
                sellerId,
                status: 'pending'
            });

            const successWithdrows = await withdrowRequest.find({
                sellerId,
                status: 'success'
            });

            const pendingAmount = this.sunAmount(pendingWithdrows);
            const withdrowAmount = this.sunAmount(successWithdrows);
            const totalAmount = this.sunAmount(payments);

            const availableAmount = totalAmount > 0 ? totalAmount - (pendingAmount + withdrowAmount) : 0;

            responseReturn(res, 200, {
                totalAmount,
                pendingAmount,
                withdrowAmount,
                availableAmount,
                successWithdrows,
                pendingWithdrows
            });
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    withdrowal_request = async (req, res) => {
        const { amount, sellerId } = req.body;
        try {
            const withdrowal = await withdrowRequest.create({
                sellerId,
                amount: parseInt(amount)
            });
            responseReturn(res, 200, { withdrowal, message: 'Withdrawal request sent' });
        } catch (error) {
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    get_payment_request = async (req, res) => {
        try {
            const withdrowalRequest = await withdrowRequest.find({ status: 'pending' });
            responseReturn(res, 200, { withdrowalRequest });
        } catch (error) {
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    payment_request_confirm = async (req, res) => {
        const { paymentId } = req.body;

        try {
            const payment = await withdrowRequest.findById(paymentId);
            const seller = await sellerModel.findOne({
                _id: new ObjectId(payment.sellerId)
            });

            const transferResponse = await axios.post('https://api.paystack.co/transfer', {
                source: "balance",
                reason: "Vendor payout",
                amount: payment.amount * 100, // Paystack uses kobo for currency
                recipient: seller.paystackSubAccountId
            }, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            });

            if (transferResponse.data.status) {
                await withdrowRequest.findByIdAndUpdate(paymentId, { status: 'success' });
                responseReturn(res, 200, { payment, message: 'Request confirmed successfully' });
            } else {
                throw new Error('Transfer failed');
            }
        } catch (error) {
            console.log(error.message);
            responseReturn(res, 500, { message: 'Internal server error or Account Not Connected' });
        }
    }
}

module.exports = new paymentController();
