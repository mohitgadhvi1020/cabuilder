import type { AssetItem, FinancialGridRow, FormData, LiabilityItem, YearValues } from "./types";
import { alignYearHeadings, headingsToColumns } from "./yearColumns";

const loanCfg = {
  industryType: "Manufacturing - Auto Components",
  auditedYears: ["2022-2023", "2023-2024"],
  projectionCount: 5,
  hasExistingTermLoan: true,
  newLoanType: "both" as const,
};

const headings = alignYearHeadings(loanCfg, []);
const colIds = headingsToColumns(headings).map((c) => c.id);

function v7(py: number, cy: number, pj: number): YearValues {
  const out: YearValues = {};
  out[colIds[0]] = py;
  out[colIds[1]] = cy;
  const projCols = colIds.slice(2);
  const n = projCols.length || 1;
  projCols.forEach((id, i) => {
    const t = (i + 1) / n;
    out[id] = Math.round(cy + (pj - cy) * t);
  });
  return out;
}

function os(
  id: string,
  label: string,
  py: number,
  cy: number,
  pj: number,
  extra: Partial<FinancialGridRow> = {}
): FinancialGridRow {
  return { id, label, values: v7(py, cy, pj), ...extra };
}

const operatingStatement: FinancialGridRow[] = [
  os("os-1", "Gross Sales", 85000000, 98000000, 115000000),
  os("os-2", "Less: Excise Duty / GST", 15300000, 17640000, 20700000),
  os("os-3", "Net Sales", 69700000, 80360000, 94300000, { isTotal: true }),
  os("os-4", "COST OF PRODUCTION", 0, 0, 0, { isHeader: true }),
  os("os-5", "Raw Material Consumed", 35000000, 40000000, 47000000),
  os("os-6", "Power & Fuel", 4200000, 4800000, 5500000),
  os("os-7", "Direct Labour", 8500000, 9800000, 11200000),
  os("os-8", "Other Mfg. Expenses", 3200000, 3600000, 4100000),
  os("os-9", "Depreciation", 2800000, 3200000, 3500000),
  os("os-10", "Total Cost of Production", 53700000, 61400000, 71300000, { isTotal: true }),
  os("os-11", "Gross Profit", 16000000, 18960000, 23000000, { isTotal: true }),
  os("os-12", "OPERATING EXPENSES", 0, 0, 0, { isHeader: true }),
  os("os-13", "Selling Expenses", 2100000, 2400000, 2800000),
  os("os-14", "Administrative Expenses", 3500000, 4000000, 4500000),
  os("os-15", "Interest & Finance", 3800000, 4200000, 4500000),
  os("os-16", "Total Operating Expenses", 9400000, 10600000, 11800000, { isTotal: true }),
  os("os-17", "Operating Profit", 6600000, 8360000, 11200000, { isTotal: true }),
  os("os-18", "Add: Other Income", 500000, 600000, 700000),
  os("os-19", "Net Profit Before Tax", 7100000, 8960000, 11900000, { isTotal: true }),
  os("os-20", "Less: Provision for Tax", 1800000, 2300000, 3100000),
  os("os-21", "Net Profit After Tax", 5300000, 6660000, 8800000, { isTotal: true }),
];

function asset(
  id: string,
  particular: string,
  py: number,
  cy: number,
  pj: number
): AssetItem {
  return { id, particular, values: v7(py, cy, pj) };
}

function liability(
  id: string,
  particular: string,
  py: number,
  cy: number,
  pj: number
): LiabilityItem {
  return { id, particular, values: v7(py, cy, pj) };
}

