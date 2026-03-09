const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
});

export const getMealsHandler = async (event) => {
  const params = event?.queryStringParameters ?? {};
  return json(200, {
    message: "GetMeals endpoint is wired",
    filters: {
      mealType: params.mealType ?? null,
      tags: params.tags ?? null
    },
    table: process.env.MEALS_TABLE
  });
};

export const createMealPlanHandler = async (event) => {
  const body = event?.body ? JSON.parse(event.body) : {};
  return json(201, {
    message: "CreateMealPlan endpoint is wired",
    input: body,
    table: process.env.MEAL_PLANS_TABLE
  });
};

export const generateGroceryListHandler = async (event) => {
  const mealPlanId = event?.pathParameters?.mealPlanId ?? null;
  return json(200, {
    message: "GenerateGroceryList endpoint is wired",
    mealPlanId,
    table: process.env.GROCERY_LISTS_TABLE
  });
};

export const exportToKrogerHandler = async (event) => {
  const groceryListId = event?.pathParameters?.groceryListId ?? null;
  return json(200, {
    message: "ExportToKroger endpoint is wired",
    groceryListId,
    ssmParamNames: {
      clientId: process.env.KROGER_CLIENT_ID_PARAM,
      clientSecret: process.env.KROGER_CLIENT_SECRET_PARAM
    }
  });
};
  
