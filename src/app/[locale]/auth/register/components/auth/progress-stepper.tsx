"use client"

import { Check } from "lucide-react"

interface ProgressStepperProps {
  currentStep: number
}

const steps = ["Account Type", "Registration", "Verification", "Complete"]

export default function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <div className="bg-white border-b px-6 py-5">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-colors ${
                index < currentStep
                  ? "bg-primary text-primary-foreground"
                  : index === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline ${
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 rounded transition-colors ${
                  index < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
