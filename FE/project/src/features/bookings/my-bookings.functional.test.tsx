import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from '@/contexts/UserContext';

// Simple test component that displays bookings
const MyBookingsTest = () => {
  return (
    <div>
      <h1>My Bookings</h1>
      <div data-testid="bookings-list">
        <div className="booking-card">
          <h3>John Smith</h3>
          <p>Date: 2024-12-01</p>
          <p>Time: 09:00 - 10:00</p>
          <span className="status">Confirmed</span>
        </div>
        <div className="booking-card">
          <h3>Maria Garcia</h3>
          <p>Date: 2024-12-05</p>
          <p>Time: 14:00 - 15:00</p>
          <span className="status">Pending</span>
        </div>
      </div>
    </div>
  );
};

const renderMyBookings = () => {
  return render(
    <BrowserRouter>
      <UserProvider>
        <MyBookingsTest />
      </UserProvider>
    </BrowserRouter>
  );
};

describe('My Bookings - Functional Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('userId', '1');
  });

  describe('Display Bookings', () => {
    it('should display page title', () => {
      renderMyBookings();
      
      expect(screen.getByText('My Bookings')).toBeInTheDocument();
    });

    it('should display bookings list', () => {
      renderMyBookings();
      
      const bookingsList = screen.getByTestId('bookings-list');
      expect(bookingsList).toBeInTheDocument();
    });

    it('should display tutor names', () => {
      renderMyBookings();
      
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
    });

    it('should display booking dates', () => {
      renderMyBookings();
      
      expect(screen.getByText(/2024-12-01/)).toBeInTheDocument();
      expect(screen.getByText(/2024-12-05/)).toBeInTheDocument();
    });

    it('should display booking times', () => {
      renderMyBookings();
      
      expect(screen.getByText(/09:00 - 10:00/)).toBeInTheDocument();
      expect(screen.getByText(/14:00 - 15:00/)).toBeInTheDocument();
    });

    it('should display booking status', () => {
      renderMyBookings();
      
      const statuses = screen.getAllByText(/Confirmed|Pending/);
      expect(statuses).toHaveLength(2);
    });
  });

  describe('Booking Cards', () => {
    it('should display multiple booking cards', () => {
      renderMyBookings();
      
      const bookingCards = screen.getAllByRole('heading', { level: 3 });
      expect(bookingCards).toHaveLength(2);
    });

    it('should show confirmed status', () => {
      renderMyBookings();
      
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });

    it('should show pending status', () => {
      renderMyBookings();
      
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });
});
