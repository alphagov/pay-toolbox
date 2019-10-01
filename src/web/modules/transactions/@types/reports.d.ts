declare module 'reports' {

  export interface PaymentsByStatusReport {
    success: number;
    declined: number;
    timedout: number;
    cancelled: number;
    error: number;
    created: number;
    started: number;
    submitted: number;
    capturable: number;
  }

  export interface PaymentsReport {
    count: number;
    gross_amount: number;
  }
}
