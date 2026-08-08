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
  static formatTemperature(temp: number | undefined): string {
    if (temp === undefined) return '';
    return `${Math.round(temp * 10) / 10}°C`;
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
}
