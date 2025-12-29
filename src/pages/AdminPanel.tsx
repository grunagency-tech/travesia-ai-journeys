import { useEffect, useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Users, 
  Map, 
  MessageSquare, 
  BarChart3, 
  ArrowLeft,
  Loader2,
  Shield,
  Calendar,
  Mail,
  Globe,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  country: string | null;
  created_at: string;
}

interface Trip {
  id: string;
  user_id: string;
  title: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number | null;
  created_at: string;
  profiles?: { email: string; name: string | null } | null;
}

interface Stats {
  totalUsers: number;
  totalTrips: number;
  totalConversations: number;
  tripsThisMonth: number;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const dateLocale = language === 'ES' ? es : enUS;

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTrips: 0,
    totalConversations: 0,
    tripsThisMonth: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  // Calculate chart data
  const chartData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(now) });

    // Users by month
    const usersByMonth = months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const count = profiles.filter((p) => {
        const createdAt = new Date(p.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;
      return {
        month: format(month, 'MMM', { locale: dateLocale }),
        usuarios: count,
      };
    });

    // Trips by month
    const tripsByMonth = months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const count = trips.filter((t) => {
        const createdAt = new Date(t.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;
      return {
        month: format(month, 'MMM', { locale: dateLocale }),
        viajes: count,
      };
    });

    // Combined data for line chart
    const combinedByMonth = months.map((month, index) => ({
      month: format(month, 'MMM', { locale: dateLocale }),
      usuarios: usersByMonth[index].usuarios,
      viajes: tripsByMonth[index].viajes,
    }));

    // Top destinations
    const destinationCounts: Record<string, number> = {};
    trips.forEach((trip) => {
      const dest = trip.destination;
      destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
    });
    const topDestinations = Object.entries(destinationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    // Users by country
    const countryCounts: Record<string, number> = {};
    profiles.forEach((profile) => {
      const country = profile.country || 'Sin país';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    const usersByCountry = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    return { usersByMonth, tripsByMonth, combinedByMonth, topDestinations, usersByCountry };
  }, [profiles, trips, dateLocale]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
      setCheckingRole(false);
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  // Fetch all data if admin
  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;

      setLoadingData(true);

      try {
        // Fetch profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        // Fetch trips with user info
        const { data: tripsData } = await supabase
          .from('trips')
          .select('*, profiles:user_id(email, name)')
          .order('created_at', { ascending: false });

        // Fetch conversations count
        const { count: conversationsCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true });

        // Calculate stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const tripsThisMonth = tripsData?.filter(
          (trip) => new Date(trip.created_at) >= startOfMonth
        ).length || 0;

        setProfiles(profilesData || []);
        setTrips(tripsData || []);
        setStats({
          totalUsers: profilesData?.length || 0,
          totalTrips: tripsData?.length || 0,
          totalConversations: conversationsCount || 0,
          tripsThisMonth,
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Show loading state
  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Shield className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-6">No tienes permisos para acceder a esta página.</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Panel de Administración
              </h1>
              <p className="text-sm text-muted-foreground">Gestiona toda la información de la plataforma</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Admin
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usuarios Totales
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Viajes Creados
              </CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrips}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversaciones
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConversations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Viajes Este Mes
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tripsThisMonth}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Crecimiento Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.combinedByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="usuarios" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
                    <Line type="monotone" dataKey="viajes" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Destinations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Destinos Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : chartData.topDestinations.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  No hay datos de destinos
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.topDestinations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Users by Country */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Usuarios por País
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : chartData.usersByCountry.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  No hay datos de países
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData.usersByCountry}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.usersByCountry.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Trips by Month Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Viajes por Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.tripsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="viajes" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="trips" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Viajes
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>País</TableHead>
                          <TableHead>Fecha de Registro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No hay usuarios registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          profiles.map((profile) => (
                            <TableRow key={profile.id}>
                              <TableCell className="font-medium">
                                {profile.name || 'Sin nombre'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  {profile.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                {profile.country ? (
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    {profile.country}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {format(new Date(profile.created_at), 'dd MMM yyyy', { locale: dateLocale })}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <CardTitle>Todos los Viajes</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Origen → Destino</TableHead>
                          <TableHead>Fechas</TableHead>
                          <TableHead>Viajeros</TableHead>
                          <TableHead>Presupuesto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trips.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No hay viajes registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          trips.map((trip) => (
                            <TableRow key={trip.id}>
                              <TableCell className="font-medium">{trip.title}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{trip.profiles?.name || 'Sin nombre'}</div>
                                  <div className="text-muted-foreground text-xs">
                                    {trip.profiles?.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {trip.origin} → {trip.destination}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(new Date(trip.start_date), 'dd MMM', { locale: dateLocale })} - {format(new Date(trip.end_date), 'dd MMM yyyy', { locale: dateLocale })}
                                </div>
                              </TableCell>
                              <TableCell>{trip.travelers}</TableCell>
                              <TableCell>
                                {trip.budget ? `$${trip.budget.toLocaleString()}` : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
