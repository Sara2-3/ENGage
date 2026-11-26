import { createContext, useCallback, useContext, useState } from 'react';
import { get_staffing_service } from '../Services/StaffingService';

// Context global
const StaffingContext = createContext({ staffing: [], getAllStaffing: async () => {} });

// Provider
const StaffingProvider = ({ children }) => {
  const [staffing, setStaffing] = useState([]);

  // GET ALL. The caller shows the error.
  const getAllStaffing = useCallback(async () => {
    setStaffing(await get_staffing_service());
  }, []);

  return <StaffingContext.Provider value={{ staffing, getAllStaffing }}>{children}</StaffingContext.Provider>;
};

const useStaffingContext = () => useContext(StaffingContext);

export { StaffingProvider, useStaffingContext };
