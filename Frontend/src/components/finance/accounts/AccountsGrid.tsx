import AccountCard from "./AccountCard";

const mockAccounts = [
  {
    name: "SBI Savings",
    type: "bank",
    balance: "₹ 85,000",
    institution: "State Bank of India",
  },
  {
    name: "GPay Wallet",
    type: "wallet",
    balance: "₹ 3,500",
    institution: "Google Pay",
  },
  {
    name: "Cash Wallet",
    type: "cash",
    balance: "₹ 2,000",
    institution: "On hand",
  },
];

const AccountsGrid = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {mockAccounts.map((account) => (
        <AccountCard key={account.name} {...account} />
      ))}
    </div>
  );
};

export default AccountsGrid;