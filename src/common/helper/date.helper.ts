import dayjs from 'dayjs';
/**
 * Date helper
 */
export class DateHelper {
  /**
   * Add days
   * @param value
   * @param unit
   * @returns
   */
  static add(value: number, unit: dayjs.ManipulateType) {
    return dayjs(value).add(30, unit);
  }

  // format date
  static format(date: number | string | Date) {
    const d = new Date(date);
    return d.toISOString();
  }
  static formatDate(date: number | string | Date) {
    const d = new Date(date);
    return d.toDateString();
  }

  static now() {
    const date = new Date();
    return date;
  }

  static nowString() {
    const date = new Date();
    return date.toISOString();
  }

  static nowDate() {
    const date = new Date();
    return date.toDateString();
  }

  static addDays(dateData, days: number) {
    days = Number(days);
    const date = new Date(dateData.valueOf());
    date.setDate(date.getDate() + days);
    return date.toDateString();
  }

  static addMonths(dateData, months: number) {
    months = Number(months);
    const date = new Date(dateData.valueOf());
    date.setMonth(date.getMonth() + months);
    return date.toDateString();
  }

  static addYears(dateData, years: number) {
    years = Number(years);
    const date = new Date(dateData.valueOf());
    date.setFullYear(date.getFullYear() + years);
    return date.toDateString();
  }

  static addHours(dateData, hours: number) {
    hours = Number(hours);
    const date = new Date(dateData.valueOf());
    date.setHours(date.getHours() + hours);
    return date.toDateString();
  }

  static addMinutes(dateData, minutes: number) {
    minutes = Number(minutes);
    const date = new Date(dateData.valueOf());
    date.setMinutes(date.getMinutes() + minutes);
    return date.toDateString();
  }

  static addSeconds(dateData, seconds: number) {
    seconds = Number(seconds);
    const date = new Date(dateData.valueOf());
    date.setSeconds(date.getSeconds() + seconds);
    return date.toDateString();
  }

  static diff(
    date1: string,
    date2: string,
    unit?: dayjs.QUnitType | dayjs.OpUnitType,
    float?: boolean,
  ) {
    const date1Data = dayjs(date1);
    const date2Data = dayjs(date2);

    return date2Data.diff(date1Data, unit, float);
  }

  // Function to normalize date and set time to 23:59:59.999 (end of the day)
  static normalizeDateToEndOfDay(date: string) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999); // Set time to 23:59:59.999 (end of the day)
  
    // If you need to convert to local time, adjust to UTC first:
    const offset = d.getTimezoneOffset(); // Get the time zone offset in minutes
    d.setMinutes(d.getMinutes() - offset); // Adjust to local time
  
    return d;
  }

  static normalizeDate(date: string){
    // const d = new Date(date);
    // d.setHours(0, 0, 0, 0);  // Set time to midnight (00:00:00)
    // return d;

    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Set time to 23:59:59.999 (end of the day)
  
    // If you need to convert to local time, adjust to UTC first:
    const offset = d.getTimezoneOffset(); // Get the time zone offset in minutes
    d.setMinutes(d.getMinutes() - offset); // Adjust to local time
  
    return d;
  };
}
