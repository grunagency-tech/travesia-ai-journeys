import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useUserLocation } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Share2, MapPin, Globe, Building2, Camera, Plane } from 'lucide-react';
import logoFull from '@/assets/logo-full.svg';

// Fix for default marker icon
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ProfileData {
  name: string | null;
  email: string;
  avatar_url: string | null;
  country: string | null;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { country, state, city, latitude, longitude, loading: locationLoading } = useUserLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tripsCount, setTripsCount] = useState(0);
  const [trips, setTrips] = useState<any[]>([]);
  const [countriesVisited, setCountriesVisited] = useState(0);
  const [citiesVisited, setCitiesVisited] = useState(0);

  const t = (key: string) => getTranslation(`profile.${key}`, language);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfileAndTrips = async () => {
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch trips
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tripsData) {
        setTrips(tripsData);
        setTripsCount(tripsData.length);
        
        // Calculate unique countries and cities
        const uniqueCountries = new Set(tripsData.map(t => t.destination.split(',').pop()?.trim()));
        const uniqueCities = new Set(tripsData.map(t => t.destination.split(',')[0]?.trim()));
        setCountriesVisited(uniqueCountries.size);
        setCitiesVisited(uniqueCities.size);
      }
    };

    fetchProfileAndTrips();
  }, [user]);

  const getInitials = () => {
    if (profile?.name) {
      return profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return profile?.name || user?.email?.split('@')[0] || 'Usuario';
  };

  const getUsername = () => {
    return '@' + (user?.email?.split('@')[0] || 'usuario');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logoFull} alt="travesIA" className="w-24 h-24 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const mapCenter: [number, number] = latitude && longitude 
    ? [latitude, longitude] 
    : [-12.0464, -77.0428]; // Default to Lima, Peru

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Profile Info */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-muted-foreground mb-4">{t('addProfilePhoto')}</p>
                
                {/* Name and Username */}
                <h1 className="text-xl font-semibold text-foreground">{getDisplayName()}</h1>
                <p className="text-sm text-muted-foreground mb-2">{getUsername()}</p>
                
                {/* Location */}
                {(city || state || country) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
                    <MapPin className="w-4 h-4" />
                    <span>{[city, state, country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-3 w-full">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Edit className="w-4 h-4" />
                    {t('edit')}
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Share2 className="w-4 h-4" />
                    {t('share')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Map and Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats and Map */}
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                {/* Stats Overlay */}
                <div className="absolute top-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{countriesVisited}</p>
                      <p className="text-xs text-muted-foreground uppercase">{t('countries')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{citiesVisited}</p>
                      <p className="text-xs text-muted-foreground uppercase">{t('citiesAndRegions')}</p>
                    </div>
                  </div>
                </div>
                
                {/* Add Places Button */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {t('addVisitedPlaces')}
                </Button>

                {/* Map */}
                <div className="h-[350px] w-full">
                  {!locationLoading && (
                    <MapContainer
                      center={mapCenter}
                      zoom={latitude && longitude ? 10 : 4}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                      className="z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {latitude && longitude && (
                        <Marker position={[latitude, longitude]} icon={customIcon}>
                          <Popup>
                            <div className="text-center">
                              <p className="font-semibold">{t('yourLocation')}</p>
                              <p className="text-sm text-muted-foreground">
                                {[city, state, country].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  )}
                  {locationLoading && (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">{t('loadingMap')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Travel Plans Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Plane className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">{t('travelPlans')}</h2>
                  <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full">
                    {tripsCount}
                  </span>
                </div>

                {trips.length > 0 ? (
                  <div className="space-y-3">
                    {trips.slice(0, 3).map((trip) => (
                      <Link 
                        key={trip.id} 
                        to={`/viaje/${trip.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{trip.title}</p>
                            <p className="text-sm text-muted-foreground">{trip.destination}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(trip.start_date).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                    {trips.length > 3 && (
                      <Link 
                        to="/mis-viajes"
                        className="block text-center text-sm text-primary hover:underline py-2"
                      >
                        {t('viewAllTrips')}
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t('noTripsYet')}</p>
                    <Button onClick={() => navigate('/crear-viaje')} className="gap-2">
                      <Plane className="w-4 h-4" />
                      {t('startPlanning')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
