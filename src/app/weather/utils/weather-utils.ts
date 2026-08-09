// Classe utilitaire pour les fonctions de formatage météo

export class WeatherUtils {
  // Formater la date en français avec jour, date complète et heure
  static formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Formater la température avec arrondi à 0.1°C
  static formatTemperature(temp: number | undefined, unit: string): string {
    if (temp === undefined) return '';
    return `${Math.round(temp * 10) / 10}`+unit;
  }

  // Obtenir la direction du vent à partir des degrés
  static getWindDirection(degrees: number): string {
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO',
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // Formater un nombre avec un nombre de décimales spécifié
  static formatNumber(value: any, decimals: number = 1): string {
    if (value == null) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    const multiplier = Math.pow(10, decimals);
    const rounded = Math.round(num * multiplier) / multiplier;
    return decimals === 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  }

  // Calculer les précipitations cumulées pour l'historique
  static calculateCumulativePrecipitation(daily: any): { date: string; precipitation: number; cumulative: number }[] {
    if (!daily?.precipitation_sum || !daily?.time) return [];

    let cumulative = 0;
    return daily.time.map((date: string, index: number) => {
      cumulative += daily.precipitation_sum[index];
      return {
        date,
        precipitation: daily.precipitation_sum[index],
        cumulative: cumulative
      };
    });
  }

  // Obtenir la couleur en fonction de la température
  // -20°C à 15°C : hue 180 (vert) → 250 (bleu)
  // 15°C à 50°C : hue 60 (jaune) → 0 (rouge) [sens inverse]
  // > 50°C : hue 0 (rouge)
  static getTemperatureColor(temp: number | undefined): string {
    if (temp === undefined) return '#1a73e8'; // Bleu par défaut

    // Plage 1: -20°C à 15°C → hue 180 à 250
    if (temp <= 16) {
      const normalized = (temp + 20) / 35; // 0 à 1
      const hue = 180 + (250 - 180) * normalized; // 180 → 250
      return `hsl(${hue}, 100%, 50%)`;
    }
    // Plage 2: 15°C à 50°C → hue 60 à 0
    else if (temp <= 50) {
      const normalized = (temp - 15) / 15; // 0 à 1
      const hue = 50 - 50 * normalized; // 60 → 0
      return `hsl(${hue}, 100%, 50%)`;
    }
    // Plage 3: > 50°C → hue 0 (rouge)
    else {
      return 'hsl(0, 100%, 50%)';
    }
  }
}
