import React, { useState, useEffect } from 'react';
import type { Customer, Rental, ClothingItem } from '../types';
import { Card } from './shared/Card';
import { Modal } from './shared/Modal';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { exportToCSV } from '../utils/export';
import { ExportIcon } from './icons/ExportIcon';
import { CustomerDetailModal } from './CustomerDetailModal';

interface CustomersPageProps {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: number) => boolean;
  rentals: Rental[];
  clothingItems: ClothingItem[];
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ customers, addCustomer, rentals, clothingItems, updateCustomer, deleteCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const initialEditFormState = { name: '', phone: '', address: '' };
  const [editForm, setEditForm] = useState(initialEditFormState);

  useEffect(() => {
    if (editingCustomer) {
      setEditForm({
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        address: editingCustomer.address,
      });
    } else {
      setEditForm(initialEditFormState);
    }
  }, [editingCustomer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomer.name && newCustomer.phone && newCustomer.address) {
      addCustomer(newCustomer);
      setNewCustomer({ name: '', phone: '', address: '' });
      setIsModalOpen(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (editForm.name && editForm.phone && editForm.address) {
      updateCustomer({
        id: editingCustomer.id,
        ...editForm,
      });
      setEditingCustomer(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      const isDeleted = deleteCustomer(customerToDelete.id);
      if (isDeleted) {
        closeDeleteModal();
      } else {
        setDeleteError(`Không thể xóa khách hàng "${customerToDelete.name}" vì họ đã có lịch sử thuê đồ.`);
      }
    }
  };

  const closeDeleteModal = () => {
    setCustomerToDelete(null);
    setDeleteError(null);
  };

  const handleExport = () => {
    const dataToExport = customers.map(customer => ({
      'ID': customer.id,
      'Tên Khách Hàng': customer.name,
      'Số Điện Thoại': customer.phone,
      'Địa Chỉ': customer.address
    }));
    exportToCSV(dataToExport, 'danh-sach-khach-hang.csv');
  };
  
  const customerRentals = (customerId: number) => {
    return rentals.filter(rental => rental.customerId === customerId);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Khách Hàng</h1>
        <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200 text-sm font-medium"
            >
              <ExportIcon />
              Xuất CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200"
            >
              Thêm Khách Hàng Mới
            </button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Số Điện Thoại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Địa Chỉ</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lượt thuê</th>
                   <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {customers.map(customer => (
                  <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3"/>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-center">{customerRentals(customer.id).length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-x-4">
                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCustomer(customer);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 font-semibold"
                          >
                              Sửa
                          </button>
                          <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomerToDelete(customer);
                              }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 font-semibold"
                          >
                              Xóa
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm Khách Hàng Mới">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" value={newCustomer.name} onChange={handleInputChange} placeholder="Tên khách hàng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="tel" name="phone" value={newCustomer.phone} onChange={handleInputChange} placeholder="Số điện thoại" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="text" name="address" value={newCustomer.address} onChange={handleInputChange} placeholder="Địa chỉ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Thêm</button>
          </div>
        </form>
      </Modal>

      {editingCustomer && (
        <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="Chỉnh Sửa Khách Hàng">
            <form onSubmit={handleEditSubmit} className="space-y-4">
                <input type="text" name="name" value={editForm.name} onChange={handleEditInputChange} placeholder="Tên khách hàng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                <input type="tel" name="phone" value={editForm.phone} onChange={handleEditInputChange} placeholder="Số điện thoại" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                <input type="text" name="address" value={editForm.address} onChange={handleEditInputChange} placeholder="Địa chỉ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Lưu Thay Đổi</button>
                </div>
            </form>
        </Modal>
      )}

      {customerToDelete && (
        <Modal 
            isOpen={!!customerToDelete} 
            onClose={closeDeleteModal} 
            title={deleteError ? "Lỗi Không Thể Xóa" : "Xác nhận xóa"}
        >
          {deleteError ? (
            <>
                <p className="text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-300 p-4 rounded-lg text-center">
                    {deleteError}
                </p>
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        type="button"
                        onClick={closeDeleteModal}
                        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                        Đã hiểu
                    </button>
                </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 dark:text-gray-300">
                Bạn có chắc chắn muốn xóa khách hàng "<strong>{customerToDelete.name}</strong>"? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={closeDeleteModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {selectedCustomer && (
        <CustomerDetailModal 
            customer={selectedCustomer}
            rentals={customerRentals(selectedCustomer.id)}
            clothingItems={clothingItems}
            onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};