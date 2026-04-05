export const DESIGNATIONS = [
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
  { value: 'NURSE', label: 'Nurse' },
  { value: 'HOSPITAL_ADMIN', label: 'Hospital Admin' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const HOSPITAL_TYPES = [
  { value: 'GOVT', label: 'Government' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'CLINIC', label: 'Clinic' },
] as const;

export const PERSON_CATEGORIES = [
  { value: 'A', label: 'A — High value' },
  { value: 'B', label: 'B — Medium' },
  { value: 'C', label: 'C — Standard' },
] as const;

export const PRODUCT_CATEGORIES = [
  { value: 'TABLET', label: 'Tablet' },
  { value: 'CAPSULE', label: 'Capsule' },
  { value: 'INJECTION', label: 'Injection' },
  { value: 'SYRUP', label: 'Syrup' },
  { value: 'DEVICE', label: 'Device' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const VISIT_PURPOSES = [
  { value: 'DETAILING', label: 'Detailing' },
  { value: 'SAMPLE_DROP', label: 'Sample drop' },
  { value: 'FOLLOW_UP', label: 'Follow up' },
  { value: 'ORDER_COLLECTION', label: 'Order collection' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const VISIT_STATUSES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const DISPATCH_TYPES = [
  { value: 'SAMPLE', label: 'Sample' },
  { value: 'SALE', label: 'Sale' },
  { value: 'PROMOTIONAL', label: 'Promotional' },
  { value: 'RETURN', label: 'Return' },
] as const;

export const DISPATCH_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const USER_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'MR', label: 'Medical Representative' },
] as const;

export const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai'] as const;
