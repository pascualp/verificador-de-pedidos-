export type DriverStatus = 'Libre' | 'Repartiendo';
export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface Driver {
  id: string;
  name: string;
  status: DriverStatus;
  activeOrders: number;
  totalOrders: number;
  lastUpdated: string;
  scheduledDays?: DayOfWeek[];
}
