import {Charge} from "./types";

export interface GatewayStatusComparison {
    payStatus: string;
    payExternalStatus: string;
    gatewayStatus: string;
    chargeId: string;
    rawGatewayResponse: string;
    charge: Charge;
    processed: boolean;
}