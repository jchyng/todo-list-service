/**
 * Todo Item Service
 * 할 일 아이템 관련 서비스 통합 export
 */

// CRUD 함수
export {
  createTodoItem,
  getTodoItems,
  updateTodoItem,
  deleteTodoItem,
  duplicateTodoItem,
} from './crud';

// 완료 상태 관리
export {
  toggleTodoCompletion,
  deleteRecurringInstance,
} from './completion';

// 순서 변경
export {
  reorderTodoItem,
  moveTodoItemBetween,
} from './position';

// 유틸리티
export {
  fetchRecurrenceConfig,
  enrichItemsWithRecurrence,
  generateNewPosition,
} from './utils';
