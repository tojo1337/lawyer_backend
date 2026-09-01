export const up = async (db, client) => {
  const plans = [
    {
      plan_name: "Basic",
      chats_per_day: 10,
      plan_cost: 0,
    },
    {
      plan_name: "Advance",
      chats_per_day: 100,
      plan_cost: 10000,
    },
    {
      plan_name: "Pro",
      chats_per_day: 500,
      plan_cost: 30000,
    },
  ];
  db.collection("plans-model").insertMany(plans);
};
export const down = async (db, client) => {
  db.collection("plans-model").deleteMany();
};
