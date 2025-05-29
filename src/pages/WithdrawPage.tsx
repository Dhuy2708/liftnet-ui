"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePaymentStore } from "../store/PaymentStore"
import { ArrowLeft } from "lucide-react"

export const WithdrawPage = () => {
  const navigate = useNavigate()
  const { createPaymentUrl, isLoading, error } = usePaymentStore()
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const paymentUrl = await createPaymentUrl(Number(amount), description)
    if (paymentUrl) {
      window.location.href = paymentUrl
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Withdraw Money</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount (VND)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de9151] focus:border-transparent"
                placeholder="Enter amount"
                required
                min="1000"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#de9151] focus:border-transparent"
                placeholder="Enter description"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gradient-to-r from-[#de9151] to-[#e9b08c] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Proceed to Withdraw"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 