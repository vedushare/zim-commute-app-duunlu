
export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
  createdAt: string;
}

export interface Ride {
  id: string;
  driverId: string;
  vehicleId: string;
  origin: string;
  destination: string;
  viaPoints: string[];
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  instantBook: boolean;
  ladiesOnly: boolean;
  acceptsParcels: boolean;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
    verificationLevel: string;
    homeCity?: string;
  };
  vehicle?: {
    make: string;
    model: string;
    color: string;
    year: number;
    licensePlate?: string;
  };
  bookingsCount?: number;
}

export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookingCode: string;
  createdAt: string;
  updatedAt: string;
  ride?: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    pricePerSeat: number;
    driver: {
      fullName: string;
      profilePhotoUrl?: string;
      phoneNumber?: string;
    };
    vehicle: {
      make: string;
      model: string;
    };
  };
}

export interface PriceCalculation {
  distance: number;
  suggestedPrice: number;
  pricePerKm: number;
}

export interface RideSearchParams {
  origin: string;
  destination: string;
  date: string;
  minPrice?: number;
  maxPrice?: number;
  departureTimeStart?: string;
  departureTimeEnd?: string;
  ladiesOnly?: boolean;
  verifiedDriversOnly?: boolean;
}
