/**
 * Enum cho loại phương tiện
 */
export enum VehicleType {
  /** Xe máy */
  MOTORBIKE = 'motorbike',
  /** Xe ô tô */
  CAR = 'car',
  /** Xe đạp điện */
  ELECTRIC_BIKE = 'electricbike',
}

/**
 * Thông tin phương tiện
 */
export interface VehicleInfo {
  /** Loại xe (Xe máy, Ô tô, Xe đạp điện) */
  vehicleType: string;
  /** Màu biển số xe */
  plateColor: string;
}

/**
 * Chi tiết vi phạm
 */
export interface ViolationDetail {
  /** Loại lỗi vi phạm */
  violationType: string;
  /** Thời gian vi phạm */
  time: string;
  /** Địa điểm vi phạm */
  location: string;
}

/**
 * Đơn vị xử lý vi phạm
 */
export interface ProcessingUnit {
  /** Đơn vị phát hiện vi phạm */
  detectingUnit: string;
  /** Địa chỉ đơn vị phát hiện */
  detectingAddress: string;
  /** Đơn vị giải quyết vi phạm */
  resolvingUnit: string;
  /** Địa chỉ đơn vị giải quyết */
  resolvingAddress: string;
  /** Số điện thoại liên hệ */
  phone?: string;
}

/**
 * Dữ liệu một vi phạm
 */
export interface ViolationData {
  /** Biển số xe */
  plateNumber: string;
  /** Trạng thái xử phạt */
  status: string;
  /** Thông tin phương tiện */
  vehicleInfo: VehicleInfo;
  /** Chi tiết vi phạm */
  violationDetail: ViolationDetail;
  /** Thông tin đơn vị xử lý */
  processingUnit: ProcessingUnit;
}

/**
 * Kết quả tra cứu vi phạm
 */
export interface ViolationResult {
  /** Tra cứu thành công hay không */
  success: boolean;
  /** Biển số xe được tra cứu */
  plateNumber: string;
  /** Loại phương tiện */
  vehicleType: string;
  /** Danh sách vi phạm (nếu có) */
  data?: ViolationData[];
  /** Thông báo lỗi (nếu có) */
  error?: string;
  /** Đường dẫn screenshot (nếu có) */
  screenshot?: string;
}
