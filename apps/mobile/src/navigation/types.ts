export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  TaskCreate: undefined;
  TaskDetail: { taskId: string };
};
