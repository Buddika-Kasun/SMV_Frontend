import { ConsultancyAgreement, ConsultancyReturnRecord } from "../types";
import { recalculateConsultancyStatus } from "../utils/consultancyUtils";

export class ConsultancyService {
  private static instance: ConsultancyService;

  static getInstance(): ConsultancyService {
    if (!ConsultancyService.instance) {
      ConsultancyService.instance = new ConsultancyService();
    }
    return ConsultancyService.instance;
  }

  returnFunds(
    agreement: ConsultancyAgreement,
    returnRecord: ConsultancyReturnRecord,
  ): ConsultancyAgreement {
    return recalculateConsultancyStatus({
      ...agreement,
      status: "Returned & Closed",
      returnRecord,
    });
  }

  recalculateStatus(agreement: ConsultancyAgreement): ConsultancyAgreement {
    return recalculateConsultancyStatus(agreement);
  }
}

export const consultancyService = ConsultancyService.getInstance();
