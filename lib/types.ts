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
}

export interface LoanDetail {
  id: string;
  facilityType: string;
  sanctionedLimit: number;
  outstanding: number;
  interestRate: number;
  securityDetails: string;
}

export interface Settings {
  reportTitle: string;
  financialYearStart: string;
  financialYearEnd: string;
  projectionYears: number;
  currency: string;
  auditorName: string;
  auditorFirm: string;
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
}

export interface OperatingStatementRow {
  id: string;
  label: string;
  previousYear: number;
  currentYear: number;
  projectedYear: number;
  isHeader?: boolean;
  isTotal?: boolean;
  indent?: number;
}

export interface AssetItem {
  id: string;
  particular: string;
  previousYear: number;
  currentYear: number;
  projectedYear: number;
}

export interface LiabilityItem {
  id: string;
  particular: string;
  previousYear: number;
  currentYear: number;
  projectedYear: number;
}

export interface FormData {
  companyDetails: CompanyDetails;
  loanDetails: LoanDetail[];
  settings: Settings;
  businessProfile: BusinessProfile;
  operatingStatement: OperatingStatementRow[];
  assets: AssetItem[];
  liabilities: LiabilityItem[];
}

export interface CMAStore {
  currentStep: number;
  formData: FormData;
  setStep: (step: number) => void;
  setCompanyDetails: (details: Partial<CompanyDetails>) => void;
  setLoanDetails: (loans: LoanDetail[]) => void;
  addLoanDetail: () => void;
  removeLoanDetail: (id: string) => void;
  updateLoanDetail: (id: string, field: keyof LoanDetail, value: string | number) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  setOperatingStatementRow: (id: string, field: keyof OperatingStatementRow, value: number) => void;
  setAssets: (assets: AssetItem[]) => void;
  addAsset: () => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, field: keyof AssetItem, value: string | number) => void;
  setLiabilities: (liabilities: LiabilityItem[]) => void;
  addLiability: () => void;
  removeLiability: (id: string) => void;
  updateLiability: (id: string, field: keyof LiabilityItem, value: string | number) => void;
  loadDummyData: () => void;
  resetForm: () => void;
}
