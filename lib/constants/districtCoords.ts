/**
 * Approximate centroid coordinates for each Nepal district.
 * Used to estimate delivery distance to courier HQs.
 */
export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  // Province 1 – Koshi
  Taplejung:        { lat: 27.35,  lng: 87.67 },
  Panchthar:        { lat: 27.13,  lng: 87.80 },
  Ilam:             { lat: 26.91,  lng: 87.93 },
  Jhapa:            { lat: 26.63,  lng: 87.84 },
  Morang:           { lat: 26.65,  lng: 87.35 },
  Sunsari:          { lat: 26.77,  lng: 87.17 },
  Dhankuta:         { lat: 27.10,  lng: 87.35 },
  Terhathum:        { lat: 27.15,  lng: 87.53 },
  Sankhuwasabha:    { lat: 27.43,  lng: 87.37 },
  Bhojpur:          { lat: 27.17,  lng: 87.05 },
  Solukhumbu:       { lat: 27.72,  lng: 86.63 },
  Okhaldhunga:      { lat: 27.30,  lng: 86.50 },
  Khotang:          { lat: 27.07,  lng: 86.83 },
  Udayapur:         { lat: 26.98,  lng: 86.52 },

  // Province 2 – Madhesh
  Saptari:          { lat: 26.65,  lng: 86.73 },
  Siraha:           { lat: 26.65,  lng: 86.20 },
  Dhanusha:         { lat: 26.80,  lng: 85.92 },
  Mahottari:        { lat: 26.87,  lng: 85.65 },
  Sarlahi:          { lat: 26.93,  lng: 85.37 },
  Rautahat:         { lat: 27.00,  lng: 85.10 },
  Bara:             { lat: 27.00,  lng: 84.93 },
  Parsa:            { lat: 27.10,  lng: 84.75 },

  // Province 3 – Bagmati
  Dolakha:          { lat: 27.67,  lng: 86.00 },
  Sindhupalchok:    { lat: 27.92,  lng: 85.73 },
  Rasuwa:           { lat: 28.17,  lng: 85.23 },
  Nuwakot:          { lat: 27.97,  lng: 85.17 },
  Dhading:          { lat: 27.90,  lng: 84.87 },
  Makwanpur:        { lat: 27.47,  lng: 84.95 },
  Chitwan:          { lat: 27.63,  lng: 84.45 },
  Kavrepalanchok:   { lat: 27.63,  lng: 85.57 },
  Sindhuli:         { lat: 27.27,  lng: 85.97 },
  Ramechhap:        { lat: 27.47,  lng: 86.10 },
  Kathmandu:        { lat: 27.71,  lng: 85.32 },
  Bhaktapur:        { lat: 27.67,  lng: 85.43 },
  Lalitpur:         { lat: 27.67,  lng: 85.32 },

  // Province 4 – Gandaki
  Gorkha:           { lat: 28.33,  lng: 84.63 },
  Manang:           { lat: 28.53,  lng: 84.07 },
  Mustang:          { lat: 28.93,  lng: 83.85 },
  Myagdi:           { lat: 28.47,  lng: 83.57 },
  Kaski:            { lat: 28.23,  lng: 84.00 },
  Lamjung:          { lat: 28.25,  lng: 84.40 },
  Tanahu:           { lat: 27.98,  lng: 84.22 },
  Nawalpur:         { lat: 27.73,  lng: 84.15 },
  Syangja:          { lat: 28.07,  lng: 83.87 },
  Parbat:           { lat: 28.23,  lng: 83.73 },
  Baglung:          { lat: 28.27,  lng: 83.60 },

  // Province 5 – Lumbini
  'Rukum East':     { lat: 28.60,  lng: 82.63 },
  Rolpa:            { lat: 28.35,  lng: 82.72 },
  Pyuthan:          { lat: 28.10,  lng: 82.87 },
  Gulmi:            { lat: 28.07,  lng: 83.27 },
  Arghakhanchi:     { lat: 27.90,  lng: 83.15 },
  Palpa:            { lat: 27.87,  lng: 83.53 },
  'Nawalparasi East': { lat: 27.65, lng: 83.90 },
  Rupandehi:        { lat: 27.52,  lng: 83.42 },
  Kapilvastu:       { lat: 27.60,  lng: 83.03 },
  Dang:             { lat: 28.07,  lng: 82.30 },
  Banke:            { lat: 28.07,  lng: 81.62 },
  Bardiya:          { lat: 28.30,  lng: 81.40 },

  // Province 6 – Karnali
  Dolpa:            { lat: 29.07,  lng: 82.73 },
  Mugu:             { lat: 29.55,  lng: 82.22 },
  Humla:            { lat: 30.10,  lng: 81.97 },
  Jumla:            { lat: 29.28,  lng: 82.18 },
  Kalikot:          { lat: 29.13,  lng: 81.65 },
  Dailekh:          { lat: 28.83,  lng: 81.70 },
  Jajarkot:         { lat: 28.70,  lng: 82.18 },
  'Rukum West':     { lat: 28.62,  lng: 82.38 },
  Salyan:           { lat: 28.38,  lng: 82.17 },
  Surkhet:          { lat: 28.60,  lng: 81.60 },

  // Province 7 – Sudurpashchim
  Bajura:           { lat: 29.53,  lng: 81.33 },
  Bajhang:          { lat: 29.75,  lng: 81.13 },
  Darchula:         { lat: 29.85,  lng: 80.58 },
  Baitadi:          { lat: 29.57,  lng: 80.47 },
  Dadeldhura:       { lat: 29.30,  lng: 80.58 },
  Doti:             { lat: 29.27,  lng: 80.95 },
  Achham:           { lat: 29.10,  lng: 81.23 },
  Kailali:          { lat: 28.73,  lng: 80.87 },
  Kanchanpur:       { lat: 28.93,  lng: 80.35 },
}

/** Haversine distance in km between two lat/lng points */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
