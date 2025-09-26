"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function ImageCarousel({ images }: { images: string[] }) {
    const [[index, direction], setIndex] = useState<[number, number]>([0, 0]);
    const paginate = (newDirection: number) => {
        setIndex(([i]) => {
            const next = (i + newDirection + images.length) % images.length;
            return [next, newDirection];
        });
    };
    return (
        <div className="relative overflow-hidden rounded-2xl">
            <div className="aspect-[16/10] w-full">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={index}
                        custom={direction}
                        initial={{ x: direction > 0 ? 100 : -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction > 0 ? -100 : 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="h-full w-full"
                    >
                        <Image src={images[index]} alt="Property image" width={1600} height={1000} className="h-full w-full object-cover" />
                    </motion.div>
                </AnimatePresence>
            </div>
            <button onClick={() => paginate(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1 text-sm shadow">Prev</button>
            <button onClick={() => paginate(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1 text-sm shadow">Next</button>
        </div>
    );
}


