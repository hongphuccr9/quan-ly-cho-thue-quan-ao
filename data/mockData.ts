import type { ClothingItem, Customer, Rental } from '../types';

const _mockClothingItems: ClothingItem[] = [
  { id: 1, name: 'Váy Dạ Hội', size: 'M', rentalPrice: 50000, imageUrl: 'https://picsum.photos/seed/gown/400/600', quantity: 5 },
  { id: 2, name: 'Áo Tuxedo', size: 'L', rentalPrice: 75000, imageUrl: 'https://picsum.photos/seed/tuxedo/400/600', quantity: 3 },
  { id: 3, name: 'Váy Cocktail', size: 'S', rentalPrice: 40000, imageUrl: 'https://picsum.photos/seed/cocktail/400/600', quantity: 7 },
  { id: 4, name: 'Váy Mùa Hè', size: 'M', rentalPrice: 30000, imageUrl: 'https://picsum.photos/seed/summer/400/600', quantity: 10 },
  { id: 5, name: 'Bộ Suit Công Sở', size: 'XL', rentalPrice: 65000, imageUrl: 'https://picsum.photos/seed/suit/400/600', quantity: 4 },
  { id: 6, name: 'Áo Khoác Vintage', size: 'L', rentalPrice: 45000, imageUrl: 'https://picsum.photos/seed/jacket/400/600', quantity: 6 },
];

const _mockCustomers: Customer[] = [
  { id: 1, name: 'Nguyễn Thị An', phone: '090-111-2222', address: '123 Đường Lê Lợi, Quận 1, TP. HCM' },
  { id: 2, name: 'Trần Văn Bình', phone: '091-333-4444', address: '456 Đường Nguyễn Huệ, Quận 3, TP. HCM' },
  { id: 3, name: 'Lê Thị Cẩm', phone: '098-555-6666', address: '789 Đường Pasteur, Quận 1, TP. Đà Nẵng' },
  { id: 4, name: 'Phạm Văn Dũng', phone: '093-777-8888', address: '101 Đường Võ Văn Tần, Quận 3, TP. HCM' },
  { id: 5, name: 'Hoàng Thị Mai', phone: '094-999-0000', address: '212 Đường Lý Thường Kiệt, Quận 10, TP. Hà Nội' },
  { id: 6, name: 'Vũ Minh Tuấn', phone: '097-123-4567', address: '333 Đường Trần Hưng Đạo, Quận 5, TP. HCM' },
  { id: 7, name: 'Đặng Thu Hà', phone: '096-888-9999', address: '555 Đường Hai Bà Trưng, Quận 1, TP. Hải Phòng' },
  { id: 8, name: 'Bùi Anh Khoa', phone: '092-222-3333', address: '444 Đường Nguyễn Văn Cừ, Quận Long Biên, TP. Hà Nội' },
];

const today = new Date();
const daysAgo = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

const _resetMockRentals: Rental[] = [
  // Active rentals - no total price yet
  { id: 1, customerId: 1, rentedItems: [{ itemId: 1, quantity: 1 }], rentalDate: daysAgo(5).toISOString(), dueDate: daysFromNow(2).toISOString(), notes: 'Khách hàng yêu cầu giao hàng tận nơi.' },
  { id: 2, customerId: 2, rentedItems: [{ itemId: 2, quantity: 1 }, { itemId: 5, quantity: 1 }], rentalDate: daysAgo(2).toISOString(), dueDate: daysFromNow(5).toISOString() },
  
  // Completed rentals - with calculated total price
  { id: 3, customerId: 3, rentedItems: [{ itemId: 3, quantity: 1 }], rentalDate: daysAgo(10).toISOString(), dueDate: daysAgo(3).toISOString(), returnDate: daysAgo(2).toISOString(), totalPrice: 320000, notes: 'Trả đồ có vết bẩn nhỏ, đã xử lý.' }, // 8 days * 40000
  { id: 4, customerId: 1, rentedItems: [{ itemId: 4, quantity: 1 }], rentalDate: daysAgo(40).toISOString(), dueDate: daysAgo(33).toISOString(), returnDate: daysAgo(32).toISOString(), totalPrice: 240000 }, // 8 days * 30000
  { id: 5, customerId: 2, rentedItems: [{ itemId: 6, quantity: 1 }], rentalDate: daysAgo(80).toISOString(), dueDate: daysAgo(73).toISOString(), returnDate: daysAgo(71).toISOString(), totalPrice: 405000 }, // 9 days * 45000
  { id: 6, customerId: 3, rentedItems: [{ itemId: 1, quantity: 1 }], rentalDate: daysAgo(35).toISOString(), dueDate: daysAgo(28).toISOString(), returnDate: daysAgo(28).toISOString(), totalPrice: 350000, notes: 'Khách hàng quen, giảm giá 10% (đã áp dụng).' }, // 7 days * 50000
];

