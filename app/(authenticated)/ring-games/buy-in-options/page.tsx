
import { BuyInOptionList } from '@/components/ring-games/buy-in-option-list';
import { getRingGameBuyInOptions } from '@/app/actions/ring-game-buy-in-options';

export default async function BuyInOptionsPage() {
    const options = await getRingGameBuyInOptions();

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">リングゲーム バイインオプション管理</h1>
            <BuyInOptionList options={options} />
        </div>
    );
}
