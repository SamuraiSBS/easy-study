import { ClipboardList, Home, MessageSquareText, PackageOpen, Star } from "lucide-react";
import type { JSX } from "react";
import type { Screen } from "../screens";

type BottomNavProps = {
  active: Screen;
  onChange: (screen: Screen) => void;
};

const items: Array<{ screen: Screen; label: string; icon: typeof Home }> = [
  { screen: "home", label: "Главная", icon: Home },
  { screen: "services", label: "Услуги", icon: PackageOpen },
  { screen: "order", label: "Заказ", icon: ClipboardList },
  { screen: "orders", label: "Мои", icon: MessageSquareText },
  { screen: "reviews", label: "Отзывы", icon: Star },
];

export function BottomNav({ active, onChange }: BottomNavProps): JSX.Element {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.screen;
        return (
          <button
            key={item.screen}
            className={isActive ? "nav-item active" : "nav-item"}
            type="button"
            onClick={() => onChange(item.screen)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
