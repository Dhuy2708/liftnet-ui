"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react"

interface PaymentInfo {
  orderId: string
  status: number
}

export const PaymentCallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)

  useEffect(() => {
    const orderId = searchParams.get("orderId")
    const status = Number(searchParams.get("status"))

    if (orderId && status) {
      setPaymentInfo({
        orderId,
        status
      })
    }
  }, [searchParams])

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#de9151]"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isSuccess = paymentInfo.status === 2

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/wallet")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Wallet
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            {isSuccess ? (
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSuccess ? "Payment Successful" : "Payment Failed"}
            </h1>
            <p className="text-gray-600">
                Order ID: {paymentInfo.orderId}   
            </p>
          </div>

         
          <div className="mt-8">
            <button
              onClick={() => navigate("/wallet")}
              className="w-full px-4 py-2 bg-gradient-to-r from-[#de9151] to-[#e9b08c] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Return to Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 