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
/**
 * Generic push to window.dataLayer with event
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
 * Push state / variables directly to window.dataLayer WITHOUT an event key
 * Useful for user_data updates, persistent variables, etc.
 */
export const pushStateToDataLayer = (data: Record<string, any> = {}) => {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    ...data,
  });
};

/**
 * Push Patient Information Form fields directly to dataLayer in specified order and format
 */
export const pushPatientFormState = (data: {
  pageType?: string;
  pageSubType?: string;
  patientNameFilled?: string;
  patientMobileFilled?: string;
  patientGender?: string;
  patientAge?: string | number;
  formStep?: string;
}) => {
  pushStateToDataLayer({
    pageType: data.pageType || "diagnostic_checkout_step",
    pageSubType: data.pageSubType || "patient_information_form",
    patientNameFilled: data.patientNameFilled || "",
    patientMobileFilled: data.patientMobileFilled || "",
    patientGender: data.patientGender || "",
    patientAge: data.patientAge ? String(data.patientAge) : "",
    formStep: data.formStep || "patient_information",
  });
};

/**
 * Push patient / user personal information directly to dataLayer (user_data object)
 */
export const pushPatientUserData = (userData: {
  name?: string;
  phone_number?: string;
  gender?: string;
  age?: string | number;
  city?: string;
  country?: string;
}) => {
  pushStateToDataLayer({
    user_data: {
      name: userData.name || null,
      phone_number: userData.phone_number || null,
      gender: userData.gender || null,
      age: userData.age ? String(userData.age) : null,
      city: userData.city || "Dhaka",
      country: userData.country || "BD",
    },
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

// Event 1: Book Appointment CTA Click (from listing / cards)
export const trackViewBook = (data: {
  doctor_name?: string;
  doctor_specialty?: string;
  source_page?: string;
  cta_label?: string;
}) => {
  pushToDataLayer("view_book", {
    doctor_name: data.doctor_name || "",
    doctor_specialty: data.doctor_specialty || "",
    source_page: data.source_page || "doctors_listing",
    cta_label: data.cta_label || "Book Appointment",
  });
};

// Event 2: Doctor Page / Chamber Select / Book Click
export const trackAddToCartBook = (data: {
  doctor_name?: string;
  doctor_specialty?: string;
  selected_hospital?: string;
  chamber_day_time?: string;
  consultation_fee?: number | string;
  source_page?: string;
  doctor_url_slug?: string;
}) => {
  pushToDataLayer("add_to_cart_book", {
    doctor_name: data.doctor_name || "",
    doctor_specialty: data.doctor_specialty || "",
    selected_hospital: data.selected_hospital || "",
    chamber_day_time: data.chamber_day_time || "",
    consultation_fee: typeof data.consultation_fee === "number" ? data.consultation_fee : Number(data.consultation_fee) || 0,
    source_page: data.source_page || "doctor_profile",
    doctor_url_slug: data.doctor_url_slug || "",
  });
};

// Event 3: Patient Information Form Step
export const trackCheckoutBook = (data: {
  doctor_name?: string;
  doctor_specialty?: string;
  selected_hospital?: string;
  appointment_date?: string;
  patient_type?: string;
  patient_gender?: string;
  promo_code_applied?: string;
  source_page?: string;
}) => {
  pushToDataLayer("checkout_book", {
    doctor_name: data.doctor_name || "",
    doctor_specialty: data.doctor_specialty || "",
    selected_hospital: data.selected_hospital || "",
    appointment_date: data.appointment_date || "",
    patient_type: data.patient_type || "new",
    patient_gender: data.patient_gender || "",
    promo_code_applied: data.promo_code_applied || "none",
    source_page: data.source_page || "appointment_form",
  });
};

// Alias for backwards compatibility
export const trackDoctorBookingInitiate = (data: {
  doctorName?: string;
  diseaseDepartment?: string;
  hospitalName?: string;
  visitFee?: number | string;
}) => {
  trackCheckoutBook({
    doctor_name: data.doctorName,
    doctor_specialty: data.diseaseDepartment,
    selected_hospital: data.hospitalName,
    source_page: "appointment_form",
  });
};

// Event 4: Successful Appointment Done (Confirmation / Success Page)
export const trackPurchaseBook = (data: {
  booking_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  selected_hospital?: string;
  appointment_date?: string;
  patient_type?: string;
  patient_gender?: string;
  booking_method?: string;
  consultation_fee?: number | string;
  location_area?: string;
  source_page?: string;
  user_data?: {
    patient_name?: string;
    phone?: string;
    name?: string;
    phone_number?: string;
  };
}) => {
  const eventId = data.booking_id ? `doc_book_${data.booking_id}` : generateEventId("doc_book");
  pushToDataLayer("purchase_book", {
    event_id: eventId,
    booking_id: data.booking_id || null,
    doctor_name: data.doctor_name || "",
    doctor_specialty: data.doctor_specialty || "",
    selected_hospital: data.selected_hospital || "",
    appointment_date: data.appointment_date || "",
    patient_type: data.patient_type || "new",
    patient_gender: data.patient_gender || "",
    booking_method: data.booking_method || "online",
    consultation_fee: typeof data.consultation_fee === "number" ? data.consultation_fee : Number(data.consultation_fee) || 0,
    location_area: data.location_area || "",
    source_page: data.source_page || "checkout",
    ...(data.user_data
      ? {
          user_data: {
            patient_name: data.user_data.patient_name || data.user_data.name || null,
            phone: data.user_data.phone || data.user_data.phone_number || null,
          },
        }
      : {}),
  });
};

// Alias for backwards compatibility
export const trackDoctorBookingPurchase = trackPurchaseBook;

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

export interface DiagnosticItemTracking {
  test_name?: string;
  test_category?: string;
  test_price?: number | string;
}

// Step 1: View Test Category / Price Compare
export const trackTestCategoryView = (testName: string, hospitalName?: string) => {
  pushToDataLayer("view_test_category", {
    test_name: testName,
    hospital_name: hospitalName || null,
  });
};

// Event 1: Add to cart button (event name: "view_test_cart")
export const trackViewTestCart = (data: {
  test_name: string;
  test_category?: string;
  test_price: number | string;
}) => {
  pushToDataLayer("view_test_cart", {
    test_name: data.test_name || "",
    test_category: data.test_category || "General",
    test_price: typeof data.test_price === "number" ? data.test_price : Number(data.test_price) || 0,
  });
};

// Event 2: Proceed to Checkout button (event name: "test_add_to_cart")
export const trackTestAddToCart = (data: {
  selected_hospital: string;
  division?: string;
  district?: string;
  thana?: string;
  test_count: number | string;
  subtotal: number | string;
  total_due: number | string;
  items: DiagnosticItemTracking[];
}) => {
  pushToDataLayer("test_add_to_cart", {
    selected_hospital: data.selected_hospital || "",
    division: data.division || "",
    district: data.district || "",
    thana: data.thana || "",
    test_count: Number(data.test_count) || 0,
    subtotal: Number(data.subtotal) || 0,
    total_due: Number(data.total_due) || 0,
    items: data.items.map((item) => ({
      test_name: item.test_name || "",
      test_category: item.test_category || "General",
      test_price: typeof item.test_price === "number" ? item.test_price : Number(item.test_price) || 0,
    })),
  });
};

// Event 3: Confirm Booking button (event name: "test_checkout")
export const trackTestCheckout = (data: {
  selected_hospital: string;
  appointment_date: string;
  patient_gender?: string;
  test_count: number | string;
  subtotal: number | string;
  total_due: number | string;
  promo_code_applied?: string;
  items: DiagnosticItemTracking[];
}) => {
  pushToDataLayer("test_checkout", {
    selected_hospital: data.selected_hospital || "",
    appointment_date: data.appointment_date || "",
    patient_gender: data.patient_gender || "",
    test_count: Number(data.test_count) || 0,
    subtotal: Number(data.subtotal) || 0,
    total_due: Number(data.total_due) || 0,
    promo_code_applied: data.promo_code_applied || "none",
    items: data.items.map((item) => ({
      test_name: item.test_name || "",
      test_category: item.test_category || "General",
      test_price: typeof item.test_price === "number" ? item.test_price : Number(item.test_price) || 0,
    })),
  });
};

// Event 4: I agree / Final booking confirmation (event name: "test_purchase")
export const trackTestPurchase = (data: {
  booking_id?: string;
  selected_hospital: string;
  appointment_date: string;
  test_count: number | string;
  subtotal: number | string;
  total_due: number | string;
  platform_fee?: number | string;
  discount?: number | string;
  booking_method?: string;
  items: DiagnosticItemTracking[];
  user_data?: {
    patient_name?: string;
    phone?: string;
    phone_number?: string;
  };
}) => {
  const eventId = data.booking_id ? `diag_book_${data.booking_id}` : generateEventId("diag_book");
  pushToDataLayer("test_purchase", {
    event_id: eventId,
    booking_id: data.booking_id || null,
    selected_hospital: data.selected_hospital || "",
    appointment_date: data.appointment_date || "",
    test_count: Number(data.test_count) || 0,
    subtotal: Number(data.subtotal) || 0,
    total_due: Number(data.total_due) || 0,
    platform_fee: Number(data.platform_fee) || 0,
    discount: Number(data.discount) || 0,
    booking_method: data.booking_method || "pay_at_hospital",
    items: data.items.map((item) => ({
      test_name: item.test_name || "",
      test_category: item.test_category || "General",
      test_price: typeof item.test_price === "number" ? item.test_price : Number(item.test_price) || 0,
    })),
    ...(data.user_data
      ? {
          user_data: {
            patient_name: data.user_data.patient_name || null,
            phone: data.user_data.phone || data.user_data.phone_number || null,
          },
        }
      : {}),
  });
};

// Additional tag: OTP Verified (event name: "test_otp_verified")
export const trackTestOtpVerified = (data: {
  selected_hospital: string;
  appointment_date: string;
  test_count: number | string;
  subtotal: number | string;
  total_due: number | string;
  items: DiagnosticItemTracking[];
}) => {
  pushToDataLayer("test_otp_verified", {
    selected_hospital: data.selected_hospital || "",
    appointment_date: data.appointment_date || "",
    test_count: Number(data.test_count) || 0,
    subtotal: Number(data.subtotal) || 0,
    total_due: Number(data.total_due) || 0,
    items: data.items.map((item) => ({
      test_name: item.test_name || "",
      test_category: item.test_category || "General",
      test_price: typeof item.test_price === "number" ? item.test_price : Number(item.test_price) || 0,
    })),
  });
};

// Backwards compatibility aliases
export const trackTestBookingInitiate = (data: {
  testName: string;
  hospitalName?: string;
  testPrice?: number | string;
}) => {
  trackViewTestCart({
    test_name: data.testName,
    test_price: data.testPrice || 0,
  });
};

export const trackTestBookingPurchase = (data: {
  testName: string;
  hospitalName?: string;
  totalPrice: number | string;
  bookingId?: string;
  patientName?: string;
  patientPhone?: string;
}) => {
  trackTestPurchase({
    booking_id: data.bookingId,
    selected_hospital: data.hospitalName || "",
    appointment_date: new Date().toISOString().split("T")[0],
    test_count: 1,
    subtotal: data.totalPrice,
    total_due: data.totalPrice,
    items: [
      {
        test_name: data.testName,
        test_category: "General",
        test_price: data.totalPrice,
      },
    ],
    user_data: {
      patient_name: data.patientName,
      phone: data.patientPhone,
    },
  });
};

/**
 * 5. Blood Donor Funnel
 */
export const trackBloodDonorCtaClick = (data?: {
  cta_label?: string;
  source_page?: string;
}) => {
  pushToDataLayer("blood_donor_cta_click", {
    cta_label: data?.cta_label || "Be a Donor",
    source_page: data?.source_page || "blood_donor_landing",
  });
};

export const trackSearchBloodDonor = (data: {
  blood_group?: string;
  division?: string;
  district?: string;
  thana?: string;
  result_count?: number | string;
  source_page?: string;
}) => {
  pushToDataLayer("search_blood_donor", {
    blood_group: data.blood_group || "",
    division: data.division || "",
    district: data.district || "",
    thana: data.thana || "",
    result_count: data.result_count !== undefined ? Number(data.result_count) : 0,
    source_page: data.source_page || "blood_donor_search",
  });
};

export const trackClickBloodDonorContact = (data: {
  donor_name?: string;
  donor_blood_group?: string;
  donor_status?: string;
  donor_location?: string;
  donor_verified?: string;
  source_page?: string;
}) => {
  pushToDataLayer("click_blood_donor_contact", {
    donor_name: data.donor_name || "",
    donor_blood_group: data.donor_blood_group || "",
    donor_status: data.donor_status || "",
    donor_location: data.donor_location || "",
    donor_verified: data.donor_verified || "",
    source_page: data.source_page || "blood_donor_search",
  });
};

// Aliases for backwards compatibility
export const trackBloodSearchInitiate = (bloodGroup: string, locationThana?: string) => {
  trackSearchBloodDonor({
    blood_group: bloodGroup,
    thana: locationThana,
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
export const trackSearchAmbulance = (data: {
  division?: string;
  district?: string;
  thana?: string;
  status_filter?: string;
  ambulance_type?: string;
  result_count?: number | string;
  source_page?: string;
}) => {
  pushToDataLayer("search_ambulance", {
    division: data.division || "",
    district: data.district || "",
    thana: data.thana || "",
    status_filter: data.status_filter || "",
    ambulance_type: data.ambulance_type || "",
    result_count: data.result_count !== undefined ? Number(data.result_count) : 0,
    source_page: data.source_page || "ambulance_search",
  });
};

export const trackClickAmbulanceContact = (data: {
  ambulance_type?: string;
  ambulance_status?: string;
  ambulance_location?: string;
  ambulance_verified?: string;
  source_page?: string;
}) => {
  pushToDataLayer("click_ambulance_contact", {
    ambulance_type: data.ambulance_type || "",
    ambulance_status: data.ambulance_status || "",
    ambulance_location: data.ambulance_location || "",
    ambulance_verified: data.ambulance_verified || "",
    source_page: data.source_page || "ambulance_search",
  });
};

// Aliases for backwards compatibility
export const trackAmbulanceSearchInitiate = (ambulanceType: string, locationThana?: string) => {
  trackSearchAmbulance({
    ambulance_type: ambulanceType,
    thana: locationThana,
  });
};

export const trackAmbulanceDriverContacted = (data: {
  driverName?: string;
  driverPhone?: string;
  ambulanceType?: string;
}) => {
  trackClickAmbulanceContact({
    ambulance_type: data.ambulanceType,
    source_page: "ambulance_search",
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
