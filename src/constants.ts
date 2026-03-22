import { Trip, Advisor, ShoppableItem, User, Story } from './types';

export const STORIES: Story[] = [
  { id: 'st1', advisorId: 'a1', advisorName: 'Sarah Chen', advisorImage: 'https://picsum.photos/seed/sarah/100/100', mediaUrl: 'https://picsum.photos/seed/story1/1080/1920', type: 'image', timestamp: '2h ago' },
  { id: 'st2', advisorId: 'a2', advisorName: 'Marcus Johnson', advisorImage: 'https://picsum.photos/seed/marcus/100/100', mediaUrl: 'https://picsum.photos/seed/story2/1080/1920', type: 'image', timestamp: '4h ago' },
  { id: 'st3', advisorId: 'a3', advisorName: 'Emma Rodriguez', advisorImage: 'https://picsum.photos/seed/emma/100/100', mediaUrl: 'https://picsum.photos/seed/story3/1080/1920', type: 'image', timestamp: '1h ago' },
  { id: 'st4', advisorId: 'a4', advisorName: 'Alex Kim', advisorImage: 'https://picsum.photos/seed/alex/100/100', mediaUrl: 'https://picsum.photos/seed/story4/1080/1920', type: 'image', timestamp: '5h ago' },
  { id: 'st5', advisorId: 'a1', advisorName: 'Sarah Chen', advisorImage: 'https://picsum.photos/seed/sarah/100/100', mediaUrl: 'https://picsum.photos/seed/story5/1080/1920', type: 'image', timestamp: '30m ago' },
];

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Uzma Bagavan',
  email: 'uzmabagavan2906@gmail.com',
  image: 'https://picsum.photos/seed/user/100/100',
  savedTrips: ['1'],
  upcomingTrips: [
    { tripId: '2', date: '2026-05-15' }
  ],
  bucketList: [
    { id: 'b1', name: 'Scuba Diving in Great Barrier Reef', location: 'Australia', ongoing: true },
    { id: 'b2', name: 'Northern Lights in Iceland', location: 'Iceland', ongoing: false },
    { id: 'b3', name: 'Hot Air Balloon in Cappadocia', location: 'Turkey', ongoing: true }
  ]
};

