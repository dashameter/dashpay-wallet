//timestamp parameter in ms
const msgDate = function (timestamp: number) {
  const date = new Date(timestamp);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "April",
    "May",
    "June",
    "July",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const fullDate =
    months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();

  return fullDate;
};

export { msgDate };
