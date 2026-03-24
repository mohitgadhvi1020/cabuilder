"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CMAStore,
  FormData,
  CompanyDetails,
  LoanDetail,
  Settings,
  BusinessProfile,
  OperatingStatementRow,
  AssetItem,
  LiabilityItem,
} from "./types";
import { dummyData } from "./dummyData";

const initialOperatingStatement: OperatingStatementRow[] = [
  { id: "os-1", label: "Gross Sales", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-2", label: "Less: Excise Duty / GST", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-3", label: "Net Sales", previousYear: 0, currentYear: 0, projectedYear: 0, isTotal: true },
  { id: "os-4", label: "COST OF PRODUCTION", previousYear: 0, currentYear: 0, projectedYear: 0, isHeader: true },
  { id: "os-5", label: "Raw Material Consumed", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-6", label: "Power & Fuel", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-7", label: "Direct Labour", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-8", label: "Other Mfg. Expenses", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-9", label: "Depreciation", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-10", label: "Total Cost of Production", previousYear: 0, currentYear: 0, projectedYear: 0, isTotal: true },
  { id: "os-11", label: "Gross Profit", previousYear: 0, currentYear: 0, projectedYear: 0, isTotal: true },
  { id: "os-12", label: "OPERATING EXPENSES", previousYear: 0, currentYear: 0, projectedYear: 0, isHeader: true },
  { id: "os-13", label: "Selling Expenses", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-14", label: "Administrative Expenses", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-15", label: "Interest & Finance", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-16", label: "Total Operating Expenses", previousYear: 0, currentYear: 0, projectedYear: 0, isTotal: true },
  { id: "os-17", label: "Operating Profit", previousYear: 0, currentYear: 0, projectedYear: 0, isTotal: true },
  { id: "os-18", label: "Add: Other Income", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-19", label: "Net Profit Before Tax", previousYear: 0, currentYear: 0, projectedYear: 0, isTotal: true },
  { id: "os-20", label: "Less: Provision for Tax", previousYear: 0, currentYear: 0, projectedYear: 0 },
  { id: "os-21", label: "Net Profit After Tax", previousYear: 0, currentYear: 0, projectedYear: 0, isTotal: true },
];

const initialFormData: FormData = {
  companyDetails: {
    name: "",
    address: "",
    constitution: "",
    establishmentYear: "",
    panNumber: "",
    gstNumber: "",
    industry: "",
    bankName: "",
    branch: "",
  },
  loanDetails: [],
  settings: {
    reportTitle: "",
    financialYearStart: "",
    financialYearEnd: "",
    projectionYears: 1,
    currency: "INR",
    auditorName: "",
    auditorFirm: "",
  },
  businessProfile: {
    natureOfBusiness: "",
    productsServices: "",
    majorCustomers: "",
    majorSuppliers: "",
    employeeCount: 0,
    experience: "",
    groupConcerns: "",
    associateCompanies: "",
  },
  operatingStatement: initialOperatingStatement,
  assets: [],
  liabilities: [],
};

let idCounter = 0;
function generateId(prefix: string) {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export const useCMAStore = create<CMAStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      formData: initialFormData,

      setStep: (step: number) => set({ currentStep: step }),

      setCompanyDetails: (details: Partial<CompanyDetails>) =>
        set((state) => ({
          formData: {
            ...state.formData,
            companyDetails: { ...state.formData.companyDetails, ...details },
          },
        })),

      setLoanDetails: (loans: LoanDetail[]) =>
        set((state) => ({
          formData: { ...state.formData, loanDetails: loans },
        })),

      addLoanDetail: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            loanDetails: [
              ...state.formData.loanDetails,
              {
                id: generateId("loan"),
                facilityType: "",
                sanctionedLimit: 0,
                outstanding: 0,
                interestRate: 0,
                securityDetails: "",
              },
            ],
          },
        })),

      removeLoanDetail: (id: string) =>
        set((state) => ({
          formData: {
            ...state.formData,
            loanDetails: state.formData.loanDetails.filter((l) => l.id !== id),
          },
        })),

      updateLoanDetail: (id: string, field: keyof LoanDetail, value: string | number) =>
        set((state) => ({
          formData: {
            ...state.formData,
            loanDetails: state.formData.loanDetails.map((l) =>
              l.id === id ? { ...l, [field]: value } : l
            ),
          },
        })),

      setSettings: (settings: Partial<Settings>) =>
        set((state) => ({
          formData: {
            ...state.formData,
            settings: { ...state.formData.settings, ...settings },
          },
        })),

      setBusinessProfile: (profile: Partial<BusinessProfile>) =>
        set((state) => ({
          formData: {
            ...state.formData,
            businessProfile: { ...state.formData.businessProfile, ...profile },
          },
        })),

      setOperatingStatementRow: (id: string, field: keyof OperatingStatementRow, value: number) =>
        set((state) => ({
          formData: {
            ...state.formData,
            operatingStatement: state.formData.operatingStatement.map((r) =>
              r.id === id ? { ...r, [field]: value } : r
            ),
          },
        })),

      setAssets: (assets: AssetItem[]) =>
        set((state) => ({
          formData: { ...state.formData, assets },
        })),

      addAsset: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            assets: [
              ...state.formData.assets,
              {
                id: generateId("asset"),
                particular: "",
                previousYear: 0,
                currentYear: 0,
                projectedYear: 0,
              },
            ],
          },
        })),

      removeAsset: (id: string) =>
        set((state) => ({
          formData: {
            ...state.formData,
            assets: state.formData.assets.filter((a) => a.id !== id),
          },
        })),

      updateAsset: (id: string, field: keyof AssetItem, value: string | number) =>
        set((state) => ({
          formData: {
            ...state.formData,
            assets: state.formData.assets.map((a) =>
              a.id === id ? { ...a, [field]: value } : a
            ),
          },
        })),

      setLiabilities: (liabilities: LiabilityItem[]) =>
        set((state) => ({
          formData: { ...state.formData, liabilities },
        })),

      addLiability: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            liabilities: [
              ...state.formData.liabilities,
              {
                id: generateId("liability"),
                particular: "",
                previousYear: 0,
                currentYear: 0,
                projectedYear: 0,
              },
            ],
          },
        })),

      removeLiability: (id: string) =>
        set((state) => ({
          formData: {
            ...state.formData,
            liabilities: state.formData.liabilities.filter((l) => l.id !== id),
          },
        })),

      updateLiability: (id: string, field: keyof LiabilityItem, value: string | number) =>
        set((state) => ({
          formData: {
            ...state.formData,
            liabilities: state.formData.liabilities.map((l) =>
              l.id === id ? { ...l, [field]: value } : l
            ),
          },
        })),

      loadDummyData: () =>
        set({
          formData: dummyData,
          currentStep: 0,
        }),

      resetForm: () =>
        set({
          formData: initialFormData,
          currentStep: 0,
        }),
    }),
    {
      name: "cma-report-store",
    }
  )
);
