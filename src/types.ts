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
  restaurantId: string;
  isHidden?: boolean;
}

export type OrderStatus = 'En Cola' | 'Asignado' | 'Entregado';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  status: OrderStatus;
  address?: string;
  driverId?: string;
  createdAt: string;
  assignedAt?: string;
}

