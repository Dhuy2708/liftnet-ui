"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, ArrowLeft, Wallet, Clock, AlertTriangle } from "lucide-react"

interface PaymentInfo {
  orderId: string
  status: number
}

export const PaymentCallbackPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const orderId = searchParams.get("orderId")
    const status = Number(searchParams.get("status"))

    if (orderId && status) {
      setPaymentInfo({
        orderId,
        status,
      })
      // Add a small delay for smooth animation
      setTimeout(() => setShowContent(true), 300)
    }
  }, [searchParams])

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#de9151] rounded-full animate-spin mx-auto mb-4"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#de9151]/30 rounded-full animate-spin mx-auto"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
          <p className="text-gray-600 font-medium">Processing payment result...</p>
        </div>
      </div>
    )
  }

  const isSuccess = paymentInfo.status === 2
  const isPending = paymentInfo.status === 1
  const isFailed = paymentInfo.status === 0

  const getStatusConfig = () => {
    if (isSuccess) {
      return {
        icon: CheckCircle2,
        iconColor: "text-emerald-500",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        title: "Payment Successful!",
        subtitle: "Your wallet has been topped up successfully",
        buttonText: "View Wallet",
        buttonStyle: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
      }
    } else if (isPending) {
      return {
        icon: Clock,
        iconColor: "text-amber-500",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        title: "Payment Pending",
        subtitle: "Your payment is being processed",
        buttonText: "Check Status",
        buttonStyle: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
      }
    } else {
      return {
        icon: AlertTriangle,
        iconColor: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        title: "Payment Failed",
        subtitle: "There was an issue processing your payment",
        buttonText: "Try Again",
        buttonStyle: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
      }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/wallet")}
            className="group flex items-center text-gray-600 hover:text-black transition-all duration-200 mb-6"
          >
            <ArrowLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Wallet</span>
          </button>
        </div>

        {/* Main Content */}
        <div
          className={`transition-all duration-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* Status Card */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-xl overflow-hidden">
            {/* Status Header */}
            <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-b-2 p-6 text-center`}>
              <div className="relative">
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 ${statusConfig.bgColor} rounded-full border-4 ${statusConfig.borderColor} mb-4 shadow-lg`}
                >
                  <StatusIcon className={`w-10 h-10 ${statusConfig.iconColor}`} />
                </div>
                {isSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-ping opacity-20"></div>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{statusConfig.title}</h1>
              <p className="text-gray-600 text-sm">{statusConfig.subtitle}</p>
            </div>

            {/* Order Details */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#de9151]/10 rounded-lg flex items-center justify-center mr-3">
                      <Wallet className="w-5 h-5 text-[#de9151]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-mono font-semibold text-gray-900 text-sm">{paymentInfo.orderId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Status</p>
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isSuccess
                          ? "bg-emerald-100 text-emerald-700"
                          : isPending
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isSuccess ? "Completed" : isPending ? "Pending" : "Failed"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/wallet")}
                  className={`w-full ${statusConfig.buttonStyle} text-white rounded-xl py-3 px-4 font-semibold transition-all duration-200 hover:scale-[1.02] shadow-lg`}
                >
                  {statusConfig.buttonText}
                </button>

                {isFailed && (
                  <button
                    onClick={() => navigate("/topup")}
                    className="w-full bg-[#de9151] hover:bg-[#c8834a] text-white rounded-xl py-3 px-4 font-semibold transition-all duration-200 hover:scale-[1.02]"
                  >
                    Try New Payment
                  </button>
                )}
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                  {isSuccess && "Transaction completed securely"}
                  {isPending && "Processing typically takes 1-3 minutes"}
                  {isFailed && "No charges were made to your account"}
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need assistance?{" "}
              <span className="text-[#de9151] font-medium cursor-pointer hover:underline">Contact Support</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
