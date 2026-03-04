import { create } from 'zustand';
import type { ComplaintType, IAttachment } from '@/types';

export interface ComplaintFormData {
  // Step 1
  type: ComplaintType | null;

  // Step 2
  categoryL1: string;
  categoryL2: string;
  categoryL3: string;
  suggestedAgencyId: string;

  // Step 3
  titleFr: string;
  titleAr: string;
  contentFr: string;
  contentAr: string;
  regionCode: string;
  incidentDate: string;

  // Step 4
  attachmentIds: string[];
  uploadedAttachments: IAttachment[];

  // Step 5
  consentGiven: boolean;
}

const initialFormData: ComplaintFormData = {
  type: null,
  categoryL1: '',
  categoryL2: '',
  categoryL3: '',
  suggestedAgencyId: '',
  titleFr: '',
  titleAr: '',
  contentFr: '',
  contentAr: '',
  regionCode: '',
  incidentDate: '',
  attachmentIds: [],
  uploadedAttachments: [],
  consentGiven: false,
};

interface ComplaintFormState {
  currentStep: number;
  formData: ComplaintFormData;
  isSubmitting: boolean;
  submittedComplaintId: string | null;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<ComplaintFormData>) => void;
  setSubmitting: (v: boolean) => void;
  setSubmittedId: (id: string) => void;
  reset: () => void;
}

export const useComplaintFormStore = create<ComplaintFormState>((set) => ({
  currentStep: 1,
  formData: { ...initialFormData },
  isSubmitting: false,
  submittedComplaintId: null,

  setStep: (step) => set({ currentStep: Math.min(Math.max(step, 1), 5) }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 5),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  setSubmitting: (v) => set({ isSubmitting: v }),

  setSubmittedId: (id) => set({ submittedComplaintId: id }),

  reset: () =>
    set({
      currentStep: 1,
      formData: { ...initialFormData },
      isSubmitting: false,
      submittedComplaintId: null,
    }),
}));
