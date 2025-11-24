import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Fusionne les classes Tailwind proprement
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formatteur de monnaie (Reusable)
export const formatCurrency = (amount) => 
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);