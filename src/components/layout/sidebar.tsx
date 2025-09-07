"use client";

import { AddressCard } from "../address/address-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Address } from "@/types/address";

type SidebarProps = {
  addresses: Address[];
  onSelect?: (a: Address) => void;
};

export function Sidebar({ addresses, onSelect }: SidebarProps) {
  return (
    <aside className="min-w-90 border-r bg-background space-x-4">
      <ScrollArea className="h-full p-4">
        <div className="space-y-3 px-2">
          {addresses
            .slice()
            .reverse()
            .map((addr) => (
              <AddressCard key={addr.id} address={addr} onSelect={onSelect} />
            ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
