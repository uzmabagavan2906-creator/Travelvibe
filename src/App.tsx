import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  MapPin, 
  ShoppingBag, 
  User, 
  Search, 
  ArrowRight, 
  X, 
  Calendar, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Star,
  Heart,
  Bookmark,
  Clock,
  Users,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  Instagram,
  Twitter,
  Facebook,
  Globe,
  Award,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Plus,
  Bell,
  BellOff,
  Send,
  XCircle,
  LogOut,
  List,
  Shield,
  Check,
  Trash2
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { FEATURED_TRIPS, ADVISORS, SHOP_ITEMS, STORIES, MOCK_USER } from './constants';
import { Trip, DayPlan, ShoppableItem, Advisor, Story, User as UserType, AdvisorApplication, AdvisorStatusUpdate, Notification, AdvisorVisibility } from './types';
import { generateItinerary } from './services/geminiService';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

// --- Helpers ---

const formatCount = (count: number) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
};

// --- Components ---

const AdvisorLogin = ({ onLogin, onSignup, onGoHome }: { onLogin: (advisor: Advisor) => void; onSignup: () => void; onGoHome: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Check if this user is an approved advisor
      const advisorDoc = await getDoc(doc(db, 'advisors', user.uid));
      
      if (advisorDoc.exists()) {
        onLogin({ id: advisorDoc.id, ...advisorDoc.data() } as Advisor);
      } else {
        // Check if they have a pending application
        const q = query(collection(db, 'applications'), where('email', '==', email));
        const appSnapshot = await getDocs(q);
        
        if (!appSnapshot.empty) {
          const appData = appSnapshot.docs[0].data();
          if (appData.status === 'pending') {
            setError('Your application is still pending approval.');
          } else if (appData.status === 'declined') {
            setError('Your application was declined.');
          }
        } else {
          setError('No advisor account found with this email.');
        }
        await signOut(auth);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-10 rounded-[48px] w-full max-w-md space-y-8 relative"
      >
        <button 
          onClick={onGoHome}
          className="absolute top-8 left-8 flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </button>
        <div className="text-center space-y-2 pt-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <User className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-serif">Advisor Portal</h2>
          <p className="text-white/40 text-sm">Sign in to manage your trips and stories</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              required
            />
          </div>

          {error && <p className="text-rose-500 text-xs text-center">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-white/40 text-xs">
            No account? <button onClick={onSignup} className="text-emerald-400 hover:underline font-medium">Create account</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const AdvisorSignup = ({ onSignupAttempt, onBack, onGoHome }: { onSignupAttempt: (email: string, password: string) => void; onBack: () => void; onGoHome: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    onSignupAttempt(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-10 rounded-[48px] w-full max-w-md space-y-8"
      >
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Login
          </button>
          <button 
            onClick={onGoHome}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors group"
          >
            Back to Home
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <UserPlus className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-serif">Create Account</h2>
          <p className="text-white/40 text-sm">Join our community of travel experts</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              required
            />
          </div>

          {error && <p className="text-rose-500 text-xs text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold transition-all shadow-xl shadow-emerald-500/20"
          >
            Continue to Application
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AdvisorDashboard = ({ advisor, onLogout, onUpdateTripTitle, onAddTrip, onAddStory, onUpdateVisibility, trips }: { 
  advisor: Advisor; 
  onLogout: () => void;
  onUpdateTripTitle: (tripId: string, newTitle: string) => void;
  onAddTrip: (trip: Trip) => void;
  onAddStory: (story: Story) => void;
  onUpdateVisibility: (visibility: Advisor['visibility']) => void;
  trips: Trip[];
}) => {
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [isAddingStory, setIsAddingStory] = useState(false);
  const advisorTrips = trips.filter(t => t.advisorId === advisor.id);

  // New Trip Form State
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    title: '',
    destination: '',
    description: '',
    price: '',
    image: 'https://picsum.photos/seed/newtrip/1200/800',
    budgetBreakdown: {
      accommodation: '',
      transport: '',
      meals: '',
      activities: ''
    },
    highlights: [],
    itinerary: []
  });

  const [linkEntries, setLinkEntries] = useState({
    transport: '',
    hotel: '',
    fashion: '',
    activities: '',
    extra: '',
    social: ''
  });

  // New Story Form State
  const [newStoryMedia, setNewStoryMedia] = useState('');

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const trip: Trip = {
      ...newTrip as Trip,
      id: Math.random().toString(36).substr(2, 9),
      advisor: advisor.name,
      advisorId: advisor.id,
      advisorImage: advisor.image,
      likes: 0,
      saves: 0,
      days: 3, // Default
      hotelLink: linkEntries.hotel,
      transportFrom: linkEntries.transport,
      passionLine: linkEntries.extra,
      shoppableItems: [],
      highlights: ['New Trip Highlight'],
      itinerary: [{ day: 1, title: 'Day 1', activities: ['Activity 1'] }],
      budgetBreakdown: {
        accommodation: '$0',
        transport: '$0',
        meals: '$0',
        activities: '$0'
      }
    };
    onAddTrip(trip);
    setIsAddingTrip(false);
  };

  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    const story: Story = {
      id: Math.random().toString(36).substr(2, 9),
      advisorId: advisor.id,
      advisorName: advisor.name,
      advisorImage: advisor.image,
      mediaUrl: newStoryMedia || 'https://picsum.photos/seed/newstory/1080/1920',
      type: 'image',
      timestamp: 'Just now'
    };
    onAddStory(story);
    setIsAddingStory(false);
    setNewStoryMedia('');
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 py-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-emerald-500/20">
            <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-4xl font-serif">{advisor.name}</h1>
            <p className="text-emerald-400 text-sm font-mono tracking-widest uppercase">Advisor Dashboard</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Actions */}
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAddingTrip(true)}
              className="flex-1 py-6 rounded-[32px] bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20"
            >
              <Plus className="w-6 h-6" />
              Add New Trip
            </button>
            <button 
              onClick={() => setIsAddingStory(true)}
              className="flex-1 py-6 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all flex items-center justify-center gap-3"
            >
              <Upload className="w-6 h-6" />
              Post Story
            </button>
          </div>

          {/* Trips List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif">Your Trips</h2>
            <div className="grid grid-cols-1 gap-6">
              {advisorTrips.map(trip => (
                <div key={trip.id} className="glass p-6 rounded-[32px] flex items-center gap-6 group">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0">
                    <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Trip Heading (Editable)</label>
                      <input 
                        type="text" 
                        defaultValue={trip.title}
                        onBlur={(e) => onUpdateTripTitle(trip.id, e.target.value)}
                        className="w-full bg-transparent text-2xl font-serif focus:outline-none focus:text-emerald-400 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-6 text-xs text-white/40">
                      <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> {trip.likes}</span>
                      <span className="flex items-center gap-2"><Bookmark className="w-4 h-4" /> {trip.saves}</span>
                      <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {trip.destination}</span>
                    </div>
                  </div>
                </div>
              ))}
              {advisorTrips.length === 0 && (
                <div className="py-20 text-center glass rounded-[32px]">
                  <p className="text-white/40">You haven't posted any trips yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[40px] space-y-6">
            <h3 className="text-xl font-serif">Visibility Settings</h3>
            <div className="space-y-4">
              {[
                { id: 'savedTrips', label: 'Saved Trips' },
                { id: 'upcomingPlans', label: 'Upcoming Plans' },
                { id: 'bucketList', label: 'Bucket List' }
              ].map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <span className="text-sm text-white/60">{setting.label}</span>
                  <button 
                    onClick={() => onUpdateVisibility({
                      ...advisor.visibility,
                      [setting.id]: !advisor.visibility[setting.id as keyof Advisor['visibility']]
                    })}
                    className={`w-12 h-6 rounded-full transition-all relative ${advisor.visibility[setting.id as keyof Advisor['visibility']] ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${advisor.visibility[setting.id as keyof Advisor['visibility']] ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-8 rounded-[40px] space-y-6">
            <h3 className="text-xl font-serif">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-white/40 text-[10px] uppercase tracking-widest">Followers</span>
                <p className="text-2xl font-serif">{formatCount(advisor.followers)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-white/40 text-[10px] uppercase tracking-widest">Trips</span>
                <p className="text-2xl font-serif">{advisorTrips.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Trip Modal */}
      <AnimatePresence>
        {isAddingTrip && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-10 rounded-[48px] w-full max-w-4xl my-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif">Create New Trip</h2>
                <button onClick={() => setIsAddingTrip(false)} className="p-3 rounded-full hover:bg-white/10 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddTrip} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Trip Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Amalfi Coast Dream"
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      onChange={(e) => setNewTrip({...newTrip, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Destination</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Italy"
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Description</label>
                    <textarea 
                      placeholder="Describe the vibe..."
                      className="w-full bg-white/5 border border-white/10 rounded-[32px] px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all h-32 resize-none"
                      onChange={(e) => setNewTrip({...newTrip, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Transport Entry (Link)</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      onChange={(e) => setLinkEntries({...linkEntries, transport: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Hotel Entry (Link)</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      onChange={(e) => setLinkEntries({...linkEntries, hotel: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Fashion Entry (Link)</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      onChange={(e) => setLinkEntries({...linkEntries, fashion: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Activities Entry (Link)</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      onChange={(e) => setLinkEntries({...linkEntries, activities: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Extra Bar (Optional Description)</label>
                    <input 
                      type="text" 
                      placeholder="Anything else to add?"
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      onChange={(e) => setLinkEntries({...linkEntries, extra: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Social Media (Link)</label>
                    <input 
                      type="url" 
                      placeholder="https://instagram.com/..."
                      className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      onChange={(e) => setLinkEntries({...linkEntries, social: e.target.value})}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-8">
                  <button 
                    type="submit"
                    className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold transition-all shadow-xl shadow-emerald-500/20"
                  >
                    Publish Trip Card
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Story Modal */}
      <AnimatePresence>
        {isAddingStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-10 rounded-[48px] w-full max-w-md space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif">Post Story</h2>
                <button onClick={() => setIsAddingStory(false)} className="p-3 rounded-full hover:bg-white/10 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddStory} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-4">Story Media URL</label>
                  <input 
                    type="url" 
                    placeholder="https://picsum.photos/..."
                    className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    value={newStoryMedia}
                    onChange={(e) => setNewStoryMedia(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-white/20 ml-4">Paste an image or video URL for your story</p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold transition-all shadow-xl shadow-emerald-500/20"
                >
                  Share Story
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar = ({ onScrollTo, onNavigate, currentView, user }: { 
  onScrollTo: (id: string) => void; 
  onNavigate: (view: 'home' | 'explore' | 'advisor-form' | 'advisor-profile' | 'dashboard' | 'advisors-list' | 'advisor-login' | 'advisor-dashboard' | 'advisor-signup' | 'admin-dashboard') => void;
  currentView: string;
  user: FirebaseUser | null;
}) => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-sm bg-black/10">
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
        <Compass className="w-5 h-5 text-black" />
      </div>
      <span className="text-xl font-serif tracking-tight">TravelVibe</span>
    </div>
    <div className="hidden md:flex items-center gap-8">
      <button 
        onClick={() => {
          if (currentView !== 'home') onNavigate('home');
          setTimeout(() => onScrollTo('discover'), 100);
        }}
        className="text-sm font-medium text-white/40 hover:text-white transition-colors"
      >
        Discover
      </button>
      <button 
        onClick={() => {
          if (currentView !== 'home') onNavigate('home');
          setTimeout(() => onScrollTo('advisors'), 100);
        }}
        className="text-sm font-medium text-white/40 hover:text-white transition-colors"
      >
        Advisors
      </button>
      <button 
        onClick={() => {
          if (currentView !== 'home') onNavigate('home');
          setTimeout(() => onScrollTo('shop'), 100);
        }}
        className="text-sm font-medium text-white/40 hover:text-white transition-colors"
      >
        Shop
      </button>
      <button 
        onClick={() => onNavigate('advisor-login')}
        className={`text-sm font-medium transition-colors ${currentView === 'advisor-login' ? 'text-emerald-400' : 'text-white/40 hover:text-white'}`}
      >
        Advisor Portal
      </button>
      {user?.email === 'uzmabagavan2906@gmail.com' && (
        <button 
          onClick={() => onNavigate('admin-dashboard')}
          className={`text-sm font-medium transition-colors ${currentView === 'admin-dashboard' ? 'text-emerald-400' : 'text-white/40 hover:text-white'}`}
        >
          Admin
        </button>
      )}
    </div>
    <div className="flex items-center gap-4">
      <button 
        onClick={() => onNavigate('dashboard')}
        className={`p-2 rounded-full transition-colors ${currentView === 'dashboard' ? 'bg-white text-black' : 'hover:bg-white/10 text-white'}`}
      >
        <User className="w-5 h-5" />
      </button>
      <button className="nav-pill" onClick={() => onNavigate('advisor-login')}>Sign In</button>
    </div>
  </nav>
);

const ShareMenu = ({ trip, onClose }: { trip: Trip; onClose: () => void }) => {
  const shareLinks = [
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]', url: `https://wa.me/?text=Check out this trip to ${trip.destination}: ${window.location.href}` },
    { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', url: '#' },
    { name: 'Twitter', icon: Twitter, color: 'bg-[#1DA1F2]', url: `https://twitter.com/intent/tweet?text=Planning my trip to ${trip.destination}!&url=${window.location.href}` },
    { name: 'Copy Link', icon: LinkIcon, color: 'bg-slate-800', url: '#' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-0 bottom-0 z-[110] p-6 md:p-12"
    >
      <div className="max-w-md mx-auto glass rounded-[40px] p-8 shadow-2xl border border-white/20">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-serif">Share Itinerary</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {shareLinks.map((link) => (
            <a 
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
              onClick={(e) => {
                if (link.name === 'Copy Link') {
                  e.preventDefault();
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
            >
              <div className={`w-12 h-12 rounded-2xl ${link.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <link.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 group-hover:text-white transition-colors">{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const StoriesBar = ({ stories, onStoryClick }: { stories: Story[]; onStoryClick: (story: Story) => void }) => (
  <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-4">
    {ADVISORS.map((advisor) => {
      const advisorStories = stories.filter(s => s.advisorId === advisor.id);
      if (advisorStories.length === 0) return null;
      
      return (
        <button 
          key={advisor.id}
          onClick={() => onStoryClick(advisorStories[0])}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600">
              <div className="w-full h-full rounded-full border-2 border-black overflow-hidden">
                <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors">
            {advisor.name.split(' ')[0].toLowerCase()}
          </span>
        </button>
      );
    })}
  </div>
);

const StoryViewer = ({ stories, initialIndex, onClose }: { stories: Story[]; initialIndex: number; onClose: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [comments, setComments] = useState<{ id: string; user: string; text: string; time: string }[]>([
    { id: '1', user: 'Alex', text: 'This looks amazing! 😍', time: '2m' },
    { id: '2', user: 'Sarah', text: 'Wish I was there right now.', time: '5m' },
  ]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 500) + 100);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, stories.length, isPaused, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      setIsLiked(false);
      setLikesCount(Math.floor(Math.random() * 500) + 100);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
      setIsLiked(false);
      setLikesCount(Math.floor(Math.random() * 500) + 100);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      handlePrev(); // User requested: swipe left show before story
    } else if (info.offset.x > threshold) {
      handleNext(); // User requested: swipe right it has to show next story
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([...comments, { id: Date.now().toString(), user: 'You', text: newComment, time: 'Just now' }]);
    setNewComment('');
  };

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      setIsPaused(true);
      setIsLongPress(true);
    }, 200);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!isLongPress) {
      onClose();
    }
    setIsPaused(false);
    setIsLongPress(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-0 md:p-4"
    >
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="relative w-full max-w-lg aspect-[9/16] bg-black overflow-hidden md:rounded-[20px] shadow-2xl flex flex-col"
      >
        {/* Story Content - Click to Close / Long Press to Pause */}
        <div 
          className="absolute inset-0 z-0 cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img 
            src={currentStory.mediaUrl} 
            alt="Story" 
            className="w-full h-full object-cover pointer-events-none" 
            referrerPolicy="no-referrer" 
          />
        </div>
        
        {/* Timeline / Progress Bars - At the very top */}
        <div className="absolute top-3 left-2 right-2 flex gap-1.5 z-30">
          {stories.map((_, idx) => (
            <div key={idx} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Bar - Profile, Username, Music */}
        <div className="absolute top-8 left-0 right-0 px-4 flex items-center justify-between z-30 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
              <img src={currentStory.advisorImage} alt={currentStory.advisorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white drop-shadow-lg tracking-tight flex items-center gap-1">
                  {currentStory.advisorName.toLowerCase().replace(/\s/g, '_')}
                  <CheckCircle2 className="w-3 h-3 text-blue-400 fill-blue-400" />
                </p>
                <span className="text-xs text-white/80 drop-shadow-md font-medium">• {currentStory.timestamp}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-end gap-[1px] h-2.5">
                  <div className="w-[1.5px] h-full bg-emerald-400 animate-[pulse_1s_infinite]" />
                  <div className="w-[1.5px] h-2/3 bg-emerald-400 animate-[pulse_1s_infinite_0.2s]" />
                  <div className="w-[1.5px] h-1/2 bg-emerald-400 animate-[pulse_1s_infinite_0.4s]" />
                </div>
                <p className="text-[10px] text-emerald-400/90 font-bold drop-shadow-md uppercase tracking-wider">Expert Advisor • {currentStory.advisorName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pointer-events-auto">
            <button className="p-1 hover:opacity-70 transition-opacity">
              <MoreHorizontal className="w-5 h-5 text-white drop-shadow-md" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:opacity-70 transition-opacity">
              <X className="w-6 h-6 text-white drop-shadow-md" />
            </button>
          </div>
        </div>

        {/* Comments Overlay */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute inset-x-0 bottom-0 top-1/2 bg-black/95 backdrop-blur-2xl z-50 p-6 flex flex-col rounded-t-[20px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold">Comments</h4>
                <button onClick={() => setShowComments(false)} className="p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">{c.user[0]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{c.user}</span>
                        <span className="text-[10px] text-white/40">{c.time}</span>
                      </div>
                      <p className="text-sm text-white/80">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..." 
                  className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none"
                />
                <button type="submit" className="p-2 bg-white text-black rounded-full"><ArrowRight className="w-4 h-4" /></button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Bar - Interaction Icons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-12 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-30 pointer-events-none">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="flex-1">
                <div className="relative group/input">
                  <input 
                    type="text" 
                    placeholder="Send message..." 
                    className="w-full bg-white/5 backdrop-blur-md border border-white/30 rounded-full px-6 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-emerald-500/50 transition-all"
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 opacity-50" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
                    className="transition-all active:scale-150 hover:scale-110 relative group/heart"
                  >
                    <Heart className={`w-9 h-9 drop-shadow-2xl transition-all ${isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white hover:text-rose-400'}`} />
                    {isLiked && (
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0.8 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        className="absolute inset-0 bg-rose-500 rounded-full blur-2xl -z-10"
                      />
                    )}
                  </button>
                  <span className="text-[11px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">{formatCount(likesCount + (isLiked ? 1 : 0))}</span>
                </div>
                
                <div className="flex flex-col items-center gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                    className="transition-all active:scale-150 hover:scale-110 group/comment"
                  >
                    <MessageCircle className="w-9 h-9 text-white drop-shadow-2xl hover:text-emerald-400 transition-colors" />
                  </button>
                  <span className="text-[11px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">{comments.length}</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="transition-all active:scale-150 hover:scale-110 group/share"
                  >
                    <Share2 className="w-8 h-8 text-white drop-shadow-2xl hover:text-blue-400 transition-colors" />
                  </button>
                  <span className="text-[11px] font-black text-white/0 drop-shadow-none">.</span>
                </div>
              </div>
            </div>
            
            {/* Advisor Badge / Status */}
            <div className="flex items-center justify-between px-1 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800 overflow-hidden shadow-xl ring-1 ring-white/10">
                      <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="user" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-white/90 font-medium drop-shadow-sm">
                  Liked by <span className="font-bold text-white">{isLiked ? 'You and ' : ''}{likesCount.toLocaleString()} others</span>
                </p>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Active Now</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdvisorStatusTimeline = ({ 
  statuses, 
  onLike, 
  onAddComment 
}: { 
  statuses: AdvisorStatusUpdate[]; 
  onLike: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
}) => {
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  return (
    <div className="space-y-12">
      <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 mb-8">Advisor Status Timeline</h3>
      <div className="relative border-l border-white/10 ml-6 pl-12 space-y-16">
        {statuses.map((status) => (
          <motion.div 
            key={status.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className="absolute -left-[61px] top-0 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#050505] z-10" />
            
            <div className="glass rounded-[32px] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <img src={status.advisorImage} alt={status.advisorName} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-serif text-lg">{status.advisorName}</h4>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">{status.timestamp}</span>
                </div>
              </div>
              
              <p className="text-xl font-light leading-relaxed">
                {status.text}
              </p>
              
              <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                <button 
                  onClick={() => onLike(status.id)}
                  className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors group"
                >
                  <Heart className={`w-5 h-5 ${status.likes > 0 ? 'fill-rose-400' : ''} transition-transform group-hover:scale-110`} />
                  <span className="text-sm font-bold">{status.likes}</span>
                </button>
                <div className="flex items-center gap-2 text-white/40">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-bold">{status.comments.length}</span>
                </div>
              </div>

              {/* Comments Section */}
              {status.comments.length > 0 && (
                <div className="space-y-4 pt-4">
                  {status.comments.map((comment, cIdx) => (
                    <div key={cIdx} className="bg-white/5 rounded-2xl p-4 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{comment.user}</span>
                        <span className="text-[8px] text-white/20">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-white/70">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={commentText[status.id] || ''}
                  onChange={(e) => setCommentText(prev => ({ ...prev, [status.id]: e.target.value }))}
                  placeholder="Add a comment..."
                  className="flex-1 glass rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all"
                />
                <button 
                  onClick={() => {
                    if (commentText[status.id]) {
                      onAddComment(status.id, commentText[status.id]);
                      setCommentText(prev => ({ ...prev, [status.id]: '' }));
                    }
                  }}
                  className="p-3 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const NotificationToast = ({ notifications, onClose }: { notifications: Notification[]; onClose: (id: string) => void }) => {
  return (
    <div className="fixed top-24 right-8 z-[200] space-y-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="pointer-events-auto glass rounded-2xl p-6 w-80 shadow-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-3xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img src={notif.advisorImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-serif text-lg leading-none mb-1">{notif.advisorName}</h4>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">New Update</span>
                  </div>
                </div>
              </div>
              <button onClick={() => onClose(notif.id)} className="text-white/20 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-4">{notif.message}</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/20 uppercase tracking-widest">{notif.timestamp}</span>
              <button className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors">View Details</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const AdvisorsListView = ({ onSelectAdvisor, onBack, onStoryClick, stories, advisors, statuses, onLikeStatus, onAddCommentToStatus }: { 
  onSelectAdvisor: (advisor: Advisor) => void; 
  onBack: () => void; 
  onStoryClick: (story: Story) => void;
  stories: Story[];
  advisors: Advisor[];
  statuses: AdvisorStatusUpdate[];
  onLikeStatus: (id: string) => void;
  onAddCommentToStatus: (id: string, text: string) => void;
}) => {
  return (
    <section className="py-32 px-8 max-w-7xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-12 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back
      </button>

      <div className="mb-16">
        <span className="small-caps mb-4 block">Our Experts</span>
        <h2 className="text-6xl font-serif mb-8">Travel Advisors</h2>
        
        {/* Stories Bar */}
        <div className="mb-12">
          <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-white/40 mb-6">Live Stories</h3>
          <StoriesBar stories={stories} onStoryClick={onStoryClick} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {advisors.map((advisor) => (
            <motion.div 
              key={advisor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelectAdvisor(advisor)}
              className="glass rounded-[40px] p-8 cursor-pointer group hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10">
                  <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif">{advisor.name}</h3>
                  <p className="text-xs text-white/40 uppercase tracking-widest mt-1">{advisor.specialty}</p>
                </div>
              </div>
              <p className="text-sm text-white/60 line-clamp-3 mb-8 leading-relaxed italic">"{advisor.bio}"</p>
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-serif">{advisor.tripsCount}</p>
                    <p className="text-[8px] uppercase tracking-widest text-white/40">Trips</p>
                  </div>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div className="text-center">
                    <p className="text-lg font-serif">{(advisor.followers / 1000).toFixed(1)}k</p>
                    <p className="text-[8px] uppercase tracking-widest text-white/40">Followers</p>
                  </div>
                </div>
                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Status Timeline */}
        <div className="lg:col-span-1">
          <AdvisorStatusTimeline 
            statuses={statuses} 
            onLike={onLikeStatus} 
            onAddComment={onAddCommentToStatus} 
          />
        </div>
      </div>
    </section>
  );
};

const UserDashboard = ({ user, onBack, onTripClick }: { user: UserType; onBack: () => void; onTripClick: (trip: Trip) => void }) => {
  const [activeTab, setActiveTab] = useState<'saves' | 'upcoming' | 'bucket'>('saves');

  const savedTrips = FEATURED_TRIPS.filter(t => user.savedTrips.includes(t.id));
  const upcomingTrips = FEATURED_TRIPS.filter(t => user.upcomingTrips.some(ut => ut.tripId === t.id));

  return (
    <section className="py-32 px-8 max-w-7xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-12 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16">
        <div className="w-32 h-32 rounded-[40px] overflow-hidden border-2 border-white/10">
          <img src={user.image} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <span className="small-caps mb-2 block">Welcome back</span>
          <h2 className="text-5xl font-serif mb-2">{user.name}</h2>
          <p className="text-white/40">{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-white/10 mb-12">
        {[
          { id: 'saves', label: 'Saved Trips', icon: Bookmark },
          { id: 'upcoming', label: 'Upcoming Plans', icon: Calendar },
          { id: 'bucket', label: 'Bucket List', icon: Sparkles }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'saves' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={() => onTripClick(trip)} />
            ))}
            {savedTrips.length === 0 && (
              <div className="col-span-full py-20 text-center glass rounded-[40px]">
                <Bookmark className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">No saved trips yet. Start exploring!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            {upcomingTrips.map((trip) => {
              const plan = user.upcomingTrips.find(ut => ut.tripId === trip.id);
              return (
                <div key={trip.id} className="glass rounded-[40px] p-8 flex flex-col md:flex-row items-center gap-8 group">
                  <div className="w-full md:w-64 aspect-video rounded-3xl overflow-hidden shrink-0">
                    <img src={trip.image} alt={trip.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">{plan?.date}</span>
                    </div>
                    <h3 className="text-3xl font-serif mb-2">{trip.title}</h3>
                    <p className="text-white/40 text-sm mb-6">{trip.destination}</p>
                    <div className="flex gap-4">
                      <button onClick={() => onTripClick(trip)} className="px-6 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all">View Itinerary</button>
                      <button className="px-6 py-3 rounded-full glass text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Manage Booking</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'bucket' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.bucketList.map((activity) => (
              <div key={activity.id} className="glass rounded-[40px] p-8 flex items-center justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${activity.ongoing ? 'text-amber-400' : 'text-white/20'}`} />
                    <h3 className="text-xl font-serif">{activity.name}</h3>
                  </div>
                  <p className="text-xs text-white/40 uppercase tracking-widest">{activity.location}</p>
                  {activity.ongoing && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-400">Ongoing Event</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    if (activity.location === 'Turkey') {
                      // Just as an example, scroll to Cappadocia if it were in featured trips
                      // or navigate to explore with a search
                      alert(`Searching for trips in ${activity.location}...`);
                    }
                  }}
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            ))}
            
            {/* Dynamic Advice Cards for Ongoing Activities */}
            {user.bucketList.filter(a => a.ongoing).map((activity) => (
              <div key={`advice-${activity.id}`} className="col-span-full mt-12 glass rounded-[40px] p-12 border border-emerald-500/20 bg-emerald-500/5">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 text-emerald-400 mb-6">
                    <Award className="w-6 h-6" />
                    <span className="small-caps">Advisor Recommendation</span>
                  </div>
                  <h3 className="text-4xl font-serif mb-6">
                    Your bucket list item <span className="italic text-emerald-400">"{activity.name}"</span> is currently active!
                  </h3>
                  <p className="text-white/60 leading-relaxed mb-8">
                    We've noticed that {activity.name} in {activity.location} is currently in peak season. Our advisors have curated special itineraries to make this dream a reality right now.
                  </p>
                  <button 
                    onClick={() => alert(`Showing curated trips for ${activity.name} in ${activity.location}`)}
                    className="px-8 py-4 rounded-full bg-emerald-500 text-white font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Explore {activity.location} Trips
                  </button>
                </div>
              </div>
            ))}

            {user.bucketList.filter(a => a.ongoing).length === 0 && (
              <div className="col-span-full py-20 text-center glass rounded-[40px]">
                <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">No ongoing events for your bucket list right now. We'll notify you when they start!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const TripCard = ({ trip, onClick }: { trip: Trip; onClick: () => void }) => (
  <motion.div 
    layoutId={`trip-${trip.id}`}
    onClick={onClick}
    className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer"
  >
    <img 
      src={trip.image} 
      alt={trip.title} 
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      referrerPolicy="no-referrer"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-8">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3 h-3 text-white/60" />
        <span className="small-caps text-white/80">{trip.destination}</span>
      </div>
      <h3 className="text-2xl font-serif mb-1">{trip.title}</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={trip.advisorImage} alt={trip.advisor} className="w-6 h-6 rounded-full border border-white/20" referrerPolicy="no-referrer" />
          <span className="text-xs text-white/60">by {trip.advisor}</span>
        </div>
        <span className="text-sm font-medium">{trip.price}</span>
      </div>
    </div>
  </motion.div>
);

const TripDetail = ({ trip, onClose }: { trip: Trip; onClose: () => void }) => {
  const [isFollowed, setIsFollowed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const handleDoubleTap = () => {
    setIsLiked(true);
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white overflow-y-auto scrollbar-hide"
    >
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">Itinerary</h2>
          <span className="text-lg font-serif italic text-slate-800">{trip.destination}</span>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-6 h-6 text-slate-800" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
              >
                <button 
                  onClick={() => {
                    setIsSaved(!isSaved);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                  {isSaved ? 'Saved' : 'Save Trip'}
                </button>
                <button 
                  onClick={() => {
                    setShowShareMenu(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share Trip
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showShareMenu && (
          <ShareMenu trip={trip} onClose={() => setShowShareMenu(false)} />
        )}
      </AnimatePresence>

      {/* 1. Full-width Image Gallery */}
      <div className="w-full space-y-1">
        <div 
          className="w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden relative cursor-pointer"
          onDoubleClick={handleDoubleTap}
        >
          <img 
            src={trip.image} 
            alt={trip.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          <AnimatePresence>
            {showLikeAnimation && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {trip.travelPics?.map((pic, i) => (
            <div key={i} className="aspect-[4/3] overflow-hidden">
              <img src={pic} alt={`Travel ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* 2. Budget Summary Section */}
        <section className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-4xl font-serif italic text-slate-900">Budget Summary</h3>
              <p className="text-slate-500 font-medium">Estimated costs for your {trip.days}-day escape</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-emerald-600">{trip.price}</span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { label: 'Hotel', value: trip.budgetBreakdown.accommodation, icon: MapPin, color: 'text-blue-500' },
              { label: 'Transport', value: trip.budgetBreakdown.transport, icon: Clock, color: 'text-emerald-500' },
              { label: 'Food', value: trip.budgetBreakdown.meals, icon: Heart, color: 'text-rose-500' },
              { label: 'Activities', value: trip.budgetBreakdown.activities, icon: Sparkles, color: 'text-amber-500' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3">
                <item.icon className={`w-6 h-6 ${item.color}`} />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
                  <span className="text-xl font-bold text-slate-800">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Detailed Categories Section */}
        <div className="space-y-20">
          {/* Transport Category */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            <div className="md:col-span-1">
              <div className="sticky top-24 space-y-4">
                <span className="text-emerald-500 font-mono text-xs tracking-[0.4em] uppercase">Category 01</span>
                <h3 className="text-5xl font-serif italic text-slate-900">Transport</h3>
                <p className="text-slate-500 leading-relaxed">Seamless travel arrangements for a stress-free journey.</p>
              </div>
            </div>
            <div className="md:col-span-2 bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100">
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</span>
                    <p className="text-xl font-bold text-slate-800">{trip.transportFrom || 'Origin'}</p>
                    {trip.budgetBreakdown.transportGoing && (
                      <p className="text-sm font-bold text-emerald-600">Going: {trip.budgetBreakdown.transportGoing}</p>
                    )}
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-300" />
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</span>
                    <p className="text-xl font-bold text-slate-800">{trip.transportTo || trip.destination}</p>
                    {trip.budgetBreakdown.transportComingBack && (
                      <p className="text-sm font-bold text-emerald-600">Return: {trip.budgetBreakdown.transportComingBack}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-slate-600 italic">Allocated Budget</span>
                  <span className="text-3xl font-black text-slate-900">{trip.budgetBreakdown.transport}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-sm text-slate-500 leading-relaxed">
                  Includes airport transfers, local metro passes, and private taxi services for late-night explorations. We recommend booking in advance for the best rates.
                </div>
              </div>
            </div>
          </section>

          {/* Hotel Category */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            <div className="md:col-span-1">
              <div className="sticky top-24 space-y-4">
                <span className="text-blue-500 font-mono text-xs tracking-[0.4em] uppercase">Category 02</span>
                <h3 className="text-5xl font-serif italic text-slate-900">Hotel</h3>
                <p className="text-slate-500 leading-relaxed">Curated stays that blend comfort with local character.</p>
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-900 rounded-[40px] overflow-hidden relative group">
                <img 
                  src={trip.hotelPics?.[0]?.exterior || "https://picsum.photos/seed/hotel_ext/800/600"} 
                  className="w-full aspect-video object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                  alt="Hotel Exterior"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/80 to-transparent">
                  <h4 className="text-2xl font-bold text-white mb-4">The Grand Parisian Suite</h4>
                  <a 
                    href={trip.hotelLink || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-sm hover:bg-emerald-400 transition-colors w-fit"
                  >
                    Book on Agoda <LinkIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {trip.hotelPics?.slice(0, 2).map((pic, i) => (
                  <div key={i} className="aspect-square rounded-[32px] overflow-hidden border border-slate-100">
                    <img src={pic.interior} className="w-full h-full object-cover" alt="Hotel Interior" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Dresses Category */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            <div className="md:col-span-1">
              <div className="sticky top-24 space-y-4">
                <span className="text-rose-500 font-mono text-xs tracking-[0.4em] uppercase">Category 03</span>
                <h3 className="text-5xl font-serif italic text-slate-900">Dresses</h3>
                <p className="text-slate-500 leading-relaxed">Look your best while exploring the world's most photogenic spots.</p>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-6">
                {trip.shoppableItems.map((item) => (
                  <div key={item.id} className="group space-y-4">
                    <div className="aspect-[3/4] rounded-[40px] overflow-hidden border border-slate-100 relative shadow-sm">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                          href={item.link} 
                          className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl"
                        >
                          Shop Now
                        </a>
                      </div>
                    </div>
                    <div className="px-4">
                      <h5 className="font-bold text-slate-800">{item.name}</h5>
                      <p className="text-emerald-600 font-black">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Optional: Activities Section */}
          {trip.activityPics && trip.activityPics.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
              <div className="md:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <span className="text-amber-500 font-mono text-xs tracking-[0.4em] uppercase">Category 04</span>
                  <h3 className="text-5xl font-serif italic text-slate-900">Activities</h3>
                  <p className="text-slate-500 leading-relaxed">Memorable experiences that define your journey.</p>
                </div>
              </div>
              <div className="md:col-span-2 space-y-8">
                {trip.activityPics.map((activity, i) => (
                  <div key={i} className="bg-slate-50 rounded-[40px] overflow-hidden border border-slate-100 flex flex-col md:flex-row">
                    <div className="md:w-1/2 aspect-square md:aspect-auto overflow-hidden">
                      <img src={activity.image} className="w-full h-full object-cover" alt={activity.description} referrerPolicy="no-referrer" />
                    </div>
                    <div className="md:w-1/2 p-8 flex flex-col justify-center gap-4">
                      <h4 className="text-2xl font-serif italic text-slate-900">{activity.description}</h4>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Spent</span>
                        <span className="text-xl font-black text-slate-800">{activity.spent}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 4. Social Footer Section */}
        <section className="pt-20 border-t border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500 p-1">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <img 
                    src={trip.advisorImage} 
                    alt={trip.advisor} 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-3xl font-serif italic text-slate-900">Follow {trip.advisor.split(' ')[0]}</h4>
                <p className="text-slate-500 font-medium">@{trip.advisor.toLowerCase().replace(' ', '_')}_travels</p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="text-center space-y-1">
                <div 
                  className="flex items-center gap-2 text-rose-500 cursor-pointer"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500' : ''}`} />
                  <span className="text-2xl font-black">{isLiked ? trip.likes + 1 : trip.likes}</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Likes</span>
              </div>
              <div className="text-center space-y-1">
                <div 
                  className="flex items-center gap-2 text-emerald-500 cursor-pointer"
                  onClick={() => setIsSaved(!isSaved)}
                >
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-emerald-500' : ''}`} />
                  <span className="text-2xl font-black">{isSaved ? trip.saves + 1 : trip.saves}</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Saves</span>
              </div>
              <button 
                onClick={() => setIsFollowed(!isFollowed)}
                className={`px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl ${
                  isFollowed 
                    ? 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200' 
                    : 'bg-slate-900 text-white hover:bg-emerald-600'
                }`}
              >
                {isFollowed ? 'Unfollow' : 'Follow Advisor'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Final Close Button */}
      <div className="p-12 flex justify-center">
        <button 
          onClick={onClose}
          className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-[0.4em] text-xs"
        >
          <X className="w-5 h-5" />
          Close Itinerary
        </button>
      </div>
    </motion.div>
  );
};


const ItineraryGenerator = () => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!destination) return;
    setIsGenerating(true);
    try {
      const data = await generateItinerary(destination, days, interests);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Failed to generate itinerary. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="py-24 px-8 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold">AI Powered</span>
        </div>
        <h2 className="text-4xl font-serif mb-4">Create Your Custom Vibe</h2>
        <p className="text-white/40">Tell us where you want to go, and our AI will curate a personalized budget-friendly itinerary just for you.</p>
      </div>

      <div className="glass rounded-[32px] p-8 md:p-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="small-caps">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Where to?" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full glass rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 ring-white/20 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="small-caps">Duration (Days)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="number" 
                min="1" 
                max="14"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full glass rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 ring-white/20 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="small-caps">Interests & Vibe</label>
          <textarea 
            placeholder="e.g. Art, local food, hidden gems, budget-friendly, photography..." 
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full glass rounded-2xl py-4 px-6 min-h-[120px] focus:outline-none focus:ring-2 ring-white/20 transition-all resize-none"
          />
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !destination}
          className="w-full py-5 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
              />
              Curating your trip...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Itinerary
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 glass rounded-[32px] p-8 md:p-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-serif">{result.title}</h3>
              <button 
                onClick={() => setResult(null)}
                className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white/60 mb-8 leading-relaxed">{result.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h4 className="small-caps">Day-by-Day Plan</h4>
                <div className="space-y-6">
                  {result.itinerary.map((day: any) => (
                    <div key={day.day} className="relative pl-8 border-l border-white/10 pb-8 last:pb-0">
                      <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-white" />
                      <span className="text-xs text-white/40 mb-1 block">Day {day.day}</span>
                      <h5 className="text-lg font-medium mb-2">{day.title}</h5>
                      <ul className="space-y-1">
                        {day.activities.map((activity: string, i: number) => (
                          <li key={i} className="text-sm text-white/60">• {activity}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                <h4 className="small-caps">Key Highlights</h4>
                <div className="grid grid-cols-1 gap-4">
                  {result.highlights.map((highlight: string, i: number) => (
                    <div key={i} className="glass p-4 rounded-xl flex items-center gap-3">
                      <Star className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-sm">{highlight}</span>
                    </div>
                  ))}
                </div>
                
                {hasValidMapsKey && (
                  <div className="space-y-4">
                    <h4 className="small-caps">Map Preview</h4>
                    <div className="h-[300px] rounded-2xl overflow-hidden glass">
                      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                        <Map
                          {...({
                            defaultCenter: { lat: 0, lng: 0 },
                            defaultZoom: 2,
                            mapId: "DEMO_MAP_ID",
                            internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
                            style: { width: '100%', height: '100%' },
                            gestureHandling: 'greedy',
                            disableDefaultUI: true,
                          } as any)}
                        />
                      </APIProvider>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const AdvisorProfile = ({ advisor, onBack, onSelectTrip, onNotifyMe, user }: { 
  advisor: Advisor; 
  onBack: () => void; 
  onSelectTrip: (trip: Trip) => void;
  onNotifyMe: (advisorId: string, tripId?: string) => void;
  user: UserType;
}) => {
  const [isFollowed, setIsFollowed] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'saves' | 'upcoming' | 'bucket'>('portfolio');
  const advisorTrips = FEATURED_TRIPS.filter(t => t.advisorId === advisor.id);
  
  const totalLikes = advisorTrips.reduce((acc, t) => acc + t.likes, 0);
  const totalSaves = advisorTrips.reduce((acc, t) => acc + t.saves, 0);

  const savedTrips = FEATURED_TRIPS.filter(t => (advisor.savedTrips || []).includes(t.id));
  const upcomingTrips = FEATURED_TRIPS.filter(t => (advisor.upcomingTrips || []).some(ut => ut.tripId === t.id));

  return (
    <section className="min-h-screen bg-[#050505] text-white">
      {/* Editorial Header */}
      <div className="relative min-h-screen overflow-hidden flex flex-col">
        {/* Background Image with Parallax-like feel */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <img src={advisor.image} alt="" className="w-full h-full object-cover grayscale brightness-75" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#050505]/40 to-[#050505]" />
        </motion.div>

        {/* Navigation Overlaid */}
        <div className="relative p-8 flex items-center justify-between z-20">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 text-white/60 hover:text-white transition-all group"
          >
            <div className="w-12 h-12 rounded-full glass flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="small-caps text-xs tracking-[0.2em]">Back to Advisors</span>
          </button>
          
          <div className="flex gap-4">
            {advisor.instagram && (
              <a href={`https://instagram.com/${advisor.instagram}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {advisor.facebook && (
              <a href={`https://facebook.com/${advisor.facebook}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {advisor.twitter && (
              <a href={`https://twitter.com/${advisor.twitter}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative flex-1 flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: "circOut" }}
              >
                <span className="text-emerald-400 font-mono text-sm tracking-[0.6em] uppercase mb-6 block">Master Curator</span>
                <h1 className="text-[10vw] lg:text-[8vw] font-serif leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">
                  {advisor.name.split(' ')[0]}<br/>
                  <span className="text-emerald-500">{advisor.name.split(' ')[1]}</span>
                </h1>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-8"
              >
                <div className="h-[2px] w-32 bg-emerald-500" />
                <p className="text-2xl md:text-3xl text-white/90 font-light italic leading-tight max-w-lg">
                  "{advisor.passionLine}"
                </p>
              </motion.div>
            </div>

            <div className="flex flex-col gap-12 lg:items-end">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 5 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="w-56 h-56 md:w-80 md:h-80 rounded-[80px] overflow-hidden border-[12px] border-white/5 shadow-[0_0_100px_rgba(16,185,129,0.2)] hover:rotate-0 transition-transform duration-1000"
              >
                <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>
              
              <div className="flex flex-nowrap items-center gap-6 md:gap-12 bg-white/5 backdrop-blur-3xl p-6 md:p-10 rounded-[40px] border border-white/10 overflow-x-auto scrollbar-hide">
                <div className="text-center space-y-2 shrink-0">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                    <Users className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-bold">Followers</span>
                  </div>
                  <span className="block text-3xl md:text-5xl font-serif">{formatCount(advisor.followers)}</span>
                </div>
                <div className="w-[1px] h-8 md:h-12 bg-white/10 shrink-0" />
                <div className="text-center space-y-2 shrink-0">
                  <div className="flex items-center justify-center gap-2 text-rose-400 mb-1">
                    <Heart className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-bold">Likes</span>
                  </div>
                  <span className="block text-3xl md:text-5xl font-serif">{formatCount(totalLikes)}</span>
                </div>
                <div className="w-[1px] h-8 md:h-12 bg-white/10 shrink-0" />
                <div className="text-center space-y-2 shrink-0">
                  <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
                    <Bookmark className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-bold">Saves</span>
                  </div>
                  <span className="block text-3xl md:text-5xl font-serif">{formatCount(totalSaves)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio & CTA Section */}
      <div className="max-w-7xl mx-auto px-8 py-32 grid grid-cols-1 lg:grid-cols-3 gap-20 items-start">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <h2 className="text-4xl font-serif">The Journey</h2>
            <p className="text-white/60 text-xl md:text-2xl leading-relaxed font-light">
              {advisor.bio}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="glass p-6 rounded-3xl space-y-2">
              <span className="text-emerald-400 block"><Globe className="w-6 h-6" /></span>
              <span className="text-xs text-white/40 uppercase tracking-widest">Global Reach</span>
              <span className="block font-serif text-xl">Worldwide</span>
            </div>
            <div className="glass p-6 rounded-3xl space-y-2">
              <span className="text-emerald-400 block"><MapPin className="w-6 h-6" /></span>
              <span className="text-xs text-white/40 uppercase tracking-widest">Base</span>
              <span className="block font-serif text-xl">Remote</span>
            </div>
            <div className="glass p-6 rounded-3xl space-y-2">
              <span className="text-emerald-400 block"><Compass className="w-6 h-6" /></span>
              <span className="text-xs text-white/40 uppercase tracking-widest">Experience</span>
              <span className="block font-serif text-xl">8+ Years</span>
            </div>
            <div className="glass p-6 rounded-3xl space-y-2">
              <span className="text-emerald-400 block"><Award className="w-6 h-6" /></span>
              <span className="text-xs text-white/40 uppercase tracking-widest">Status</span>
              <span className="block font-serif text-xl">Pro Advisor</span>
            </div>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] space-y-8 sticky top-32">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-serif">Join the Inner Circle</h3>
            <p className="text-white/40 text-sm">Get exclusive access to {advisor.name.split(' ')[0]}'s private itineraries and travel hacks.</p>
          </div>
          <button 
            onClick={() => setIsFollowed(!isFollowed)}
            className={`w-full py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl group ${
              isFollowed 
                ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
                : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20'
            }`}
          >
            {isFollowed ? (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Unfollow {advisor.name.split(' ')[0]}
              </>
            ) : (
              <>
                <UserPlus className="w-6 h-6 transition-transform group-hover:scale-110" />
                Follow {advisor.name.split(' ')[0]}
              </>
            )}
          </button>

          <button 
            onClick={() => onNotifyMe(advisor.id)}
            className={`w-full py-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-3 border ${
              user.notifiedAdvisors?.includes(advisor.id)
                ? 'bg-emerald-500 text-black border-emerald-500 hover:bg-emerald-400' 
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {user.notifiedAdvisors?.includes(advisor.id) ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Notifications Active
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Notify Me
              </>
            )}
          </button>
          <div className="flex justify-center gap-4 pt-4 border-t border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-white/20">Trusted by {formatCount(advisor.followers)} explorers</span>
          </div>
        </div>
      </div>

      {/* Planning Trips Section */}
      {advisor.planningTrips && advisor.planningTrips.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 py-20 border-t border-white/5">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Compass className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-emerald-400 font-mono text-[10px] tracking-[0.4em] uppercase block mb-1">Live Updates</span>
              <h2 className="text-4xl font-serif">Planning & Announcements</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advisor.planningTrips.map((pt) => (
              <div key={pt.id} className="glass rounded-[40px] p-8 flex flex-col md:flex-row gap-8 items-center group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    pt.status === 'Announced' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    pt.status === 'Booking' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {pt.status}
                  </div>
                </div>
                
                <div className="w-full md:w-48 aspect-square rounded-3xl overflow-hidden shrink-0">
                  <img src={pt.image} alt={pt.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1 block">{pt.destination}</span>
                    <h3 className="text-2xl font-serif">{pt.title}</h3>
                  </div>
                  
                  {pt.announcement && (
                    <p className="text-white/60 text-sm leading-relaxed italic">
                      "{pt.announcement}"
                    </p>
                  )}
                  
                  {pt.expectedDate && (
                    <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold">
                      <Calendar className="w-4 h-4" />
                      Expected: {pt.expectedDate}
                    </div>
                  )}

                  <button 
                    onClick={() => onNotifyMe(advisor.id, pt.id)}
                    className={`text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 group/btn ${
                      user.notifiedPlanningTrips?.includes(pt.id) ? 'text-emerald-400' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {user.notifiedPlanningTrips?.includes(pt.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Notified
                      </>
                    ) : (
                      <>
                        Notify Me
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-8 mb-12">
        <div className="flex gap-8 border-b border-white/10">
          {[
            { id: 'portfolio', label: 'Portfolio', icon: Globe, visible: true },
            { id: 'saves', label: 'Saved Trips', icon: Bookmark, visible: advisor.visibility?.savedTrips ?? true },
            { id: 'upcoming', label: 'Upcoming Plans', icon: Calendar, visible: advisor.visibility?.upcomingPlans ?? true },
            { id: 'bucket', label: 'Bucket List', icon: Sparkles, visible: advisor.visibility?.bucketList ?? true }
          ].filter(tab => tab.visible).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="advisorActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-8 pb-32">
        {activeTab === 'portfolio' && (
          <div className="space-y-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <span className="text-emerald-400 font-mono text-xs tracking-[0.4em] uppercase">Curated Collections</span>
                <h2 className="text-6xl font-serif leading-none">The Portfolio</h2>
              </div>
              <div className="text-white/40 font-light max-w-md text-right">
                Explore the hand-picked destinations and meticulously crafted budgets that define {advisor.name}'s signature travel style.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {advisorTrips.map((trip, i) => (
                <motion.div 
                  key={trip.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => onSelectTrip(trip)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-[48px] overflow-hidden mb-8">
                    <img 
                      src={trip.image} 
                      alt={trip.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                    
                    <div className="absolute top-8 right-8 flex flex-col gap-3">
                      <div className="glass px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-2xl border-white/20">
                        <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                        <span className="text-xs font-bold">{trip.likes}</span>
                      </div>
                      <div className="glass px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-2xl border-white/20">
                        <Bookmark className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                        <span className="text-xs font-bold">{trip.saves}</span>
                      </div>
                    </div>

                    <div className="absolute bottom-10 left-10 right-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-emerald-400 font-mono text-[10px] tracking-[0.2em] uppercase">
                          <MapPin className="w-4 h-4" />
                          {trip.destination}
                        </div>
                        <h3 className="text-3xl font-serif text-white leading-tight">{trip.title}</h3>
                        <div className="flex items-center justify-between pt-6 border-t border-white/10">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-1">Total Budget</span>
                            <span className="text-2xl font-serif text-white">{trip.price}</span>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                            <ArrowRight className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'saves' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={() => onSelectTrip(trip)} />
            ))}
            {savedTrips.length === 0 && (
              <div className="col-span-full py-20 text-center glass rounded-[40px]">
                <Bookmark className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">No saved trips yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            {upcomingTrips.map((trip) => {
              const plan = advisor.upcomingTrips?.find(ut => ut.tripId === trip.id);
              return (
                <div key={trip.id} className="glass rounded-[40px] p-8 flex flex-col md:flex-row items-center gap-8 group">
                  <div className="w-full md:w-64 aspect-video rounded-3xl overflow-hidden shrink-0">
                    <img src={trip.image} alt={trip.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">{plan?.date}</span>
                    </div>
                    <h3 className="text-3xl font-serif mb-2">{trip.title}</h3>
                    <p className="text-white/40 text-sm mb-6">{trip.destination}</p>
                    <div className="flex gap-4">
                      <button onClick={() => onSelectTrip(trip)} className="px-6 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all">View Itinerary</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {upcomingTrips.length === 0 && (
              <div className="py-20 text-center glass rounded-[40px]">
                <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">No upcoming plans.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bucket' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(advisor.bucketList || []).map((activity) => (
              <div key={activity.id} className="glass rounded-[40px] p-8 flex items-center justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${activity.ongoing ? 'text-amber-400' : 'text-white/20'}`} />
                    <h3 className="text-xl font-serif">{activity.name}</h3>
                  </div>
                  <p className="text-xs text-white/40 uppercase tracking-widest">{activity.location}</p>
                </div>
              </div>
            ))}
            {(advisor.bucketList || []).length === 0 && (
              <div className="col-span-full py-20 text-center glass rounded-[40px]">
                <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">Bucket list is empty.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="py-32 px-8 text-center border-t border-white/5">
        <p className="text-white/20 text-sm tracking-[0.2em] uppercase mb-12">More from {advisor.name}</p>
        <div className="flex flex-wrap justify-center gap-8">
          {advisor.instagram && (
            <a href={`https://instagram.com/${advisor.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 glass px-8 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1">
              <Instagram className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">Instagram</span>
            </a>
          )}
          {advisor.facebook && (
            <a href={`https://facebook.com/${advisor.facebook}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 glass px-8 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1">
              <Facebook className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">Facebook</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

const AdvisorsList = ({ onSelectAdvisor, onSeeMore }: { onSelectAdvisor: (advisor: Advisor) => void; onSeeMore: () => void }) => (
  <section id="advisors" className="py-32 px-8 max-w-7xl mx-auto">
    <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-4">
      <div className="max-w-xl">
        <span className="small-caps mb-4 block">Meet the experts</span>
        <h2 className="text-5xl font-serif mb-6">Our Travel Advisors</h2>
        <p className="text-white/40">
          Connect with seasoned explorers who curate personalized experiences based on years of on-the-ground knowledge.
        </p>
      </div>
      <button 
        onClick={onSeeMore}
        className="px-6 py-3 rounded-full glass text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 group"
      >
        See All Advisors
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {ADVISORS.map((advisor) => (
        <motion.div 
          key={advisor.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-[40px] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start"
        >
          <div className="w-48 h-48 rounded-3xl overflow-hidden shrink-0">
            <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <h3 className="text-2xl font-serif">{advisor.name}</h3>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/60">
                {advisor.tripsCount} Trips
              </span>
            </div>
            <p className="text-emerald-400 text-sm font-medium mb-4">{advisor.specialty}</p>
            <p className="text-white/60 text-sm leading-relaxed mb-6 line-clamp-3">{advisor.bio}</p>
            <button 
              onClick={() => onSelectAdvisor(advisor)}
              className="flex items-center gap-2 text-sm font-semibold group"
            >
              View Advisor Profile
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

const ShopList = () => (
  <section id="shop" className="py-32 px-8 max-w-7xl mx-auto">
    <div className="text-center mb-20">
      <span className="small-caps mb-4 block">Travel Essentials</span>
      <h2 className="text-5xl font-serif mb-6">Shop the Look</h2>
      <p className="text-white/40 max-w-2xl mx-auto">
        Curated gear and fashion recommended by our advisors for your next adventure.
      </p>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {SHOP_ITEMS.map((item) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-6 group cursor-pointer"
        >
          <div className="aspect-square rounded-2xl overflow-hidden mb-6">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <h3 className="text-lg font-medium mb-1">{item.name}</h3>
          <p className="text-xs text-white/40 mb-4">Recommended by {item.postedBy}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{item.price}</span>
            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white text-white hover:text-black transition-all">
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

const ExploreTrips = ({ onSelectTrip, onBack }: { onSelectTrip: (trip: Trip) => void; onBack: () => void }) => {
  const getAdvisorFollowers = (advisorId: string) => {
    const advisor = ADVISORS.find(a => a.id === advisorId);
    if (!advisor) return '0';
    if (advisor.followers >= 1000) {
      return (advisor.followers / 1000).toFixed(1) + 'k';
    }
    return advisor.followers.toString();
  };

  return (
    <section className="py-32 px-8 max-w-7xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-12 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Home
      </button>

      <div className="mb-16">
        <span className="small-caps mb-4 block">All listed trips</span>
        <h2 className="text-5xl font-serif mb-6">Explore Destinations</h2>
        <p className="text-white/40 max-w-2xl">
          Browse through all expert-curated itineraries and find your next budget-friendly adventure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURED_TRIPS.map((trip) => (
          <motion.div 
            key={trip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelectTrip(trip)}
            className="glass rounded-[32px] overflow-hidden cursor-pointer group"
          >
            <div className="aspect-[4/3] relative overflow-hidden">
              <img 
                src={trip.image} 
                alt={trip.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span className="text-[10px] font-bold">{trip.likes}</span>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/60">{trip.days} Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/60">{trip.saves} Saves</span>
                </div>
              </div>
              <h3 className="text-2xl font-serif mb-2">{trip.title}</h3>
              <p className="text-sm text-white/40 mb-6 line-clamp-2">{trip.description}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <img src={trip.advisorImage} alt={trip.advisor} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-xs font-medium">{trip.advisor}</p>
                    <p className="text-[10px] text-white/40">{getAdvisorFollowers(trip.advisorId)} followers</p>
                  </div>
                </div>
                <span className="text-lg font-serif">{trip.price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [applications, setApplications] = useState<AdvisorApplication[]>([]);
  const [tripApplications, setTripApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'applications'), where('status', '==', 'pending'));
    const unsubscribeApps = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdvisorApplication));
      setApplications(apps);
      setLoading(false);
    });

    const tq = query(collection(db, 'tripApplications'), where('status', '==', 'pending'));
    const unsubscribeTrips = onSnapshot(tq, (snapshot) => {
      const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTripApplications(trips);
    });

    return () => {
      unsubscribeApps();
      unsubscribeTrips();
    };
  }, []);

  const handleApproveTrip = async (trip: any) => {
    if (!confirm(`Approve trip "${trip.title}"?`)) return;
    try {
      await updateDoc(doc(db, 'tripApplications', trip.id), { status: 'accepted' });
      alert('Trip approved!');
    } catch (error) {
      console.error('Error approving trip:', error);
    }
  };

  const handleDeclineTrip = async (trip: any) => {
    if (!confirm(`Decline trip "${trip.title}"?`)) return;
    try {
      await updateDoc(doc(db, 'tripApplications', trip.id), { status: 'declined' });
      alert('Trip declined.');
    } catch (error) {
      console.error('Error declining trip:', error);
    }
  };

  const handleApprove = async (app: AdvisorApplication) => {
    if (!confirm(`Are you sure you want to approve ${app.fullName}?`)) return;

    try {
      // 1. Create Firebase Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, app.email, app.password || 'password123');
      const user = userCredential.user;

      // 2. Create Advisor Document in Firestore
      const advisorData: Advisor = {
        id: user.uid,
        name: app.fullName,
        email: app.email,
        image: app.travelPics[0] || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
        specialty: app.specialties.join(', '),
        bio: app.itinerary.substring(0, 200) + '...',
        tripsCount: 0,
        followers: 0,
        passionLine: app.passionLine,
        status: 'approved',
        visibility: { savedTrips: true, upcomingPlans: true, bucketList: true },
        instagram: app.socialLinks?.instagram || '',
        facebook: app.socialLinks?.facebook || '',
        twitter: app.socialLinks?.twitter || '',
      };

      await setDoc(doc(db, 'advisors', user.uid), advisorData);

      // 3. Update Application Status
      await updateDoc(doc(db, 'applications', app.id), { status: 'accepted' });

      alert(`Approved ${app.fullName}! Welcome email sent.`);
    } catch (error: any) {
      console.error('Error approving advisor:', error);
      alert('Error approving advisor: ' + error.message);
    }
  };

  const handleDecline = async (app: AdvisorApplication) => {
    if (!confirm(`Are you sure you want to decline ${app.fullName}?`)) return;

    try {
      await updateDoc(doc(db, 'applications', app.id), { status: 'declined' });
      alert(`Declined ${app.fullName}. Decline email sent.`);
    } catch (error: any) {
      console.error('Error declining advisor:', error);
      alert('Error declining advisor: ' + error.message);
    }
  };

  return (
    <section className="py-32 px-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-16">
        <div>
          <span className="small-caps mb-4 block">Owner Portal</span>
          <h2 className="text-5xl font-serif">Pending Applications</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={onLogout} className="px-6 py-3 glass rounded-full hover:bg-white/10 transition-all flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="space-y-24">
        <section>
          <h3 className="text-3xl font-serif mb-8">Advisor Applications</h3>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="glass rounded-[40px] p-12 text-center">
              <p className="text-white/40">No pending advisor applications.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {applications.map((app) => (
                <motion.div 
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-[40px] p-8 md:p-12"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-3xl font-serif mb-2">{app.fullName}</h3>
                        <p className="text-emerald-400 text-sm font-mono">{app.email} • {app.phone}</p>
                      </div>

                      <div className="space-y-4">
                        <label className="small-caps opacity-40">Passion Line</label>
                        <p className="text-lg italic">"{app.passionLine}"</p>
                      </div>

                      <div className="space-y-4">
                        <label className="small-caps opacity-40">Specialties</label>
                        <div className="flex flex-wrap gap-2">
                          {app.specialties.map(s => (
                            <span key={s} className="px-3 py-1 glass rounded-full text-[10px] uppercase tracking-wider">{s}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-8">
                        <button 
                          onClick={() => handleApprove(app)}
                          className="flex-1 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleDecline(app)}
                          className="flex-1 py-4 glass text-white font-bold rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-3xl font-serif mb-8">Trip Experience Submissions</h3>
          {tripApplications.length === 0 ? (
            <div className="glass rounded-[40px] p-12 text-center">
              <p className="text-white/40">No pending trip submissions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {tripApplications.map((trip) => (
                <motion.div 
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-[40px] p-8 md:p-12"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-3xl font-serif mb-2">{trip.title}</h3>
                        <p className="text-emerald-400 text-sm font-mono">By {trip.advisorName} • {trip.destination}</p>
                      </div>
                      <p className="text-white/60">{trip.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="small-caps opacity-40">Nature Pics</label>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {trip.naturePics?.map((p: string, i: number) => (
                              <img key={i} src={p} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="small-caps opacity-40">Transport Slip</label>
                          {trip.transport?.slipUrl && <img src={trip.transport.slipUrl} className="w-16 h-16 rounded-lg object-cover" />}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-8">
                        <button 
                          onClick={() => handleApproveTrip(trip)}
                          className="flex-1 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Accept Trip
                        </button>
                        <button 
                          onClick={() => handleDeclineTrip(trip)}
                          className="flex-1 py-4 glass text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

const DetailedTripForm = ({ onBack, onSubmit, advisor }: { onBack: () => void; onSubmit: (trip: any) => void; advisor: Advisor }) => {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  
  // Nature Pics
  const [naturePics, setNaturePics] = useState<{ file: File | null; preview?: string }[]>([{ file: null }]);
  
  // Transport
  const [transportGoing, setTransportGoing] = useState('');
  const [transportComingBack, setTransportComingBack] = useState('');
  const [transportSlip, setTransportSlip] = useState<{ file: File | null; preview?: string }>({ file: null });
  const [transportLink, setTransportLink] = useState('');

  // Hotel
  const [hotelInteriorPics, setHotelInteriorPics] = useState<{ file: File | null; preview?: string }[]>([{ file: null }]);
  const [hotelExteriorPics, setHotelExteriorPics] = useState<{ file: File | null; preview?: string }[]>([{ file: null }]);
  const [hotelLink, setHotelLink] = useState('');

  // Activities
  const [activities, setActivities] = useState<{ pics: { file: File | null; preview?: string }[]; charges: string }[]>([{ pics: [{ file: null }], charges: '' }]);

  // Dress Links
  const [dressLinks, setDressLinks] = useState<{ pics: { file: File | null; preview?: string }[]; link: string }[]>([{ pics: [{ file: null }], link: '' }]);

  const handleAddNaturePic = () => setNaturePics([...naturePics, { file: null }]);
  const handleNaturePicChange = (idx: number, file: File) => {
    const newPics = [...naturePics];
    newPics[idx] = { file, preview: URL.createObjectURL(file) };
    setNaturePics(newPics);
  };

  const handleAddActivity = () => setActivities([...activities, { pics: [{ file: null }], charges: '' }]);
  const handleAddDress = () => setDressLinks([...dressLinks, { pics: [{ file: null }], link: '' }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tripData = {
      advisorId: advisor.id,
      advisorName: advisor.name,
      title,
      destination,
      description,
      price,
      duration,
      naturePics: naturePics.map(p => p.preview).filter(Boolean),
      transport: {
        going: transportGoing,
        comingBack: transportComingBack,
        slipUrl: transportSlip.preview,
        link: transportLink
      },
      hotel: {
        interiorPics: hotelInteriorPics.map(p => p.preview).filter(Boolean),
        exteriorPics: hotelExteriorPics.map(p => p.preview).filter(Boolean),
        link: hotelLink
      },
      activities: activities.map(a => ({
        pics: a.pics.map(p => p.preview).filter(Boolean),
        charges: a.charges
      })),
      dressLinks: dressLinks.map(d => ({
        pics: d.pics.map(p => p.preview).filter(Boolean),
        link: d.link
      })),
      status: 'pending',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'tripApplications'), tripData);
      alert('Trip submitted for review to uzmabagavan2906@gmail.com!');
      onBack();
    } catch (error) {
      console.error('Error submitting trip:', error);
      alert('Failed to submit trip application.');
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span className="small-caps text-xs tracking-widest">Back to Dashboard</span>
          </button>
          <h2 className="text-3xl font-serif">Add Trip Experience</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Basic Info */}
          <div className="glass p-8 rounded-[40px] space-y-8">
            <h3 className="text-xl font-serif">Basic Trip Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="small-caps">Trip Title</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full glass rounded-2xl py-4 px-6" placeholder="e.g. Budget Bali Adventure" />
              </div>
              <div className="space-y-2">
                <label className="small-caps">Destination</label>
                <input required type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full glass rounded-2xl py-4 px-6" placeholder="e.g. Bali, Indonesia" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="small-caps">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full glass rounded-2xl py-4 px-6 min-h-[120px]" placeholder="Share your experience..." />
            </div>
          </div>

          {/* Nature Pics */}
          <div className="glass p-8 rounded-[40px] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif">Nature Pictures</h3>
              <button type="button" onClick={handleAddNaturePic} className="text-xs text-emerald-400">+ Add More</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {naturePics.map((pic, idx) => (
                <div key={idx} className="aspect-square glass rounded-2xl relative overflow-hidden group border-dashed border border-white/10">
                  {pic.preview ? (
                    <img src={pic.preview} alt="Nature" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Upload className="w-6 h-6 text-white/20" />
                      <span className="text-[10px] mt-2 text-white/20">Upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleNaturePicChange(idx, e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div className="glass p-8 rounded-[40px] space-y-8">
            <h3 className="text-xl font-serif">Transport Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="small-caps">Going Charges</label>
                <input type="text" value={transportGoing} onChange={(e) => setTransportGoing(e.target.value)} className="w-full glass rounded-2xl py-4 px-6" placeholder="e.g. $50" />
              </div>
              <div className="space-y-2">
                <label className="small-caps">Coming Back Charges</label>
                <input type="text" value={transportComingBack} onChange={(e) => setTransportComingBack(e.target.value)} className="w-full glass rounded-2xl py-4 px-6" placeholder="e.g. $50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="small-caps">MakeMyTrip Link</label>
                <input type="url" value={transportLink} onChange={(e) => setTransportLink(e.target.value)} className="w-full glass rounded-2xl py-4 px-6" placeholder="https://makemytrip.com/..." />
              </div>
              <div className="space-y-2">
                <label className="small-caps">Ticket Slip</label>
                <div className="aspect-video glass rounded-2xl relative overflow-hidden group border-dashed border border-white/10">
                  {transportSlip.preview ? (
                    <img src={transportSlip.preview} alt="Slip" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Upload className="w-6 h-6 text-white/20" />
                      <span className="text-[10px] mt-2 text-white/20">Upload Slip</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setTransportSlip({ file: e.target.files[0], preview: URL.createObjectURL(e.target.files[0]) })} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          {/* Hotel */}
          <div className="glass p-8 rounded-[40px] space-y-8">
            <h3 className="text-xl font-serif">Hotel Details (Optional)</h3>
            <div className="space-y-4">
              <label className="small-caps">Interior Pictures</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {hotelInteriorPics.map((pic, idx) => (
                  <div key={idx} className="aspect-square glass rounded-2xl relative overflow-hidden border-dashed border border-white/10">
                    {pic.preview ? <img src={pic.preview} className="absolute inset-0 w-full h-full object-cover" /> : <Upload className="absolute inset-0 m-auto w-6 h-6 text-white/20" />}
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setHotelInteriorPics(prev => {
                      const n = [...prev];
                      n[idx] = { file: e.target.files![0], preview: URL.createObjectURL(e.target.files![0]) };
                      return n;
                    })} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                ))}
                <button type="button" onClick={() => setHotelInteriorPics([...hotelInteriorPics, { file: null }])} className="aspect-square glass rounded-2xl flex items-center justify-center text-white/20 hover:text-white/40">+</button>
              </div>
            </div>
            <div className="space-y-4">
              <label className="small-caps">Exterior Pictures</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {hotelExteriorPics.map((pic, idx) => (
                  <div key={idx} className="aspect-square glass rounded-2xl relative overflow-hidden border-dashed border border-white/10">
                    {pic.preview ? <img src={pic.preview} className="absolute inset-0 w-full h-full object-cover" /> : <Upload className="absolute inset-0 m-auto w-6 h-6 text-white/20" />}
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setHotelExteriorPics(prev => {
                      const n = [...prev];
                      n[idx] = { file: e.target.files![0], preview: URL.createObjectURL(e.target.files![0]) };
                      return n;
                    })} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                ))}
                <button type="button" onClick={() => setHotelExteriorPics([...hotelExteriorPics, { file: null }])} className="aspect-square glass rounded-2xl flex items-center justify-center text-white/20 hover:text-white/40">+</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="small-caps">Booking Link (Agoda/MakeMyTrip)</label>
              <input type="url" value={hotelLink} onChange={(e) => setHotelLink(e.target.value)} className="w-full glass rounded-2xl py-4 px-6" placeholder="https://agoda.com/..." />
            </div>
          </div>

          {/* Activities */}
          <div className="glass p-8 rounded-[40px] space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif">Extra Activities (Optional)</h3>
              <button type="button" onClick={handleAddActivity} className="text-xs text-emerald-400">+ Add Activity</button>
            </div>
            {activities.map((activity, aIdx) => (
              <div key={aIdx} className="space-y-4 p-6 glass rounded-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="small-caps text-[10px]">Charges</label>
                    <input type="text" value={activity.charges} onChange={(e) => {
                      const n = [...activities];
                      n[aIdx].charges = e.target.value;
                      setActivities(n);
                    }} className="w-full glass rounded-xl py-3 px-4" placeholder="e.g. $30" />
                  </div>
                  <div className="space-y-2">
                    <label className="small-caps text-[10px]">Pictures</label>
                    <div className="flex gap-2">
                      {activity.pics.map((p, pIdx) => (
                        <div key={pIdx} className="w-12 h-12 glass rounded-lg relative overflow-hidden">
                          {p.preview ? <img src={p.preview} className="w-full h-full object-cover" /> : <Upload className="m-auto w-4 h-4 text-white/20" />}
                          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setActivities(prev => {
                            const n = [...prev];
                            n[aIdx].pics[pIdx] = { file: e.target.files![0], preview: URL.createObjectURL(e.target.files![0]) };
                            return n;
                          })} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dress Links */}
          <div className="glass p-8 rounded-[40px] space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif">Dress Links</h3>
              <button type="button" onClick={handleAddDress} className="text-xs text-emerald-400">+ Add Dress</button>
            </div>
            {dressLinks.map((dress, dIdx) => (
              <div key={dIdx} className="space-y-4 p-6 glass rounded-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="small-caps text-[10px]">Shop Link</label>
                    <input type="url" value={dress.link} onChange={(e) => {
                      const n = [...dressLinks];
                      n[dIdx].link = e.target.value;
                      setDressLinks(n);
                    }} className="w-full glass rounded-xl py-3 px-4" placeholder="https://shop.com/..." />
                  </div>
                  <div className="space-y-2">
                    <label className="small-caps text-[10px]">Pictures</label>
                    <div className="flex gap-2">
                      {dress.pics.map((p, pIdx) => (
                        <div key={pIdx} className="w-12 h-12 glass rounded-lg relative overflow-hidden">
                          {p.preview ? <img src={p.preview} className="w-full h-full object-cover" /> : <Upload className="m-auto w-4 h-4 text-white/20" />}
                          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setDressLinks(prev => {
                            const n = [...prev];
                            n[dIdx].pics[pIdx] = { file: e.target.files![0], preview: URL.createObjectURL(e.target.files![0]) };
                            return n;
                          })} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full py-6 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 transition-all">
            Submit Trip for Review
          </button>
        </form>
      </div>
    </div>
  );
};

const BecomeAdvisorForm = ({ onBack, onSubmit, initialData }: { onBack: () => void; onSubmit: (app: AdvisorApplication) => void; initialData?: { email?: string; password?: string } }) => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState(initialData?.password || '');
  const [aadharNo, setAadharNo] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(initialData?.email || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [passionLine, setPassionLine] = useState('');
  const [itinerary, setItinerary] = useState('');

  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');

  // Dynamic links state
  const [transportGoing, setTransportGoing] = useState('');
  const [transportComingBack, setTransportComingBack] = useState('');
  const [transportLinks, setTransportLinks] = useState<{ url: string; ticket: File | null; ticketPreview?: string; spent: string }[]>([{ url: '', ticket: null, spent: '' }]);
  const [hotelLinks, setHotelLinks] = useState<{ url: string; interior: File | null; exterior: File | null; interiorPreview?: string; exteriorPreview?: string; spent: string }[]>([{ url: '', interior: null, exterior: null, spent: '' }]);
  const [shopLinks, setShopLinks] = useState<{ url: string; dress: File | null; dressPreview?: string }[]>([{ url: '', dress: null }]);
  const [activityLinks, setActivityLinks] = useState<{ description: string; spent: string; image: File | null; preview?: string }[]>([{ description: '', spent: '', image: null }]);

  // Static pics state
  const [travelPics, setTravelPics] = useState<{ file: File | null; preview?: string }[]>([{ file: null }, { file: null }]);
  const [hotelCheckinPics, setHotelCheckinPics] = useState<{ file: File | null; preview?: string }[]>([{ file: null }, { file: null }]);

  const specialties = [
    "Budget-friendly itinerary planning",
    "Local food and cultural experiences",
    "Transportation hacks and booking tips",
    "Off-season travel recommendations",
    "Shoppable fashion for travelers"
  ];

  const handleAddTransport = () => setTransportLinks([...transportLinks, { url: '', ticket: null, spent: '' }]);
  const handleTransportChange = (index: number, field: string, value: any) => {
    const newLinks = [...transportLinks];
    if (field === 'ticket') {
      const file = value as File;
      const preview = URL.createObjectURL(file);
      newLinks[index] = { ...newLinks[index], ticket: file, ticketPreview: preview };
    } else {
      newLinks[index] = { ...newLinks[index], [field]: value };
    }
    setTransportLinks(newLinks);
  };

  const handleAddHotel = () => setHotelLinks([...hotelLinks, { url: '', interior: null, exterior: null, spent: '' }]);
  const handleHotelChange = (index: number, field: string, value: any) => {
    const newLinks = [...hotelLinks];
    if (field === 'interior' || field === 'exterior') {
      const file = value as File;
      const preview = URL.createObjectURL(file);
      newLinks[index] = { ...newLinks[index], [field]: file, [`${field}Preview`]: preview };
    } else {
      newLinks[index] = { ...newLinks[index], [field]: value };
    }
    setHotelLinks(newLinks);
  };

  const handleAddActivity = () => setActivityLinks([...activityLinks, { description: '', spent: '', image: null }]);
  const handleActivityChange = (index: number, field: string, value: any) => {
    const newLinks = [...activityLinks];
    if (field === 'image') {
      const file = value as File;
      const preview = URL.createObjectURL(file);
      newLinks[index] = { ...newLinks[index], image: file, preview };
    } else {
      newLinks[index] = { ...newLinks[index], [field]: value };
    }
    setActivityLinks(newLinks);
  };

  const handleAddShop = () => setShopLinks([...shopLinks, { url: '', dress: null }]);
  const handleShopChange = (index: number, field: string, value: any) => {
    const newLinks = [...shopLinks];
    if (field === 'dress') {
      const file = value as File;
      const preview = URL.createObjectURL(file);
      newLinks[index] = { ...newLinks[index], [field]: file, dressPreview: preview };
    } else {
      newLinks[index] = { ...newLinks[index], [field]: value };
    }
    setShopLinks(newLinks);
  };

  const handleStaticPicChange = (type: 'travel' | 'hotel', index: number, file: File) => {
    const preview = URL.createObjectURL(file);
    if (type === 'travel') {
      const newPics = [...travelPics];
      newPics[index] = { file, preview };
      setTravelPics(newPics);
    } else {
      const newPics = [...hotelCheckinPics];
      newPics[index] = { file, preview };
      setHotelCheckinPics(newPics);
    }
  };

  const handleFinalSubmit = async () => {
    const applicationData = {
      fullName,
      password,
      aadharNo,
      phone,
      email,
      specialties: selectedSpecialties,
      passionLine,
      travelPics: travelPics.map(p => p.preview || ''),
      hotelCheckinPics: hotelCheckinPics.map(p => p.preview || ''),
      itinerary,
      transportCharges: {
        going: transportGoing,
        comingBack: transportComingBack
      },
      transportLinks: transportLinks.map(l => ({ url: l.url, ticketPic: l.ticketPreview, spent: l.spent })),
      hotelLinks: hotelLinks.map(l => ({ url: l.url, interiorPic: l.interiorPreview, exteriorPic: l.exteriorPreview, spent: l.spent })),
      shopLinks: shopLinks.map(l => ({ url: l.url, dressPic: l.dressPreview })),
      activities: activityLinks.map(a => ({ description: a.description, spent: a.spent, image: a.preview })),
      socialLinks: {
        instagram,
        facebook,
        twitter
      },
      status: 'pending',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'applications'), applicationData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  if (submitted) {
    return (
      <section className="py-32 px-8 max-w-2xl mx-auto text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-[40px] p-12"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-serif mb-4">Application Received!</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Thank you for applying to become a TravelVibe Advisor. Our team will review your details and get back to you within 3-5 business days.
          </p>
          <button 
            onClick={onBack}
            className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all"
          >
            Back to Home
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="py-32 px-8 max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-12 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Home
      </button>

      <div className="mb-16">
        <span className="small-caps mb-4 block">Join our community</span>
        <h2 className="text-5xl font-serif mb-6">Become an Advisor</h2>
        <p className="text-white/40 max-w-2xl">
          Share your travel wisdom, curate unique experiences, and help others explore the world on a budget.
        </p>
      </div>

      <div className="glass rounded-[40px] p-8 md:p-12">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-white' : 'bg-white/10'}`} 
            />
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if(step < 3) setStep(step + 1); else handleFinalSubmit(); }} className="space-y-12">
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <h3 className="text-2xl font-serif">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="small-caps">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name" 
                    className="w-full glass rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="small-caps">Aadhar Card No</label>
                  <input 
                    required 
                    type="text" 
                    value={aadharNo}
                    onChange={(e) => setAadharNo(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX" 
                    className="w-full glass rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="small-caps">Phone Number</label>
                  <input 
                    required 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX" 
                    className="w-full glass rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="small-caps">Email ID</label>
                  <input 
                    required 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com" 
                    className="w-full glass rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                  />
                </div>
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-white/5">
                  <label className="small-caps">Social Media Links</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        type="text" 
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="Instagram"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="relative">
                      <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        type="text" 
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="Facebook"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="relative">
                      <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        type="text" 
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="Twitter"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <h3 className="text-2xl font-serif">Trip Details & Expertise</h3>
              
              <div className="space-y-4">
                <label className="small-caps">Specialties</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specialties.map((spec) => (
                    <label key={spec} className="flex items-center gap-3 glass p-4 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedSpecialties.includes(spec)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSpecialties([...selectedSpecialties, spec]);
                          else setSelectedSpecialties(selectedSpecialties.filter(s => s !== spec));
                        }}
                        className="w-5 h-5 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500" 
                      />
                      <span className="text-sm text-white/80">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="small-caps">One Passionate Line About Travelling</label>
                <input 
                  required 
                  type="text" 
                  value={passionLine}
                  onChange={(e) => setPassionLine(e.target.value)}
                  placeholder="What does travel mean to you?" 
                  className="w-full glass rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="small-caps">Mandatory Travel Pics (Nature Only)</label>
                  <div className="grid grid-cols-2 gap-4">
                    {travelPics.map((pic, i) => (
                      <div key={i} className="aspect-video glass rounded-2xl flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden">
                        {pic.preview ? (
                          <img src={pic.preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-colors" />
                            <span className="text-[10px] uppercase mt-2 text-white/20">{i === 0 ? 'Required' : 'Optional'}</span>
                          </>
                        )}
                        <input 
                          required={i === 0 && !pic.file} 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => e.target.files?.[0] && handleStaticPicChange('travel', i, e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="small-caps">Mandatory Hotel Check-in Pics</label>
                  <div className="grid grid-cols-2 gap-4">
                    {hotelCheckinPics.map((pic, i) => (
                      <div key={i} className="aspect-video glass rounded-2xl flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden">
                        {pic.preview ? (
                          <img src={pic.preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-colors" />
                            <span className="text-[10px] uppercase mt-2 text-white/20">{i === 0 ? 'Required' : 'Optional'}</span>
                          </>
                        )}
                        <input 
                          required={i === 0 && !pic.file} 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => e.target.files?.[0] && handleStaticPicChange('hotel', i, e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
            >
              <div className="space-y-8">
                <h3 className="text-2xl font-serif">Itinerary & Links</h3>
                <div className="space-y-2">
                  <label className="small-caps">Detailed Itinerary with Expenses</label>
                  <textarea 
                    required 
                    value={itinerary}
                    onChange={(e) => setItinerary(e.target.value)}
                    placeholder="Describe your trip from start to finish, including all expenses..." 
                    className="w-full glass rounded-2xl py-4 px-6 min-h-[200px] focus:outline-none focus:ring-2 ring-white/20 transition-all resize-none" 
                  />
                </div>
              </div>

              {/* Transport Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/40" />
                  <h3 className="text-2xl font-serif">Transport Charges</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="small-caps">Going Charge (Outbound)</label>
                    <input 
                      type="text" 
                      required
                      value={transportGoing}
                      onChange={(e) => setTransportGoing(e.target.value)}
                      placeholder="e.g. $120" 
                      className="w-full glass rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="small-caps">Coming Back Charge (Inbound)</label>
                    <input 
                      type="text" 
                      required
                      value={transportComingBack}
                      onChange={(e) => setTransportComingBack(e.target.value)}
                      placeholder="e.g. $120" 
                      className="w-full glass rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Transport Links */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-white/40" />
                    <label className="small-caps">Transport Links (Optional)</label>
                  </div>
                  <button type="button" onClick={handleAddTransport} className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors">+ Add Link</button>
                </div>
                <div className="space-y-6">
                  {transportLinks.map((transport, idx) => (
                    <div key={idx} className="glass p-6 rounded-[32px] space-y-4">
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1 w-full space-y-4">
                          <input 
                            type="url" 
                            value={transport.url}
                            onChange={(e) => handleTransportChange(idx, 'url', e.target.value)}
                            placeholder="RedBus / AbhiBus Link (Optional)" 
                            className="w-full glass rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                          />
                          <input 
                            type="text" 
                            value={transport.spent}
                            onChange={(e) => handleTransportChange(idx, 'spent', e.target.value)}
                            placeholder="Amount Spent on Travel (e.g. $150)" 
                            className="w-full glass rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                          />
                        </div>
                        <div className="w-full md:w-48">
                          <div className="aspect-video glass rounded-xl flex flex-col items-center justify-center border-dashed border border-white/10 relative overflow-hidden group">
                            {transport.ticketPreview ? (
                              <img src={transport.ticketPreview} alt="Ticket" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center">
                                <Upload className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                                <span className="text-[8px] uppercase mt-1 text-white/20">Ticket Slip</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleTransportChange(idx, 'ticket', e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hotel Links with Pics */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-white/40" />
                    <label className="small-caps">Hotel Links (MMT / Agoda / Airbnb)</label>
                  </div>
                  <button type="button" onClick={handleAddHotel} className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors">+ Add Hotel</button>
                </div>
                <div className="space-y-8">
                  {hotelLinks.map((hotel, idx) => (
                    <div key={idx} className="glass p-6 rounded-[32px] space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="url" 
                          value={hotel.url}
                          onChange={(e) => handleHotelChange(idx, 'url', e.target.value)}
                          placeholder="Hotel Booking Link" 
                          className="w-full glass rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                        />
                        <input 
                          type="text" 
                          value={hotel.spent}
                          onChange={(e) => handleHotelChange(idx, 'spent', e.target.value)}
                          placeholder="Amount Spent on Hotel (e.g. $400)" 
                          className="w-full glass rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40">Interior Pic</label>
                          <div className="aspect-video glass rounded-xl flex flex-col items-center justify-center border-dashed border border-white/10 relative overflow-hidden group">
                            {hotel.interiorPreview ? (
                              <img src={hotel.interiorPreview} alt="Interior" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <Upload className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                            )}
                            <input required type="file" accept="image/*" onChange={(e) => handleHotelChange(idx, 'interior', e.target.files?.[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40">Exterior Pic</label>
                          <div className="aspect-video glass rounded-xl flex flex-col items-center justify-center border-dashed border border-white/10 relative overflow-hidden group">
                            {hotel.exteriorPreview ? (
                              <img src={hotel.exteriorPreview} alt="Exterior" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <Upload className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                            )}
                            <input required type="file" accept="image/*" onChange={(e) => handleHotelChange(idx, 'exterior', e.target.files?.[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shopping Links with Dress Pics */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-white/40" />
                    <label className="small-caps">Dress Links (Amazon / Myntra / Nykaa)</label>
                  </div>
                  <button type="button" onClick={handleAddShop} className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors">+ Add Dress</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shopLinks.map((shop, idx) => (
                    <div key={idx} className="glass p-6 rounded-[32px] space-y-4">
                      <input 
                        type="url" 
                        value={shop.url}
                        onChange={(e) => handleShopChange(idx, 'url', e.target.value)}
                        placeholder="Shopping Link" 
                        className="w-full glass rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Dress Pic</label>
                        <div className="aspect-square glass rounded-xl flex flex-col items-center justify-center border-dashed border border-white/10 relative overflow-hidden group">
                          {shop.dressPreview ? (
                            <img src={shop.dressPreview} alt="Dress" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                          )}
                          <input required type="file" accept="image/*" onChange={(e) => handleShopChange(idx, 'dress', e.target.files?.[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities or Adventures Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-white/40" />
                    <label className="small-caps">Activities & Adventures (Optional)</label>
                  </div>
                  <button type="button" onClick={handleAddActivity} className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors">+ Add Activity</button>
                </div>
                <div className="space-y-6">
                  {activityLinks.map((activity, idx) => (
                    <div key={idx} className="glass p-6 rounded-[32px] space-y-4">
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1 w-full space-y-4">
                          <input 
                            type="text" 
                            value={activity.description}
                            onChange={(e) => handleActivityChange(idx, 'description', e.target.value)}
                            placeholder="What did you do? (e.g. Scuba Diving in Bali)" 
                            className="w-full glass rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                          />
                          <input 
                            type="text" 
                            value={activity.spent}
                            onChange={(e) => handleActivityChange(idx, 'spent', e.target.value)}
                            placeholder="Amount Spent on Activity (e.g. $80)" 
                            className="w-full glass rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 ring-white/20 transition-all" 
                          />
                        </div>
                        <div className="w-full md:w-32">
                          <div className="aspect-square glass rounded-xl flex flex-col items-center justify-center border-dashed border border-white/10 relative overflow-hidden group">
                            {activity.preview ? (
                              <img src={activity.preview} alt="Activity" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center">
                                <Upload className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                                <span className="text-[8px] uppercase mt-1 text-white/20">Pic</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleActivityChange(idx, 'image', e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/10">
                <label className="small-caps">Social Media Links</label>
                <p className="text-[10px] text-white/40 italic mb-4">TravelVibe will check instapics of respected trips for approval</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input type="url" placeholder="Instagram Profile" className="w-full glass rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 ring-white/20 transition-all" />
                  </div>
                  <div className="relative">
                    <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input type="url" placeholder="Twitter Profile" className="w-full glass rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 ring-white/20 transition-all" />
                  </div>
                  <div className="relative">
                    <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input type="url" placeholder="Facebook Profile" className="w-full glass rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 ring-white/20 transition-all" />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input type="url" placeholder="Personal Website / Blog" className="w-full glass rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:ring-2 ring-white/20 transition-all" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-between pt-8">
            {step > 1 && (
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-8 py-4 rounded-full glass font-semibold hover:bg-white/10 transition-all"
              >
                Previous
              </button>
            )}
            <button 
              type="submit"
              className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all ml-auto"
            >
              {step === 3 ? 'Submit Application' : (step === 1 ? 'Continue to Application' : 'Next Step')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

// --- Main App ---

export default function App() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [view, setView] = useState<'home' | 'explore' | 'advisor-form' | 'advisor-profile' | 'dashboard' | 'advisors-list' | 'advisor-login' | 'advisor-dashboard' | 'advisor-signup' | 'admin-dashboard' | 'add-trip'>('home');
  const [loggedInAdvisor, setLoggedInAdvisor] = useState<Advisor | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [advisorSignupInitialData, setAdvisorSignupInitialData] = useState<{ email?: string; password?: string } | undefined>(undefined);
  
  // Stateful data
  const [trips, setTrips] = useState<Trip[]>(FEATURED_TRIPS);
  const [stories, setStories] = useState<Story[]>(STORIES);
  const [advisors, setAdvisors] = useState<Advisor[]>(ADVISORS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<UserType>(MOCK_USER);
  const [advisorStatuses, setAdvisorStatuses] = useState<AdvisorStatusUpdate[]>([]);

  // Sync Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Check if user is an advisor
        const advisorDoc = await getDoc(doc(db, 'advisors', user.uid));
        if (advisorDoc.exists()) {
          setLoggedInAdvisor({ id: advisorDoc.id, ...advisorDoc.data() } as Advisor);
          if (view === 'advisor-login' || view === 'advisor-signup') {
            setView('advisor-dashboard');
          }
        }
        
        // Check if user is admin
        if (user.email === 'uzmabagavan2906@gmail.com') {
          // Admin specific logic if needed
        }
      } else {
        setLoggedInAdvisor(null);
      }
    });
    return () => unsubscribe();
  }, [view]);

  // Sync data from Firestore
  useEffect(() => {
    const qAdvisors = query(collection(db, 'advisors'));
    const unsubAdvisors = onSnapshot(qAdvisors, (snapshot) => {
      const dbAdvisors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advisor));
      setAdvisors([...ADVISORS, ...dbAdvisors]);
    });

    const qTrips = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
    const unsubTrips = onSnapshot(qTrips, (snapshot) => {
      const dbTrips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setTrips([...FEATURED_TRIPS, ...dbTrips]);
    });

    return () => {
      unsubAdvisors();
      unsubTrips();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAdvisorLogin = (advisor: Advisor) => {
    setLoggedInAdvisor(advisor);
    setView('advisor-dashboard');
  };

  const handleAdvisorSignupAttempt = async (email: string, password: string) => {
    try {
      // Check if advisor already exists
      const q = query(collection(db, 'advisors'), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        alert('An advisor account with this email already exists. Please log in.');
        setView('advisor-login');
      } else {
        // Check if application already exists
        const qApp = query(collection(db, 'applications'), where('email', '==', email));
        const appSnapshot = await getDocs(qApp);
        
        if (!appSnapshot.empty) {
          alert('You already have a pending application. Please wait for approval.');
          setView('advisor-login');
        } else {
          setAdvisorSignupInitialData({ email, password });
          setView('advisor-form');
        }
      }
    } catch (error) {
      console.error('Error checking advisor existence:', error);
    }
  };

  const handleAdvisorLogout = async () => {
    await signOut(auth);
    setLoggedInAdvisor(null);
    setView('home');
  };

  const handleBecomeAdvisorSubmit = (application: AdvisorApplication) => {
    console.log('Application submitted to uzmabagavan2906@gmail.com:', application);
    setView('advisor-login');
  };

  const handleNotifyMe = (advisorId: string, planningTripId?: string) => {
    const advisor = advisors.find(a => a.id === advisorId);
    
    if (planningTripId) {
      const isAlreadyNotified = user.notifiedPlanningTrips?.includes(planningTripId);
      if (isAlreadyNotified) {
        setUser(prev => ({
          ...prev,
          notifiedPlanningTrips: prev.notifiedPlanningTrips?.filter(id => id !== planningTripId)
        }));
        alert(`You will no longer receive notifications for this trip.`);
      } else {
        setUser(prev => ({
          ...prev,
          notifiedPlanningTrips: [...(prev.notifiedPlanningTrips || []), planningTripId]
        }));
        alert(`You will now be notified about updates for this trip!`);
      }
      return;
    }

    const isAlreadyNotified = user.notifiedAdvisors?.includes(advisorId);
    if (isAlreadyNotified) {
      setUser(prev => ({
        ...prev,
        notifiedAdvisors: prev.notifiedAdvisors?.filter(id => id !== advisorId)
      }));
      alert(`You will no longer receive notifications from ${advisor?.name}.`);
    } else {
      setUser(prev => ({
        ...prev,
        notifiedAdvisors: [...(prev.notifiedAdvisors || []), advisorId]
      }));
      alert(`You will now be notified when ${advisor?.name} posts an announcement or trip!`);
    }
  };

  const handleLikeStatus = (statusId: string) => {
    setAdvisorStatuses(prev => prev.map(s => s.id === statusId ? { ...s, likes: s.likes + 1 } : s));
  };

  const handleAddCommentToStatus = (statusId: string, text: string) => {
    const newComment = {
      user: user.name,
      text,
      timestamp: 'Just now'
    };
    setAdvisorStatuses(prev => prev.map(s => s.id === statusId ? { ...s, comments: [...s.comments, newComment] } : s));
  };

  const handleUpdateVisibility = (visibility: Advisor['visibility']) => {
    setAdvisors(prev => prev.map(a => a.id === loggedInAdvisor?.id ? { ...a, visibility } : a));
    setLoggedInAdvisor(prev => prev ? { ...prev, visibility } : null);
  };

  const triggerNotification = (advisorId: string, type: 'trip' | 'announcement', message: string) => {
    if (user.notifiedAdvisors?.includes(advisorId)) {
      const advisor = advisors.find(a => a.id === advisorId);
      const newNotification: Notification = {
        id: `n${Date.now()}`,
        advisorId,
        advisorName: advisor?.name || 'Advisor',
        advisorImage: advisor?.image || 'https://picsum.photos/seed/advisor/100/100',
        message,
        timestamp: 'Just now',
        type
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const handleUpdateTripTitle = (tripId: string, newTitle: string) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, title: newTitle } : t));
  };

  const handleAddTrip = (newTrip: Trip) => {
    setTrips(prev => [newTrip, ...prev]);
    triggerNotification(newTrip.advisorId, 'trip', `New trip posted: ${newTrip.title}`);
  };

  const handleAddStory = (newStory: Story) => {
    setStories(prev => [newStory, ...prev]);
    triggerNotification(newStory.advisorId, 'announcement', `New story posted!`);
  };

  return (
    <div className="min-h-screen">
      {view !== 'advisor-profile' && view !== 'advisor-login' && view !== 'advisor-dashboard' && view !== 'advisor-signup' && view !== 'admin-dashboard' && (
        <Navbar onScrollTo={scrollToSection} onNavigate={setView} currentView={view} user={firebaseUser} />
      )}
      
      <main>
        <NotificationToast 
          notifications={notifications} 
          onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
        />
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero Section */}
              <header id="hero" className="relative h-screen flex flex-col items-center justify-center text-center px-8 overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <img 
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop" 
                    alt="Hero" 
                    className="w-full h-full object-cover opacity-50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="relative z-10 max-w-5xl"
                >
                  <span className="small-caps mb-6 block">Curated by real travel advisors</span>
                  <h1 className="title-text mb-8">
                    Budget-friendly trips <br />
                    <span className="italic">curated for you.</span>
                  </h1>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => setView('explore')}
                      className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all flex items-center gap-2 group"
                    >
                      Explore Trips
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <button 
                      onClick={() => setView('advisor-login')}
                      className="px-8 py-4 rounded-full glass text-white font-semibold hover:bg-white/10 transition-all flex items-center gap-2 group"
                    >
                      Become an Advisor
                      <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    </button>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Scroll to discover</span>
                  <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
                </motion.div>
              </header>

              {/* Featured Trips */}
              <section id="discover" className="py-24 px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
                  <div className="max-w-xl">
                    <h2 className="text-4xl font-serif mb-4">Trending Escapes</h2>
                    <p className="text-white/40">Hand-picked itineraries from our top travel advisors, optimized for budget and experience.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {trips.slice(0, 3).map((trip) => (
                    <TripCard 
                      key={trip.id} 
                      trip={trip} 
                      onClick={() => setSelectedTrip(trip)} 
                    />
                  ))}
                  
                  {/* Placeholder for more trips */}
                  <div 
                    onClick={() => setView('explore')}
                    className="aspect-[3/4] rounded-3xl glass border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center p-8 group cursor-pointer hover:border-white/20 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6 text-white/40" />
                    </div>
                    <h4 className="font-medium mb-2">Discover More</h4>
                    <p className="text-xs text-white/40">Browse 500+ curated trips <br /> across 80 destinations</p>
                  </div>
                </div>
              </section>

              {/* AI Generator Section */}
              <div className="bg-white/5 border-y border-white/10">
                <ItineraryGenerator />
              </div>

              {/* Advisors Section */}
              <AdvisorsList 
                onSelectAdvisor={(advisor) => {
                  setSelectedAdvisor(advisor);
                  setView('advisor-profile');
                }} 
                onSeeMore={() => setView('advisors-list')}
              />

              {/* Shop Section */}
              <div className="bg-white/5 border-y border-white/10">
                <ShopList />
              </div>
            </motion.div>
          ) : view === 'explore' ? (
            <motion.div
              key="explore"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ExploreTrips onSelectTrip={setSelectedTrip} onBack={() => setView('home')} />
            </motion.div>
          ) : view === 'advisor-profile' && selectedAdvisor ? (
            <motion.div
              key="advisor-profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdvisorProfile 
                advisor={selectedAdvisor} 
                onBack={() => setView('home')} 
                onSelectTrip={setSelectedTrip}
                onNotifyMe={handleNotifyMe}
                user={user}
              />
            </motion.div>
          ) : view === 'advisor-form' ? (
            <motion.div
              key="advisor-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BecomeAdvisorForm 
                onBack={() => setView('home')} 
                onSubmit={handleBecomeAdvisorSubmit} 
                initialData={advisorSignupInitialData}
              />
            </motion.div>
          ) : view === 'admin-dashboard' ? (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard 
                onLogout={handleAdvisorLogout}
              />
            </motion.div>
          ) : view === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UserDashboard 
                user={MOCK_USER} 
                onBack={() => setView('home')} 
                onTripClick={setSelectedTrip} 
              />
            </motion.div>
          ) : view === 'advisors-list' ? (
            <motion.div
              key="advisors-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdvisorsListView 
                onSelectAdvisor={(advisor) => {
                  setSelectedAdvisor(advisor);
                  setView('advisor-profile');
                }} 
                onBack={() => setView('home')} 
                onStoryClick={(story) => {
                  const index = stories.findIndex(s => s.id === story.id);
                  setSelectedStoryIndex(index);
                }}
                stories={stories}
                advisors={advisors}
                statuses={advisorStatuses}
                onLikeStatus={handleLikeStatus}
                onAddCommentToStatus={handleAddCommentToStatus}
              />
            </motion.div>
          ) : view === 'advisor-login' ? (
            <motion.div
              key="advisor-login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdvisorLogin 
                onLogin={handleAdvisorLogin} 
                onSignup={() => setView('advisor-signup')}
                onGoHome={() => setView('home')}
              />
            </motion.div>
          ) : view === 'advisor-signup' ? (
            <motion.div
              key="advisor-signup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdvisorSignup 
                onSignupAttempt={handleAdvisorSignupAttempt}
                onBack={() => setView('advisor-login')}
                onGoHome={() => setView('home')}
              />
            </motion.div>
          ) : view === 'advisor-dashboard' && loggedInAdvisor ? (
            <motion.div
              key="advisor-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdvisorDashboard 
                advisor={loggedInAdvisor} 
                onLogout={handleAdvisorLogout}
                onUpdateTripTitle={handleUpdateTripTitle}
                onAddTrip={handleAddTrip}
                onAddStory={handleAddStory}
                onUpdateVisibility={handleUpdateVisibility}
                trips={trips}
              />
            </motion.div>
          ) : view === 'add-trip' && loggedInAdvisor ? (
            <motion.div
              key="add-trip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DetailedTripForm 
                advisor={loggedInAdvisor}
                onBack={() => setView('advisor-dashboard')}
                onSubmit={(trip) => {
                  console.log('Trip submitted:', trip);
                  setView('advisor-dashboard');
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Shop Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-[0.2em]">
              <ShoppingBag className="w-4 h-4" />
              <span>Travel Essentials</span>
            </div>
            <h2 className="text-5xl font-serif">The Shop</h2>
          </div>
          <button className="text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold flex items-center gap-2 group">
            View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {SHOP_ITEMS.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
            >
              <div className="aspect-square rounded-[32px] overflow-hidden mb-4 relative">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 px-2">
                <h3 className="text-sm font-medium truncate">{item.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-mono text-xs">{item.price}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-tighter">By {item.postedBy}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Compass className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-serif tracking-tight">TravelVibe</span>
            </div>
            <p className="text-white/40 max-w-sm">
              Empowering travelers to explore the world without breaking the bank. 
              Curated by experts, powered by AI.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholder */}
              {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full glass" />)}
            </div>
          </div>
          <div>
            <h5 className="small-caps mb-6">Explore</h5>
            <ul className="space-y-4 text-sm text-white/40">
              <li><a href="#" className="hover:text-white transition-colors">Trending Trips</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Top Advisors</a></li>
              <li><button onClick={() => setView('advisor-login')} className="hover:text-white transition-colors">Advisor Portal</button></li>
              <li><a href="#" className="hover:text-white transition-colors">Destinations</a></li>
            </ul>
          </div>
          <div>
            <h5 className="small-caps mb-6">Support</h5>
            <ul className="space-y-4 text-sm text-white/40">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><button onClick={() => setView('admin-dashboard')} className="hover:text-white transition-colors">Admin Portal</button></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest text-white/20">© 2026 TravelVibe. All rights reserved.</span>
          <span className="text-[10px] uppercase tracking-widest text-white/20 italic">Designed for the modern explorer.</span>
        </div>
      </footer>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedTrip && (
          <TripDetail 
            trip={selectedTrip} 
            onClose={() => setSelectedTrip(null)} 
          />
        )}
      </AnimatePresence>

      {/* Story Viewer Overlay */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <StoryViewer 
            stories={stories} 
            initialIndex={selectedStoryIndex} 
            onClose={() => setSelectedStoryIndex(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

