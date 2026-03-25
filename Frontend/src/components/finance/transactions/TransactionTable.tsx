const rows = [
  {
    title: "Lunch at Cafe",
    type: "expense",
    category: "Food",
    account: "GPay Wallet",
    amount: "₹ 280",
    date: "2026-03-14",
  },
  {
    title: "Salary Credit",
    type: "income",
    category: "Salary",
    account: "SBI Savings",
    amount: "₹ 45,000",
    date: "2026-03-12",
  },
];

const TransactionTable = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-border/10 bg-card/5 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/5 text-left text-zinc-300">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.title}-${idx}`} className="border-t border-border/30">
                <td className="px-4 py-3 font-medium">{row.title}</td>
                <td className="px-4 py-3 capitalize">{row.type}</td>
                <td className="px-4 py-3">{row.category}</td>
                <td className="px-4 py-3">{row.account}</td>
                <td className="px-4 py-3">{row.amount}</td>
                <td className="px-4 py-3">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;