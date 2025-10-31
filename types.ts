export type View = 'dashboard' | 'clothing' | 'customers' | 'rentals';

export interface ClothingItem {
  id: number;
  name: string;
  size: string;
  rentalPrice: number; // This will now be treated as price per day
  imageUrl: string;
  quantity: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface Rental {
  id: number;
  customerId: number;
  rentedItems: { itemId: number; quantity: number }[];
  rentalDate: string; // ISO string
  dueDate: string;   // ISO string
  returnDate?: string; // ISO string, optional
  totalPrice?: number; // Optional, calculated on return
  notes?: string;
  discountPercent?: number; // Discount percentage (e.g., 10 for 10%)
}
