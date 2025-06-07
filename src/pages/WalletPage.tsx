"use client"

import { useState, useEffect } from "react"
import { Spin } from "antd"
import { formatCurrency } from "../utils/format"
import { ArrowUpRight, ArrowDownLeft, Wallet, Clock, DollarSign, BarChart3 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useWalletStore, TransactionType, TransactionStatus } from "../store/WalletStore"

export const WalletPage = () => {
  const navigate = useNavigate()
  const { balance, transactions, isLoading, getBalance, getTransactions } = useWalletStore()
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    getBalance()
    getTransactions(currentPage)
  }, [getBalance, getTransactions, currentPage])

  const getTransactionType = (type: TransactionType) => {
    switch (type) {
      case TransactionType.Topup:
        return "Top Up"
      case TransactionType.Transfer:
        return "Transfer"
      case TransactionType.Withdraw:
        return "Withdraw"
      default:
        return "Unknown"
    }
  }

  const getTransactionStatus = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.Pending:
        return "Pending"
      case TransactionStatus.Success:
        return "Success"
      case TransactionStatus.Failed:
        return "Failed"
      case TransactionStatus.Hold:
        return "On Hold"
      default:
        return "Unknown"
    }
  }

  const getTypeBadgeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.Topup:
        return 'bg-blue-100 text-blue-600'
      case TransactionType.Transfer:
        return 'bg-purple-100 text-purple-600'
      case TransactionType.Withdraw:
        return 'bg-orange-100 text-orange-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
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

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-1/5">Transaction ID</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-1/5">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-1/5">Type</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-1/5">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-1/5">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-600 text-center">{transaction.transactionId}</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <span className="font-medium text-gray-800">{formatCurrency(transaction.amount, "VND")}</span>
                          <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full bg-orange-50 text-[#de9151]">
                            VND
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(transaction.type)}`}>
                          {getTransactionType(transaction.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === TransactionStatus.Success ? 'bg-green-100 text-green-600' :
                          transaction.status === TransactionStatus.Pending ? 'bg-yellow-100 text-yellow-600' :
                          transaction.status === TransactionStatus.Failed ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getTransactionStatus(transaction.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-center">{transaction.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 text-[#de9151] text-sm font-medium hover:underline transition-all flex items-center"
            >
              Load More
              <ArrowUpRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
