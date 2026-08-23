import { Loan } from '../types';
import { generateInstallmentSchedule, recalculateLoanState } from '../utils/loanUtils';

const rawLoans: Loan[] = [
  {
    id: 'LN-2026-1001',
    accountNumber: 'ACC-883921',
    customerName: 'Sarah Jenkins',
    customerPhone: '+94 77 234 5678',
    customerEmail: 'sarah.j@example.com',
    loanType: 'Instant Personal',
    requestedAmount: 500000,
    disbursedAmount: 500000,
    interestRatePerAnnum: 14.5,
    termMonths: 12,
    repaymentFrequency: 'Monthly',
    interestMethod: 'Reducing Balance',
    processingFee: 15000,
    earlySettlementPenaltyPercent: 2.5,
    status: 'Active',
    requestedDate: '2026-03-10',
    approvedDate: '2026-03-11',
    disbursedDate: '2026-03-12',
    purpose: 'Home repairs & appliances',
    creditScore: 745,
    totalPaidAmount: 0,
    outstandingBalance: 500000,
    kyc: {
      nationalIdNumber: '199216604092',
      idType: 'NIC',
      dateOfBirth: '1992-06-15',
      gender: 'Female',
      occupation: 'Senior Financial Analyst',
      employerName: 'Apex Capital Inc',
      monthlyIncome: 250000,
      addressLine: '742 Galle Road',
      city: 'Colombo 03',
      postalCode: '00300',
      guarantorName: 'Robert Jenkins',
      guarantorPhone: '+94 71 888 2341',
      guarantorRelation: 'Brother',
      bankName: 'Commercial Bank of Ceylon',
      accountNumber: '**** **** 4912',
      isVerified: true,
      verifiedBy: 'Officer James Sterling',
      verifiedAt: '2026-03-11 14:30',
      documents: [
        {
          id: 'DOC-101',
          type: 'National ID / Passport',
          fileName: 'sarah_jenkins_nic_front_back.pdf',
          fileUrl: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400&q=80',
          status: 'Verified',
          uploadedAt: '2026-03-10 10:15',
        },
        {
          id: 'DOC-102',
          type: 'Proof of Address',
          fileName: 'utility_bill_electric_feb2026.pdf',
          fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
          status: 'Verified',
          uploadedAt: '2026-03-10 10:18',
        },
        {
          id: 'DOC-103',
          type: 'Pay Slip / Bank Statement',
          fileName: 'pay_stub_jan_feb_2026.pdf',
          fileUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&q=80',
          status: 'Verified',
          uploadedAt: '2026-03-10 10:20',
        },
      ],
    },
    installments: [],
    payments: [],
  },
  {
    id: 'LN-2026-1002',
    accountNumber: 'ACC-912044',
    customerName: 'David Miller',
    customerPhone: '+94 76 912 3049',
    customerEmail: 'david.m@example.com',
    loanType: 'Emergency Quick',
    requestedAmount: 250000,
    disbursedAmount: 250000,
    interestRatePerAnnum: 16.0,
    termMonths: 6,
    repaymentFrequency: 'Monthly',
    interestMethod: 'Flat Rate',
    processingFee: 7500,
    earlySettlementPenaltyPercent: 2.0,
    status: 'KYC Pending',
    requestedDate: '2026-07-20',
    approvedDate: '2026-07-21',
    purpose: 'Medical emergency expenses',
    creditScore: 680,
    totalPaidAmount: 0,
    outstandingBalance: 250000,
    kyc: {
      nationalIdNumber: '198831002910',
      idType: 'Passport',
      dateOfBirth: '1988-11-03',
      gender: 'Male',
      occupation: 'Software Quality Engineer',
      employerName: 'TechCorp Labs',
      monthlyIncome: 180000,
      addressLine: '128 Kandy Road',
      city: 'Kelaniya',
      postalCode: '11600',
      guarantorName: 'Amanda Miller',
      guarantorPhone: '+94 77 402 9912',
      guarantorRelation: 'Spouse',
      bankName: 'Hatton National Bank',
      accountNumber: '**** **** 1029',
      isVerified: false,
      documents: [
        {
          id: 'DOC-201',
          type: 'National ID / Passport',
          fileName: 'david_passport_scan.pdf',
          fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
          status: 'Pending Review',
          uploadedAt: '2026-07-20 16:22',
        },
      ],
    },
    installments: [],
    payments: [],
  },
  {
    id: 'LN-2026-1003',
    accountNumber: 'ACC-774910',
    customerName: 'Elena Rostova',
    customerPhone: '+94 75 774 0012',
    customerEmail: 'elena.rostova@example.com',
    loanType: 'Business Expansion',
    requestedAmount: 1500000,
    disbursedAmount: 1500000,
    interestRatePerAnnum: 12.0,
    termMonths: 24,
    repaymentFrequency: 'Monthly',
    interestMethod: 'Reducing Balance',
    processingFee: 30000,
    earlySettlementPenaltyPercent: 3.0,
    status: 'Pending Approval',
    requestedDate: '2026-07-22',
    purpose: 'Boutique inventory purchase',
    creditScore: 790,
    totalPaidAmount: 0,
    outstandingBalance: 1500000,
    kyc: {
      nationalIdNumber: '199558802910',
      idType: 'NIC',
      dateOfBirth: '1995-02-28',
      gender: 'Female',
      occupation: 'Retail Business Owner',
      employerName: 'Self Employed - Rostova Fashion',
      monthlyIncome: 350000,
      addressLine: '504 Main Street',
      city: 'Negombo',
      postalCode: '11500',
      guarantorName: 'Victor Rostova',
      guarantorPhone: '+94 70 901 2281',
      guarantorRelation: 'Father',
      bankName: 'Sampath Bank',
      accountNumber: '**** **** 8820',
      isVerified: false,
      documents: [
        {
          id: 'DOC-301',
          type: 'Business Registration',
          fileName: 'rostova_fashion_biz_reg.pdf',
          fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&q=80',
          status: 'Pending Review',
          uploadedAt: '2026-07-22 09:10',
        },
        {
          id: 'DOC-302',
          type: 'Pay Slip / Bank Statement',
          fileName: 'bank_statement_6_months.pdf',
          fileUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&q=80',
          status: 'Pending Review',
          uploadedAt: '2026-07-22 09:12',
        },
      ],
    },
    installments: [],
    payments: [],
  },
  {
    id: 'LN-2026-1004',
    accountNumber: 'ACC-331092',
    customerName: 'Marcus Vance',
    customerPhone: '+94 77 331 9022',
    customerEmail: 'marcus.vance@example.com',
    loanType: 'Standard Personal',
    requestedAmount: 800000,
    disbursedAmount: 800000,
    interestRatePerAnnum: 15.0,
    termMonths: 12,
    repaymentFrequency: 'Monthly',
    interestMethod: 'Reducing Balance',
    processingFee: 20000,
    earlySettlementPenaltyPercent: 2.5,
    status: 'Overdue',
    requestedDate: '2026-01-15',
    approvedDate: '2026-01-16',
    disbursedDate: '2026-01-17',
    purpose: 'Vehicle maintenance & consolidation',
    creditScore: 610,
    totalPaidAmount: 0,
    outstandingBalance: 800000,
    kyc: {
      nationalIdNumber: '198423200192',
      idType: 'Driver License',
      dateOfBirth: '1984-08-19',
      gender: 'Male',
      occupation: 'Logistics Coordinator',
      employerName: 'Speedy Express Inc',
      monthlyIncome: 160000,
      addressLine: '902 Station Road',
      city: 'Kurunegala',
      postalCode: '60000',
      guarantorName: 'Carl Vance',
      guarantorPhone: '+94 71 102 8833',
      guarantorRelation: 'Uncle',
      bankName: 'Nations Trust Bank',
      accountNumber: '**** **** 3301',
      isVerified: true,
      verifiedBy: 'Officer James Sterling',
      verifiedAt: '2026-01-16 11:00',
      documents: [
        {
          id: 'DOC-401',
          type: 'National ID / Passport',
          fileName: 'marcus_dl_license.pdf',
          fileUrl: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400&q=80',
          status: 'Verified',
          uploadedAt: '2026-01-15 11:30',
        },
      ],
    },
    installments: [],
    payments: [],
  },
  {
    id: 'LN-2026-1005',
    accountNumber: 'ACC-502188',
    customerName: 'Sophia Chen',
    customerPhone: '+94 72 502 1880',
    customerEmail: 'sophia.c@example.com',
    loanType: 'Instant Personal',
    requestedAmount: 400000,
    disbursedAmount: 400000,
    interestRatePerAnnum: 13.5,
    termMonths: 12,
    repaymentFrequency: 'Monthly',
    interestMethod: 'Reducing Balance',
    processingFee: 12000,
    earlySettlementPenaltyPercent: 2.0,
    status: 'Early Settled',
    requestedDate: '2026-02-01',
    approvedDate: '2026-02-02',
    disbursedDate: '2026-02-03',
    settledDate: '2026-05-15',
    purpose: 'Education tuition fees',
    creditScore: 810,
    totalPaidAmount: 408500,
    outstandingBalance: 0,
    kyc: {
      nationalIdNumber: '199781003058',
      idType: 'NIC',
      dateOfBirth: '1997-12-12',
      gender: 'Female',
      occupation: 'UX Designer',
      employerName: 'Creative Cloud Studio',
      monthlyIncome: 280000,
      addressLine: '310 High Level Road',
      city: 'Nugegoda',
      postalCode: '10250',
      guarantorName: 'David Chen',
      guarantorPhone: '+94 77 991 0022',
      guarantorRelation: 'Brother',
      bankName: 'Seylan Bank',
      accountNumber: '**** **** 9011',
      isVerified: true,
      verifiedBy: 'Officer James Sterling',
      verifiedAt: '2026-02-02 16:00',
      documents: [],
    },
    installments: [],
    payments: [],
  },
];

