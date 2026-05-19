import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/DashboardScreen';
import TaskCreateScreen from '../screens/TaskCreateScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import TaskListScreen from '../screens/TaskListScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'TodoN · 今日' }} />
      <Stack.Screen name="Tasks" component={TaskListScreen} options={{ title: 'TodoN · リスト' }} />
      <Stack.Screen name="TaskCreate" component={TaskCreateScreen} options={{ title: 'タスク作成' }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'タスク詳細' }} />
    </Stack.Navigator>
  );
}
