// Shop settings. Everything marked "À CONFIRMER" must be validated by the shop before launch.

export const SHOP = {
  name: "Sweet Moodee",
  city: "Abidjan",
  whatsapp: "2250100000000", // À CONFIRMER : numéro complet sans + ni espaces
  whatsappDisplay: "+225 01 00 00 00 00", // À CONFIRMER
  instagram: "https://www.instagram.com/sweet_moodee/",
  snapchat: "https://t.snapchat.com/DsIUZMcr",
  address: "Abidjan, Côte d'Ivoire", // À CONFIRMER : adresse exacte de la boutique
  hours: "", // À CONFIRMER
  deliveryDelay: "24 à 48 h", // À CONFIRMER
  freeDeliveryFrom: 60000, // À CONFIRMER
  isMockup: true, // passe à false à la mise en ligne (retire le bandeau « Maquette »)
} as const;

// Delivery fees per commune, in FCFA — À CONFIRMER
export const ZONES: readonly { name: string; fee: number }[] = [
  { name: "Cocody", fee: 1500 },
  { name: "Plateau", fee: 1500 },
  { name: "Marcory", fee: 1500 },
  { name: "Treichville", fee: 1500 },
  { name: "Adjamé", fee: 1500 },
  { name: "Koumassi", fee: 2000 },
  { name: "Yopougon", fee: 2000 },
  { name: "Abobo", fee: 2000 },
  { name: "Attécoubé", fee: 2000 },
  { name: "Port-Bouët", fee: 2000 },
  { name: "Bingerville", fee: 3000 },
  { name: "Anyama", fee: 3000 },
  { name: "Songon", fee: 3000 },
];
