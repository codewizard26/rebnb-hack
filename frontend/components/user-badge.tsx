"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useEnsName } from "wagmi";
import { flowAuth, configureFlow } from "@/lib/flow";

function shorten(addr?: string | null) {
    if (!addr) return "";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function UserBadge() {
    const { address: evmAddress } = useAccount();
    const { data: ens } = useEnsName({ address: evmAddress });
    const [flowAddr, setFlowAddr] = useState<string | null>(null);

    useEffect(() => {
        configureFlow();
        return flowAuth.subscribe((u) => setFlowAddr(u.addr ?? null));
    }, []);

    const label = useMemo(() => {
        if (ens) return ens;
        if (evmAddress) return shorten(evmAddress);
        if (flowAddr) return shorten(flowAddr);
        return "Guest";
    }, [ens, evmAddress, flowAddr]);

    const initials = useMemo(() => {
        if (ens) return ens[0]?.toUpperCase();
        if (evmAddress) return evmAddress[2]?.toUpperCase();
        if (flowAddr) return flowAddr[0]?.toUpperCase();
        return "G";
    }, [ens, evmAddress, flowAddr]);

    return (
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-xs font-medium">
                    {initials}
                </div>
            </div>
            <span className="hidden text-sm text-muted-foreground sm:inline">{label}</span>
        </div>
    );
}


