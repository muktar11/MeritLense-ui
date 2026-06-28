export default function KPICards() {
  const cards = [
    {
      title: "Evaluations Completed",
      value: "400",
      subtitle: "+20% growth",
      icon: "📊",
      color: "blue",
    },
    {
      title: "Active Candidates",
      value: "2,405",
      subtitle: "+15 profiles",
      icon: "👥",
      color: "green",
    },
    {
      title: "Certificates Issued",
      value: "500",
      subtitle: "Valid",
      icon: "📄",
      color: "purple",
    },
    {
      title: "Bonus Balance",
      value: "1200",
      subtitle: "3% paid in month",
      icon: "💰",
      color: "blue",
    },
    {
      title: "Success Rate",
      value: "70%",
      subtitle: "8% increase",
      icon: "📈",
      color: "green",
    },
    {
      title: "Critical Alert",
      value: "Contract Pending",
      subtitle: "Action Required",
      icon: "⚠️",
      color: "red",
    },
  ]

  return (
    <div className="grid grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-xs font-medium mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
