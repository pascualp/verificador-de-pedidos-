export type DriverStatus = 'Libre' | 'Repartiendo';

export interface Driver {
  id: string;
  name: string;
  status: DriverStatus;
  activeOrders: number;
  totalOrders: number;
  lastUpdated: string;
}
