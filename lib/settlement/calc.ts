import { VisitSettlementDetails } from "@/app/actions/visits";
import { CONSUMPTION_TAX_RATE } from "./const";

export const calcTax = (input: {
  visitSettlementDetails: VisitSettlementDetails;
  webCoinWithdrawAmount: number;
}) => {
  const {
    visitSettlementDetails: { webCoinRing, tournament },
    webCoinWithdrawAmount,
  } = input;

  const webCoinRingNet = webCoinRing.totalCashOut - webCoinRing.totalBuyIn;

  const net =
    webCoinRingNet + tournament.totalPrizeAmount + webCoinWithdrawAmount;
  if (net > 0) {
    return {
      consumptionTax: 0,
    };
  }

  const taxableAmount = Math.abs(net);
  return {
    consumptionTax: taxableAmount * CONSUMPTION_TAX_RATE,
  };
};

export const calcFinalNetAmount = (input: {
  visitSettlementDetails: VisitSettlementDetails;
  consumptionTax: number;
  webCoinWithdrawAmount: number;
}) => {
  const {
    visitSettlementDetails: { webCoinRing, tournament, inStoreRing },
    consumptionTax,
    webCoinWithdrawAmount,
  } = input;

  const plusItems = [
    webCoinRing.totalCashOut,
    tournament.totalPrizeAmount,
    webCoinWithdrawAmount,
  ];
  const minusItems = [
    webCoinRing.totalBuyIn,
    tournament.totalChargeAmount,
    inStoreRing.totalBuyInFee,
    inStoreRing.withdrawFee,
    consumptionTax,
  ];

  return (
    plusItems.reduce((acc, item) => acc + item, 0) -
    minusItems.reduce((acc, item) => acc + item, 0)
  );
};