// Populate schedules and initial payments for realistic demo
export const INITIAL_LOANS: Loan[] = rawLoans.map(raw => {
  if (raw.status === 'Pending Approval') {
    const sched = generateInstallmentSchedule(raw.requestedAmount, raw.interestRatePerAnnum, raw.termMonths, raw.repaymentFrequency, raw.interestMethod, '2026-08-01');
    return recalculateLoanState({ ...raw, installments: sched });
  }

  if (raw.status === 'KYC Pending') {
    const sched = generateInstallmentSchedule(raw.requestedAmount, raw.interestRatePerAnnum, raw.termMonths, raw.repaymentFrequency, raw.interestMethod, '2026-08-01');
    return recalculateLoanState({ ...raw, installments: sched });
  }

  if (raw.id === 'LN-2026-1001') { // Sarah Jenkins - Active with 3 paid installments
    const sched = generateInstallmentSchedule(500000, 14.5, 12, 'Monthly', 'Reducing Balance', '2026-03-12');
    
    // Simulate payments for March, April, May
    const payment1Date = '2026-04-12';
    const payment2Date = '2026-05-12';
    const payment3Date = '2026-06-12';
    const emiVal = sched[0].totalInstallment;

    sched[0].paidAmount = emiVal;
    sched[0].remainingAmount = 0;
    sched[0].status = 'Paid';
    sched[0].paidDate = payment1Date;

    sched[1].paidAmount = emiVal;
    sched[1].remainingAmount = 0;
    sched[1].status = 'Paid';
    sched[1].paidDate = payment2Date;

    sched[2].paidAmount = emiVal;
    sched[2].remainingAmount = 0;
    sched[2].status = 'Paid';
    sched[2].paidDate = payment3Date;

    const payments = [
      {
        id: 'PAY-1003',
        loanId: 'LN-2026-1001',
        customerName: 'Sarah Jenkins',
        amount: emiVal,
        paymentDate: payment3Date,
        paymentMethod: 'Bank Transfer' as const,
        referenceNumber: 'TRF-902183',
        receivedBy: 'System Auto-Debit',
        notes: 'Monthly Installment #3',
        allocatedPrincipal: sched[2].principalAmount,
        allocatedInterest: sched[2].interestAmount,
        allocatedLateFee: 0,
        installmentNumbersCovered: [3],
      },
      {
        id: 'PAY-1002',
        loanId: 'LN-2026-1001',
        customerName: 'Sarah Jenkins',
        amount: emiVal,
        paymentDate: payment2Date,
        paymentMethod: 'Bank Transfer' as const,
        referenceNumber: 'TRF-881293',
        receivedBy: 'System Auto-Debit',
        notes: 'Monthly Installment #2',
        allocatedPrincipal: sched[1].principalAmount,
        allocatedInterest: sched[1].interestAmount,
        allocatedLateFee: 0,
        installmentNumbersCovered: [2],
      },
      {
        id: 'PAY-1001',
        loanId: 'LN-2026-1001',
        customerName: 'Sarah Jenkins',
        amount: emiVal,
        paymentDate: payment1Date,
        paymentMethod: 'Bank Transfer' as const,
        referenceNumber: 'TRF-771029',
        receivedBy: 'System Auto-Debit',
        notes: 'Monthly Installment #1',
        allocatedPrincipal: sched[0].principalAmount,
        allocatedInterest: sched[0].interestAmount,
        allocatedLateFee: 0,
        installmentNumbersCovered: [1],
      }
    ];

    return recalculateLoanState({
      ...raw,
      installments: sched,
      payments,
    });
  }

  if (raw.id === 'LN-2026-1004') { // Marcus Vance - Overdue
    const sched = generateInstallmentSchedule(800000, 15.0, 12, 'Monthly', 'Reducing Balance', '2026-01-17');
    // First 2 installments paid, March/April unpaid -> now Overdue
    const emiVal = sched[0].totalInstallment;
    
    sched[0].paidAmount = emiVal;
    sched[0].remainingAmount = 0;
    sched[0].status = 'Paid';
    sched[0].paidDate = '2026-02-17';

    sched[1].status = 'Overdue';
    sched[1].lateFee = 2500;
    sched[2].status = 'Overdue';
    sched[2].lateFee = 2500;
    sched[3].status = 'Overdue';

    const payments = [
      {
        id: 'PAY-2001',
        loanId: 'LN-2026-1004',
        customerName: 'Marcus Vance',
        amount: emiVal,
        paymentDate: '2026-02-17',
        paymentMethod: 'Cash' as const,
        referenceNumber: 'CSH-10293',
        receivedBy: 'Cashier Mary Lane',
        notes: 'Installment #1 Cash payment at branch',
        allocatedPrincipal: sched[0].principalAmount,
        allocatedInterest: sched[0].interestAmount,
        allocatedLateFee: 0,
        installmentNumbersCovered: [1],
      }
    ];

    return recalculateLoanState({
      ...raw,
      installments: sched,
      payments,
      status: 'Overdue',
    });
  }

  if (raw.id === 'LN-2026-1005') { // Sophia Chen - Early Settled
    const sched = generateInstallmentSchedule(400000, 13.5, 12, 'Monthly', 'Reducing Balance', '2026-02-03');
    sched.forEach(i => {
      i.paidAmount = i.totalInstallment;
      i.remainingAmount = 0;
      i.status = 'Paid';
      i.paidDate = '2026-05-15';
    });

    return recalculateLoanState({
      ...raw,
      installments: sched,
      payments: [
        {
          id: 'SETTLE-5001',
          loanId: 'LN-2026-1005',
          customerName: 'Sophia Chen',
          amount: 312000,
          paymentDate: '2026-05-15',
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'STL-992018',
          receivedBy: 'Officer James Sterling',
          notes: 'Full early settlement payment executed. Unearned interest waived.',
          allocatedPrincipal: 305000,
          allocatedInterest: 7000,
          allocatedLateFee: 0,
          installmentNumbersCovered: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        },
        {
          id: 'PAY-5002',
          loanId: 'LN-2026-1005',
          customerName: 'Sophia Chen',
          amount: 35800,
          paymentDate: '2026-04-03',
          paymentMethod: 'Debit/Credit Card',
          referenceNumber: 'CRD-10293',
          receivedBy: 'System Online',
          notes: 'Regular Installment #2',
          allocatedPrincipal: 31500,
          allocatedInterest: 4300,
          allocatedLateFee: 0,
          installmentNumbersCovered: [2],
        },
        {
          id: 'PAY-5001',
          loanId: 'LN-2026-1005',
          customerName: 'Sophia Chen',
          amount: 35800,
          paymentDate: '2026-03-03',
          paymentMethod: 'Debit/Credit Card',
          referenceNumber: 'CRD-10112',
          receivedBy: 'System Online',
          notes: 'Regular Installment #1',
          allocatedPrincipal: 31100,
          allocatedInterest: 4700,
          allocatedLateFee: 0,
          installmentNumbersCovered: [1],
        }
      ],
      status: 'Early Settled',
    });
  }

  const defaultSched = generateInstallmentSchedule(raw.requestedAmount, raw.interestRatePerAnnum, raw.termMonths, raw.repaymentFrequency, raw.interestMethod, '2026-08-01');
  return recalculateLoanState({ ...raw, installments: defaultSched });
});
