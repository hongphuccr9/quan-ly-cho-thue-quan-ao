import React, { useMemo, useState } from 'react';
import type { Customer, Rental, ClothingItem } from '../types';
import { Modal } from './shared/Modal';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { Card } from './shared/Card';
import { InvoiceModal } from './InvoiceModal';

interface CustomerDetailModalProps {
  customer: Customer;
  rentals: Rental[];
  clothingItems: ClothingItem[];
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, rentals, clothingItems, onClose }) => {
  const [selectedRentalForInvoice, setSelectedRentalForInvoice] = useState<Rental | null>(null);
  
  const clothingMap = useMemo(() => new Map(clothingItems.map(item => [item.id, item])), [clothingItems]);

  const totalSpent = useMemo(() => {
    return rentals.reduce((acc, rental) => acc + (rental.totalPrice || 0), 0);
  }, [rentals]);
  
  const sortedRentals = useMemo(() => {
    return [...rentals].sort((a, b) => parseISO(b.rentalDate).getTime() - parseISO(a.rentalDate).getTime());
  }, [rentals]);

  const getItemsForRental = (rental: Rental): ClothingItem[] => {
    return rental.rentedItems.map(({itemId}) => clothingMap.get(itemId)).filter((i): i is ClothingItem => !!i);
  }

  return (
    <>
      <Modal isOpen={!!customer} onClose={onClose} title={`Chi tiết khách hàng: ${customer.name}`}>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Thông tin liên hệ</h3>
            <p className="text-gray-600 dark:text-gray-300"><strong>SĐT:</strong> {customer.phone}</p>
            <p className="text-gray-600 dark:text-gray-300"><strong>Địa chỉ:</strong> {customer.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Card className="!p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng số lượt thuê</h4>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{rentals.length}</p>
              </Card>
              <Card className="!p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng chi tiêu</h4>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {totalSpent.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </p>
              </Card>
          </div>

          <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">Lịch Sử Thuê</h3>
              <div className="max-h-80 overflow-y-auto border dark:border-gray-700 rounded-lg">
                  {sortedRentals.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                              <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Món Đồ</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày Thuê</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trạng Thái</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tổng Tiền</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hành động</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {sortedRentals.map(rental => {
                                  const items = rental.rentedItems.map(({itemId, quantity}) => {
                                    const item = clothingMap.get(itemId);
                                    return `${item?.name || 'N/A'} (x${quantity})`;
                                  }).join(', ');
                                  
                                  const isOverdue = !rental.returnDate && new Date() > parseISO(rental.dueDate);
                                  const status = rental.returnDate 
                                      ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đã trả</span>
                                      : isOverdue
                                      ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Quá hạn</span>
                                      : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Đang thuê</span>;

                                  return (
                                      <tr key={rental.id}>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{items}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{format(parseISO(rental.rentalDate), 'dd/MM/yyyy')}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">{status}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 text-right font-medium">
                                              <div className="flex items-center justify-end">
                                                  <span>{rental.totalPrice ? rental.totalPrice.toLocaleString('vi-VN', {style: 'currency', currency: 'VND'}) : 'N/A'}</span>
                                                  {rental.discountPercent && rental.discountPercent > 0 && (
                                                      <span title={`Giảm giá ${rental.discountPercent}%`} className="ml-2 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 px-2 py-0.5 rounded-full">
                                                          -%
                                                      </span>
                                                  )}
                                              </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            {rental.returnDate && (
                                              <button
                                                onClick={() => setSelectedRentalForInvoice(rental)}
                                                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-semibold"
                                              >
                                                Xem Hóa Đơn
                                              </button>
                                            )}
                                          </td>
                                      </tr>
                                  )
                              })}
                          </tbody>
                      </table>
                  ) : (
                      <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                          Khách hàng này chưa có lịch sử thuê.
                      </div>
                  )}
              </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {selectedRentalForInvoice && (
        <InvoiceModal 
            rental={selectedRentalForInvoice}
            customer={customer}
            items={clothingItems}
            onClose={() => setSelectedRentalForInvoice(null)}
        />
      )}
    </>
  );
};
