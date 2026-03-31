/** Column id -> numeric amount (rupees or lakhs per settings) */
export type YearValues = Record<string, number>;

/** Per-cell: user input vs computed in report */
export type CellMode = "input" | "auto";

export type MoneyFormat = "lakhs" | "no_decimals" | "decimals" | "crores";

export type IncomeTaxMode = "no" | "default" | "custom";

export type YearHeadingType = "actual" | "estimated";

export interface YearColumn {
  id: string;
  label: string;
  kind: YearHeadingType;
}

export interface CompanyDetails {
  name: string;
  address: string;
  constitution: string;
  establishmentYear: string;
  panNumber: string;
  gstNumber: string;
  industry: string;
  bankName: string;
  branch: string;
  ifscCode: string;
  locationType: "village" | "town";
  activity: string;
  email: string;
  phone: string;
  employmentCount: number;
  registrationType: string;
}

/** Finline-style loan questionnaire (drives columns + TL flows) */
export interface LoanReportConfig {
  industryType: string;
  auditedYears: string[];
  projectionCount: number;
  hasExistingTermLoan: boolean;
  newLoanType: "term" | "wc" | "both";
}

export interface LoanDetail {
  id: string;
  facilityType: string;
  sanctionedLimit: number;
  outstanding: number;
  interestRate: number;
  securityDetails: string;
}

export interface YearHeadingRow {
  yearLabel: string;
  type: YearHeadingType;
}

export interface Settings {
  reportTitle: string;
  financialYearStart: string;
  financialYearEnd: string;
  projectionYears: number;
  currency: string;
  auditorName: string;
  auditorFirm: string;
  moneyFormat: MoneyFormat;
  fixedAssetSchedule: boolean;
  incomeTaxMode: IncomeTaxMode;
  yearHeadings: YearHeadingRow[];
}

export interface BusinessProfile {
  natureOfBusiness: string;
  productsServices: string;
  majorCustomers: string;
  majorSuppliers: string;
  employeeCount: number;
  experience: string;
  groupConcerns: string;
  associateCompanies: string;
  /** Rich HTML from cover/profile editor */
  richHtml: string;
}

export interface FinancialGridRow {
  id: string;
  label: string;
  values: YearValues;
  modes?: Partial<Record<string, CellMode>>;
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
  /** YoY % applied across year columns when `growthPctLocked` is true */
  growthPct?: number;
  growthPctLocked?: boolean;
}

/** @deprecated use FinancialGridRow — kept for migration */
export interface OperatingStatementRow {
  id: string;
  label: string;
  previousYear: number;
  currentYear: number;
  projectedYear: number;
  values?: YearValues;
  modes?: Partial<Record<string, CellMode>>;
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
}

export interface AssetItem {
  id: string;
  particular: string;
  values: YearValues;
  modes?: Partial<Record<string, CellMode>>;
}

export interface LiabilityItem {
  id: string;
  particular: string;
  values: YearValues;
  modes?: Partial<Record<string, CellMode>>;
}

export interface WorkingCapitalLine {
  id: string;
  label: string;
  amount: number;
}

export interface WorkingCapital {
  closingStock: number;
  receivables: number;
  exportReceivables: number;
  sundryDebtors: number;
  payables: number;
  wcTotal: number;
  wcLoanPct: number;
  totalWcLoan: number;
  ownContribution: number;
  interestPct: number;
  loanStartMonth: string;
  tenureMonths: number;
  moratoriumMonths: number;
  extraLines: WorkingCapitalLine[];
}

export interface OldTermLoan {
  id: string;
  outstanding: number;
  interestRate: number;
  monthlyEmi: number;
  yearsRemaining: number;
}

export interface CoverSettings {
  titleText: string;
  fontSize: number;
  fontWeight: number;
  fontColor: string;
  /** Template image used as the cover background (path under /covers/) */
  coverTemplate: string;
}

export interface ReportImageRef {
  id: string;
  storagePath?: string;
  filename: string;
  previewUrl?: string;
}

export interface FormData {
  companyDetails: CompanyDetails;
  loanReportConfig: LoanReportConfig;
  loanDetails: LoanDetail[];
  settings: Settings;
  businessProfile: BusinessProfile;
  operatingStatement: FinancialGridRow[];
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  workingCapital: WorkingCapital;
  oldTermLoans: OldTermLoan[];
  coverSettings: CoverSettings;
  images: ReportImageRef[];
}

export interface CMAStore {
  currentStep: number;
  reportId: string | null;
  companyId: string | null;
  formData: FormData;
  yearColumns: YearColumn[];
  setStep: (step: number) => void;
  setReportContext: (reportId: string | null, companyId: string | null) => void;
  rebuildYearColumns: () => void;
  setCompanyDetails: (details: Partial<CompanyDetails>) => void;
  setLoanReportConfig: (cfg: Partial<LoanReportConfig>) => void;
  setLoanDetails: (loans: LoanDetail[]) => void;
  addLoanDetail: () => void;
  removeLoanDetail: (id: string) => void;
  updateLoanDetail: (id: string, field: keyof LoanDetail, value: string | number) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setYearHeading: (index: number, patch: Partial<YearHeadingRow>) => void;
  setBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  setOperatingRows: (rows: FinancialGridRow[]) => void;
  updateOperatingCell: (rowId: string, columnId: string, value: number) => void;
  setOperatingCellMode: (rowId: string, columnId: string, mode: CellMode) => void;
  applyOperatingBulkPercent: (columnId: string, percent: number) => void;
  updateOperatingGrowthPct: (rowId: string, pct: number) => void;
  setOperatingGrowthLock: (rowId: string, locked: boolean) => void;
  setAssets: (assets: AssetItem[]) => void;
  addAsset: () => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, field: keyof AssetItem | "values", value: string | number | YearValues) => void;
  updateAssetCell: (id: string, columnId: string, value: number) => void;
  applyAssetBulkPercent: (columnId: string, percent: number) => void;
  setLiabilities: (liabilities: LiabilityItem[]) => void;
  addLiability: () => void;
  removeLiability: (id: string) => void;
  updateLiability: (id: string, field: keyof LiabilityItem | "values", value: string | number | YearValues) => void;
  updateLiabilityCell: (id: string, columnId: string, value: number) => void;
  applyLiabilityBulkPercent: (columnId: string, percent: number) => void;
  setWorkingCapital: (wc: Partial<WorkingCapital>) => void;
  addWorkingCapitalLine: () => void;
  updateWorkingCapitalLine: (id: string, amount: number) => void;
  removeWorkingCapitalLine: (id: string) => void;
  setOldTermLoans: (loans: OldTermLoan[]) => void;
  addOldTermLoan: () => void;
  updateOldTermLoan: (id: string, field: keyof OldTermLoan, value: number) => void;
  removeOldTermLoan: (id: string) => void;
  setCoverSettings: (c: Partial<CoverSettings>) => void;
  setImages: (images: ReportImageRef[]) => void;
  addImage: (img: ReportImageRef) => void;
  removeImage: (id: string) => void;
  loadFormData: (data: FormData) => void;
  loadDummyData: () => void;
  resetForm: () => void;
}
