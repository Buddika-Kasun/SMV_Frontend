// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
// } from "react";
// import { INITIAL_CONSULTANCIES } from "../data/initialConsultancies";
// import { consultancyService } from "../services/consultancy.service";
// import { storageService } from "../services/storage.service";
// import toast from "react-hot-toast";
// import { ConsultancyAgreement } from "../api";

// const STORAGE_KEY = "instalend_finance_consultancies_v1";

// interface ConsultancyContextType {
//   consultancies: ConsultancyAgreement[];
//   activeConsultancyCount: number;
//   onboardConsultancy: (agreement: ConsultancyAgreement) => void;
//   returnFunds: (
//     agreementId: string,
//     returnRecord: ConsultancyReturnRecord,
//   ) => void;
//   resetConsultancies: () => void;
// }

// const ConsultancyContext = createContext<ConsultancyContextType | undefined>(
//   undefined,
// );

// export const ConsultancyProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [consultancies, setConsultancies] = useState<ConsultancyAgreement[]>(
//     () => {
//       return storageService.get(STORAGE_KEY, INITIAL_CONSULTANCIES);
//     },
//   );

//   useEffect(() => {
//     storageService.set(STORAGE_KEY, consultancies);
//   }, [consultancies]);

//   const activeConsultancyCount = consultancies.filter(
//     (c) => c.status !== "Returned & Closed",
//   ).length;

//   const onboardConsultancy = useCallback(
//     (newAgreement: ConsultancyAgreement) => {
//       setConsultancies((prev) => [newAgreement, ...prev]);
//       toast.success(
//         `Consultancy agreement #${newAgreement.agreementNumber} onboarded successfully!`,
//       );
//     },
//     [],
//   );

//   const returnFunds = useCallback(
//     (agreementId: string, returnRecord: ConsultancyReturnRecord) => {
//       setConsultancies((prev) =>
//         prev.map((c) => {
//           if (c.id === agreementId) {
//             return consultancyService.returnFunds(c, returnRecord);
//           }
//           return c;
//         }),
//       );
//       toast.success("Placement funds returned and agreement marked closed.");
//     },
//     [],
//   );

//   const resetConsultancies = useCallback(() => {
//     storageService.remove(STORAGE_KEY);
//     setConsultancies(INITIAL_CONSULTANCIES);
//     toast.success("Consultancy data reset.");
//   }, []);

//   const value = {
//     consultancies,
//     activeConsultancyCount,
//     onboardConsultancy,
//     returnFunds,
//     resetConsultancies,
//   };

//   return (
//     <ConsultancyContext.Provider value={value}>
//       {children}
//     </ConsultancyContext.Provider>
//   );
// };

// export const useConsultancies = () => {
//   const context = useContext(ConsultancyContext);
//   if (!context) {
//     throw new Error("useConsultancies must be used within ConsultancyProvider");
//   }
//   return context;
// };