export const dummyData: FormData = {
  companyDetails: {
    name: "Sharma Industries Pvt. Ltd.",
    address: "Plot No. 45, MIDC Industrial Area, Pune, Maharashtra - 411045",
    constitution: "Private Limited Company",
    establishmentYear: "2008",
    panNumber: "AADCS1234A",
    gstNumber: "27AADCS1234A1ZP",
    industry: "Manufacturing - Auto Components",
    bankName: "State Bank of India",
    branch: "MIDC Pune Branch",
    locationType: "town",
    activity: "Auto component manufacturing",
    email: "contact@sharmaindustries.in",
    phone: "9876543210",
    employmentCount: 250,
    registrationType: "Private Limited",
  },
  loanReportConfig: loanCfg,
  loanDetails: [
    {
      id: "loan-1",
      facilityType: "Cash Credit",
      sanctionedLimit: 15000000,
      outstanding: 12500000,
      interestRate: 10.5,
      securityDetails: "Hypothecation of stock and book debts",
    },
    {
      id: "loan-2",
      facilityType: "Term Loan",
      sanctionedLimit: 25000000,
      outstanding: 18000000,
      interestRate: 11.0,
      securityDetails: "Mortgage of factory land and building",
    },
    {
      id: "loan-3",
      facilityType: "Bank Guarantee",
      sanctionedLimit: 5000000,
      outstanding: 3000000,
      interestRate: 1.5,
      securityDetails: "Counter guarantee by directors",
    },
  ],
  settings: {
    reportTitle: "CMA Data Report - FY 2024-25",
    financialYearStart: "2024-04-01",
    financialYearEnd: "2025-03-31",
    projectionYears: 5,
    currency: "INR",
    auditorName: "CA Rajesh Mehta",
    auditorFirm: "Mehta & Associates",
    moneyFormat: "lakhs",
    fixedAssetSchedule: true,
    incomeTaxMode: "default",
    yearHeadings: headings,
  },
  businessProfile: {
    natureOfBusiness:
      "Manufacturing of precision auto components including brake systems, steering parts, and suspension components for OEM and aftermarket segments.",
    productsServices: "Brake Drums, Disc Rotors, Steering Knuckles, Suspension Arms, Hub Assemblies",
    majorCustomers: "Tata Motors, Mahindra & Mahindra, Bajaj Auto, Maruti Suzuki",
    majorSuppliers: "Tata Steel, JSW Steel, Hindalco Industries",
    employeeCount: 250,
    experience: "15+ years in auto component manufacturing with ISO 9001:2015 and IATF 16949 certifications",
    groupConcerns: "Sharma Auto Parts (Sister concern - Trading)",
    associateCompanies: "Sharma Forgings Ltd.",
    richHtml: "<p><strong>Sharma Industries</strong> is a leading manufacturer...</p>",
  },
  operatingStatement,
  assets: [
    asset("a-1", "Land & Building", 18000000, 22000000, 25000000),
    asset("a-2", "Plant & Machinery", 25000000, 30000000, 35000000),
    asset("a-3", "Furniture & Fixtures", 1500000, 1800000, 2000000),
    asset("a-4", "Vehicles", 3000000, 3500000, 4000000),
    asset("a-5", "Inventory", 12000000, 14000000, 16000000),
    asset("a-6", "Sundry Debtors", 10000000, 12000000, 14000000),
    asset("a-7", "Cash & Bank Balance", 2500000, 3000000, 3500000),
    asset("a-8", "Other Current Assets", 1800000, 2200000, 2500000),
  ],
  liabilities: [
    liability("l-1", "Share Capital", 10000000, 10000000, 10000000),
    liability("l-2", "Reserves & Surplus", 15000000, 21660000, 30460000),
    liability("l-3", "Term Loans", 22000000, 18000000, 14000000),
    liability("l-4", "Cash Credit / OD", 10000000, 12500000, 14000000),
    liability("l-5", "Sundry Creditors", 8000000, 10000000, 12000000),
    liability("l-6", "Other Current Liabilities", 4800000, 5340000, 5540000),
    liability("l-7", "Provisions", 4000000, 5000000, 6000000),
  ],
  workingCapital: {
    closingStock: 14000000,
    receivables: 12000000,
    exportReceivables: 0,
    sundryDebtors: 12000000,
    payables: 10000000,
    wcTotal: 28000000,
    wcLoanPct: 75,
    totalWcLoan: 12500000,
    ownContribution: 5000000,
    interestPct: 10.5,
    loanStartMonth: "2024-04",
    extraLines: [],
  },
  oldTermLoans: [
    {
      id: "otl-1",
      outstanding: 18000000,
      interestRate: 11,
      monthlyEmi: 175000,
      yearsRemaining: 4,
    },
  ],
  coverSettings: {
    titleText: "CMA REPORT",
    fontSize: 52,
    fontWeight: 700,
    fontColor: "#1a2332",
    coverTemplate: "/covers/cover-1.svg",
  },
  images: [],
};
