export enum VehicleType {
  MOTORBIKE = 'motorbike',
  CAR = 'car',
  ELECTRIC_BIKE = 'electricbike',
}

export interface VehicleInfo {
  vehicleType: string;
  plateColor: string;
}

export interface ViolationDetail {
  violationType: string;
  time: string;
  location: string;
}

export interface ProcessingUnit {
  detectingUnit: string;
  detectingAddress: string;
  resolvingUnit: string;
  resolvingAddress: string;
  phone?: string;
}

export interface ViolationData {
  plateNumber: string;
  status: string;
  vehicleInfo: VehicleInfo;
  violationDetail: ViolationDetail;
  processingUnit: ProcessingUnit;
}

export interface ViolationResult {
  success: boolean;
  plateNumber: string;
  vehicleType: string;
  data?: ViolationData[];
  error?: string;
  screenshot?: string;
}
