import React from 'react';
import type { Customer, Rental, ClothingItem } from '../types';
import { Modal } from './shared/Modal';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

interface ActiveRentalDetailModalProps {
  rental: Rental;
  customer?: Customer;
  items: ClothingItem[]; // This is the full list of all clothing items
  onClose: () => void;
  onConfirmReturn: (rental: Rental) => void;
}

export const ActiveRentalDetailModal: React.FC<ActiveRentalDetailModalProps> = ({ rental, customer, items, onClose, onConfirmReturn }) => {
  // FIX: Explicitly typing the Map ensures that .get() returns a correctly typed value (ClothingItem | undefined) instead of `unknown`, resolving property access errors.
  const itemsMap = new Map<number, ClothingItem>(items.map(i => [i.id, i]));
    
  return (
    <Modal isOpen={!!rental} onClose={onClose} title={`Chi tiết lượt thuê #${rental.id}`}>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Khách hàng</h3>
          <p className="text-gray-600 dark:text-gray-300"><strong>Tên:</strong> {customer?.name}</p>
          <p className="text-gray-600 dark:text-gray-300"><strong>SĐT:</strong> {customer?.phone}</p>
          <p className="text-gray-600 dark:text-gray-300"><strong>Địa chỉ:</strong> {customer?.address}</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Thông tin thuê</h3>
           <p className="text-gray-600 dark:text-gray-300"><strong>Ngày thuê:</strong> {format(parseISO(rental.rentalDate), 'dd/MM/yyyy')}</p>
          <p className="text-gray-600 dark:text-gray-300"><strong>Ngày hẹn trả:</strong> {format(parseISO(rental.dueDate), 'dd/MM/yyyy')}</p>
          {rental.discountPercent && rental.discountPercent > 0 && (
            <p className="text-gray-600 dark:text-gray-300"><strong>Giảm giá:</strong> {rental.discountPercent}%</p>
          )}
        </div>

        <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">Món đồ đã thuê</h3>
            <ul className="list-disc list-inside bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg space-y-1">
                {rental.rentedItems.map(({itemId, quantity}) => {
                    const item = itemsMap.get(itemId);
                    if (!item) return null;
                    return (
                        <li key={itemId} className="text-gray-700 dark:text-gray-300">
                           {item.name} - Cỡ {item.size} <strong className="font-semibold">(Số lượng: {quantity})</strong>
                        </li>
                    )
                })}
            </ul>
        </div>

        {rental.notes && (
             <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Ghi chú</h3>
                <p className="p-3 mt-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-gray-600 dark:text-gray-300 italic">{rental.notes}</p>
            </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            Đóng
          </button>
          <button type="button" onClick={() => onConfirmReturn(rental)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
            Đánh dấu đã trả
          </button>
        </div>
      </div>
    </Modal>
  );
};