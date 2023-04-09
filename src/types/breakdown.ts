export enum BreakdownType {
  Equipment,
  Inventory,
}

export interface Breakdown {
  itemName: string
  description: string
  breakdownType: BreakdownType
}
