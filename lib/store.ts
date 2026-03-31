"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AssetItem,
  CMAStore,
  FinancialGridRow,
  FormData,
  LiabilityItem,
  WorkingCapitalLine,
  YearValues,
} from "./types";
import { dummyData } from "./dummyData";
import { alignYearHeadings, headingsToColumns } from "./yearColumns";
import { cascadeValuesFromFirstColumn, impliedYoYGrowthPct } from "./operatingGrowth";

let idCounter = 0;
function generateId(prefix: string) {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function emptyYearValues(colIds: string[]): YearValues {
  return Object.fromEntries(colIds.map((id) => [id, 0]));
}

function mergeYearValues(existing: YearValues | undefined, colIds: string[]): YearValues {
  const next: YearValues = { ...(existing || {}) };
  colIds.forEach((id) => {
    if (next[id] === undefined) next[id] = 0;
  });
  Object.keys(next).forEach((k) => {
    if (!colIds.includes(k)) delete next[k];
  });
  return next;
}

function migrateFinancialRows(
  rows: unknown[],
  colIds: string[]
): FinancialGridRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((raw) => {
    const r = raw as FinancialGridRow & {
      previousYear?: number;
      currentYear?: number;
      projectedYear?: number;
    };
    if (r.values && typeof r.values === "object") {
      return { ...r, values: mergeYearValues(r.values, colIds) };
    }
    return {
      ...r,
      values: {
        [colIds[0] ?? "col_0"]: r.previousYear ?? 0,
        [colIds[1] ?? "col_1"]: r.currentYear ?? 0,
        [colIds[2] ?? "col_2"]: r.projectedYear ?? 0,
      },
    };
  });
}

function migrateAssetItems(items: unknown[], colIds: string[]): AssetItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const a = raw as AssetItem & {
      previousYear?: number;
      currentYear?: number;
      projectedYear?: number;
    };
    if (a.values && typeof a.values === "object") {
      return { ...a, values: mergeYearValues(a.values, colIds) };
    }
    return {
      id: a.id,
      particular: a.particular,
      values: {
        [colIds[0] ?? "col_0"]: a.previousYear ?? 0,
        [colIds[1] ?? "col_1"]: a.currentYear ?? 0,
        [colIds[2] ?? "col_2"]: a.projectedYear ?? 0,
      },
    };
  });
}

function migrateLiabilityItems(items: unknown[], colIds: string[]): LiabilityItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const l = raw as LiabilityItem & {
      previousYear?: number;
      currentYear?: number;
      projectedYear?: number;
    };
    if (l.values && typeof l.values === "object") {
      return { ...l, values: mergeYearValues(l.values, colIds) };
    }
    return {
      id: l.id,
      particular: l.particular,
      values: {
        [colIds[0] ?? "col_0"]: l.previousYear ?? 0,
        [colIds[1] ?? "col_1"]: l.currentYear ?? 0,
        [colIds[2] ?? "col_2"]: l.projectedYear ?? 0,
      },
    };
  });
}

function buildInitialOperatingRows(colIds: string[]): FinancialGridRow[] {
  const z = () => emptyYearValues(colIds);
  const mk = (id: string, label: string, extra: Partial<FinancialGridRow> = {}): FinancialGridRow => ({
    id,
    label,
    values: z(),
    ...extra,
  });
  return [
    mk("os-1", "Gross Sales"),
    mk("os-2", "Less: Excise Duty / GST"),
    mk("os-3", "Net Sales", { isTotal: true }),
    mk("os-4", "COST OF PRODUCTION", { isHeader: true }),
    mk("os-5", "Raw Material Consumed"),
    mk("os-6", "Power & Fuel"),
    mk("os-7", "Direct Labour"),
    mk("os-8", "Other Mfg. Expenses"),
    mk("os-9", "Depreciation"),
    mk("os-10", "Total Cost of Production", { isTotal: true }),
    mk("os-11", "Gross Profit", { isTotal: true }),
    mk("os-12", "OPERATING EXPENSES", { isHeader: true }),
    mk("os-13", "Selling Expenses"),
    mk("os-14", "Administrative Expenses"),
    mk("os-15", "Interest & Finance"),
    mk("os-16", "Total Operating Expenses", { isTotal: true }),
    mk("os-17", "Operating Profit", { isTotal: true }),
    mk("os-18", "Add: Other Income"),
    mk("os-19", "Net Profit Before Tax", { isTotal: true }),
    mk("os-20", "Less: Provision for Tax"),
    mk("os-21", "Net Profit After Tax", { isTotal: true }),
  ];
}

