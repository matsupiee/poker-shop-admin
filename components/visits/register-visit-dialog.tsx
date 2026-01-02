"use client";

import { useActionState, useEffect } from "react";
import { registerVisit } from "@/app/actions/visits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterVisitDialogProps {
  player: {
    id: string;
    name: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState = {
  errors: {},
  success: false,
};

export function RegisterVisitDialog({
  player,
  open,
  onOpenChange,
}: RegisterVisitDialogProps) {
  const [state, action, isPending] = useActionState(
    registerVisit,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>来店登録</DialogTitle>
          <DialogDescription>
            {player.name} さんの来店を登録します。
          </DialogDescription>
        </DialogHeader>
        <form action={action}>
          <input type="hidden" name="playerId" value={player.id} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entranceFee" className="text-right">
                入場料
              </Label>
              <div className="col-span-3">
                <Input
                  id="entranceFee"
                  name="entranceFee"
                  type="number"
                  placeholder="0"
                  min="0"
                  defaultValue={1000}
                />
                {state.errors?.entranceFee && (
                  <p className="text-red-500 text-xs mt-1">
                    {state.errors.entranceFee[0]}
                  </p>
                )}
              </div>
            </div>
            {state.errors?._form && (
              <div className="text-red-500 text-sm text-center">
                {state.errors._form[0]}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "登録中..." : "登録"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
