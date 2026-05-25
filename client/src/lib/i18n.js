import { create } from 'zustand';

const translations = {
  en: {
    // Common
    welcome: 'Welcome',
    login: 'Login',
    logout: 'Logout',
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    view: 'View',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    
    // Navigation
    home: 'Home',
    vehicles: 'Vehicles',
    drivers: 'Drivers',
    routes: 'Routes',
    schedules: 'Schedules',
    bookings: 'Bookings',
    tracking: 'Tracking',
    reports: 'Reports',
    maintenance: 'Maintenance',
    notifications: 'Notifications',
    
    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember me',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    
    // Vehicles
    fleet: 'Fleet',
    plateNumber: 'Plate Number',
    vehicleType: 'Vehicle Type',
    capacity: 'Capacity',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    maintenance: 'Maintenance',
    bus: 'Bus',
    minibus: 'Minibus',
    
    // Drivers
    driverName: 'Driver Name',
    licenseNumber: 'License Number',
    experience: 'Experience',
    rating: 'Rating',
    
    // Routes
    origin: 'Origin',
    destination: 'Destination',
    distance: 'Distance',
    duration: 'Duration',
    fare: 'Fare',
    
    // Schedules
    departureTime: 'Departure Time',
    arrivalTime: 'Arrival Time',
    platform: 'Platform',
    
    // Bookings
    ticket: 'Ticket',
    bookingRef: 'Booking Reference',
    passenger: 'Passenger',
    seat: 'Seat',
    payment: 'Payment',
    confirmed: 'Confirmed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    
    // Tracking
    liveTracking: 'Live Tracking',
    currentLocation: 'Current Location',
    speed: 'Speed',
    eta: 'ETA',
    distanceToDestination: 'Distance to Destination',
    
    // Reports
    revenue: 'Revenue',
    passengers: 'Passengers',
    trips: 'Trips',
    analytics: 'Analytics',
    
    // Maintenance
    scheduled: 'Scheduled',
    inProgress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
    
    // Notifications
    markAsRead: 'Mark as Read',
    clearAll: 'Clear All',
    
    // Currency
    etb: 'ETB',
  },
  
  am: {
    // Common
    welcome: 'እንኳን ደህና መጡ',
    login: 'ግባ',
    logout: 'ውጣ',
    dashboard: 'ዳሽቦርድ',
    settings: 'ቅንብሮች',
    profile: 'መገለጫ',
    search: 'ፈልግ',
    filter: 'ማጣሪያ',
    export: 'ወጥብ',
    print: 'አትም',
    save: 'አስቀምጥ',
    cancel: 'ተው',
    delete: 'አጥፋ',
    edit: 'አርትዕ',
    add: 'አክል',
    view: 'ተመልከት',
    back: 'ተመለስ',
    next: 'ቀጣይ',
    submit: 'አስገባ',
    loading: 'በመጫን ላይ...',
    error: 'ስህተት',
    success: 'ስኬት',
    warning: 'ማስጠንቀቂያ',
    info: 'መረጃ',
    
    // Navigation
    home: 'መነሻ',
    vehicles: 'መኪኖች',
    drivers: 'አሽከሮች',
    routes: 'መስመሮች',
    schedules: 'የጊዜ ሰሌዳዎች',
    bookings: 'ቦታ አስያዝ',
    tracking: 'መከታ',
    reports: 'ሪፖርቶች',
    maintenance: 'ጥገና',
    notifications: 'ማስታወሻዎች',
    
    // Auth
    email: 'ኢሜይል',
    password: 'የይለፍ ቃል',
    confirmPassword: 'የይለፍ ቃል አረጋግጥ',
    forgotPassword: 'የይለፍ ቃል ረሱኝ?',
    rememberMe: 'አስታውስኝ',
    signIn: 'ግባ',
    signUp: 'ምዝግባ',
    fullName: 'ሙሉ ስም',
    phoneNumber: 'ስልክ ቁጥር',
    
    // Vehicles
    fleet: 'መኪኖች',
    plateNumber: 'የፕሌት ቁጥር',
    vehicleType: 'የመኪና ዓይነት',
    capacity: 'አቅም',
    status: 'ሁኔታ',
    active: 'ንቁ',
    inactive: 'የማይሰራ',
    maintenance: 'ጥገና',
    bus: 'አውቶቡስ',
    minibus: 'ሚኒቡስ',
    
    // Drivers
    driverName: 'የአሽከር ስም',
    licenseNumber: 'የፍቃድ ቁጥር',
    experience: 'ልምድ',
    rating: 'መስራች',
    
    // Routes
    origin: 'መነሻ',
    destination: 'መድረሻ',
    distance: 'ርቀት',
    duration: 'ጊዜ',
    fare: 'ዋጋ',
    
    // Schedules
    departureTime: 'የመጡብ ጊዜ',
    arrivalTime: 'የመጪው ጊዜ',
    platform: 'ፕላትፎርም',
    
    // Bookings
    ticket: 'ቲኬት',
    bookingRef: 'የቦታ አስያዝ ማመልከቻ',
    passenger: 'ተሳፋሪ',
    seat: 'መቀመጫ',
    payment: 'ክፍያ',
    confirmed: 'ተረጋግጧል',
    pending: 'በመጠባበቅ ላይ',
    cancelled: 'ተሰርዟል',
    
    // Tracking
    liveTracking: 'በእውነተኛ ጊዜ መከታ',
    currentLocation: 'የአሁን አካባቢ',
    speed: 'ፍጥነት',
    eta: 'የመጪው ጊዜ',
    distanceToDestination: 'ወደ መድረሻ ርቀት',
    
    // Reports
    revenue: 'ገቢ',
    passengers: 'ተሳፋሪዎች',
    trips: 'ጉዟዎች',
    analytics: 'ትንታኔ',
    
    // Maintenance
    scheduled: 'ተወሰነ',
    inProgress: 'በሂደት ላይ',
    completed: 'ተጠናቅቋል',
    overdue: 'ጊዜው ያለፈ',
    
    // Notifications
    markAsRead: 'እንደተነበበ ምልክት ያድርጉ',
    clearAll: 'ሁሉንም አጽዳ',
    
    // Currency
    etb: 'ብር',
  },
};

const useI18n = create((set) => ({
  language: localStorage.getItem('language') || 'en',
  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },
  t: (key) => {
    const language = useI18n.getState().language;
    return translations[language][key] || translations.en[key] || key;
  },
}));

export default useI18n;