const defaultLoanReportConfig = {
  industryType: "Manufacturing",
  auditedYears: ["2023-2024", "2024-2025"],
  projectionCount: 5,
  hasExistingTermLoan: false,
  newLoanType: "wc" as const,
};

const defaultWorkingCapital = {
  closingStock: 0,
  receivables: 0,
  exportReceivables: 0,
  sundryDebtors: 0,
  payables: 0,
  wcTotal: 0,
  wcLoanPct: 0,
  totalWcLoan: 0,
  ownContribution: 0,
  interestPct: 0,
  loanStartMonth: "",
  tenureMonths: 0,
  moratoriumMonths: 0,
  extraLines: [] as WorkingCapitalLine[],
};

const defaultCover = {
  titleText: "CMA REPORT",
  fontSize: 48,
  fontWeight: 600,
  fontColor: "#1a2332",
  coverTemplate: "/covers/cover-1.svg",
};

function buildInitialForm(colIds: string[]): FormData {
  const headings = alignYearHeadings(defaultLoanReportConfig, []);
  const cols = headingsToColumns(headings).map((c) => c.id);
  const ids = cols.length ? cols : colIds;
  return {
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
      ifscCode: "",
      locationType: "village",
      activity: "",
      email: "",
      phone: "",
      employmentCount: 0,
      registrationType: "",
    },
    loanReportConfig: { ...defaultLoanReportConfig },
    loanDetails: [],
    settings: {
      reportTitle: "",
      financialYearStart: "",
      financialYearEnd: "",
      projectionYears: defaultLoanReportConfig.projectionCount,
      currency: "INR",
      auditorName: "",
      auditorFirm: "",
      moneyFormat: "lakhs",
      fixedAssetSchedule: false,
      incomeTaxMode: "default",
      yearHeadings: headings,
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
      richHtml: "",
    },
    operatingStatement: buildInitialOperatingRows(ids),
    assets: [],
    liabilities: [],
    workingCapital: { ...defaultWorkingCapital, extraLines: [] },
    oldTermLoans: [],
    coverSettings: { ...defaultCover },
    images: [],
  };
}

const seedColIds = headingsToColumns(alignYearHeadings(defaultLoanReportConfig, [])).map((c) => c.id);
const initialFormData = buildInitialForm(seedColIds);
const initialYearColumns = headingsToColumns(initialFormData.settings.yearHeadings);

export function getDefaultFormSnapshot(): FormData {
  return buildInitialForm(seedColIds);
}

