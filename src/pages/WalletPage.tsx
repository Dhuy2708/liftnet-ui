"use client"

import { useState, useEffect } from "react"
import { Spin } from "antd"
import { formatCurrency } from "../utils/format"
import { ArrowUpRight, ArrowDownLeft, Wallet, Clock, DollarSign, BarChart3 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useWalletStore } from "../store/WalletStore"

interface Transaction {
  id: string
  amount: number
  type: "credit" | "debit"
  description: string
  date: string
  currency: "LIFT"
}

export const WalletPage = () => {
  const navigate = useNavigate()
  const { balance, isLoading, error, getBalance } = useWalletStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    getBalance()
  }, [getBalance])

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Simulated API response
        setTransactions([
          {
            id: "1",
            amount: 100,
            type: "credit",
            description: "Payment for training session",
            date: "2024-03-20",
            currency: "LIFT",
          },
          {
            id: "2",
            amount: 50,
            type: "debit",
            description: "Subscription renewal",
            date: "2024-03-19",
            currency: "LIFT",
          },
          {
            id: "3",
            amount: 75,
            type: "credit",
            description: "Reward bonus",
            date: "2024-03-17",
            currency: "LIFT",
          },
        ])
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }

    fetchTransactions()
  }, [])

  const filteredTransactions = transactions

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Loading your wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 flex items-center">
          <Wallet className="mr-3 text-[#de9151]" />
          My Wallet
        </h1>

        {/* Balance Card */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all hover:shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#de9151] to-[#e9b08c] flex items-center justify-center mr-3">
                    <DollarSign className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">LiftCoin Balance</h3>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-orange-50 text-[#de9151] rounded-full">LIFT</span>
              </div>
              <div className="flex items-baseline">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#de9151] to-[#e9b08c] bg-clip-text text-transparent">
                  {formatCurrency(balance, "LIFT")}
                </h2>
              </div>
              <div className="mt-4 flex justify-between">
                <button 
                  onClick={() => navigate('/topup')}
                  className="px-4 py-2 bg-gradient-to-r from-[#de9151] to-[#e9b08c] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center"
                >
                  <ArrowUpRight size={16} className="mr-1" /> Top Up
                </button>
                <button 
                  onClick={() => navigate('/withdraw')}
                  className="px-4 py-2 border border-[#de9151] text-[#de9151] rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors flex items-center"
                >
                  <ArrowDownLeft size={16} className="mr-1" /> Withdraw
                </button>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-[#de9151] to-[#e9b08c]"></div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Clock className="mr-3 text-[#de9151]" />
              <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-600">{formatDate(transaction.date)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              transaction.type === "credit" ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {transaction.type === "credit" ? (
                              <ArrowDownLeft size={16} className="text-green-600" />
                            ) : (
                              <ArrowUpRight size={16} className="text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {transaction.type === "credit" ? "Received" : "Sent"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`py-4 px-4 text-right font-medium ${
                          transaction.type === "credit" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        <div className="flex items-center justify-end">
                          <span className="mr-1">{transaction.type === "credit" ? "+" : "-"}</span>
                          <span>{formatCurrency(transaction.amount, "LIFT")}</span>
                          <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full bg-orange-50 text-[#de9151]">
                            LIFT
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button className="px-4 py-2 text-[#de9151] text-sm font-medium hover:underline transition-all flex items-center">
              View All Transactions
              <ArrowUpRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
