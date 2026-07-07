"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Title from "@/components/Title";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ slots: 0, bookings: 0, users: 0, shifts: 0 });

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, "availability_slots"), (s) => setStats((p) => ({ ...p, slots: s.size }))),
      onSnapshot(collection(db, "bookings"), (s) => setStats((p) => ({ ...p, bookings: s.size }))),
      onSnapshot(collection(db, "users"), (s) => setStats((p) => ({ ...p, users: s.size }))),
      onSnapshot(collection(db, "staff_shifts"), (s) => setStats((p) => ({ ...p, shifts: s.size }))),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const cards = [
    { label: "Slots", value: stats.slots },
    { label: "Bookings", value: stats.bookings },
    { label: "Users", value: stats.users },
    { label: "Shifts", value: stats.shifts },
  ];

  return (
    <div>
      <Title heading="Admin dashboard" description="Overview of your RotaBook workspace" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-panel rounded-2xl p-6">
            <p className="text-sm text-gray-400">{c.label}</p>
            <p className="text-3xl font-semibold mt-2">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
