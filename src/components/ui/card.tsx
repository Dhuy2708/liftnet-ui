import { HTMLAttributes } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${className}`}
      {...props}
    />
  )
} 