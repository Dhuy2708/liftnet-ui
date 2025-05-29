"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { usePaymentStore } from "../store/PaymentStore"
import { ArrowLeft, Coins, CreditCard, Wallet } from "lucide-react"

export const TopUpPage = () => {
  const navigate = useNavigate()
  const { createPaymentUrl, isLoading, error } = usePaymentStore()
  const [amount, setAmount] = useState("")
  const [liftCoinAmount, setLiftCoinAmount] = useState(0)

  useEffect(() => {
    const vndAmount = Number(amount.replace(/,/g, "")) || 0
    setLiftCoinAmount(Math.floor(vndAmount / 1000))
  }, [amount])

  const generateDescription = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const description = generateDescription()
    const paymentUrl = await createPaymentUrl(Number(amount.replace(/,/g, "")), description)
    if (paymentUrl) {
      window.location.href = paymentUrl
    }
  }

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, "")
    if (value === "" || /^\d+$/.test(value)) {
      setAmount(value === "" ? "" : formatNumber(Number(value)))
    }
  }

  const quickAmounts = [50000, 100000, 200000, 500000]

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={24} className="mr-2" />
            <span className="font-medium text-lg">Back</span>
          </button>
          <div className="flex items-center">
            <Wallet className="w-7 h-7 text-[#de9151] mr-2" />
            <h1 className="text-2xl font-bold text-black">Top Up Wallet</h1>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-lg overflow-hidden">
          {/* Quick Amount Selection */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Quick Select</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(formatNumber(quickAmount))}
                  className={`p-4 rounded-lg border transition-all ${
                    amount === formatNumber(quickAmount)
                      ? "border-[#de9151] bg-[#de9151]/5 text-[#de9151] font-medium"
                      : "border-gray-200 hover:border-[#de9151]/30 text-gray-700"
                  }`}
                >
                  <div className="font-medium text-base">{formatNumber(quickAmount)}</div>
                  <div className="text-sm text-gray-500">{formatNumber(quickAmount / 1000)} coins</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-base font-semibold text-gray-700 mb-2">
                  Custom Amount (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="amount"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#de9151]/20 focus:border-[#de9151] transition-all"
                    placeholder="Enter amount"
                    required
                    min="1000"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base font-medium">
                    VND
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">1 LiftCoin = 1,000 VND</p>
              </div>

              {/* Conversion Display */}
              {amount && liftCoinAmount > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Coins className="w-6 h-6 text-[#de9151] mr-2" />
                      <div>
                        <p className="text-base text-gray-600">You'll receive</p>
                        <p className="font-bold text-lg text-[#de9151]">{formatNumber(liftCoinAmount)} LiftCoins</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base text-gray-600">Total</p>
                      <p className="font-semibold text-lg text-black">{amount} VND</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-base text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || liftCoinAmount === 0}
                className="w-full bg-[#de9151] hover:bg-[#c8834a] text-white rounded-lg py-4 px-4 text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">🔒 Secure payment processing</p>
        </div>
      </div>
    </div>
  )
}
