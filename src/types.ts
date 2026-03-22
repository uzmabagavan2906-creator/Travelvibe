export interface BudgetBreakdown {
  accommodation: string;
  transport: string;
  transportGoing?: string;
  transportComingBack?: string;
  meals: string;
  activities: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string;
  advisor: string;
  advisorImage: string;
  advisorId: string; // Added to link to Advisor
  image: string;
  price: string;
  likes: number;
  saves: number;
  days: number;
  highlights: string[];
  itinerary: DayPlan[];
  shoppableItems: ShoppableItem[];
  budgetBreakdown: BudgetBreakdown;
  travelPics?: string[];
  hotelPics?: { interior: string; exterior: string }[];
  hotelLink?: string;
  transportFrom?: string;
  transportTo?: string;
  activityPics?: { description: string; image: string; spent: string }[];
  dressPics?: string[];
  passionLine?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  activities: string[];
}

export interface ShoppableItem {
  id: string;
  name: string;
  price: string;
  image: string;
  link: string;
  postedBy: string;
  wornAt: string;
}

export interface Story {
  id: string;
  advisorId: string;
  advisorName: string;
  advisorImage: string;
  mediaUrl: string;
  type: 'image' | 'video';
  timestamp: string;
  likes?: number;
  comments?: { user: string; text: string }[];
}

export interface BucketListActivity {
  id: string;
  name: string;
  location?: string;
  ongoing?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  savedTrips: string[]; // Trip IDs
  upcomingTrips: { tripId: string; date: string }[];
  bucketList: BucketListActivity[];
  notifiedAdvisors?: string[]; // Advisor IDs
  notifiedPlanningTrips?: string[]; // Planning Trip IDs
}

export interface PlanningTrip {
  id: string;
  title: string;
  destination: string;
  status: 'Planning' | 'Researching' | 'Booking' | 'Announced';
  announcement?: string;
  expectedDate?: string;
  image: string;
}

export interface AdvisorVisibility {
  savedTrips: boolean;
  upcomingPlans: boolean;
  bucketList: boolean;
}

export interface Advisor {
  id: string;
  name: string;
  email: string;
  image: string;
  specialty: string;
  bio: string;
  tripsCount: number;
  followers: number;
  passionLine?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  password?: string; // Added for advisor login
  stories?: Story[];
  planningTrips?: PlanningTrip[];
  savedTrips?: string[]; // Trip IDs
  upcomingTrips?: { tripId: string; date: string }[];
  bucketList?: BucketListActivity[];
  status: 'approved' | 'pending' | 'declined';
  visibility: AdvisorVisibility;
}

export interface AdvisorStatusUpdate {
  id: string;
  advisorId: string;
  advisorName: string;
  advisorImage: string;
  text: string;
  timestamp: string;
  likes: number;
  comments: { user: string; text: string; timestamp: string }[];
  image?: string;
}

export interface Notification {
  id: string;
  advisorId: string;
  advisorName: string;
  advisorImage: string;
  message: string;
  timestamp: string;
  type: 'trip' | 'announcement';
}

export interface AdvisorApplication {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  aadharNo: string;
  phone: string;
  specialties: string[];
  passionLine: string;
  itinerary: string;
  transportCharges: {
    going: string;
    comingBack: string;
  };
  transportLinks: any[];
  hotelLinks: any[];
  shopLinks: any[];
  activities: any[];
  travelPics: any[];
  hotelCheckinPics: any[];
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  timestamp: string;
}

