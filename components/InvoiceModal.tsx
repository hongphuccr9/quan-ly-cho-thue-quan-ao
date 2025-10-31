import React from 'react';
import type { Rental, Customer, ClothingItem } from '../types';
import { Modal } from './shared/Modal';
import { format, differenceInCalendarDays } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

interface InvoiceModalProps {
  rental: Rental | null;
  customer?: Customer;
  items: ClothingItem[]; // This is the full list of all clothing items
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ rental, customer, items, onClose }) => {
  if (!rental || !rental.returnDate) return null;

  const rentalDate = parseISO(rental.rentalDate);
  const returnDate = parseISO(rental.returnDate);
  const daysRented = Math.max(1, differenceInCalendarDays(returnDate, rentalDate) + 1);

  // FIX: Explicitly typing the Map ensures that .get() returns a correctly typed value (ClothingItem | undefined) instead of `unknown`, resolving multiple property access errors.
  const itemsMap = new Map<number, ClothingItem>(items.map(item => [item.id, item]));

  const subtotal = rental.rentedItems.reduce((acc, rentedItem) => {
    const item = itemsMap.get(rentedItem.itemId);
    if (!item) return acc;
    return acc + (item.rentalPrice * rentedItem.quantity * daysRented);
  }, 0);

  const discountPercent = rental.discountPercent || 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const total = rental.totalPrice;

  const handleExportImage = () => {
    const invoiceElement = document.getElementById('invoice-content-display');
    const html2canvas = (window as any).html2canvas;

    if (!invoiceElement || !html2canvas) {
        alert("Lỗi: Không thể tạo tệp ảnh. Vui lòng làm mới trang và thử lại.");
        console.error("Phần tử hóa đơn hoặc thư viện html2canvas không được tìm thấy.");
        return;
    }

    html2canvas(invoiceElement, { 
      scale: 2, // Tăng độ phân giải của ảnh
      useCORS: true, 
      backgroundColor: document.body.classList.contains('dark') ? '#1f2937' : '#ffffff' // Xử lý nền cho dark mode
    }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `hoa-don-${rental.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
  };

  const handleExportExcel = () => {
    if (!rental || !customer) return;

    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert("Lỗi: Không thể tạo tệp Excel. Vui lòng làm mới trang và thử lại.");
      console.error("Thư viện 'xlsx' không được tìm thấy trên đối tượng window.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws_name = `HoaDon_${rental.id}`;
    
    const boldStyle = { font: { bold: true } };
    const titleStyle = { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } };
    const sectionTitleStyle = { font: { bold: true, sz: 12 } };
    const totalLabelStyle = { font: { bold: true }, alignment: { horizontal: 'right' } };
    const totalValueStyle = { font: { bold: true, sz: 14 } };
    const currencyFormat = '#,##0 "VND"';

    const rentedItemsDetails = rental.rentedItems.map(({itemId, quantity}) => {
        const item = itemsMap.get(itemId);
        return {
            name: item?.name || 'N/A',
            price: item?.rentalPrice || 0,
            quantity: quantity,
            lineTotal: (item?.rentalPrice || 0) * quantity * daysRented
        };
    });

    const data = [
      [{ v: 'HÓA ĐƠN THUÊ ĐỒ', s: titleStyle }],
      [],
      [{ v: 'Thông Tin Khách Hàng', s: sectionTitleStyle }],
      ['Tên:', customer.name],
      ['SĐT:', customer.phone],
      ['Địa chỉ:', customer.address],
      [],
      [{ v: 'Chi Tiết Thuê', s: sectionTitleStyle }],
      ['Ngày Thuê:', format(rentalDate, 'dd/MM/yyyy')],
      ['Ngày Trả:', format(returnDate, 'dd/MM/yyyy')],
      ['Số Ngày Thuê:', `${daysRented} ngày`],
      [],
      [{ v: 'Chi Tiết Hóa Đơn', s: sectionTitleStyle }],
      ['Món Đồ', 'Đơn Giá/Ngày', 'Số Lượng', 'Số Ngày Thuê', 'Thành Tiền'].map(h => ({ v: h, s: boldStyle })),
      ...rentedItemsDetails.map(detail => [
        detail.name,
        { v: detail.price, t: 'n', z: currencyFormat },
        detail.quantity,
        daysRented,
        { v: detail.lineTotal, t: 'n', z: currencyFormat }
      ]),
      [],
      [null, null, null, { v: 'Tạm tính:', s: totalLabelStyle }, { v: subtotal, t: 'n', z: currencyFormat }],
    ];

    if (discountPercent > 0) {
      data.push([null, null, null, { v: `Giảm giá (${discountPercent}%):`, s: totalLabelStyle }, { v: -discountAmount, t: 'n', z: currencyFormat }]);
    }
    
    data.push([null, null, null, { v: 'Tổng cộng:', s: totalLabelStyle }, { v: rental.totalPrice ?? 0, t: 'n', z: currencyFormat, s: totalValueStyle }]);

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
    ];

    ws['!cols'] = [
      { wch: 35 }, // Món Đồ
      { wch: 20 }, // Đơn Giá/Ngày
      { wch: 10 }, // Số Lượng
      { wch: 15 }, // Số Ngày Thuê
      { wch: 20 }  // Thành Tiền
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, `hoa-don-${rental.id}.xlsx`);
  };

  return (
    <Modal isOpen={!!rental} onClose={onClose} title={`Hóa Đơn #${rental.id}`}>
        <div id="invoice-content-display" className="printable-area bg-white dark:bg-gray-800 p-4">
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">HÓA ĐƠN</h2>
                    <p className="text-gray-500">Mã số: #{rental.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Khách Hàng:</h3>
                        <p>{customer?.name}</p>
                        <p>{customer?.phone}</p>
                        <p>{customer?.address}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Chi Tiết Thuê:</h3>
                        <p><strong>Ngày Thuê:</strong> {format(rentalDate, 'dd/MM/yyyy')}</p>
                        <p><strong>Ngày Trả:</strong> {format(returnDate, 'dd/MM/yyyy')}</p>
                        <p><strong>Tổng Số Ngày Thuê:</strong> {daysRented} ngày</p>
                    </div>
                </div>
                
                {rental.notes && (
                    <div className="pt-2">
                        <h3 className="font-bold text-gray-800 dark:text-white">Ghi Chú:</h3>
                        <p className="p-2 mt-1 bg-gray-100 dark:bg-gray-900/50 rounded-md text-gray-600 dark:text-gray-300">{rental.notes}</p>
                    </div>
                )}

                <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Chi Tiết Hóa Đơn:</h3>
                    <div className="overflow-x-auto border rounded-lg dark:border-gray-600">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Món Đồ</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Đơn Giá/Ngày</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Số Lượng</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Thành Tiền</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {rental.rentedItems.map(({itemId, quantity}) => {
                                const item = itemsMap.get(itemId);
                                if (!item) return null;
                                return (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right">{item.rentalPrice.toLocaleString('vi-VN')} VND</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-center">{quantity}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right">{(item.rentalPrice * quantity * daysRented).toLocaleString('vi-VN')} VND</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="text-right mt-4 pt-4 border-t dark:border-gray-600 space-y-2">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Tạm tính:</span>
                        <span className="font-semibold text-gray-800 dark:text-white ml-2">
                            {subtotal.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </span>
                    </div>
                    {discountPercent > 0 && (
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Giảm giá ({discountPercent}%):</span>
                            <span className="font-semibold text-green-600 dark:text-green-400 ml-2">
                                - {discountAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                            </span>
                        </div>
                    )}
                    <div className="pt-2">
                        <span className="text-lg font-bold text-gray-800 dark:text-white">Tổng cộng:</span>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {total?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 no-print">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Đóng</button>
            <button type="button" onClick={handleExportImage} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Xuất Ảnh</button>
            <button type="button" onClick={handleExportExcel} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Xuất Excel</button>
        </div>
    </Modal>
  );
};