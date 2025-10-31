import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClothingPage } from './components/ClothingPage';
import { CustomersPage } from './components/CustomersPage';
import { RentalsPage } from './components/RentalsPage';
import { getClothingItems, getCustomers, getInitialRentals, getResetRentals } from './data/mockData';
import type { View, ClothingItem, Customer, Rental } from './types';
import { MenuIcon } from './components/icons/MenuIcon';
// FIX: 'parseISO' is not a top-level export, importing from its own module path.
import { differenceInCalendarDays } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

const viewTitles: Record<View, string> = {
  dashboard: 'Bảng Điều Khiển',
  clothing: 'Quản Lý Quần Áo',
  customers: 'Khách Hàng',
  rentals: 'Quản Lý Lượt Thuê'
};


const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>(getClothingItems());
  const [customers, setCustomers] = useState<Customer[]>(getCustomers());
  const [rentals, setRentals] = useState<Rental[]>(getInitialRentals());
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const activeRentals = useMemo(() => rentals.filter(r => !r.returnDate), [rentals]);
  
  const rentedItemCounts = useMemo(() => {
    const counts = new Map<number, number>();
    activeRentals.forEach(rental => {
        rental.rentedItems.forEach(({ itemId, quantity }) => {
            counts.set(itemId, (counts.get(itemId) || 0) + quantity);
        });
    });
    return counts;
  }, [activeRentals]);

  const addClothingItem = (item: Omit<ClothingItem, 'id'>) => {
    setClothingItems(prev => [...prev, { ...item, id: Date.now() }]);
  };

  const updateClothingItem = (itemToUpdate: ClothingItem) => {
    setClothingItems(prev => prev.map(item => item.id === itemToUpdate.id ? itemToUpdate : item));
  };

  const deleteClothingItem = (itemId: number) => {
    setClothingItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addCustomer = (customer: Omit<Customer, 'id'>): Customer => {
    const newCustomer = { ...customer, id: Date.now() };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (customerToUpdate: Customer) => {
    setCustomers(prev => prev.map(customer => customer.id === customerToUpdate.id ? customerToUpdate : customer));
  };

  const deleteCustomer = (customerId: number): boolean => {
    const hasRentals = rentals.some(r => r.customerId === customerId);
    if (hasRentals) {
      // The component will now handle displaying the error message.
      return false;
    }
    setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    return true;
  };

  const addRental = (rental: Omit<Rental, 'id' | 'totalPrice'>) => {
    setRentals(prev => [...prev, { ...rental, id: Date.now() }]);
  };

  const returnRental = (rentalId: number): Rental | undefined => {
    let updatedRental: Rental | undefined;
    setRentals(prev => prev.map(r => {
      if (r.id === rentalId) {
        const returnDate = new Date();
        const rentalDate = parseISO(r.rentalDate);
        
        const daysRented = differenceInCalendarDays(returnDate, rentalDate) + 1;
        const totalDays = Math.max(1, daysRented); // Minimum 1 day rental

        const dailyRate = r.rentedItems.reduce((acc, rentedItem) => {
            const item = clothingItems.find(c => c.id === rentedItem.itemId);
            return acc + (item?.rentalPrice || 0) * rentedItem.quantity;
        }, 0);
        
        const grossPrice = totalDays * dailyRate;
        const discount = r.discountPercent || 0;
        const discountAmount = grossPrice * (discount / 100);
        const totalPrice = grossPrice - discountAmount;

        const newRentalData = { ...r, returnDate: returnDate.toISOString(), totalPrice: Math.round(totalPrice) };
        updatedRental = newRentalData;
        return newRentalData;
      }
      return r;
    }));
    return updatedRental;
  };

  const deleteRental = (rentalId: number) => {
    setRentals(prev => prev.filter(r => r.id !== rentalId));
  };

  const handleResetAllData = () => {
    setClothingItems([]);
    setCustomers([]);
    setRentals([]);
  };
  
  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard clothingItems={clothingItems} customers={customers} rentals={rentals} rentedItemCounts={rentedItemCounts}/>;
      case 'clothing':
        return <ClothingPage clothingItems={clothingItems} addClothingItem={addClothingItem} rentedItemCounts={rentedItemCounts} updateClothingItem={updateClothingItem} deleteClothingItem={deleteClothingItem} />;
      case 'customers':
        return <CustomersPage customers={customers} addCustomer={addCustomer} rentals={rentals} clothingItems={clothingItems} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} />;
      case 'rentals':
        return <RentalsPage rentals={rentals} customers={customers} clothingItems={clothingItems} returnRental={returnRental} addRental={addRental} addCustomer={addCustomer} rentedItemCounts={rentedItemCounts} deleteRental={deleteRental} />;
      default:
        return <Dashboard clothingItems={clothingItems} customers={customers} rentals={rentals} rentedItemCounts={rentedItemCounts} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      <Sidebar view={view} setView={setView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} onAdminReset={handleResetAllData} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:justify-end">
           <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
             <MenuIcon className="h-6 w-6" />
           </button>
          <h1 className="text-xl font-semibold capitalize md:hidden">{viewTitles[view]}</h1>
          <div className="w-10 h-10"></div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
