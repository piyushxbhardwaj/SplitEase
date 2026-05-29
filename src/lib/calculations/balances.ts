export interface Member {
  id: string;
  name: string | null;
  email: string;
}

export interface Expense {
  id: string;
  amount: number;
  paid_by: string;
  description: string;
}

export interface ExpenseSplit {
  expense_id: string;
  user_id: string;
  amount_owed: number;
}

export interface Settlement {
  id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  email: string;
  totalPaid: number;
  totalOwed: number;
  settlementsPaid: number;
  settlementsReceived: number;
  net: number; // positive = owed money, negative = owes money
}

export interface SuggestedTransaction {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export function calculateBalances(
  members: Member[],
  expenses: Expense[],
  splits: ExpenseSplit[],
  settlements: Settlement[]
): {
  balances: MemberBalance[];
  transactions: SuggestedTransaction[];
} {
  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  const balances: Record<string, MemberBalance> = {};

  // Initialize balances for all members
  members.forEach((member) => {
    balances[member.id] = {
      memberId: member.id,
      name: member.name || member.email.split('@')[0],
      email: member.email,
      totalPaid: 0,
      totalOwed: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
      net: 0,
    };
  });

  // Sum up total paid by each member
  expenses.forEach((exp) => {
    const payerId = exp.paid_by;
    if (balances[payerId]) {
      balances[payerId].totalPaid += Number(exp.amount);
    }
  });

  // Sum up total owed by each member
  splits.forEach((split) => {
    const debtorId = split.user_id;
    if (balances[debtorId]) {
      balances[debtorId].totalOwed += Number(split.amount_owed);
    }
  });

  // Sum up settlements paid and received
  settlements.forEach((settle) => {
    const payerId = settle.paid_by;
    const receiverId = settle.paid_to;

    if (balances[payerId]) {
      balances[payerId].settlementsPaid += Number(settle.amount);
    }
    if (balances[receiverId]) {
      balances[receiverId].settlementsReceived += Number(settle.amount);
    }
  });

  // Calculate net balance for each member
  // Net = (Paid + SettlementsPaid) - (Owed + SettlementsReceived)
  const balancesList = Object.values(balances).map((bal) => {
    const net = (bal.totalPaid + bal.settlementsPaid) - (bal.totalOwed + bal.settlementsReceived);
    bal.net = Math.round((net + Number.EPSILON) * 100) / 100;
    return bal;
  });

  // Generate suggested transactions to settle the debts (Who owes whom)
  const debtors = balancesList
    .filter((b) => b.net < -0.009)
    .map((b) => ({ ...b, absNet: Math.abs(b.net) }));
  
  const creditors = balancesList
    .filter((b) => b.net > 0.009)
    .map((b) => ({ ...b }));

  // Sort: largest net first
  debtors.sort((a, b) => b.absNet - a.absNet);
  creditors.sort((a, b) => b.net - a.net);

  const transactions: SuggestedTransaction[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    if (debtor.absNet < 0.01) {
      dIdx++;
      continue;
    }
    if (creditor.net < 0.01) {
      cIdx++;
      continue;
    }

    const amount = Math.min(debtor.absNet, creditor.net);
    const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        fromId: debtor.memberId,
        fromName: debtor.name,
        toId: creditor.memberId,
        toName: creditor.name,
        amount: roundedAmount,
      });
    }

    debtor.absNet -= roundedAmount;
    creditor.net -= roundedAmount;

    if (debtor.absNet < 0.01) {
      dIdx++;
    }
    if (creditor.net < 0.01) {
      cIdx++;
    }
  }

  return {
    balances: balancesList,
    transactions,
  };
}
