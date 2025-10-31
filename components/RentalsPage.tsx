import React, { useState, useMemo } from 'react';
import type { Rental, Customer, ClothingItem } from '../types';
import { Card } from './shared/Card';
import { Modal } from './shared/Modal';
import { InvoiceModal } from './InvoiceModal';
// FIX: 'parseISO' is not a top-level export, importing from its own module path.
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { exportToCSV } from '../utils/export';
import { ExportIcon } from './icons/ExportIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ActiveRentalDetailModal } from './ActiveRentalDetailModal';
import { TrashIcon } from './icons/TrashIcon';

interface RentalsPageProps {
  rentals: Rental[];
  customers: Customer[];
  clothingItems: ClothingItem[];
  returnRental: (rentalId: number) => Rental | undefined;
  addRental: (rental: Omit<Rental, 'id' | 'totalPrice'>) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  rentedItemCounts: Map<number, number>;
  deleteRental: (rentalId: number) => void;
}

interface RentalRowProps {
    rental: Rental;
    customer?: Customer;
    clothingMap: Map<number, ClothingItem>;
    onInitiateReturn?: (rental: Rental) => void;
    onShowInvoice?: (rental: Rental) => void;
    onDelete?: (rental: Rental) => void;
}

const RentalRow: React.FC<RentalRowProps> = ({rental, customer, clothingMap, onInitiateReturn, onShowInvoice, onDelete}) => {
    const isOverdue = !rental.returnDate && new Date() > parseISO(rental.dueDate);
    const isCompleted = !!rental.returnDate;

    const handleRowClick = () => {
        if (!isCompleted && onInitiateReturn) {
            onInitiateReturn(rental);
        } else if (isCompleted && onShowInvoice) {
            onShowInvoice(rental);
        }
    };
    
    const itemsRentedString = rental.rentedItems.map(({ itemId, quantity }) => {
        const item = clothingMap.get(itemId);
        return `${item?.name || 'Unknown'} (x${quantity})`;
    }).join(', ');


    const rowClasses = [
        isOverdue ? "bg-red-50 dark:bg-red-900/20" : "",
        (onInitiateReturn || onShowInvoice) ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150" : ""
    ].filter(Boolean).join(" ");


    return (
        <tr onClick={handleRowClick} className={rowClasses}>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer?.name || 'Unknown'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
            {itemsRentedString}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{format(parseISO(rental.rentalDate), 'dd/MM/yyyy')}</td>
          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500 dark:text-gray-300'}`}>{format(parseISO(rental.dueDate), 'dd/MM/yyyy')}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
            {rental.returnDate ? format(parseISO(rental.returnDate), 'dd/MM/yyyy') : 'Chưa trả'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate" title={rental.notes}>{rental.notes || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
             <div className="flex items-center">
                <span>{rental.totalPrice ? rental.totalPrice.toLocaleString('vi-VN', {style: 'currency', currency: 'VND'}) : 'N/A'}</span>
                {rental.discountPercent && rental.discountPercent > 0 && isCompleted && (
                    <span title={`Giảm giá ${rental.discountPercent}%`} className="ml-2 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 px-2 py-0.5 rounded-full">
                        -%
                    </span>
                )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end gap-x-2">
              {!isCompleted && onInitiateReturn && (
                <span className="text-indigo-600 font-semibold">Xem chi tiết</span>
              )}
              {isCompleted && onShowInvoice && (
                <span className="text-primary-600 font-semibold">Xem hóa đơn</span>
              )}
               {isCompleted && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(rental);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-gray-700 transition-colors"
                        title="Xóa lượt thuê"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
          </td>
        </tr>
    )
}

export const RentalsPage: React.FC<RentalsPageProps> = ({ rentals, customers, clothingItems, returnRental, addRental, addCustomer, rentedItemCounts, deleteRental }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRentalForInvoice, setSelectedRentalForInvoice] = useState<Rental | null>(null);
  const [rentalToConfirmReturn, setRentalToConfirmReturn] = useState<Rental | null>(null);
  const [selectedActiveRental, setSelectedActiveRental] = useState<Rental | null>(null);
  const [rentalToDelete, setRentalToDelete] = useState<Rental | null>(null);
  
  const todayString = format(new Date(), 'yyyy-MM-dd');
  const initialNewRentalState = { customerId: '', rentedItems: [] as { itemId: number, quantity: number }[], rentalDate: todayString, dueDate: '', notes: '', discountPercent: '' };
  const [newRental, setNewRental] = useState(initialNewRentalState);

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const initialNewCustomerState = { name: '', phone: '', address: '' };
  const [newCustomer, setNewCustomer] = useState(initialNewCustomerState);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'returnDate', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');

  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const clothingMap = useMemo(() => new Map(clothingItems.map(c => [c.id, c])), [clothingItems]);
  
  const getItemsForRental = (rental: Rental): ClothingItem[] => {
    return rental.rentedItems.map(({itemId}) => clothingMap.get(itemId)).filter((i): i is ClothingItem => !!i);
  }
  
  const filteredRentals = useMemo(() => {
    if (!searchTerm) {
      return rentals;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return rentals.filter(rental => {
      const customer = customerMap.get(rental.customerId);
      if (customer?.name.toLowerCase().includes(lowercasedTerm)) return true;

      const items = getItemsForRental(rental);
      if (items.some(item => item.name.toLowerCase().includes(lowercasedTerm))) return true;

      if (format(parseISO(rental.rentalDate), 'dd/MM/yyyy').includes(lowercasedTerm)) return true;
      if (format(parseISO(rental.dueDate), 'dd/MM/yyyy').includes(lowercasedTerm)) return true;
      if (rental.returnDate && format(parseISO(rental.returnDate), 'dd/MM/yyyy').includes(lowercasedTerm)) return true;

      return false;
    });
  }, [searchTerm, rentals, customerMap, clothingMap]);


  const { activeRentals, pastRentals } = useMemo(() => {
    const active: Rental[] = [];
    const past: Rental[] = [];
    filteredRentals.forEach(r => (r.returnDate ? past.push(r) : active.push(r)));
    active.sort((a,b) => parseISO(b.rentalDate).getTime() - parseISO(a.rentalDate).getTime());
    return { activeRentals: active, pastRentals: past };
  }, [filteredRentals]);

  const availableItems = useMemo(() => {
    return clothingItems.filter(item => {
        const rentedCount = rentedItemCounts.get(item.id) || 0;
        return item.quantity - rentedCount > 0;
    });
  }, [clothingItems, rentedItemCounts]);

  const sortedPastRentals = useMemo(() => {
    const sortableItems = [...pastRentals];
    if (sortConfig) {
        sortableItems.sort((a, b) => {
            const getSortValue = (rental: Rental, key: string) => {
                switch(key) {
                    case 'customerName': return customerMap.get(rental.customerId)?.name || '';
                    case 'rentalDate':
                    case 'dueDate':
                    case 'returnDate': return rental[key] ? parseISO(rental[key] as string).getTime() : 0;
                    case 'totalPrice': return rental.totalPrice ?? null;
                    default: return rental[key as keyof Rental];
                }
            };

            const aValue = getSortValue(a, sortConfig.key);
            const bValue = getSortValue(b, sortConfig.key);
            
            if (aValue === null) return 1;
            if (bValue === null) return -1;
            
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [pastRentals, sortConfig, customerMap]);
  
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <span className="opacity-30">↕</span>;
    }
    if (sortConfig.direction === 'ascending') {
        return <span className="text-primary-600">▲</span>;
    }
    return <span className="text-primary-600">▼</span>;
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewRental(initialNewRentalState);
    setIsAddingCustomer(false);
    setNewCustomer(initialNewCustomerState);
  };

  const handleAddNewCustomer = () => {
    if (newCustomer.name && newCustomer.phone && newCustomer.address) {
        const addedCustomer = addCustomer(newCustomer);
        setNewRental(p => ({ ...p, customerId: addedCustomer.id.toString() }));
        setNewCustomer(initialNewCustomerState);
        setIsAddingCustomer(false);
    } else {
        alert("Vui lòng điền đầy đủ thông tin khách hàng.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customerId = parseInt(newRental.customerId);
    const discountPercent = newRental.discountPercent ? parseFloat(newRental.discountPercent) : undefined;
    if (customerId && newRental.rentedItems.length > 0 && newRental.rentalDate && newRental.dueDate) {
      addRental({
        customerId,
        rentedItems: newRental.rentedItems,
        rentalDate: new Date(newRental.rentalDate).toISOString(),
        dueDate: new Date(newRental.dueDate).toISOString(),
        notes: newRental.notes,
        discountPercent,
      });
      handleCloseModal();
    }
  };

  const handleItemToggle = (itemId: number) => {
    setNewRental(prev => {
      const existingItemIndex = prev.rentedItems.findIndex(i => i.itemId === itemId);
      if (existingItemIndex > -1) {
        // Item exists, so remove it
        return {
          ...prev,
          rentedItems: prev.rentedItems.filter(i => i.itemId !== itemId),
        };
      } else {
        // Item doesn't exist, add it with quantity 1
        return {
          ...prev,
          rentedItems: [...prev.rentedItems, { itemId: itemId, quantity: 1 }],
        };
      }
    });
  };

  const handleQuantityChange = (itemId: number, quantityStr: string) => {
      const quantity = parseInt(quantityStr, 10);
      setNewRental(prev => ({
        ...prev,
        rentedItems: prev.rentedItems.map(item =>
          item.itemId === itemId ? { ...item, quantity: isNaN(quantity) || quantity < 1 ? 1 : quantity } : item
        ),
      }));
  };

  
  const handleExport = () => {
    const dataToExport = rentals.map(rental => {
        const customer = customerMap.get(rental.customerId);
        const items = rental.rentedItems.map(({itemId, quantity}) => {
            const item = clothingMap.get(itemId);
            return `${item?.name || 'N/A'} (x${quantity})`;
        }).join('; ');

        return {
            'ID Lượt Thuê': rental.id,
            'Tên Khách Hàng': customer?.name || 'N/A',
            'ID Khách Hàng': rental.customerId,
            'Các Món Đồ': items,
            'Ngày Thuê': format(parseISO(rental.rentalDate), 'dd/MM/yyyy'),
            'Ngày Hẹn Trả': format(parseISO(rental.dueDate), 'dd/MM/yyyy'),
            'Ngày Đã Trả': rental.returnDate ? format(parseISO(rental.returnDate), 'dd/MM/yyyy') : 'Chưa trả',
            'Giảm giá (%)': rental.discountPercent || 0,
            'Tổng Tiền (VND)': rental.totalPrice ?? 'N/A',
            'Ghi Chú': rental.notes || ''
        };
    });
    exportToCSV(dataToExport, 'lich-su-thue.csv');
  };

  const handleConfirmReturn = () => {
    if (rentalToConfirmReturn) {
      const updatedRental = returnRental(rentalToConfirmReturn.id);
      if (updatedRental) {
        setSelectedRentalForInvoice(updatedRental);
      }
      setRentalToConfirmReturn(null);
    }
  };

  const handleConfirmDelete = () => {
    if (rentalToDelete) {
        deleteRental(rentalToDelete.id);
        setRentalToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex-shrink-0">Quản Lý Lượt Thuê</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
             <div className="relative flex-grow max-w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    title="Tìm kiếm theo tên khách hàng, tên món đồ, hoặc ngày (dd/mm/yyyy)."
                />
            </div>
            <button
              onClick={handleExport}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200 text-sm font-medium"
            >
              <ExportIcon />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200"
            >
              Tạo Mới
            </button>
        </div>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Đang Thuê</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Món đồ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày thuê</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày hẹn trả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày đã trả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ghi chú</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tổng tiền</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activeRentals.length > 0 ? (
                    activeRentals.map(r => <RentalRow key={r.id} rental={r} customer={customerMap.get(r.customerId)} clothingMap={clothingMap} onInitiateReturn={setSelectedActiveRental} onShowInvoice={setSelectedRentalForInvoice}/>)
                ) : (
                    <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">Không tìm thấy lượt thuê nào.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Tạo Lượt Thuê Mới">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAddingCustomer ? (
            <div className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-900/50 space-y-3">
              <h4 className="font-semibold text-md text-gray-800 dark:text-gray-200">Thêm Khách Hàng Mới</h4>
              <input type="text" value={newCustomer.name} onChange={e => setNewCustomer(p => ({...p, name: e.target.value}))} placeholder="Tên khách hàng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({...p, phone: e.target.value}))} placeholder="Số điện thoại" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              <input type="text" value={newCustomer.address} onChange={e => setNewCustomer(p => ({...p, address: e.target.value}))} placeholder="Địa chỉ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsAddingCustomer(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded text-sm">Hủy</button>
                <button type="button" onClick={handleAddNewCustomer} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Lưu Khách Hàng</button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Khách hàng</label>
              <div className="flex items-center gap-2 mt-1">
                <select value={newRental.customerId} onChange={e => setNewRental(p => ({...p, customerId: e.target.value}))} className="block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required>
                  <option value="">Chọn một khách hàng</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setIsAddingCustomer(true)} className="px-3 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900 text-sm whitespace-nowrap">Thêm Mới</button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Các món đồ có sẵn</label>
            <div className="mt-1 max-h-60 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 space-y-2">
              {availableItems.length > 0 ? availableItems.map(item => {
                const selectedItem = newRental.rentedItems.find(i => i.itemId === item.id);
                const isSelected = !!selectedItem;
                const availableCount = item.quantity - (rentedItemCounts.get(item.id) || 0);

                return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50">
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id={`item-${item.id}`} 
                                checked={isSelected} 
                                onChange={() => handleItemToggle(item.id)} 
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor={`item-${item.id}`} className="ml-3 text-sm text-gray-900 dark:text-gray-200">
                                {item.name} 
                                <span className="text-xs text-gray-500 dark:text-gray-400"> (Còn lại: {availableCount})</span>
                            </label>
                        </div>
                        {isSelected && (
                            <div className="flex items-center gap-2">
                                <label htmlFor={`quantity-${item.id}`} className="text-sm">Số lượng:</label>
                                <input
                                    type="number"
                                    id={`quantity-${item.id}`}
                                    min="1"
                                    max={availableCount}
                                    value={selectedItem.quantity}
                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                    className="w-20 p-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 text-center"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        )}
                    </div>
                )
              }) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Không có đồ nào có sẵn.</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày thuê</label>
            <input type="date" value={newRental.rentalDate} onChange={e => setNewRental(p => ({...p, rentalDate: e.target.value}))} className="mt-1 block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày hẹn trả</label>
            <input type="date" value={newRental.dueDate} onChange={e => setNewRental(p => ({...p, dueDate: e.target.value}))} className="mt-1 block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Giảm giá (%)</label>
            <input type="number" value={newRental.discountPercent} onChange={e => setNewRental(p => ({...p, discountPercent: e.target.value}))} className="mt-1 block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" placeholder="Ví dụ: 10" min="0" max="100"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
            <textarea value={newRental.notes} onChange={e => setNewRental(p => ({...p, notes: e.target.value}))} className="mt-1 block w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" rows={3} placeholder="Ví dụ: yêu cầu đặc biệt của khách, tình trạng đồ..."></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Tạo</button>
          </div>
        </form>
      </Modal>

      <Card>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Lịch Sử Thuê</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('customerName')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Khách hàng</span>
                            {getSortIndicator('customerName')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Món đồ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('rentalDate')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Ngày thuê</span>
                            {getSortIndicator('rentalDate')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('dueDate')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Ngày hẹn trả</span>
                            {getSortIndicator('dueDate')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('returnDate')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Ngày đã trả</span>
                            {getSortIndicator('returnDate')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ghi chú</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <button onClick={() => requestSort('totalPrice')} className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-100 transition-colors">
                            <span>Tổng tiền</span>
                            {getSortIndicator('totalPrice')}
                        </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hành động</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedPastRentals.length > 0 ? (
                    sortedPastRentals.map(r => <RentalRow key={r.id} rental={r} customer={customerMap.get(r.customerId)} clothingMap={clothingMap} onShowInvoice={setSelectedRentalForInvoice} onDelete={setRentalToDelete} />)
                ) : (
                     <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">Không tìm thấy lượt thuê nào.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </Card>
      
      {selectedRentalForInvoice && (
        <InvoiceModal 
            rental={selectedRentalForInvoice}
            customer={customerMap.get(selectedRentalForInvoice.customerId)}
            items={clothingItems}
            onClose={() => setSelectedRentalForInvoice(null)}
        />
      )}

      {rentalToConfirmReturn && (
        <Modal 
            isOpen={!!rentalToConfirmReturn} 
            onClose={() => setRentalToConfirmReturn(null)} 
            title="Xác nhận trả đồ"
        >
            <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                    Bạn có chắc chắn muốn đánh dấu lượt thuê cho khách hàng "<strong>{customerMap.get(rentalToConfirmReturn.customerId)?.name}</strong>" là đã trả không?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hành động này sẽ tính toán tổng tiền và tạo hóa đơn.
                </p>
                <div className="flex justify-end gap-2 pt-4">
                    <button 
                        type="button" 
                        onClick={() => setRentalToConfirmReturn(null)} 
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        type="button" 
                        onClick={handleConfirmReturn} 
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </Modal>
      )}

      {selectedActiveRental && (
        <ActiveRentalDetailModal
            rental={selectedActiveRental}
            customer={customerMap.get(selectedActiveRental.customerId)}
            items={clothingItems}
            onClose={() => setSelectedActiveRental(null)}
            onConfirmReturn={(rental) => {
                setSelectedActiveRental(null);
                setRentalToConfirmReturn(rental);
            }}
        />
      )}

    {rentalToDelete && (
        <Modal
            isOpen={!!rentalToDelete}
            onClose={() => setRentalToDelete(null)}
            title="Xác nhận xóa lượt thuê"
        >
            <p className="text-gray-700 dark:text-gray-300">
                Bạn có chắc chắn muốn xóa vĩnh viễn lượt thuê của khách hàng "<strong>{customerMap.get(rentalToDelete.customerId)?.name}</strong>" vào ngày <strong>{format(parseISO(rentalToDelete.rentalDate), 'dd/MM/yyyy')}</strong>?
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-semibold">Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setRentalToDelete(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                    Hủy
                </button>
                <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Xác nhận Xóa
                </button>
            </div>
        </Modal>
    )}

    </div>
  );
};
