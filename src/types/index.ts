// ── Entity Types ──────────────────────────────────────────────────

export type ProjectStatus = 'Bidding' | 'Awarded' | 'Lost' | 'In Progress' | 'Completed'

export interface Project {
  id: string
  name: string
  clientName: string
  bidDate: string // ISO date string
  status: ProjectStatus
  address: string
  projectManager: string
  estimator: string
  prevailingWage: boolean
  pwBaseRate?: number
  pwFringeRate?: number
  overheadPercent: number
  profitPercent: number
  lineItems: LineItem[]
  veAlternates: VEAlternate[]
  scopeDescriptions: ScopeDescription[]
  timestamps: {
    createdAt: string // ISO datetime
    updatedAt: string // ISO datetime
  }
}

export interface LineItem {
  id: string
  systemTypeId: string
  glassTypeId: string
  frameSystemId: string
  description: string
  quantity: number
  widthInches: number
  heightInches: number
  sqft: number
  perimeter: number
  materialCost: number
  laborCost: number
  equipmentCost: number
  doorHardwareCost: number  // Derived: door hardware cost included in materialCost
  lineTotal: number
  conditionIds: string[]
  crewDays: number
  manHours: number
  equipmentIds: string[]
  hardwareIds: string[]
  doorHardware: DoorHardwareEntry[]  // Door-specific hardware with per-item quantities
}

export interface VEAlternate {
  id: string
  lineItemId: string
  description: string
  originalCost: number
  alternateCost: number
  savings: number // originalCost - alternateCost
}

export interface ScopeDescription {
  systemTypeId: string
  text: string
}

// ── Settings / Reference Data ─────────────────────────────────────

export interface GlassType {
  id: string
  name: string
  costPerSqft: number
}

export interface FrameSystem {
  id: string
  name: string
  costPerLinFt: number
}

export interface SystemType {
  id: string
  name: string
  benchmarkLow: number
  benchmarkHigh: number
  laborMode: 'area' | 'unit'
  sfPerManHour?: number
  hoursPerUnit?: number
}

export interface LaborRate {
  id: string
  role: string
  baseRate: number       // $/hr
  burdenPercent: number  // decimal, e.g. 0.35 for 35%
  healthHourly: number   // $/hr
  loadedRate: number     // computed: base * (1 + burden) + health
}

export interface Condition {
  id: string
  name: string
  adjustment: number // crew-day units added to total (not per-unit)
}

export interface Hardware {
  id: string
  name: string
  unitCost: number
}

export interface DoorHardwareEntry {
  hardwareId: string   // References Hardware.id in settings.doorHardware
  quantity: number     // Per-door quantity (e.g., 3 hinges per door)
}

export interface Equipment {
  id: string
  name: string
  dailyRate: number
}

// ── Application State ─────────────────────────────────────────────

export interface AppSettings {
  glassTypes: GlassType[]
  frameSystems: FrameSystem[]
  laborRates: LaborRate[]
  conditions: Condition[]
  hardware: Hardware[]
  doorHardware: Hardware[]   // Door hardware catalog (12 items, dhw-xxx IDs)
  equipment: Equipment[]
  systemTypes: SystemType[]
}

export interface AppState {
  schemaVersion: number
  projects: Project[]
  settings: AppSettings
}

// ── Calculation Result Types ──────────────────────────────────────

export interface RunningTotals {
  materialTotal: number
  laborTotal: number
  equipmentTotal: number
  subtotal: number
  veSavings: number
  adjustedSubtotal: number // subtotal - veSavings
  overheadAmount: number
  profitAmount: number
  contractValue: number
}

export interface SOVGroup {
  systemTypeId: string
  systemTypeName: string
  lineItemCount: number
  totalSqft: number
  directCost: number
  contractValue: number
}

export interface PieSegment {
  name: string
  value: number
  color: string
}

// ── Export Schema ─────────────────────────────────────────────────

export interface ProjectExport {
  exportDate: string
  projectName: string
  clientName: string
  bidDate: string
  status: ProjectStatus
  address: string
  projectManager: string
  estimator: string
  overheadPercent: number
  profitPercent: number
  lineItems: LineItem[]
  veAlternates: VEAlternate[]
  sovGroups: SOVGroup[]
  runningTotals: RunningTotals
  scopeDescriptions: ScopeDescription[]
}

// ── Benchmark ─────────────────────────────────────────────────────

export type BenchmarkLevel = 'green' | 'amber' | 'red'
