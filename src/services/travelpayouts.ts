
interface FlightSearchParams {
    origin: string;
    destination: string;
    departure: string;
    returnDate?: string;
    one_way?: boolean;
    direct?: boolean;
    currency?: string;
}

const TOKEN = import.meta.env.VITE_TRAVELPAYOUTS_TOKEN;

export const getFlightPrices = async (params: FlightSearchParams) => {
    const url = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates');

    url.searchParams.append('origin', params.origin);
    url.searchParams.append('destination', params.destination);
    url.searchParams.append('departure_at', params.departure);

    if (params.returnDate && !params.one_way) {
        url.searchParams.append('return_at', params.returnDate);
    }

    url.searchParams.append('unique', 'false');
    url.searchParams.append('cy', params.currency || 'usd'); // dynamic currency default to usd
    url.searchParams.append('one_way', String(params.one_way ?? false));
    url.searchParams.append('direct', String(params.direct ?? false));
    url.searchParams.append('token', TOKEN);
    url.searchParams.append('sorting', 'price');
    url.searchParams.append('limit', '30');

    console.log('Fetching flights from:', url.toString());

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`TravelPayouts API Error: ${response.status}`);
        }

        const json = await response.json();
        // The API usually returns { success: true, data: [...] }
        const flights = Array.isArray(json) ? json : json.data;

        if (!Array.isArray(flights)) return [];

        return flights.map((flight: any) => ({
            ...flight,
            // API returns relative link like "/search/...", we need absolute
            link: flight.link
                ? `https://www.aviasales.com${flight.link}`
                : generateAviasalesLink({
                    origin: params.origin,
                    destination: params.destination,
                    departure: flight.departure_at ? flight.departure_at.split('T')[0] : params.departure,
                    returnDate: params.returnDate,
                    one_way: params.one_way
                })
        }));
    } catch (error) {
        console.error('Error fetching flights:', error);
        return [];
    }
}

export const generateAviasalesLink = (params: FlightSearchParams): string => {
    const formatDatePart = (dateStr: string) => {
        // Fix timezone issue by splitting string "YYYY-MM-DD"
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        if (!day || !month) return ''; // fallback safety
        return `${day}${month}`;
    };

    const origin = params.origin;
    const depDate = formatDatePart(params.departure);
    const dest = params.destination;

    let link = `https://www.aviasales.com/search/${origin}${depDate}${dest}`;

    if (params.returnDate && !params.one_way) {
        const retDate = formatDatePart(params.returnDate);
        link += `${retDate}`;
    }

    link += '1'; // Default 1 passenger

    return link;
};
