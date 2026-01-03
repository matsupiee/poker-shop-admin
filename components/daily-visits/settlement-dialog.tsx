"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DailyVisit,
  getVisitSettlementDetails,
  settleVisit,
  VisitSettlementDetails,
} from "@/app/actions/visits";
import { calcFinalNetAmount, calcTax } from "@/lib/settlement/calc";

type SettlementDialogProps = {
  visitId: string;
  playerName: string;
  webCoinBalance: number;
  settlement: DailyVisit["settlement"];
  onSuccess?: () => void;
};

export const CONSUMPTION_TAX_RATE = 0.1;

export function SettlementDialog({
  visitId,
  playerName,
  webCoinBalance,
  settlement,
  onSuccess,
}: SettlementDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [visitSettlementDetails, setVisitSettlementDetails] =
    React.useState<VisitSettlementDetails | null>(null);

  const [depositToSavings, setDepositToSavings] = React.useState(false); // Default false or maybe true? User preference.
  const [webCoinWithdrawal, setWebCoinWithdrawal] = React.useState<string>("");

  const [submitting, setSubmitting] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  // Calculate details when dialog opens
  React.useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);

    getVisitSettlementDetails(visitId)
      .then((data) => {
        setVisitSettlementDetails(data);
      })
      .catch(() => {
        setError("明細の取得に失敗しました");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, visitId]);

  const isSettled = !!settlement;

  // Calculate final net amount after web coin withdrawal and tax
  const webCoinWithdrawAmount = parseInt(webCoinWithdrawal) || 0;

  const { consumptionTax } = visitSettlementDetails
    ? calcTax({
        visitSettlementDetails,
        webCoinWithdrawAmount,
      })
    : { consumptionTax: 0 };

  const finalNetAmount = settlement
    ? settlement.netAmount
    : visitSettlementDetails
      ? calcFinalNetAmount({
          visitSettlementDetails,
          webCoinWithdrawAmount,
          consumptionTax,
        })
      : 0;

  const handleSettle = async () => {
    setSubmitting(true);
    setError(null);

    if (webCoinWithdrawAmount > webCoinBalance) {
      setError(
        `web貯金コイン残高(${webCoinBalance.toLocaleString()}コイン)を超える額は入力できません`
      );
      setSubmitting(false);
      return;
    }

    try {
      const result = await settleVisit({
        visitId,
        depositToSavings,
        webCoinWithdrawAmount,
      });
      if (result.success) {
        setOpen(false);
        onSuccess?.();
      } else {
        setError(result.error || "エラーが発生しました");
      }
    } catch {
      setError("予期せぬエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isSettled ? "secondary" : "default"}
          size="sm"
          className={cn(
            isSettled && "bg-green-100 text-green-700 hover:bg-green-200"
          )}
        >
          {isSettled ? (
            <CheckCircle2 className="w-4 h-4 mr-1" />
          ) : (
            <Receipt className="w-4 h-4 mr-1" />
          )}
          {isSettled ? "決済済" : "会計"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>お会計プレビュー</DialogTitle>
          <DialogDescription>
            {playerName} 様の本日のお会計詳細です。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                  {error}
                </div>
              )}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-4 space-y-4">
                  <SettlementBreakdown
                    groupIndex={0}
                    groupName="トーナメント"
                    items={[
                      {
                        label: "トーナメント参加費",
                        amount:
                          visitSettlementDetails?.tournament
                            .totalChargeAmount || 0,
                      },
                      {
                        label: "獲得prize",
                        amount:
                          visitSettlementDetails?.tournament.totalPrizeAmount ||
                          0,
                      },
                    ]}
                  />
                  <SettlementBreakdown
                    groupIndex={1}
                    groupName="webコイン リングゲーム"
                    items={[
                      {
                        label: "収支(チップ×50で計算)",
                        amount: visitSettlementDetails
                          ? visitSettlementDetails.webCoinRing.totalCashOut -
                            visitSettlementDetails.webCoinRing.totalBuyIn
                          : 0,
                      },
                    ]}
                  />
                  <SettlementBreakdown
                    groupIndex={2}
                    groupName="店内リングゲーム"
                    items={[
                      {
                        label: "引き出し費用",
                        amount: -(
                          visitSettlementDetails?.inStoreRing.withdrawFee || 0
                        ),
                      },
                      {
                        label: "BUY_IN費用",
                        amount: -(
                          visitSettlementDetails?.inStoreRing.totalBuyInFee || 0
                        ),
                      },
                    ]}
                  />

                  <SettlementBreakdown
                    groupIndex={3}
                    groupName="その他"
                    items={[
                      {
                        label: "消費税",
                        amount: -consumptionTax,
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Web Coin Withdraw Section */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="webCoinWithdrawal"
                    className="text-sm font-medium"
                  >
                    預けているwebコインを使う
                  </label>
                  <span className="text-xs text-muted-foreground">
                    残高: {webCoinBalance.toLocaleString()}コイン
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    id="webCoinWithdrawal"
                    type="number"
                    min="0"
                    max={webCoinBalance}
                    placeholder="0"
                    value={
                      settlement
                        ? (
                            settlement.webCoinWithdraw?.withdrawAmount || 0
                          ).toLocaleString()
                        : webCoinWithdrawal
                    }
                    onChange={(e) => setWebCoinWithdrawal(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    コイン
                  </span>
                </div>
              </div>

              {/* Final Net Amount Display */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-900">
                    最終収支
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold font-mono",
                      finalNetAmount > 0
                        ? "text-green-600"
                        : finalNetAmount < 0
                          ? "text-red-500"
                          : "text-gray-600"
                    )}
                  >
                    {finalNetAmount > 0 ? "+" : ""}
                    {finalNetAmount.toLocaleString()}円
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                {finalNetAmount < 0 ? (
                  <span>
                    プレイヤーが{" "}
                    <span className="font-bold text-red-500">
                      {Math.abs(finalNetAmount).toLocaleString()}
                    </span>{" "}
                    円支払います
                  </span>
                ) : finalNetAmount > 0 ? (
                  <span>
                    {depositToSavings ? (
                      <>
                        <span className="font-bold text-green-600">
                          {finalNetAmount.toLocaleString()}
                        </span>
                        <span> 円を貯コインします</span>
                      </>
                    ) : (
                      <>
                        <span>お店が </span>
                        <span className="font-bold text-green-600">
                          {finalNetAmount.toLocaleString()}
                        </span>
                        <span> webコインを支払います</span>
                      </>
                    )}
                  </span>
                ) : (
                  <span>精算額はありません</span>
                )}
              </div>
            </div>
          )}
          {finalNetAmount > 0 && (
            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="deposit"
                checked={depositToSavings}
                onChange={(e) => setDepositToSavings(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
              />
              <label
                htmlFor="deposit"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                貯コインする
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSettle}
            disabled={loading || submitting || isSettled}
            className={cn(
              finalNetAmount > 0 ? "bg-green-600 hover:bg-green-700" : ""
            )}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            決済を確定する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettlementBreakdown({
  groupIndex,
  groupName,
  items,
}: {
  groupIndex: number;
  groupName: string;
  items: {
    label: string;
    amount: number;
  }[];
}) {
  return (
    <div
      className={cn(
        "space-y-2",
        groupIndex > 0 && "pt-2 border-t border-dashed"
      )}
    >
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {groupName}
      </h4>
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex justify-between items-center text-sm"
          >
            <span className="text-muted-foreground">{item.label}</span>
            <span
              className={cn(
                "font-mono font-medium",
                item.amount > 0
                  ? "text-green-600"
                  : item.amount < 0
                    ? "text-red-500"
                    : "text-gray-600"
              )}
            >
              {item.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
