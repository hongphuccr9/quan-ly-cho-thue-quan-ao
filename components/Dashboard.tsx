

import React, { useState, useMemo } from 'react';
import type { ClothingItem, Customer, Rental } from '../types';
import { Card } from './shared/Card';
// FIX: 'parseISO', 'subWeeks', 'subMonths', and 'subYears' are not top-level exports, importing them from their own module paths.
import { format, getYear, getMonth, getWeek, isWithinInterval } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { subWeeks } from 'date-fns/subWeeks';
import { subMonths } from 'date-fns/subMonths';
import { subYears } from 'date-fns/subYears';
// FIX: Locales must be imported from their specific file path.
import { vi } from 'date-fns/locale/vi';
// FIX: Removed unused LegendPayload import to avoid potential type conflicts.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface DashboardProps {
  clothingItems: ClothingItem[];
  customers: Customer[];
  rentals: Rental[];
  rentedItemCounts: Map<number, number>;
}

export const Dashboard: React.FC<DashboardProps> = ({ clothingItems, customers, rentals, rentedItemCounts }) => {
  const [revenueView, setRevenueView] = useState<'week' | 'month' | 'year'>('month');
  
  const activeRentals = rentals.filter(r => !r.returnDate);
  const overdueRentals = activeRentals.filter(r => new Date() > parseISO(r.dueDate));
  const totalItemsStock = clothingItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const mostPopularItems = [...clothingItems]
    .sort((a, b) => (rentedItemCounts.get(b.id) || 0) - (rentedItemCounts.get(a.id) || 0))
    .slice(0, 5)
    .filter(item => (rentedItemCounts.get(item.id) || 0) > 0);

  const stats = [
    { title: 'Tổng Số Loại Đồ', value: clothingItems.length },
    { title: 'Tổng Số Lượng Trong Kho', value: totalItemsStock },
    { title: 'Đang Cho Thuê', value: activeRentals.length },
    { title: 'Quá Hạn Trả', value: overdueRentals.length, isWarning: true },
  ];
  
  const clothingItemMap = new Map(clothingItems.map(item => [item.id, item]));

  const topSpendingCustomers = useMemo(() => {
    const now = new Date();
    const currentYear = getYear(now);
    const customerSpending = new Map<number, number>();

    rentals.forEach(rental => {
        if (rental.totalPrice && getYear(parseISO(rental.rentalDate)) === currentYear) {
            const currentSpending = customerSpending.get(rental.customerId) || 0;
            customerSpending.set(rental.customerId, currentSpending + rental.totalPrice);
        }
    });

    const customerMap = new Map(customers.map(c => [c.id, c.name]));

    return Array.from(customerSpending.entries())
        .map(([customerId, totalSpent]) => ({
            id: customerId,
            name: customerMap.get(customerId) || 'Khách hàng không xác định',
            totalSpent,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

  }, [rentals, customers]);

  const revenueData = useMemo(() => {
    const now = new Date();
    let data: { name: string; DoanhThu: number }[] = [];
    
    if (revenueView === 'month') {
        const last12Months = Array.from({ length: 12 }, (_, i) => subMonths(now, i)).reverse();
        data = last12Months.map(monthStart => ({
            name: format(monthStart, 'MMM yyyy', { locale: vi }),
            DoanhThu: 0
        }));
        rentals.forEach(rental => {
            if (!rental.totalPrice) return;
            const rentalDate = parseISO(rental.rentalDate);
            const monthIndex = last12Months.findIndex(monthStart => getYear(rentalDate) === getYear(monthStart) && getMonth(rentalDate) === getMonth(monthStart));
            if (monthIndex !== -1) {
                data[monthIndex].DoanhThu += rental.totalPrice;
            }
        });
    } else if (revenueView === 'week') {
        const last12Weeks = Array.from({ length: 12 }, (_, i) => subWeeks(now, i)).reverse();
        data = last12Weeks.map(weekStart => ({
            name: `Tuần ${getWeek(weekStart, { locale: vi, weekStartsOn: 1 })}`,
            DoanhThu: 0
        }));
        rentals.forEach(rental => {
            if (!rental.totalPrice) return;
            const rentalDate = parseISO(rental.rentalDate);
            const weekIndex = last12Weeks.findIndex(weekStart => getYear(rentalDate) === getYear(weekStart) && getWeek(rentalDate, { locale: vi, weekStartsOn: 1 }) === getWeek(weekStart, { locale: vi, weekStartsOn: 1 }));
            if (weekIndex !== -1) {
                data[weekIndex].DoanhThu += rental.totalPrice;
            }
        });
    } else if (revenueView === 'year') {
        const last5Years = Array.from({ length: 5 }, (_, i) => subYears(now, i)).reverse();
        data = last5Years.map(yearStart => ({
            name: format(yearStart, 'yyyy'),
            DoanhThu: 0
        }));
        rentals.forEach(rental => {
            if (!rental.totalPrice) return;
            const rentalDate = parseISO(rental.rentalDate);
            const yearIndex = last5Years.findIndex(yearStart => getYear(rentalDate) === getYear(yearStart));
            if (yearIndex !== -1) {
                data[yearIndex].DoanhThu += rental.totalPrice;
            }
        });
    }
    return data;
  }, [rentals, revenueView]);
  

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bảng Điều Khiển</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <Card key={stat.title}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</h3>
            <p className={`mt-1 text-3xl font-semibold ${stat.isWarning && stat.value > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Báo Cáo Doanh Thu</h2>
              <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                  <button onClick={() => setRevenueView('week')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${revenueView === 'week' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tuần</button>
                  <button onClick={() => setRevenueView('month')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${revenueView === 'month' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Tháng</button>
                  <button onClick={() => setRevenueView('year')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${revenueView === 'year' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Năm</button>
              </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(value: number) => new Intl.NumberFormat('vi-VN').format(value)}/>
                    <Tooltip 
                      // FIX: Explicitly typing the value from the formatter avoids using 'any' and improves type safety.
                      formatter={(value: number, name: string) => [`${value.toLocaleString('vi-VN')} VND`, name]} 
                      cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                      contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff' }}
                    />
                    {/* FIX: By typing `entry` as `any`, we can safely access `entry.payload.name` without TypeScript errors, as recharts types can be inconsistent. */}
                    <Legend formatter={(value, entry: any) => {
                        const name = entry?.payload?.name || value;
                        return <span className="text-gray-800 dark:text-white">{name}</span>;
                    }} />
                    <Bar dataKey="DoanhThu" name="Doanh Thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Món Đồ Được Thuê Nhiều Nhất (Hiện tại)</h2>
          {mostPopularItems.length > 0 ? (
            <ul className="space-y-4">
              {mostPopularItems.map(item => (
                <li key={item.id} className="flex items-center space-x-4">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Số lượng đang thuê: {rentedItemCounts.get(item.id) || 0}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Chưa có món đồ nào đang được thuê.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Top 5 Khách Hàng Chi Tiêu Nhiều Nhất (Năm nay)</h2>
          {topSpendingCustomers.length > 0 ? (
            <ul className="space-y-4">
              {topSpendingCustomers.map(customer => (
                <li key={customer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                     <UserCircleIcon className="h-8 w-8 text-gray-400"/>
                     <p className="font-semibold text-gray-800 dark:text-white">{customer.name}</p>
                  </div>
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {customer.totalSpent.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu chi tiêu trong năm nay.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Lượt Thuê Quá Hạn</h2>
          {overdueRentals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Món Đồ</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày Hẹn Trả</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {overdueRentals.slice(0, 5).map(rental => (
                    <tr key={rental.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {rental.rentedItems.map(({ itemId, quantity }) => {
                            const item = clothingItemMap.get(itemId);
                            return `${item?.name || 'N/A'} (x${quantity})`;
                        }).join(', ')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-medium">
                        {format(parseISO(rental.dueDate), 'dd/MM/yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Không có lượt thuê nào quá hạn.</p>
          )}
        </Card>
      </div>
    </div>
  );
};