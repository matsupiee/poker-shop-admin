"use client";

import { useActionState, useEffect, useState } from "react";
import { createTournament } from "@/app/actions/tournaments";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import {
  ChipEventOption,
  ChipEventOptionsForm,
} from "./chip-event-options-form";

const initialState = {
  errors: {},
  success: false,
};

const DEFAULT_CHIP_EVENT_OPTIONS: ChipEventOption[] = [
  { eventType: "ENTRY", name: "エントリー", chipAmount: 0, chargeAmount: 0 },
  { eventType: "ENTRY", name: "リエントリー", chipAmount: 0, chargeAmount: 0 },
  { eventType: "ENTRY", name: "シングル", chipAmount: 0, chargeAmount: 0 },
  { eventType: "ENTRY", name: "フル", chipAmount: 0, chargeAmount: 0 },
  {
    eventType: "ENTRY",
    name: "エントリーフリー",
    chipAmount: 0,
    chargeAmount: 0,
  },
  { eventType: "ADD_CHIP", name: "アドオン", chipAmount: 0, chargeAmount: 0 },
  {
    eventType: "ADD_CHIP",
    name: "アドオンフリー",
    chipAmount: 0,
    chargeAmount: 0,
  },
];

interface CreateTournamentDialogProps {
  onTournamentCreated?: () => void;
  children?: React.ReactNode;
}

export function CreateTournamentDialog({
  onTournamentCreated,
  children,
}: CreateTournamentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    if (onTournamentCreated) {
      onTournamentCreated();
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        {children ? (
          children
        ) : (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> 新規作成
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="h-full sm:max-w-[760px] flex flex-col">
        <DrawerHeader className="flex-none border-b">
          <DrawerTitle>トーナメント新規作成</DrawerTitle>
          <DrawerDescription>
            新しいトーナメントを作成します。
          </DrawerDescription>
        </DrawerHeader>
        <CreateTournamentForm onSuccess={handleSuccess} />
      </DrawerContent>
    </Drawer>
  );
}

function CreateTournamentForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, action, isPending] = useActionState(
    createTournament,
    initialState
  );
  const [prizes, setPrizes] = useState<Array<{ rank: number; amount: number }>>(
    Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, amount: 0 }))
  );
  const [hasBounty, setHasBounty] = useState(false);
  const [chipEventOptions, setChipEventOptions] = useState<ChipEventOption[]>(
    DEFAULT_CHIP_EVENT_OPTIONS
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  const addPrize = () => {
    setPrizes([...prizes, { rank: prizes.length + 1, amount: 0 }]);
  };

  const removePrize = (index: number) => {
    const newPrizes = prizes.filter((_, i) => i !== index);
    const reordered = newPrizes.map((p, i) => ({ ...p, rank: i + 1 }));
    setPrizes(reordered);
  };

  const updatePrize = (index: number, amount: number) => {
    const newPrizes = [...prizes];
    if (index > 0) {
      const higherRankAmount = newPrizes[index - 1].amount;
      if (amount > higherRankAmount) {
        return;
      }
    }
    newPrizes[index].amount = amount;
    for (let i = index + 1; i < newPrizes.length; i++) {
      if (newPrizes[i].amount > amount) {
        newPrizes[i].amount = amount;
      } else {
        break;
      }
    }
    setPrizes(newPrizes);
  };

  const formatRank = (rank: number) => {
    switch (rank) {
      case 1:
        return "1st";
      case 2:
        return "2nd";
      case 3:
        return "3rd";
      default:
        return `${rank}th`;
    }
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;

  return (
    <form action={action} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6">
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-6">
            <Label htmlFor="eventDate" className="text-right w-24">
              開催日
            </Label>
            <div>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                defaultValue={today}
                min={today}
                className="w-[200px]"
              />
              {state.errors?.eventDate && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.eventDate[0]}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Label htmlFor="startTime" className="text-right w-24">
              開始時刻
            </Label>
            <div>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue="19:00"
                className="w-[200px]"
              />
              {state.errors?.startTime && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.startTime[0]}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Label htmlFor="entryClosesTime" className="text-right w-24">
              締切時刻
            </Label>
            <div>
              <Input
                id="entryClosesTime"
                name="entryClosesTime"
                type="time"
                defaultValue="21:10"
                className="w-[200px]"
              />
              {state.errors?.entryClosesTime && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.entryClosesTime[0]}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Label htmlFor="name" className="text-right w-24">
              大会名
            </Label>
            <div>
              <Input
                id="name"
                name="name"
                placeholder="例: デイリーハイパーターボ"
                className="w-[300px]"
              />
              {state.errors?.name && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.name[0]}
                </p>
              )}
            </div>
          </div>

          {/* Prize Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-8">
              <Label>プライズ設定</Label>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {prizes.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  プライズ設定なし
                </div>
              )}
              {prizes.map((prize, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 flex-none flex items-center justify-center bg-muted h-10 rounded text-sm font-medium">
                    {formatRank(index + 1)}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        ¥
                      </span>
                      <Input
                        type="number"
                        value={prize.amount === 0 ? "" : prize.amount}
                        onChange={(e) =>
                          updatePrize(index, Number(e.target.value))
                        }
                        className="pl-7 w-[200px]"
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrize(index)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed mt-2"
                onClick={addPrize}
              >
                <Plus className="h-4 w-4 mr-1" /> 追加
              </Button>
            </div>
            <input type="hidden" name="prizes" value={JSON.stringify(prizes)} />
          </div>

          <ChipEventOptionsForm
            options={chipEventOptions}
            onChange={setChipEventOptions}
          />

          {/* Bounty Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasBounty"
                name="hasBounty"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={hasBounty}
                onChange={(e) => setHasBounty(e.target.checked)}
              />
              <Label htmlFor="hasBounty">バウンティあり</Label>
            </div>

            {hasBounty && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bountyTicketCount" className="text-right">
                    チケット枚数
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="bountyTicketCount"
                      name="bountyTicketCount"
                      type="number"
                      min="1"
                      defaultValue="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bountyTotalAmount" className="text-right">
                    バウンティ総額
                  </Label>
                  <div className="col-span-3 pb-2 relative">
                    <span className="absolute left-3 top-[calc(50%-4px)] -translate-y-1/2 text-muted-foreground text-sm z-10">
                      ¥
                    </span>
                    <Input
                      id="bountyTotalAmount"
                      name="bountyTotalAmount"
                      type="number"
                      min="0"
                      className="pl-7"
                      placeholder="0"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {state.errors?._form && (
            <div className="text-red-500 text-sm text-center">
              {state.errors._form[0]}
            </div>
          )}
        </div>
      </div>
      <DrawerFooter className="flex-none border-t bg-background">
        <Button type="submit" disabled={isPending}>
          {isPending ? "作成中..." : "作成"}
        </Button>
      </DrawerFooter>
    </form>
  );
}
