/**
 * Google Tag Manager & DataLayer Helper for Meditime
 * Container ID: GTM-MM2T9W6K
 */

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}

/**
 * Generate a unique event_id for Meta deduplication (CAPI & Pixel)
 */
export const generateEventId = (prefix = "event"): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generic push to window.dataLayer
 */
export const pushToDataLayer = (event: string, data: Record<string, any> = {}) => {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...data,
  });
};

/**
 * 1. Global Page View Tracking
 * @param contentCategory 'doctor' | 'hospital' | 'diagnostic' | 'blood' | 'ambulance' | 'general'
 */
export const trackGlobalPageView = (contentCategory: string, pagePath?: string) => {
  pushToDataLayer("page_view_global", {
    content_category: contentCategory,
    page_path: pagePath || (typeof window !== "undefined" ? window.location.pathname : ""),
  });
};

/**
 * 2. Doctor Funnel Tracking
 */

// Step 1: Doctor Category / Search Filter View
export const trackDoctorCategoryView = (diseaseDepartment: string | null, hospitalName: string | null) => {
  pushToDataLayer("view_doctor_category", {
    disease_department: diseaseDepartment || null,
    hospital_name: hospitalName || null,
  });
};

// Step 2: Doctor Booking Initiation (Form/Page Opened)
export const trackDoctorBookingInitiate = (data: {
  doctorName?: string;
  diseaseDepartment?: string;
  hospitalName?: string;
  visitFee?: number | string;
}) => {
  pushToDataLayer("initiate_doctor_booking", {
    doctor_name: data.doctorName || null,
    disease_department: data.diseaseDepartment || null,
    hospital_name: data.hospitalName || null,
    visit_fee: data.visitFee || null,
  });
};

// Step 3: Doctor Booking Confirmed (Success Page)
export const trackDoctorBookingPurchase = (data: {
  doctorName?: string;
  diseaseDepartment?: string;
  hospitalName?: string;
  visitFee?: number | string;
  bookingId?: string;
  patientName?: string;
  patientPhone?: string;
}) => {
  const eventId = data.bookingId ? `doc_book_${data.bookingId}` : generateEventId("doc_book");
  pushToDataLayer("purchase_doctor_booking", {
    event_id: eventId,
    doctor_name: data.doctorName || null,
    disease_department: data.diseaseDepartment || null,
    hospital_name: data.hospitalName || null,
    value: typeof data.visitFee === "number" ? data.visitFee : Number(data.visitFee) || 0,
    currency: "BDT",
    booking_status: "confirmed",
    booking_id: data.bookingId || null,
    user_data: {
      patient_name: data.patientName || null,
      phone: data.patientPhone || null,
    },
  });
};

/**
 * 3. Hospital Directory Tracking
 */
export const trackHospitalProfileView = (hospitalName: string) => {
  pushToDataLayer("view_hospital_profile", {
    hospital_name: hospitalName,
  });
};

/**
 * 4. Diagnostic Test Cross-Selling Funnel
 */

// Step 1: View Test Category / Price Compare
export const trackTestCategoryView = (testName: string, hospitalName?: string) => {
  pushToDataLayer("view_test_category", {
    test_name: testName,
    hospital_name: hospitalName || null,
  });
};

// Step 2: Test Booking Initiated
export const trackTestBookingInitiate = (data: {
  testName: string;
  hospitalName?: string;
  testPrice?: number | string;
}) => {
  pushToDataLayer("initiate_test_booking", {
    test_name: data.testName,
    hospital_name: data.hospitalName || null,
    test_price: data.testPrice || 0,
  });
};

// Step 3: Test Booking Confirmed (Success Page)
export const trackTestBookingPurchase = (data: {
  testName: string;
  hospitalName?: string;
  totalPrice: number | string;
  bookingId?: string;
  patientName?: string;
  patientPhone?: string;
}) => {
  const eventId = data.bookingId ? `diag_book_${data.bookingId}` : generateEventId("diag_book");
  pushToDataLayer("purchase_test_booking", {
    event_id: eventId,
    test_name: data.testName,
    hospital_name: data.hospitalName || null,
    value: typeof data.totalPrice === "number" ? data.totalPrice : Number(data.totalPrice) || 0,
    currency: "BDT",
    test_status: "confirmed",
    booking_id: data.bookingId || null,
    user_data: {
      patient_name: data.patientName || null,
      phone: data.patientPhone || null,
    },
  });
};

/**
 * 5. Blood Donor Funnel
 */
export const trackBloodSearchInitiate = (bloodGroup: string, locationThana?: string) => {
  pushToDataLayer("blood_search_initiate", {
    blood_group: bloodGroup,
    location_thana: locationThana || null,
  });
};

export const trackBloodDonorRegistered = (bloodGroup: string) => {
  pushToDataLayer("blood_donor_registered", {
    blood_group: bloodGroup,
    status: "success",
  });
};

/**
 * 6. Ambulance Service Funnel
 */
export const trackAmbulanceSearchInitiate = (ambulanceType: string, locationThana?: string) => {
  pushToDataLayer("ambulance_search_initiate", {
    ambulance_type: ambulanceType,
    location_thana: locationThana || null,
  });
};

export const trackAmbulanceDriverContacted = (data: {
  driverName?: string;
  driverPhone?: string;
  ambulanceType?: string;
}) => {
  pushToDataLayer("ambulance_driver_contacted", {
    driver_name: data.driverName || null,
    driver_phone: data.driverPhone || null,
    ambulance_type: data.ambulanceType || null,
  });
};

/**
 * 7. Contact Form Tracking
 */
export const trackContactFormSubmit = (data: {
  name?: string;
  phone?: string;
  email?: string;
  subject?: string;
}) => {
  pushToDataLayer("contact_form_submit", {
    name: data.name || null,
    phone: data.phone || null,
    email: data.email || null,
    subject: data.subject || null,
    status: "submitted",
  });
};

/**
 * 8. User Engagement & Scroll Depth
 */
export const track10sEngagement = (pagePath: string) => {
  pushToDataLayer("engagement_10s", {
    page_path: pagePath,
  });
};

export const trackScrollDepth = (depthPercentage: number, pagePath: string) => {
  pushToDataLayer("scroll_depth", {
    scroll_depth_threshold: depthPercentage,
    page_path: pagePath,
  });
};
