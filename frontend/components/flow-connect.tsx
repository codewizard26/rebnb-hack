"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { configureFlow, flowAuth } from "@/lib/flow";

type FlowUser = { addr?: string | null };

export function FlowConnectButton() {
    const [user, setUser] = useState<FlowUser>({});
    useEffect(() => {
        configureFlow();
        return flowAuth.subscribe((u) => setUser({ addr: u.addr }));
    }, []);

    if (user.addr) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Flow</span>
                <Button variant="outline" onClick={() => flowAuth.logOut()}>
                    {user.addr.slice(0, 6)}...{user.addr.slice(-4)}
                </Button>
            </div>
        );
    }

    return (
        <Button variant="outline" onClick={() => flowAuth.logIn()}>
            Connect Flow
        </Button>
    );
}


