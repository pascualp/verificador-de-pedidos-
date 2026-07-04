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

export type OrderStatus = 'En Cola' | 'Asignado' | 'Entregado' | 'Cancelado';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export interface AppConfig {
  webhookUrl?: string;
  webhookEnabled: boolean;
}

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
  prepTime?: number;
}

