import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { CreatePatient, getPatients, EditPatients, DeletePatient } from "../services/patients";
import { AddDoctor, getDoctors } from "../services/doctor";
import { createAppointment, getAppointments, updateAppointment, deleteAppointment } from "../services/appointments";
import { getPrescriptions } from "../services/prescriptions";
import { getStaff } from "../services/staff";
import { axiosInstance } from "../services/axiosInstance";
import { normalizeRole, canAccessRoute, hasPermission as rbacHasPermission } from "../utils/rbac";

export const ContextProvider = createContext();
export const useAuth = () => useContext(ContextProvider);

function StoreManagement({ children }) {
    const userString = localStorage.getItem("user");
    const userdata = userString ? JSON.parse(userString) : null;
    const token = userdata?.token || userdata?.data?.token || userdata?.accessToken || userdata?.data?.accessToken;

    const [user, setUser] = useState(userString);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!token);
    const [Patients, setPatients] = useState([]);
    const [Doctors, setDoctors] = useState([]);
    const [Appointments, setAppointments] = useState([]);
    const [Prescriptions, setPrescriptions] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [loading, setLoading] = useState({ patients: true, doctors: true, appointments: true, prescriptions: true });
    const [isEditClick, setIsEditClick] = useState(false);
    const [selectedPatientData, setSelectedPatientData] = useState(null);

    // Dynamic permissions state for staff members
    const [staffPermissions, setStaffPermissions] = useState(() => {
        try {
            const raw = userString || localStorage.getItem("user");
            if (!raw) return [];
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            const u = parsed?.data?.user || parsed?.user || parsed?.data?.staff || parsed?.staff || parsed?.data || parsed;
            return Array.isArray(u?.permissions) ? u.permissions : [];
        } catch {
            return [];
        }
    });

    // Synchronize staffPermissions whenever user state updates
    useEffect(() => {
        if (user) {
            try {
                const parsed = typeof user === "string" ? JSON.parse(user) : user;
                const u = parsed?.data?.user || parsed?.user || parsed?.data?.staff || parsed?.staff || parsed?.data || parsed;
                if (Array.isArray(u?.permissions)) {
                    setStaffPermissions(u.permissions);
                }
            } catch (e) {
                console.warn('Error syncing staff permissions from user state:', e);
            }
        }
    }, [user]);

    // Parse current logged-in user and role dynamically
    const currentUser = useMemo(() => {
        try {
            const raw = user || localStorage.getItem("user");
            if (!raw) return null;
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            const baseUser = parsed?.data?.user || parsed?.user || parsed?.data?.patient || parsed?.patient || parsed?.data?.doctor || parsed?.doctor || parsed?.data?.staff || parsed?.staff || parsed?.data || parsed;
            if (!baseUser) return null;

            const perms = Array.isArray(baseUser.permissions)
                ? baseUser.permissions
                : (Array.isArray(staffPermissions) ? staffPermissions : []);

            const clinicId = baseUser.clinicId || parsed?.data?.clinic?._id || parsed?.clinic?._id || null;
            const clinicName = baseUser.clinicName || parsed?.data?.clinic?.name || parsed?.clinic?.name || null;

            return {
                ...baseUser,
                clinicId,
                clinicName,
                permissions: perms,
            };
        } catch {
            return null;
        }
    }, [user, staffPermissions]);

    const userRole = useMemo(() => {
        const rawRole = currentUser?.role || currentUser?.employment || currentUser?.designation || currentUser?.type || currentUser?.accountType || (currentUser?.patient ? 'patient' : null);
        return normalizeRole(rawRole);
    }, [currentUser]);

    // Proactively re-sync staff permissions from the backend staff registry on load / refresh
    useEffect(() => {
        if (!token || userRole !== 'staff') return;

        let isMounted = true;
        const syncFromServer = async () => {
            try {
                const staffRes = await getStaff(token);
                const staffList = Array.isArray(staffRes?.data) ? staffRes.data : Array.isArray(staffRes) ? staffRes : [];
                const userEmail = (currentUser?.email || '').toLowerCase().trim();
                const userId = String(currentUser?._id || currentUser?.id || '');
                const userName = (currentUser?.name || currentUser?.fullName || '').toLowerCase().trim();

                const matched = staffList.find(s => 
                    (s.email && s.email.toLowerCase().trim() === userEmail) ||
                    (s.employeeuserId && String(s.employeeuserId) === userId) ||
                    (s._id && String(s._id) === userId) ||
                    (s.fullName && s.fullName.toLowerCase().trim() === userName)
                );

                if (isMounted && matched && Array.isArray(matched.permissions)) {
                    setStaffPermissions(matched.permissions);
                    try {
                        const raw = localStorage.getItem("user");
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            const target = parsed?.data?.user || parsed?.user || parsed?.data?.staff || parsed?.staff || parsed?.data || parsed;
                            if (target && typeof target === 'object') {
                                target.permissions = matched.permissions;
                                localStorage.setItem("user", JSON.stringify(parsed));
                            }
                        }
                    } catch {}
                }
            } catch (err) {
                console.warn('Could not sync staff permissions from server in store:', err);
            }
        };

        syncFromServer();
        return () => { isMounted = false; };
    }, [token, userRole, currentUser?.email, currentUser?._id, currentUser?.id]);

    const canAccess = useCallback((path) => canAccessRoute(path, userRole, currentUser), [userRole, currentUser]);
    const hasPermission = useCallback((permission) => rbacHasPermission(permission, currentUser), [currentUser]);

    const getAllPatience = useCallback(async () => {
        if (!token) return [];
        setLoading((current) => ({ ...current, patients: true }));
        try {
            const res = await getPatients(token);
            console.log('response', res);
            const list = Array.isArray(res?.data?.data)
                ? res.data.data
                : Array.isArray(res?.data?.patients)
                ? res.data.patients
                : Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                ? res
                : [];
            setPatients(list);
            return list;
        } catch (error) {
            console.error('error getting patients', error);
            setPatients([]);
            return [];
        } finally {
            setLoading((current) => ({ ...current, patients: false }));
        }
    }, [token]);

    const getAllDoctor = useCallback(async () => {
        if (!token) return [];
        setLoading((current) => ({ ...current, doctors: true }));
        try {
            const getalldoctor = await getDoctors(token);
            console.log('getting all doctor', getalldoctor);
            setDoctors(getalldoctor);
            return getalldoctor;
        } catch (error) {
            console.log('error', error);
            return [];
        } finally {
            setLoading((current) => ({ ...current, doctors: false }));
        }
    }, [token]);

    const getAllAppointments = useCallback(async () => {
        if (!token) return [];
        setLoading((current) => ({ ...current, appointments: true }));
        try {
            const res = await getAppointments(token);
            console.log('getting all appointments', res);
            const list = res?.data || res || [];
            setAppointments(list);
            return list;
        } catch (error) {
            console.log('error getting appointments', error);
            return [];
        } finally {
            setLoading((current) => ({ ...current, appointments: false }));
        }
    }, [token]);

    const getAllPrescriptions = useCallback(async () => {
        if (!token) return [];
        setLoading((current) => ({ ...current, prescriptions: true }));
        try {
            const res = await getPrescriptions(token);
            const prescriptions = res?.data || res?.prescriptions || res || [];
            const list = Array.isArray(prescriptions) ? prescriptions : [];
            setPrescriptions(list);
            return list;
        } catch (error) {
            console.log('error getting prescriptions', error);
            setPrescriptions([]);
            return [];
        } finally {
            setLoading((current) => ({ ...current, prescriptions: false }));
        }
    }, [token]);

    const PatientCreate = useCallback(async (formData) => {
        try {
            const res = await CreatePatient(formData, token);
            await getAllPatience();
            return res;
        } catch (error) {
            throw error;
        }
    }, [token, getAllPatience]);

    const PatientEdit = useCallback(async (id, formData) => {
        try {
            const res = await EditPatients(token, id, formData);
            await getAllPatience();
            return res;
        } catch (error) {
            throw error;
        }
    }, [token, getAllPatience]);

    const CreateDoctor = useCallback(async (formData) => {
        try {
            const response = await AddDoctor(token, formData);
            console.log('response to create doctor', response);
            await getAllDoctor();
            return response;
        } catch (err) {
            throw err;
        }
    }, [token, getAllDoctor]);

    const AppointmentCreate = useCallback(async (formData) => {
        try {
            const response = await createAppointment(token, formData);
            console.log('response to create appointment', response);
            await getAllAppointments();
            return response;
        } catch (err) {
            throw err;
        }
    }, [token, getAllAppointments]);

    const AppointmentUpdate = useCallback(async (fomdata, id) => {
        try {
            const res = await updateAppointment(token, id, fomdata);
            await getAllAppointments();
            return res;
        } catch (error) {
            console.log('error', error);
        }
    }, [token, getAllAppointments]);

    const AppointmentDelete = useCallback(async (id) => {
        try {
            const res = await deleteAppointment(token, id);
            await getAllAppointments();
            return res;
        } catch (error) {
            console.log('error deleting appointment', error);
            throw error;
        }
    }, [token, getAllAppointments]);

    const PatientDelete = useCallback(async (id) => {
        try {
            await DeletePatient(token, id);
            await getAllPatience();
        } catch (error) {
            console.log('error deleting patient', error);
            throw error;
        }
    }, [token, getAllPatience]);

    const DoctorEdit = useCallback(async (id, formData) => {
        try {
            const finaldata = {
                ...formData,
                working_days: typeof formData.working_days === 'string' ? formData.working_days.split(',').map(day => day.trim()) : formData.working_days
            };
            const res = await axiosInstance.post(`/doctors/${id}`, finaldata, {
                headers: { authorization: `Bearer ${token}` }
            });
            await getAllDoctor();
            return res.data;
        } catch (error) {
            console.log('error editing doctor', error);
            throw error;
        }
    }, [token, getAllDoctor]);

    const DoctorDelete = useCallback(async (id) => {
        try {
            await axiosInstance.post(`/doctors/delete/${id}`, {}, {
                headers: { authorization: `Bearer ${token}` }
            });
            await getAllDoctor();
        } catch (error) {
            console.log('error deleting doctor', error);
            throw error;
        }
    }, [token, getAllDoctor]);

    const syncStaffPermissions = useCallback(async () => {
        if (!token) return;
        try {
            const res = await getStaff(token);
            const staffList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            if (!staffList.length) return;

            const raw = localStorage.getItem('user');
            const parsed = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
            const cu = parsed?.data?.user || parsed?.user || parsed?.data?.staff || parsed?.staff || parsed?.data || parsed;

            const email = (cu?.email || '').toLowerCase().trim();
            const uid = String(cu?._id || cu?.id || '');
            const name = (cu?.name || cu?.fullName || '').toLowerCase().trim();

            const matched = staffList.find((s) => {
                const sEmail = (s.email || '').toLowerCase().trim();
                const sEmpId = String(s.employeeuserId || '');
                const sId = String(s._id || s.id || '');
                const sName = (s.fullName || s.name || '').toLowerCase().trim();

                return (
                    (email && sEmail && sEmail === email) ||
                    (uid && sEmpId && sEmpId === uid) ||
                    (uid && sId && sId === uid) ||
                    (name && sName && sName === name)
                );
            });

            if (matched && Array.isArray(matched.permissions)) {
                // Prevent state update if permissions are identical
                setStaffPermissions((prev) => {
                    if (
                        Array.isArray(prev) &&
                        prev.length === matched.permissions.length &&
                        prev.every((val, idx) => val === matched.permissions[idx])
                    ) {
                        return prev;
                    }
                    return matched.permissions;
                });

                // Update localStorage so rbac.js getCurrentUser() picks it up immediately
                try {
                    if (raw) {
                        const parsedUser = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        const applyUpdate = (target) => {
                            if (target && typeof target === 'object') {
                                target.permissions = matched.permissions;
                                if (matched.employment) target.employment = matched.employment;
                                if (matched.designation) target.designation = matched.designation;
                            }
                        };

                        if (parsedUser.data?.user) applyUpdate(parsedUser.data.user);
                        if (parsedUser.user) applyUpdate(parsedUser.user);
                        if (parsedUser.data?.staff) applyUpdate(parsedUser.data.staff);
                        if (parsedUser.staff) applyUpdate(parsedUser.staff);
                        if (parsedUser.data && !parsedUser.data.user) applyUpdate(parsedUser.data);

                        localStorage.setItem('user', JSON.stringify(parsedUser));
                    }
                } catch (e) {
                    console.error('Error saving updated permissions to localStorage:', e);
                }
            }
        } catch (error) {
            console.warn('Could not sync staff permissions:', error);
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            setDashboardLoading(false);
            return;
        }

        setDashboardLoading(true);
        Promise.allSettled([
            getAllPatience(),
            getAllDoctor(),
            getAllAppointments(),
            getAllPrescriptions(),
            syncStaffPermissions()
        ]).finally(() => setDashboardLoading(false));
    }, [token, getAllPatience, getAllDoctor, getAllAppointments, getAllPrescriptions, syncStaffPermissions]);

    const contextValue = useMemo(() => ({
        user, setUser, token, currentUser, userRole, canAccess, hasPermission,
        selectedPatientData, setSelectedPatientData,
        Patients, PatientCreate, PatientEdit, PatientDelete, getAllPatience,
        CreateDoctor, Doctors, DoctorEdit, DoctorDelete,
        Appointments, AppointmentCreate, getAllAppointments,
        Prescriptions, getAllPrescriptions, dashboardLoading, loading,
        setIsEditClick, isEditClick, AppointmentUpdate, AppointmentDelete,
        setIsAuthenticated, isAuthenticated,
        syncStaffPermissions, staffPermissions
    }), [
        user, token, currentUser, userRole, canAccess, hasPermission,
        selectedPatientData, Patients, PatientCreate, PatientEdit, PatientDelete, getAllPatience,
        CreateDoctor, Doctors, DoctorEdit, DoctorDelete,
        Appointments, AppointmentCreate, getAllAppointments,
        Prescriptions, getAllPrescriptions, dashboardLoading, loading,
        isEditClick, AppointmentUpdate, AppointmentDelete,
        isAuthenticated, syncStaffPermissions, staffPermissions
    ]);

    return (
        <ContextProvider.Provider value={contextValue}>
            {children}
        </ContextProvider.Provider>
    );
}

export default StoreManagement;
