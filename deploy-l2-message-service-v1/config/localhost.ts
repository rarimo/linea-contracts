import * as process from "process";

export const SECURITY_COUNCIL = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
export const MESSAGE_SETTER =
  process.env.L2MSGSERVICE_L1L2_MESSAGE_SETTER || "0xd42e308fc964b71e18126df469c21b0d7bcb86cc";
export const RATE_LIMIT_PERIOD = 86400;
export const RATE_LIMIT_AMOUNT = 1000000000000000000000n;