// --- Generate more data for the last 6 months ---

const generateInitialRentals = (): Rental[] => {
  const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const clothingItemsMap = new Map(_mockClothingItems.map(item => [item.id, item]));
  let nextRentalId = Math.max(..._resetMockRentals.map(r => r.id)) + 1;

  const newRentals: Rental[] = [];

  // Generate ~50 new rentals over the last 6 months
  for (let i = 0; i < 50; i++) {
    const customerId = _mockCustomers[getRandomInt(0, _mockCustomers.length - 1)].id;
    
    const numItems = getRandomInt(1, 2);
    const rentedItems: { itemId: number; quantity: number }[] = [];
    const availableItems = [..._mockClothingItems];
    while (rentedItems.length < numItems && availableItems.length > 0) {
      const randomIndex = getRandomInt(0, availableItems.length - 1);
      rentedItems.push({ itemId: availableItems[randomIndex].id, quantity: 1 });
      availableItems.splice(randomIndex, 1);
    }

    const rentalDateDaysAgo = getRandomInt(1, 180);
    const rentalDate = daysAgo(rentalDateDaysAgo);
    const rentalDuration = getRandomInt(5, 15);
    const dueDate = new Date(rentalDate.getTime() + rentalDuration * 24 * 60 * 60 * 1000);

    // If the rental started more than 10 days ago, assume it's completed
    if (rentalDateDaysAgo > 10) {
      const returnDelay = getRandomInt(-2, 4); 
      const returnDate = new Date(dueDate.getTime() + returnDelay * 24 * 60 * 60 * 1000);
      
      if (returnDate > today) continue; 

      const dailyRate = rentedItems.reduce((acc, rentedItem) => {
          const item = clothingItemsMap.get(rentedItem.itemId);
          return acc + (item?.rentalPrice || 0) * rentedItem.quantity;
      }, 0);
      
      const daysRented = Math.max(1, Math.ceil((returnDate.getTime() - rentalDate.getTime()) / (1000 * 3600 * 24)));
      const totalPrice = daysRented * dailyRate;

      newRentals.push({
        id: nextRentalId++,
        customerId,
        rentedItems,
        rentalDate: rentalDate.toISOString(),
        dueDate: dueDate.toISOString(),
        returnDate: returnDate.toISOString(),
        totalPrice: Math.round(totalPrice / 1000) * 1000,
      });
    } else { // Active rental
      newRentals.push({
        id: nextRentalId++,
        customerId,
        rentedItems,
        rentalDate: rentalDate.toISOString(),
        dueDate: dueDate.toISOString(),
      });
    }
  }
  return [..._resetMockRentals, ...newRentals];
}

const _initialMockRentals = generateInitialRentals();

// Using JSON.parse(JSON.stringify(...)) for a deep copy to prevent any mutation of the source data.
export const getClothingItems = (): ClothingItem[] => JSON.parse(JSON.stringify(_mockClothingItems));
export const getCustomers = (): Customer[] => JSON.parse(JSON.stringify(_mockCustomers));
export const getInitialRentals = (): Rental[] => JSON.parse(JSON.stringify(_initialMockRentals));
export const getResetRentals = (): Rental[] => JSON.parse(JSON.stringify(_resetMockRentals));
