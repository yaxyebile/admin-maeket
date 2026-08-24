import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./useAuthStore";
import Layout from "./Layout";
import LoginPage from "./LoginPage";
import DashboardPage from "./DashboardPage";
import ProductsPage from "./ProductsPage";

// PLACEHOLDERS / STUBS for files they can create or we also provide:
const UsersPage = () => <div className="p-6 text-white font-medium">Users Management Interface</div>;
const StoresPage = () => <div className="p-6 text-white font-medium">Stores Management Interface</div>;
const OrdersPage = () => <div className="p-6 text-white font-medium">Orders Management Interface</div>;
const SecondHandPage = () => <div className="p-6 text-white font-medium">Second Hand Items Interface</div>;
const PropertyListingsPage = () => <div className="p-6 text-white font-medium">Property Listings Interface</div>;
const PropertyBookingsPage = () => <div className="p-6 text-white font-medium">Property Bookings Interface</div>;
const SecondHandBookingsPage = () => <div className="p-6 text-white font-medium">Second Hand Bookings Interface</div>;
const TechniciansPage = () => <div className="p-6 text-white font-medium">Technicians Interface</div>;
const TechnicianBookingsPage = () => <div className="p-6 text-white font-medium">Technician Bookings Interface</div>;
const CargoAdsPage = () => <div className="p-6 text-white font-medium">Cargo Ads Interface</div>;
const PromosPage = () => <div className="p-6 text-white font-medium">Promos / Banners Interface</div>;
const RevenuePage = () => <div className="p-6 text-white font-medium">Revenue & Financial Reports Interface</div>;
const NotificationsPage = () => <div className="p-6 text-white font-medium">Notifications & Broadcast Interface</div>;

// Store Manager Dashboard Placeholder
const StoreDashboardPage = () => <div className="p-6 text-white font-medium">Store Dashboard (Store Manager Mode)</div>;

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ("admin" | "staff" | "delivery" | "user")[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, loading, checkSession } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        checkSession();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-emerald-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
                    <span className="text-sm font-semibold tracking-wider">Verifying EMARA credentials...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect appropriately by role default route
        if (user.role === "admin") {
            return <Navigate to="/dashboard" replace />;
        } else if (user.role === "staff") {
            return <Navigate to="/store" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default function App() {
    const { checkSession } = useAuthStore();

    useEffect(() => {
        checkSession();
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public login Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Super Admin Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="stores" element={<StoresPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="second-hand" element={<SecondHandPage />} />
                    <Route path="properties" element={<PropertyListingsPage />} />
                    <Route path="property-bookings" element={<PropertyBookingsPage />} />
                    <Route path="second-hand-bookings" element={<SecondHandBookingsPage />} />
                    <Route path="technicians" element={<TechniciansPage />} />
                    <Route path="technician-bookings" element={<TechnicianBookingsPage />} />
                    <Route path="cargo" element={<CargoAdsPage />} />
                    <Route path="promos" element={<PromosPage />} />
                    <Route path="revenue" element={<RevenuePage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                </Route>

                {/* Store Manager / Staff Protected Routes */}
                <Route
                    path="/store"
                    element={
                        <ProtectedRoute allowedRoles={["staff"]}>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<StoreDashboardPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
