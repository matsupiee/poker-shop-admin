"use client";

import { useActionState, useEffect } from "react";
import { updatePlayer } from "@/app/actions/players";
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
import { Player } from "./player-list";

interface EditPlayerDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState = {
  errors: {},
  success: false,
};

export function EditPlayerDialog({
  player,
  open,
  onOpenChange,
}: EditPlayerDialogProps) {
  const [state, action, isPending] = useActionState(updatePlayer, initialState);

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
          <DialogTitle>プレイヤー情報編集</DialogTitle>
          <DialogDescription>
            プレイヤー情報を編集してください。
          </DialogDescription>
        </DialogHeader>
        <form action={action}>
          <input type="hidden" name="id" value={player.id} />
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="memberId" className="text-right">
                会員ID
              </Label>
              <div className="col-span-3">
                <Input
                  id="memberId"
                  name="memberId"
                  defaultValue={player.memberId}
                  placeholder="例: 1001"
                />
                {state.errors?.memberId && (
                  <p className="text-red-500 text-xs mt-1">
                    {state.errors.memberId[0]}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名前
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  name="name"
                  defaultValue={player.name}
                  placeholder="例: 山田 太郎"
                />
                {state.errors?.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {state.errors.name[0]}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gameId" className="text-right">
                ゲームID
              </Label>
              <div className="col-span-3">
                <Input
                  id="gameId"
                  name="gameId"
                  defaultValue={player.gameId ?? ""}
                  placeholder="任意"
                />
                {state.errors?.gameId && (
                  <p className="text-red-500 text-xs mt-1">
                    {state.errors.gameId[0]}
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
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
