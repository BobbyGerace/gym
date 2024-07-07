export const formatDate = (yyyy_mm_dd: string, locale: string): string => {
  let [year, month, day] = yyyy_mm_dd.split("-").map(Number);

  let date = new Date(year, month - 1, day);

  let formattedDate = date.toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return formattedDate;
};
