import React, { useState, useMemo, useEffect } from 'react';
import type { ClothingItem } from '../types';
import { Card } from './shared/Card';
import { Modal } from './shared/Modal';
import { exportToCSV } from '../utils/export';
import { ExportIcon } from './icons/ExportIcon';

interface ClothingPageProps {
  clothingItems: ClothingItem[];
  addClothingItem: (item: Omit<ClothingItem, 'id'>) => void;
  updateClothingItem: (item: ClothingItem) => void;
  deleteClothingItem: (id: number) => void;
  rentedItemCounts: Map<number, number>;
}

export const ClothingPage: React.FC<ClothingPageProps> = ({ clothingItems, addClothingItem, updateClothingItem, deleteClothingItem, rentedItemCounts }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);

  const [newItem, setNewItem] = useState({ name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' });
  const initialEditFormState = { name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' };
  const [editForm, setEditForm] = useState(initialEditFormState);
  
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [addImageSource, setAddImageSource] = useState<'url' | 'upload'>('url');
  const [editImageSource, setEditImageSource] = useState<'url' | 'upload'>('url');


  useEffect(() => {
    if (editingItem) {
      setEditForm({
        name: editingItem.name,
        size: editingItem.size,
        rentalPrice: String(editingItem.rentalPrice),
        quantity: String(editingItem.quantity),
        imageUrl: editingItem.imageUrl,
      });
      // Determine if the existing imageUrl is a data URL or a regular URL
      if (editingItem.imageUrl.startsWith('data:image')) {
        setEditImageSource('upload');
      } else {
        setEditImageSource('url');
      }
    } else {
      setEditForm(initialEditFormState);
    }
  }, [editingItem]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  const handleAddImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setNewItem(prev => ({ ...prev, imageUrl: base64 }));
      } catch (error) {
        console.error("Lỗi chuyển đổi tệp:", error);
        alert("Không thể tải lên hình ảnh. Vui lòng thử lại.");
      }
    }
  };
  
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setEditForm(prev => ({ ...prev, imageUrl: base64 }));
      } catch (error) {
        console.error("Lỗi chuyển đổi tệp:", error);
        alert("Không thể tải lên hình ảnh. Vui lòng thử lại.");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newItem.rentalPrice);
    const quantity = parseInt(newItem.quantity, 10);
    if (newItem.name && newItem.size && !isNaN(price) && !isNaN(quantity) && quantity > 0) {
      addClothingItem({ 
        name: newItem.name, 
        size: newItem.size, 
        rentalPrice: price,
        quantity: quantity,
        imageUrl: newItem.imageUrl || `https://picsum.photos/seed/${newItem.name.replace(/\s+/g, '-')}/400/600`
      });
      setNewItem({ name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' });
      setIsAddModalOpen(false);
      setAddImageSource('url');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const price = parseFloat(editForm.rentalPrice);
    const quantity = parseInt(editForm.quantity, 10);
    if (editForm.name && editForm.size && !isNaN(price) && !isNaN(quantity) && quantity >= 0) {
      updateClothingItem({
        id: editingItem.id,
        name: editForm.name,
        size: editForm.size,
        rentalPrice: price,
        quantity: quantity,
        imageUrl: editForm.imageUrl || `https://picsum.photos/seed/${editForm.name.replace(/\s+/g, '-')}/400/600`
      });
      setEditingItem(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteClothingItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const filteredItems = useMemo(() => clothingItems.filter(item => {
    const rentedCount = rentedItemCounts.get(item.id) || 0;
    const availableCount = item.quantity - rentedCount;
    if (filter === 'available') return availableCount > 0;
    if (filter === 'unavailable') return availableCount === 0;
    return true;
  }), [clothingItems, rentedItemCounts, filter]);
  
  const handleExport = () => {
    const dataToExport = clothingItems.map(item => ({
        'ID': item.id,
        'Tên Món Đồ': item.name,
        'Kích Cỡ': item.size,
        'Giá Thuê (VND/ngày)': item.rentalPrice,
        'Tổng Số Lượng': item.quantity,
        'Số Lượng Đang Thuê': rentedItemCounts.get(item.id) || 0,
        'Số Lượng Còn Lại': item.quantity - (rentedItemCounts.get(item.id) || 0)
    }));
    exportToCSV(dataToExport, 'danh-sach-quan-ao.csv');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Quản Lý Quần Áo</h1>
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg shadow">
                 <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm rounded-l-lg ${filter === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Tất cả</button>
                 <button onClick={() => setFilter('available')} className={`px-4 py-2 text-sm ${filter === 'available' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Còn hàng</button>
                 <button onClick={() => setFilter('unavailable')} className={`px-4 py-2 text-sm rounded-r-lg ${filter === 'unavailable' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Hết hàng</button>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200 text-sm font-medium"
            >
              <ExportIcon />
              Xuất CSV
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-200"
            >
              Thêm Món Mới
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map(item => {
          const rentedCount = rentedItemCounts.get(item.id) || 0;
          const availableCount = item.quantity - rentedCount;
          const isAvailable = availableCount > 0;

          return (
            <Card key={item.id} className="overflow-hidden flex flex-col">
              <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{item.name}</h3>
                <p className="text-gray-600 dark:text-gray-300">Kích cỡ: {item.size}</p>
                <p className="text-gray-600 dark:text-gray-300">Giá: {item.rentalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}/ngày</p>
                <p className="text-gray-600 dark:text-gray-300">Còn lại: {availableCount}/{item.quantity}</p>
                <div className="mt-auto pt-2 flex justify-between items-center">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {isAvailable ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setEditingItem(item)} 
                      className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium rounded-md hover:bg-primary-100 dark:hover:bg-gray-700"
                    >
                      Sửa
                    </button>
                     <button 
                      onClick={() => setItemToDelete(item)} 
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium rounded-md hover:bg-red-100 dark:hover:bg-gray-700"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setAddImageSource('url'); setNewItem({ name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' }); }} title="Thêm Món Đồ Mới">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <input type="text" name="name" value={newItem.name} onChange={handleInputChange} placeholder="Tên món đồ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="text" name="size" value={newItem.size} onChange={handleInputChange} placeholder="Kích cỡ (VD: S, M, L)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="number" name="rentalPrice" value={newItem.rentalPrice} onChange={handleInputChange} placeholder="Giá thuê (VND/ngày)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          <input type="number" name="quantity" value={newItem.quantity} onChange={handleInputChange} placeholder="Số lượng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required min="1" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh</label>
            <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 w-min mb-3">
              <button type="button" onClick={() => setAddImageSource('url')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${addImageSource === 'url' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Từ URL</button>
              <button type="button" onClick={() => setAddImageSource('upload')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${addImageSource === 'upload' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tải lên</button>
            </div>
            
            {addImageSource === 'url' ? (
              <input type="text" name="imageUrl" value={newItem.imageUrl} onChange={handleInputChange} placeholder="URL Hình ảnh (tùy chọn)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
            ) : (
              <input type="file" accept="image/*" onChange={handleAddImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-700 file:text-primary-700 dark:file:text-primary-100 hover:file:bg-primary-100 dark:hover:file:bg-primary-600 transition-colors cursor-pointer" />
            )}
            
            {newItem.imageUrl && <img src={newItem.imageUrl} alt="Xem trước" className="mt-3 rounded-lg max-h-40 w-auto mx-auto object-contain" />}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsAddModalOpen(false); setAddImageSource('url'); setNewItem({ name: '', size: '', rentalPrice: '', quantity: '', imageUrl: '' }); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Thêm</button>
          </div>
        </form>
      </Modal>

      {editingItem && (
        <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Chỉnh Sửa Món Đồ">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <input type="text" name="name" value={editForm.name} onChange={handleEditInputChange} placeholder="Tên món đồ" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
            <input type="text" name="size" value={editForm.size} onChange={handleEditInputChange} placeholder="Kích cỡ (VD: S, M, L)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
            <input type="number" name="rentalPrice" value={editForm.rentalPrice} onChange={handleEditInputChange} placeholder="Giá thuê (VND/ngày)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
            <input type="number" name="quantity" value={editForm.quantity} onChange={handleEditInputChange} placeholder="Số lượng" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required min="0" />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh</label>
              <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 w-min mb-3">
                <button type="button" onClick={() => setEditImageSource('url')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${editImageSource === 'url' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Từ URL</button>
                <button type="button" onClick={() => setEditImageSource('upload')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${editImageSource === 'upload' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tải lên</button>
              </div>

              {editImageSource === 'url' ? (
                <input type="text" name="imageUrl" value={editForm.imageUrl} onChange={handleEditInputChange} placeholder="URL Hình ảnh (tùy chọn)" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
              ) : (
                <input type="file" accept="image/*" onChange={handleEditImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-700 file:text-primary-700 dark:file:text-primary-100 hover:file:bg-primary-100 dark:hover:file:bg-primary-600 transition-colors cursor-pointer" />
              )}
              
              {editForm.imageUrl && <img src={editForm.imageUrl} alt="Xem trước" className="mt-3 rounded-lg max-h-40 w-auto mx-auto object-contain" />}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Hủy</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Lưu Thay Đổi</button>
            </div>
          </form>
        </Modal>
      )}

      {itemToDelete && (
        <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Xác nhận xóa">
          <p className="text-gray-700 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa món đồ "{itemToDelete.name}"? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setItemToDelete(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">
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
        </Modal>
      )}
    </div>
  );
};