export const useCMAStore = create<CMAStore>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      reportId: null,
      companyId: null,
      formData: initialFormData,
      yearColumns: initialYearColumns,

      setStep: (step: number) => set({ currentStep: step }),

      setReportContext: (reportId, companyId) => set({ reportId, companyId }),

      rebuildYearColumns: () => {
        set((state) => {
          const cfg = state.formData.loanReportConfig;
          const headings = alignYearHeadings(cfg, state.formData.settings.yearHeadings);
          const cols = headingsToColumns(headings);
          const colIds = cols.map((c) => c.id);
          const mergeRows = (rows: FinancialGridRow[]) =>
            rows.map((r) => ({ ...r, values: mergeYearValues(r.values, colIds) }));
          const mergeAssets = (rows: AssetItem[]) =>
            rows.map((r) => ({ ...r, values: mergeYearValues(r.values, colIds) }));
          const mergeLiab = (rows: LiabilityItem[]) =>
            rows.map((r) => ({ ...r, values: mergeYearValues(r.values, colIds) }));
          return {
            yearColumns: cols,
            formData: {
              ...state.formData,
              settings: { ...state.formData.settings, yearHeadings: headings },
              operatingStatement: mergeRows(state.formData.operatingStatement),
              assets: mergeAssets(state.formData.assets),
              liabilities: mergeLiab(state.formData.liabilities),
            },
          };
        });
      },

      setCompanyDetails: (details) =>
        set((state) => ({
          formData: {
            ...state.formData,
            companyDetails: { ...state.formData.companyDetails, ...details },
          },
        })),

      setLoanReportConfig: (cfg) =>
        set((state) => {
          const next = { ...state.formData.loanReportConfig, ...cfg };
          const headings = alignYearHeadings(next, state.formData.settings.yearHeadings);
          const cols = headingsToColumns(headings);
          const colIds = cols.map((c) => c.id);
          const merge = (v: YearValues | undefined) => mergeYearValues(v, colIds);
          return {
            yearColumns: cols,
            formData: {
              ...state.formData,
              loanReportConfig: next,
              settings: { ...state.formData.settings, yearHeadings: headings },
              operatingStatement: state.formData.operatingStatement.map((r) => ({
                ...r,
                values: merge(r.values),
              })),
              assets: state.formData.assets.map((a) => ({ ...a, values: merge(a.values) })),
              liabilities: state.formData.liabilities.map((l) => ({ ...l, values: merge(l.values) })),
            },
          };
        }),

      setLoanDetails: (loans) =>
        set((state) => ({ formData: { ...state.formData, loanDetails: loans } })),

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

      removeLoanDetail: (id) =>
        set((state) => ({
          formData: {
            ...state.formData,
            loanDetails: state.formData.loanDetails.filter((l) => l.id !== id),
          },
        })),

      updateLoanDetail: (id, field, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            loanDetails: state.formData.loanDetails.map((l) =>
              l.id === id ? { ...l, [field]: value } : l
            ),
          },
        })),

      setSettings: (settings) =>
        set((state) => ({
          formData: {
            ...state.formData,
            settings: { ...state.formData.settings, ...settings },
          },
        })),

      setYearHeading: (index, patch) =>
        set((state) => {
          const yearHeadings = [...state.formData.settings.yearHeadings];
          yearHeadings[index] = { ...yearHeadings[index], ...patch };
          const cols = headingsToColumns(yearHeadings);
          return {
            yearColumns: cols,
            formData: {
              ...state.formData,
              settings: { ...state.formData.settings, yearHeadings },
            },
          };
        }),

      setBusinessProfile: (profile) =>
        set((state) => ({
          formData: {
            ...state.formData,
            businessProfile: { ...state.formData.businessProfile, ...profile },
          },
        })),

      setOperatingRows: (rows) =>
        set((state) => ({ formData: { ...state.formData, operatingStatement: rows } })),

      updateOperatingCell: (rowId, columnId, value) =>
        set((state) => {
          const colIds = state.yearColumns.map((c) => c.id);
          return {
            formData: {
              ...state.formData,
              operatingStatement: state.formData.operatingStatement.map((r) => {
                if (r.id !== rowId) return r;
                if (
                  r.growthPctLocked &&
                  !r.isHeader &&
                  !r.isTotal &&
                  colIds.length > 0 &&
                  columnId !== colIds[0]
                ) {
                  return r;
                }
                let nextValues = { ...r.values, [columnId]: value };
                if (r.growthPctLocked && !r.isHeader && !r.isTotal && colIds.length > 1) {
                  nextValues = cascadeValuesFromFirstColumn(nextValues, colIds, r.growthPct ?? 0);
                }
                return { ...r, values: nextValues };
              }),
            },
          };
        }),

      setOperatingCellMode: (rowId, columnId, mode) =>
        set((state) => ({
          formData: {
            ...state.formData,
            operatingStatement: state.formData.operatingStatement.map((r) =>
              r.id === rowId
                ? { ...r, modes: { ...r.modes, [columnId]: mode } }
                : r
            ),
          },
        })),

      applyOperatingBulkPercent: (columnId, percent) =>
        set((state) => ({
          formData: {
            ...state.formData,
            operatingStatement: state.formData.operatingStatement.map((r) => {
              if (r.isHeader || r.isTotal || r.growthPctLocked) return r;
              const base = r.values[columnId] ?? 0;
              const factor = 1 + percent / 100;
              return {
                ...r,
                values: { ...r.values, [columnId]: Math.round(base * factor * 100) / 100 },
              };
            }),
          },
        })),

      updateOperatingGrowthPct: (rowId, pct) =>
        set((state) => {
          const colIds = state.yearColumns.map((c) => c.id);
          return {
            formData: {
              ...state.formData,
              operatingStatement: state.formData.operatingStatement.map((r) => {
                if (r.id !== rowId) return r;
                if (!r.growthPctLocked || r.isHeader || r.isTotal) return r;
                const nextPct = Number.isFinite(pct) ? pct : 0;
                const nextValues = cascadeValuesFromFirstColumn(
                  { ...r.values },
                  colIds,
                  nextPct
                );
                return { ...r, growthPct: nextPct, values: nextValues };
              }),
            },
          };
        }),

      setOperatingGrowthLock: (rowId, locked) =>
        set((state) => {
          const colIds = state.yearColumns.map((c) => c.id);
          return {
            formData: {
              ...state.formData,
              operatingStatement: state.formData.operatingStatement.map((r) => {
                if (r.id !== rowId || r.isHeader || r.isTotal) return r;
                if (!locked) {
                  return { ...r, growthPctLocked: false };
                }
                const implied = impliedYoYGrowthPct(r.values, colIds);
                const nextPct = implied;
                const nextValues = cascadeValuesFromFirstColumn(
                  { ...r.values },
                  colIds,
                  nextPct
                );
                return {
                  ...r,
                  growthPctLocked: true,
                  growthPct: nextPct,
                  values: nextValues,
                };
              }),
            },
          };
        }),

      setAssets: (assets) =>
        set((state) => ({ formData: { ...state.formData, assets } })),

      addAsset: () =>
        set((state) => {
          const colIds = get().yearColumns.map((c) => c.id);
          return {
            formData: {
              ...state.formData,
              assets: [
                ...state.formData.assets,
                {
                  id: generateId("asset"),
                  particular: "",
                  values: emptyYearValues(colIds),
                },
              ],
            },
          };
        }),

      removeAsset: (id) =>
        set((state) => ({
          formData: {
            ...state.formData,
            assets: state.formData.assets.filter((a) => a.id !== id),
          },
        })),

      updateAsset: (id, field, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            assets: state.formData.assets.map((a) => {
              if (a.id !== id) return a;
              if (field === "values" && typeof value === "object")
                return { ...a, values: value as YearValues };
              return { ...a, [field]: value } as AssetItem;
            }),
          },
        })),

      updateAssetCell: (id, columnId, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            assets: state.formData.assets.map((a) =>
              a.id === id ? { ...a, values: { ...a.values, [columnId]: value } } : a
            ),
          },
        })),

      applyAssetBulkPercent: (columnId, percent) =>
        set((state) => ({
          formData: {
            ...state.formData,
            assets: state.formData.assets.map((a) => {
              const base = a.values[columnId] ?? 0;
              const factor = 1 + percent / 100;
              return {
                ...a,
                values: { ...a.values, [columnId]: Math.round(base * factor * 100) / 100 },
              };
            }),
          },
        })),

      setLiabilities: (liabilities) =>
        set((state) => ({ formData: { ...state.formData, liabilities } })),

      addLiability: () =>
        set((state) => {
          const colIds = get().yearColumns.map((c) => c.id);
          return {
            formData: {
              ...state.formData,
              liabilities: [
                ...state.formData.liabilities,
                {
                  id: generateId("liability"),
                  particular: "",
                  values: emptyYearValues(colIds),
                },
              ],
            },
          };
        }),

      removeLiability: (id) =>
        set((state) => ({
          formData: {
            ...state.formData,
            liabilities: state.formData.liabilities.filter((l) => l.id !== id),
          },
        })),

      updateLiability: (id, field, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            liabilities: state.formData.liabilities.map((l) => {
              if (l.id !== id) return l;
              if (field === "values" && typeof value === "object")
                return { ...l, values: value as YearValues };
              return { ...l, [field]: value } as LiabilityItem;
            }),
          },
        })),

      updateLiabilityCell: (id, columnId, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            liabilities: state.formData.liabilities.map((l) =>
              l.id === id ? { ...l, values: { ...l.values, [columnId]: value } } : l
            ),
          },
        })),

      applyLiabilityBulkPercent: (columnId, percent) =>
        set((state) => ({
          formData: {
            ...state.formData,
            liabilities: state.formData.liabilities.map((l) => {
              const base = l.values[columnId] ?? 0;
              const factor = 1 + percent / 100;
              return {
                ...l,
                values: { ...l.values, [columnId]: Math.round(base * factor * 100) / 100 },
              };
            }),
          },
        })),

      setWorkingCapital: (wc) =>
        set((state) => ({
          formData: {
            ...state.formData,
            workingCapital: { ...state.formData.workingCapital, ...wc },
          },
        })),

      addWorkingCapitalLine: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            workingCapital: {
              ...state.formData.workingCapital,
              extraLines: [
                ...state.formData.workingCapital.extraLines,
                { id: generateId("wcl"), label: "New line", amount: 0 },
              ],
            },
          },
        })),

      updateWorkingCapitalLine: (id, amount) =>
        set((state) => ({
          formData: {
            ...state.formData,
            workingCapital: {
              ...state.formData.workingCapital,
              extraLines: state.formData.workingCapital.extraLines.map((l) =>
                l.id === id ? { ...l, amount } : l
              ),
            },
          },
        })),

      removeWorkingCapitalLine: (id) =>
        set((state) => ({
          formData: {
            ...state.formData,
            workingCapital: {
              ...state.formData.workingCapital,
              extraLines: state.formData.workingCapital.extraLines.filter((l) => l.id !== id),
            },
          },
        })),

      setOldTermLoans: (loans) =>
        set((state) => ({ formData: { ...state.formData, oldTermLoans: loans } })),

      addOldTermLoan: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            oldTermLoans: [
              ...state.formData.oldTermLoans,
              {
                id: generateId("otl"),
                outstanding: 0,
                interestRate: 0,
                monthlyEmi: 0,
                yearsRemaining: 0,
              },
            ],
          },
        })),

      updateOldTermLoan: (id, field, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            oldTermLoans: state.formData.oldTermLoans.map((l) =>
              l.id === id ? { ...l, [field]: value } : l
            ),
          },
        })),

      removeOldTermLoan: (id) =>
        set((state) => ({
          formData: {
            ...state.formData,
            oldTermLoans: state.formData.oldTermLoans.filter((l) => l.id !== id),
          },
        })),

      setCoverSettings: (c) =>
        set((state) => ({
          formData: {
            ...state.formData,
            coverSettings: { ...state.formData.coverSettings, ...c },
          },
        })),

      setImages: (images) =>
        set((state) => ({ formData: { ...state.formData, images } })),

      addImage: (img) =>
        set((state) => ({
          formData: {
            ...state.formData,
            images: [...state.formData.images, img],
          },
        })),

      removeImage: (id) =>
        set((state) => ({
          formData: {
            ...state.formData,
            images: state.formData.images.filter((i) => i.id !== id),
          },
        })),

      loadFormData: (data) =>
        set(() => {
          const headings = alignYearHeadings(
            data.loanReportConfig || defaultLoanReportConfig,
            data.settings?.yearHeadings || []
          );
          const cols = headingsToColumns(headings);
          const colIds = cols.map((c) => c.id);
          return {
            formData: {
              ...data,
              loanReportConfig: data.loanReportConfig || defaultLoanReportConfig,
              settings: {
                ...initialFormData.settings,
                ...data.settings,
                yearHeadings: headings,
              },
              operatingStatement: migrateFinancialRows(
                data.operatingStatement as unknown[],
                colIds
              ),
              assets: migrateAssetItems(data.assets as unknown[], colIds),
              liabilities: migrateLiabilityItems(data.liabilities as unknown[], colIds),
              workingCapital: { ...defaultWorkingCapital, ...data.workingCapital },
              oldTermLoans: data.oldTermLoans || [],
              coverSettings: { ...defaultCover, ...data.coverSettings },
              images: data.images || [],
              businessProfile: {
                ...initialFormData.businessProfile,
                ...data.businessProfile,
              },
            },
            yearColumns: cols,
          };
        }),

      loadDummyData: () =>
        set({
          formData: dummyData,
          yearColumns: headingsToColumns(dummyData.settings.yearHeadings),
          currentStep: 0,
        }),

      resetForm: () =>
        set({
          formData: buildInitialForm(seedColIds),
          yearColumns: headingsToColumns(alignYearHeadings(defaultLoanReportConfig, [])),
          currentStep: 0,
          reportId: null,
          companyId: null,
        }),
    }),
    {
      name: "cma-report-store-v3",
      version: 1,
      migrate: (persisted: unknown) => {
        const p = persisted as {
          state?: {
            formData?: FormData;
            yearColumns?: unknown;
            currentStep?: number;
            reportId?: string | null;
            companyId?: string | null;
          };
        };
        if (!p?.state?.formData) return persisted as never;
        const fd = p.state.formData as FormData;
        const cfg = fd.loanReportConfig || defaultLoanReportConfig;
        const headings = alignYearHeadings(cfg, fd.settings?.yearHeadings || []);
        const cols = headingsToColumns(headings);
        const colIds = cols.map((c) => c.id);
        return {
          ...p,
          state: {
            ...p.state,
            yearColumns: cols,
            formData: {
              ...initialFormData,
              ...fd,
              loanReportConfig: cfg,
              settings: {
                ...initialFormData.settings,
                ...fd.settings,
                yearHeadings: headings,
              },
              operatingStatement: migrateFinancialRows(
                (fd.operatingStatement || []) as unknown[],
                colIds
              ),
              assets: migrateAssetItems((fd.assets || []) as unknown[], colIds),
              liabilities: migrateLiabilityItems((fd.liabilities || []) as unknown[], colIds),
              workingCapital: { ...defaultWorkingCapital, ...(fd.workingCapital || {}) },
              oldTermLoans: fd.oldTermLoans || [],
              coverSettings: { ...defaultCover, ...(fd.coverSettings || {}) },
              images: fd.images || [],
              businessProfile: {
                ...initialFormData.businessProfile,
                ...(fd.businessProfile || {}),
              },
            },
          },
        } as never;
      },
      partialize: (s) => ({
        currentStep: s.currentStep,
        reportId: s.reportId,
        companyId: s.companyId,
        formData: s.formData,
        yearColumns: s.yearColumns,
      }),
    }
  )
);
