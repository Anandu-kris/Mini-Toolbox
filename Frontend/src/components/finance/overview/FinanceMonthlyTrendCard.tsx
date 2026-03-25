import FinanceSectionHeader from "../FinanceSectionHeader";
import type { FinanceMonthlyTrendItem } from "@/services/finance_manager.service";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  monthlyTrend: FinanceMonthlyTrendItem[];
};

function formatCurrency(value: number) {
  return `₹ ${value.toLocaleString("en-IN")}`;
}

function formatMonthLabel(month: string) {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1, 1);

  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

const FinanceMonthlyTrendCard = ({ monthlyTrend }: Props) => {
  const chartData = monthlyTrend.map((item) => ({
    ...item,
    label: formatMonthLabel(item.month),
  }));

  return (
    <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(35,41,88,0.22),rgba(20,4,55,0.46))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <FinanceSectionHeader
        title="Monthly Trend"
        description="Income, expense, and net savings over time."
      />

      <div className="mt-5 h-[340px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 8, bottom: 4 }}
              barGap={10}
            >
              <CartesianGrid
                stroke="rgba(255,255,255,0.14)"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "rgba(255,255,255,0.78)", fontSize: 13 }}
              />

              <YAxis
                tickFormatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
                tickLine={false}
                axisLine={false}
                tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 13 }}
                width={90}
              />

              <Tooltip
                formatter={(value, name) => {
                  const numericValue =
                    typeof value === "number"
                      ? value
                      : Number(value ?? 0);

                  const label =
                    name === "income"
                      ? "Income"
                      : name === "expense"
                      ? "Expense"
                      : "Net";

                  return [formatCurrency(numericValue), label];
                }}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(9, 12, 28, 0.96)",
                  color: "#ffffff",
                  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
                }}
                labelStyle={{
                  color: "rgba(255,255,255,0.92)",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
                itemStyle={{
                  color: "rgba(255,255,255,0.88)",
                }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />

              <Legend
                wrapperStyle={{
                  color: "rgba(255,255,255,0.84)",
                  paddingTop: 12,
                }}
                formatter={(value) => {
                  if (value === "income") return "Income";
                  if (value === "expense") return "Expense";
                  return "Net";
                }}
              />

              <Bar
                dataKey="income"
                name="income"
                fill="#4ade80"
                radius={[10, 10, 0, 0]}
                maxBarSize={32}
              />

              <Bar
                dataKey="expense"
                name="expense"
                fill="#fb923c"
                radius={[10, 10, 0, 0]}
                maxBarSize={32}
              />

              <Line
                type="monotone"
                dataKey="net"
                name="net"
                stroke="#67e8f9"
                strokeWidth={3}
                dot={{
                  r: 4,
                  stroke: "#67e8f9",
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
                activeDot={{
                  r: 6,
                  stroke: "#67e8f9",
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/3 px-6 text-center">
            <p className="text-sm text-white/65">
              No monthly trend data available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceMonthlyTrendCard;