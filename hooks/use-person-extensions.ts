'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export type StockistExtensions = {
  entityType: 'STOCKIST';
  inventory: {
    productId: string;
    productName: string;
    currentQty: number;
    lastMovementDate: string | null;
    stockStatus: string;
  }[];
  salesByMonth: { month: string; year: number; units: number; value: number }[];
};

export type HospitalExtensions = {
  entityType: 'HOSPITAL';
  inventory: {
    productId: string;
    productName: string;
    currentQty: number;
    lastMovementDate: string | null;
  }[];
};

export type EmployeeExtensions = {
  entityType: 'EMPLOYEE';
  performance: {
    currentMonth: number;
    currentYear: number;
    targetInr: number;
    achievedInr: number;
    achievementPct: number;
    last6Months: { month: number; year: number; target: number; achieved: number }[];
  };
};

export type DoctorExtensions = { entityType: 'DOCTOR'; extras: null };

export type PersonExtensionsPayload = StockistExtensions | HospitalExtensions | EmployeeExtensions | DoctorExtensions;

export function usePersonExtensions(personId: string | undefined) {
  return useQuery({
    queryKey: ['person-extensions', personId],
    queryFn: async () => {
      const { data } = await apiFetch<PersonExtensionsPayload>(`/api/persons/${personId}/extensions`);
      return data;
    },
    enabled: !!personId,
    staleTime: 20_000,
  });
}
