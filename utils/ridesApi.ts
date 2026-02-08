
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from './api';
import { Vehicle, Ride, Booking, PriceCalculation, RideSearchParams } from '@/types/rides';

// Vehicle Management
export async function createVehicle(data: {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
}): Promise<Vehicle> {
  console.log('Creating vehicle:', data);
  return authenticatedPost('/api/vehicles', data);
}

export async function getVehicles(): Promise<Vehicle[]> {
  console.log('Fetching user vehicles');
  return authenticatedGet('/api/vehicles');
}

export async function deleteVehicle(vehicleId: string): Promise<{ success: boolean }> {
  console.log('Deleting vehicle:', vehicleId);
  return authenticatedDelete(`/api/vehicles/${vehicleId}`);
}

// Ride Management (Driver)
export async function createRide(data: {
  vehicleId: string;
  origin: string;
  destination: string;
  viaPoints: string[];
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  pricePerSeat: number;
  instantBook: boolean;
  ladiesOnly: boolean;
  acceptsParcels: boolean;
}): Promise<Ride> {
  console.log('Creating ride:', data);
  return authenticatedPost('/api/rides', data);
}

export async function getMyRides(): Promise<Ride[]> {
  console.log('Fetching driver rides');
  return authenticatedGet('/api/rides/my-rides');
}

export async function updateRide(
  rideId: string,
  data: {
    departureTime?: string;
    arrivalTime?: string;
    pricePerSeat?: number;
    instantBook?: boolean;
    ladiesOnly?: boolean;
    acceptsParcels?: boolean;
  }
): Promise<Ride> {
  console.log('Updating ride:', rideId, data);
  return authenticatedPut(`/api/rides/${rideId}`, data);
}

export async function cancelRide(rideId: string): Promise<{ success: boolean }> {
  console.log('Cancelling ride:', rideId);
  return authenticatedDelete(`/api/rides/${rideId}`);
}

// Ride Search (Passenger)
export async function searchRides(params: RideSearchParams): Promise<Ride[]> {
  console.log('Searching rides:', params);
  const queryParams = new URLSearchParams();
  
  queryParams.append('origin', params.origin);
  queryParams.append('destination', params.destination);
  queryParams.append('date', params.date);
  
  if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.departureTimeStart) queryParams.append('departureTimeStart', params.departureTimeStart);
  if (params.departureTimeEnd) queryParams.append('departureTimeEnd', params.departureTimeEnd);
  if (params.ladiesOnly !== undefined) queryParams.append('ladiesOnly', params.ladiesOnly.toString());
  if (params.verifiedDriversOnly !== undefined) queryParams.append('verifiedDriversOnly', params.verifiedDriversOnly.toString());
  
  return authenticatedGet(`/api/rides/search?${queryParams.toString()}`);
}

export async function getRideDetails(rideId: string): Promise<Ride> {
  console.log('Fetching ride details:', rideId);
  return authenticatedGet(`/api/rides/${rideId}`);
}

// Booking Management
export async function createBooking(data: {
  rideId: string;
  seatsBooked: number;
}): Promise<Booking> {
  console.log('Creating booking:', data);
  return authenticatedPost('/api/bookings', data);
}

export async function getMyBookings(): Promise<Booking[]> {
  console.log('Fetching passenger bookings');
  return authenticatedGet('/api/bookings/my-bookings');
}

export async function cancelBooking(bookingId: string): Promise<{ success: boolean }> {
  console.log('Cancelling booking:', bookingId);
  return authenticatedPut(`/api/bookings/${bookingId}/cancel`, {});
}

export async function confirmBooking(bookingId: string): Promise<{ success: boolean }> {
  console.log('Confirming booking:', bookingId);
  return authenticatedPut(`/api/bookings/${bookingId}/confirm`, {});
}

// Price Calculator
export async function calculatePrice(origin: string, destination: string): Promise<PriceCalculation> {
  console.log('Calculating price:', origin, destination);
  const queryParams = new URLSearchParams({ origin, destination });
  return authenticatedGet(`/api/rides/calculate-price?${queryParams.toString()}`);
}