export const FEATURED_TRIPS: Trip[] = [
  {
    id: '1',
    title: 'Parisian Escape',
    destination: 'Paris, France',
    description: 'A romantic getaway through the City of Light, featuring hidden gems and classic landmarks.',
    advisor: 'Sarah Chen',
    advisorImage: 'https://picsum.photos/seed/sarah/100/100',
    advisorId: 'a1',
    image: 'https://picsum.photos/seed/paris/1200/800',
    price: '$1,200',
    likes: 1240,
    saves: 850,
    days: 3,
    highlights: ['Eiffel Tower at sunset', 'Louvre Museum tour', 'Seine River cruise'],
    itinerary: [
      { day: 1, title: 'Arrival & Classic Landmarks', activities: ['Check-in at hotel', 'Visit Eiffel Tower', 'Dinner at Le Comptoir du Relais'] },
      { day: 2, title: 'Art & Culture', activities: ['Louvre Museum', 'Montmartre walk', 'Sacré-Cœur Basilica'] },
      { day: 3, title: 'Hidden Gems', activities: ['Le Marais exploration', 'Picasso Museum', 'Evening Seine cruise'] }
    ],
    shoppableItems: [
      { id: 's1', name: 'Summer Travel Dress', price: '$45', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=400&h=400&auto=format&fit=crop', link: '#', postedBy: 'Sarah Chen', wornAt: 'Parisian Escape' },
      { id: 's2', name: 'Comfortable Walking Shoes', price: '$85', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&h=400&auto=format&fit=crop', link: '#', postedBy: 'Sarah Chen', wornAt: 'Parisian Escape' }
    ],
    budgetBreakdown: {
      accommodation: '$600',
      transport: '$150',
      transportGoing: '$75',
      transportComingBack: '$75',
      meals: '$300',
      activities: '$150'
    },
    travelPics: ['https://picsum.photos/seed/paris1/800/600', 'https://picsum.photos/seed/paris2/800/600'],
    hotelPics: [{ interior: 'https://picsum.photos/seed/hotel1/800/600', exterior: 'https://picsum.photos/seed/hotel2/800/600' }],
    hotelLink: 'https://www.agoda.com/hotel-lutetia/hotel/paris-fr.html',
    transportFrom: 'Charles de Gaulle Airport',
    transportTo: 'Paris City Center',
    activityPics: [{ description: 'Seine River Cruise', image: 'https://picsum.photos/seed/seine/800/600', spent: '$50' }],
    dressPics: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=400&h=400&auto=format&fit=crop'],
    passionLine: 'Exploring the soul of Europe, one cobblestone at a time.'
  },
  {
    id: '2',
    title: 'Tropical Paradise',
    destination: 'Bali, Indonesia',
    description: 'Experience the spiritual heart of Bali with lush jungles, ancient temples, and serene beaches.',
    advisor: 'Marcus Johnson',
    advisorImage: 'https://picsum.photos/seed/marcus/100/100',
    advisorId: 'a2',
    image: 'https://picsum.photos/seed/bali/1200/800',
    price: '$950',
    likes: 2100,
    saves: 1400,
    days: 3,
    highlights: ['Ubud Monkey Forest', 'Tegalalang Rice Terrace', 'Uluwatu Temple sunset'],
    itinerary: [
      { day: 1, title: 'Ubud Exploration', activities: ['Monkey Forest', 'Ubud Palace', 'Traditional dance performance'] },
      { day: 2, title: 'Nature & Temples', activities: ['Rice Terraces', 'Tirta Empul Temple', 'Waterfall hike'] },
      { day: 3, title: 'Beach & Sunset', activities: ['Uluwatu Temple', 'Kecak Fire Dance', 'Seafood dinner on the beach'] }
    ],
    shoppableItems: [
      { id: 's3', name: 'Lightweight Backpack', price: '$65', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&h=400&auto=format&fit=crop', link: '#', postedBy: 'Marcus Johnson', wornAt: 'Tropical Paradise' },
      { id: 's4', name: 'Mobile Charger', price: '$15', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=400&h=400&auto=format&fit=crop', link: '#', postedBy: 'Marcus Johnson', wornAt: 'Tropical Paradise' }
    ],
    budgetBreakdown: {
      accommodation: '$400',
      transport: '$100',
      transportGoing: '$50',
      transportComingBack: '$50',
      meals: '$250',
      activities: '$200'
    },
    travelPics: ['https://picsum.photos/seed/bali1/800/600', 'https://picsum.photos/seed/bali2/800/600'],
    hotelPics: [{ interior: 'https://picsum.photos/seed/balihotel1/800/600', exterior: 'https://picsum.photos/seed/balihotel2/800/600' }],
    hotelLink: 'https://www.makemytrip.com/hotels/bali-hotels.html',
    transportFrom: 'Ngurah Rai International Airport',
    transportTo: 'Ubud Center',
    activityPics: [{ description: 'Scuba Diving', image: 'https://picsum.photos/seed/scuba/800/600', spent: '$120' }],
    dressPics: ['https://images.unsplash.com/photo-1515377666659-81701a05cc2b?q=80&w=400&h=400&auto=format&fit=crop'],
    passionLine: 'Finding peace in the waves and the jungle.'
  }
];

export const ADVISORS: Advisor[] = [
  {
    id: 'a1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    image: 'https://picsum.photos/seed/sarah/400/400',
    specialty: 'European Luxury & Hidden Gems',
    bio: 'Sarah is passionate about discovering world-class destinations without breaking the bank. With over 8 years of travel experience across Europe, Asia, and beyond, she specializes in crafting unforgettable itineraries that maximize experiences while minimizing costs.',
    tripsCount: 24,
    followers: 12500,
    passionLine: 'Discovering world-class destinations without breaking the bank.',
    instagram: 'sarah_travels',
    facebook: 'sarah.chen.travel',
    twitter: 'sarahchen',
    password: 'password123',
    status: 'approved',
    visibility: { savedTrips: true, upcomingPlans: true, bucketList: true },
    planningTrips: [
      { id: 'pt1', title: 'Amalfi Coast Dream', destination: 'Italy', status: 'Planning', announcement: 'Getting ready for a summer in Italy! 🍋', image: 'https://picsum.photos/seed/amalfi/800/600' },
      { id: 'pt2', title: 'Swiss Alps Winter', destination: 'Switzerland', status: 'Announced', announcement: 'Winter 2026 is going to be magical. ❄️', expectedDate: 'Dec 2026', image: 'https://picsum.photos/seed/swiss/800/600' }
    ],
    savedTrips: ['2'],
    upcomingTrips: [{ tripId: '1', date: '2026-06-20' }],
    bucketList: [
      { id: 'b4', name: 'Cherry Blossom Season', location: 'Japan', ongoing: false },
      { id: 'b5', name: 'Safari Adventure', location: 'Kenya', ongoing: true }
    ]
  },
  {
    id: 'a2',
    name: 'Marcus Johnson',
    email: 'marcus@example.com',
    image: 'https://picsum.photos/seed/marcus/400/400',
    specialty: 'Tropical Adventures & Eco-Tourism',
    bio: 'Marcus is an avid surfer and environmentalist who has spent the last decade mapping out the most sustainable and breathtaking tropical destinations in Southeast Asia.',
    tripsCount: 18,
    followers: 8900,
    passionLine: 'Sustainable travel for a better planet.',
    instagram: 'marcus_eco',
    facebook: 'marcus.johnson',
    password: 'password123',
    status: 'approved',
    visibility: { savedTrips: true, upcomingPlans: true, bucketList: true }
  },
  {
    id: 'a3',
    name: 'Emma Rodriguez',
    email: 'emma@example.com',
    image: 'https://picsum.photos/seed/emma/400/400',
    specialty: 'South American Culture & Gastronomy',
    bio: 'Emma is a former chef who now curates travel experiences that focus on the rich culinary traditions and vibrant cultures of South America.',
    tripsCount: 31,
    followers: 15400,
    passionLine: 'Taste the world, one bite at a time.',
    instagram: 'emma_foodie_travel',
    password: 'password123',
    status: 'approved',
    visibility: { savedTrips: true, upcomingPlans: true, bucketList: true }
  },
  {
    id: 'a4',
    name: 'Alex Kim',
    email: 'alex@example.com',
    image: 'https://picsum.photos/seed/alex/400/400',
    specialty: 'Modern Asian Metropolises',
    bio: 'Alex is a tech enthusiast and urban explorer who specializes in the fast-paced, neon-lit cities of East Asia, from Tokyo to Seoul.',
    tripsCount: 15,
    followers: 6700,
    passionLine: 'Neon lights and urban nights.',
    instagram: 'alex_urban_explorer',
    password: 'password123',
    status: 'approved',
    visibility: { savedTrips: true, upcomingPlans: true, bucketList: true }
  }
];

export const SHOP_ITEMS: ShoppableItem[] = [
  {
    id: 's1',
    name: 'Summer Travel Dress',
    price: '$45',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=400&h=400&auto=format&fit=crop',
    link: '#',
    postedBy: 'Sarah Chen',
    wornAt: 'Parisian Escape'
  },
  {
    id: 's2',
    name: 'Comfortable Walking Shoes',
    price: '$85',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&h=400&auto=format&fit=crop',
    link: '#',
    postedBy: 'Sarah Chen',
    wornAt: 'Parisian Escape'
  },
  {
    id: 's3',
    name: 'Lightweight Backpack',
    price: '$65',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&h=400&auto=format&fit=crop',
    link: '#',
    postedBy: 'Marcus Johnson',
    wornAt: 'Tropical Paradise'
  },
  {
    id: 's4',
    name: 'Mobile Charger',
    price: '$15',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=400&h=400&auto=format&fit=crop',
    link: '#',
    postedBy: 'Marcus Johnson',
    wornAt: 'Tropical Paradise'
  },
  {
    id: 's5',
    name: 'Cozy Travel Sweater',
    price: '$55',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=400&h=400&auto=format&fit=crop',
    link: '#',
    postedBy: 'Emma Rodriguez',
    wornAt: 'South American Culture'
  },
  {
    id: 's6',
    name: 'Compact Travel Camera',
    price: '$450',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&h=400&auto=format&fit=crop',
    link: '#',
    postedBy: 'Alex Kim',
    wornAt: 'Modern Asian Metropolises'
  }
];


