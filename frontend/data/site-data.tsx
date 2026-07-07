import { CalendarIcon, ClockIcon, UsersIcon } from "lucide-react";

export const featuresData = [
  {
    icon: <CalendarIcon className="w-6 h-6" />,
    title: "Realtime slots",
    desc: "Availability and capacity update instantly for users, staff and admins.",
  },
  {
    icon: <ClockIcon className="w-6 h-6" />,
    title: "Secure bookings",
    desc: "Server-side validation prevents overbooking and duplicate reservations.",
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: "Staff rota",
    desc: "Admins plan shifts while staff see schedules and assigned bookings.",
  },
];

export const footerLinks = [
  {
    title: "Platform",
    links: [
      { name: "Book", url: "/book" },
      { name: "Sign in", url: "/login" },
      { name: "Register", url: "/register" },
    ],
  },
  {
    title: "Areas",
    links: [
      { name: "User", url: "/book" },
      { name: "Admin", url: "/admin/dashboard" },
      { name: "Staff", url: "/staff/schedule" },
    ],
  },
];

export const sectorLabels = [
  "Gyms",
  "Clinics",
  "Salons",
  "Studios",
  "Coworking",
];

export const previewCards = [
  {
    label: "Slots",
    image: "https://images.unsplash.com/photo-1611224923853-80b023f02dca?q=80&w=400&auto=format&fit=crop",
  },
  {
    label: "Bookings",
    image: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=400&auto=format&fit=crop",
  },
  {
    label: "Shifts",
    image: "https://images.unsplash.com/photo-1521737711862-ece3fd0f790b?q=80&w=400&auto=format&fit=crop",
  },
];
