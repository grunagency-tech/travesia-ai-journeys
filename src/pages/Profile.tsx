import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useUserLocation } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Share2, MapPin, Camera, Plane, Loader2 } from 'lucide-react';
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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tripsCount, setTripsCount] = useState(0);
  const [trips, setTrips] = useState<any[]>([]);
  const [countriesVisited, setCountriesVisited] = useState(0);
  const [citiesVisited, setCitiesVisited] = useState(0);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
        setEditName(profileData.name || '');
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

  const handleOpenEditModal = () => {
    setEditName(profile?.name || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ name: editName.trim() })
      .eq('id', user.id);
    
    if (error) {
      toast({
        title: 'Error',
        description: t('saveError'),
        variant: 'destructive',
      });
    } else {
      setProfile(prev => prev ? { ...prev, name: editName.trim() } : null);
      toast({
        title: t('saved'),
        description: t('profileUpdated'),
      });
      setIsEditModalOpen(false);
    }
    
    setIsSaving(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: t('invalidImageType'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: t('imageTooLarge'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      toast({
        title: t('photoUpdated'),
        description: t('photoUpdatedDesc'),
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: t('uploadError'),
        variant: 'destructive',
      });
    }

    setIsUploadingPhoto(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${t('checkMyProfile')} ${getDisplayName()} - travesIA`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'travesIA',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('linkCopied'),
        description: t('linkCopiedDesc'),
      });
    }
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
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32 lg:pt-36">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Left Panel - Profile Info */}
          <Card className="lg:col-span-1 h-fit border-border/50 shadow-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-5">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-28 h-28 border-4 border-background shadow-lg ring-2 ring-border/30">
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute -bottom-1 -right-1 p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">{t('addProfilePhoto')}</p>
                
                {/* Name and Username */}
                <div className="space-y-1">
                  <h1 className="text-xl font-semibold text-foreground">{getDisplayName()}</h1>
                  <p className="text-sm text-muted-foreground">{getUsername()}</p>
                </div>
                
                {/* Location */}
                {(city || state || country) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-center">{[city, state, country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-3 w-full pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={handleOpenEditModal}
                  >
                    <Edit className="w-4 h-4" />
                    {t('edit')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={handleShare}
                  >
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
            <Card className="overflow-hidden border-border/50 shadow-sm">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Stats Overlay */}
                  <div className="absolute top-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-xl px-4 py-3 lg:px-5 lg:py-4 shadow-lg border border-border/50">
                    <div className="flex gap-6 lg:gap-8">
                      <div className="text-center">
                        <p className="text-xl lg:text-2xl font-bold text-foreground">{countriesVisited}</p>
                        <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wide">{t('countries')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl lg:text-2xl font-bold text-foreground">{citiesVisited}</p>
                        <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wide">{t('citiesAndRegions')}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Places Button - Desktop only */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm border-border/50 hidden lg:flex"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {t('addVisitedPlaces')}
                  </Button>

                  {/* Map */}
                  <div className="h-[280px] lg:h-[380px] w-full">
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
                </div>
                
                {/* Add Places Button - Mobile only */}
                <div className="p-4 lg:hidden border-t border-border/50">
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {t('addVisitedPlaces')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Travel Plans Section */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Plane className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">{t('travelPlans')}</h2>
                  <span className="bg-primary/10 text-primary text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {tripsCount}
                  </span>
                </div>

                {trips.length > 0 ? (
                  <div className="space-y-2">
                    {trips.slice(0, 3).map((trip) => (
                      <Link 
                        key={trip.id} 
                        to={`/viaje/${trip.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{trip.title}</p>
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
                        className="block text-center text-sm text-primary hover:underline py-3"
                      >
                        {t('viewAllTrips')}
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10">
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

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editProfile')}</DialogTitle>
            <DialogDescription>{t('editProfileDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t('enterName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">{t('emailCantChange')}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                t('saveChanges')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
