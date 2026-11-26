import { createContext, useCallback, useContext, useState } from 'react';
import { get_cases_overview_service } from '../Services/CaseService';

// Context global
const CaseContext = createContext({ cases: [], getAllCases: async () => {} });

// Provider
const CaseProvider = ({ children }) => {
  const [cases, setCases] = useState([]);

  // GET ALL. The caller shows the error.
  const getAllCases = useCallback(async () => {
    setCases(await get_cases_overview_service());
  }, []);

  return <CaseContext.Provider value={{ cases, getAllCases }}>{children}</CaseContext.Provider>;
};

const useCaseContext = () => useContext(CaseContext);

export { CaseProvider, useCaseContext };
