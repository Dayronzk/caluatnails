import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: "rose" | "blue" | "green" | "amber" | "purple";
}

const colorClasses = {
  rose: "bg-rose-50 text-rose-600",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
};

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  color,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              changeType === "up"
                ? "text-emerald-600"
                : changeType === "down"
                ? "text-rose-600"
                : "text-gray-500"
            }`}
          >
            {changeType === "up" && <TrendingUp className="w-4 h-4" />}
            {changeType === "down" && <TrendingDown className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  );
}