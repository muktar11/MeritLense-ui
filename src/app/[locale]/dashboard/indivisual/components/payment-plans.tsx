"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PaymentPlans() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  const plans = [
    {
      name: "Starter",
      price: 1000,
      description: "Perfect for getting started",
      features: [
        "Monthly Evaluations up to 5",
        "Basic Reports",
        "Candidate + Advanced",
        "PDF Reports",
        "Enhanced Support",
        "Report PDF Creation",
        "Export Evaluation",
        "File Report evaluation",
      ],
    },
    {
      name: "Growth",
      price: 2000,
      description: "For growing businesses",
      features: [
        "Monthly Evaluations up to 25",
        "Dashboard + Analytics",
        "Report Advanced",
        "Video Introduction",
        "Benchmarking & Predictive Comparison",
        "Moderation & Bulk Scoring",
        "Video Reference & Analysis",
        "Recording & Analysis",
      ],
    },
    {
      name: "Business",
      price: 3500,
      description: "For established businesses",
      features: [
        "Unlimited Monthly Evaluations",
        "Up to 150x",
        "Add-on Discount 10%",
        "Priority Support 15% Discount",
        "Custom Behavioral Model",
        "Supplemental Report",
        "API Access",
      ],
    },
    {
      name: "Enterprise",
      price: null,
      description: "Custom solution",
      features: [
        "Unlimited Monthly Evaluations",
        "Unlimited Add-on",
        "Discount",
        "Priority & Expert Support",
        "Dedicated Account Manager",
        "All custom features",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">The Right Plan for Your Business</h1>
          <p className="text-gray-600 mb-8">
            Based on your selected role and coverage options, here is an estimate of plan cost. Costs are 100%
            transparent and billed once a month package, but some features will not be disabled
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`font-medium ${billingPeriod === "monthly" ? "text-gray-900" : "text-gray-600"}`}>
              Bill Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingPeriod === "annual" ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute w-6 h-6 bg-white rounded-full top-0.5 transition-transform ${
                  billingPeriod === "annual" ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={`font-medium ${billingPeriod === "annual" ? "text-gray-900" : "text-gray-600"}`}>
              Bill Annually
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-xl border transition-all ${index === 2 ? "border-purple-600 shadow-lg scale-105" : "border-gray-200"} bg-white p-8`}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

              <div className="mb-6">
                {plan.price ? (
                  <>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">€{plan.price.toLocaleString()}</span>
                      <span className="text-gray-600 text-sm">/month</span>
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-gray-900 mb-2">Custom</div>
                )}
              </div>

              <Button className="w-full mb-8 bg-purple-600 hover:bg-purple-700">Get Started</Button>

              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Finish Button */}
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700 px-8">Finish</Button>
        </div>
      </div>
    </div>
  )
}
